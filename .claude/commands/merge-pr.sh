#!/usr/bin/env bash
# Merge PRs one after another: branch up to date, all required checks green,
# exact checked sha. Never the release PR.
# Usage: .claude/commands/merge-pr.sh <pr> [<pr>...]   — one call, PRs in merge order.
# Parallel runs queue: a run started while another is merging waits for it to exit, across all worktrees.
# Exit 0 = all merged. Exit 1 = stopped; the last line says why.
set -uo pipefail
die() { echo "$*"; exit 1; }
repo=$(gh repo view --json nameWithOwner -q .nameWithOwner) || die "cannot resolve the repo"
R=repos/$repo
need=$(gh api "$R/branches/master/protection/required_status_checks" --jq '.contexts | length') || die "cannot read branch protection"
[ "$need" -gt 0 ] || die "master has no required checks configured"

# One run at a time: a lock dir in the git common dir (shared by worktrees) with the holder's pid; a dead holder's lock is taken over.
# Released on every exit, die included.
# ponytail: takeover is check-then-remove, so two waiters on one dead lock in the same millisecond can both get in.
# ponytail: a holder killed between mkdir and its pid write (pid shows as ?), or a dead holder's pid reused, looks alive; rm -r the lock by hand.
lock=$(git rev-parse --path-format=absolute --git-common-dir)/merge-pr.lock || die "cannot find the git dir"
trap '[ "$(cat "$lock/pid" 2>/dev/null)" = "$$" ] && rm -rf "$lock"' EXIT
ahead=-
until mkdir "$lock" 2>/dev/null; do
  pid=$(cat "$lock/pid" 2>/dev/null)
  if [ -n "$pid" ] && ! kill -0 "$pid" 2>/dev/null; then echo "merge-pr.sh pid $pid is gone; taking over its lock"; rm -rf "$lock"; continue; fi
  [ "$pid" = "$ahead" ] || { echo "waiting for merge-pr.sh pid ${pid:-?} to finish (lock: $lock)"; ahead=$pid; }
  sleep 15
done
echo "$$" >"$lock/pid"

for n in "$@"; do
  ref=$(gh pr view "$n" --json headRefName -q .headRefName) || die "#$n not found"
  [ "$ref" != "changeset-release/master" ] || die "#$n is the Version Packages release PR — the maintainer merges it"
  for round in 1 2 3 4 5; do
    read -r state mstate head < <(gh pr view "$n" --json state,mergeStateStatus,headRefOid -q '"\(.state) \(.mergeStateStatus) \(.headRefOid)"')
    [ -n "${state:-}" ] || die "#$n cannot read PR state"
    echo "$(date +%H:%M) #$n round $round: $state $mstate ${head:0:7}"
    case "$state $mstate" in
      MERGED*) break ;;
      *DRAFT) die "#$n is a draft" ;;
      CLOSED*) die "#$n is closed" ;;
      *DIRTY) die "#$n conflicts with master — merge origin/master in the worktree, run the gates, push, rerun" ;;
      *BEHIND) gh api -X PUT "$R/pulls/$n/update-branch" >/dev/null || die "#$n update-branch failed"; echo "#$n branch updated"; sleep 60; continue ;;
    esac

    # Required checks: wait up to 30 min until every one has reported, then require all green.
    for _ in $(seq 60); do
      read -r total pending bad < <(gh pr checks "$n" --required --json bucket \
        --jq '"\(length) \([.[] | select(.bucket == "pending")] | length) \([.[] | select(.bucket != "pass" and .bucket != "skipping")] | length)"' 2>/dev/null)
      [ "${total:-0}" -ge "$need" ] && [ "${pending:-1}" -eq 0 ] && break
      sleep 30
    done
    if [ "${total:-0}" -lt "$need" ] || [ "${bad:-1}" -ne 0 ]; then
      gh pr checks "$n" --required; die "#$n required checks not green after 30 min ($total/$need reported, $bad not passing)"
    fi

    # Merge only the commit that was checked, and only while it is up to date with master.
    # UNSTABLE = a non-required check (e.g. the docs preview) failed; required ones are green.
    # ponytail: master can still move between this read and the PUT (admin merge skips strict mode); window is seconds.
    read -r mstate now < <(gh pr view "$n" --json mergeStateStatus,headRefOid -q '"\(.mergeStateStatus) \(.headRefOid)"')
    if [ "$now" = "$head" ] && { [ "$mstate" = CLEAN ] || [ "$mstate" = UNSTABLE ]; } &&
      gh api -X PUT "$R/pulls/$n/merge" -f merge_method=merge -f sha="$head" --jq .message; then
      echo "#$n merged"; sleep 15; break
    fi
    echo "#$n not merged this round ($mstate, head ${now:0:7})"; sleep 30
  done
  [ "$(gh pr view "$n" --json state -q .state)" = MERGED ] || die "#$n not merged after 5 rounds"
done
echo "all merged"
