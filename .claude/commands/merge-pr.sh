#!/usr/bin/env bash
# Merge PRs in order once required checks are green and CodeRabbit has no open findings.
# Usage: .claude/commands/merge-pr.sh <pr> [<pr>...]
# Exit 0 = all merged. Exit 1 = stopped; the last line says why (conflict, red check, CodeRabbit findings).
set -u
R=repos/$(gh repo view --json nameWithOwner -q .nameWithOwner)
CR='coderabbitai[bot]'

for n in "$@"; do
  if [ "$(gh pr view "$n" --json headRefName -q .headRefName)" = "changeset-release/master" ]; then
    echo "#$n is the Version Packages release PR — the maintainer merges it"; exit 1
  fi
  for round in 1 2 3 4 5; do
    st=$(gh pr view "$n" --json state,mergeStateStatus -q '.state + " " + .mergeStateStatus')
    echo "$(date +%H:%M) #$n $st"
    case "$st" in
      MERGED*) break ;;
      CLOSED*) echo "#$n is closed"; exit 1 ;;
      *DIRTY*) echo "#$n has conflicts with master — rebase or merge master, push, rerun"; exit 1 ;;
      *BEHIND*) gh api -X PUT "$R/pulls/$n/update-branch" >/dev/null && echo "#$n branch updated"; sleep 30 ;;
    esac

    # Required checks: wait up to 30 min until all are registered and none is pending, then require all green.
    buckets=""
    for _ in $(seq 1 60); do
      buckets=$(gh pr checks "$n" --required --json bucket --jq '[.[].bucket] | join(" ")' 2>/dev/null)
      [ -n "$buckets" ] && ! grep -q pending <<<"$buckets" && break
      sleep 30
    done
    if [ -z "$buckets" ] || grep -qE "fail|cancel|pending" <<<"$buckets"; then
      gh pr checks "$n" --required; echo "#$n required checks not green: $buckets"; exit 1
    fi

    # CodeRabbit: wait up to 30 min for a verdict on the current head (review, "no actionable", skipped or rate-limited).
    # ponytail: a head CodeRabbit never reviews (e.g. an update-branch merge) costs the full 30 min, then merge proceeds.
    head=$(gh pr view "$n" --json headRefOid -q .headRefOid)
    since=$(gh pr view "$n" --json commits -q '.commits[-1].committedDate')
    for _ in $(seq 1 60); do
      revs=$(gh api "$R/pulls/$n/reviews" --jq "[.[] | select(.user.login==\"$CR\" and .commit_id==\"$head\")] | length")
      notes=$(gh api "$R/issues/$n/comments" --jq ".[] | select(.user.login==\"$CR\" and .updated_at >= \"$since\") | .body")
      { [ "$revs" -gt 0 ] || grep -qiE "No actionable comments|rate limit|Review limit reached|Review skipped" <<<"$notes"; } && break
      sleep 30
    done
    if gh api "$R/pulls/$n/reviews" --jq ".[] | select(.user.login==\"$CR\" and .commit_id==\"$head\") | .body" \
      | grep -qE "Actionable comments posted: [1-9]"; then
      echo "#$n has actionable CodeRabbit findings on $head — triage, fix, push, rerun"; exit 1
    fi

    st=$(gh pr view "$n" --json mergeStateStatus -q .mergeStateStatus)
    if [ "$st" = "CLEAN" ] || [ "$st" = "UNSTABLE" ]; then
      gh api -X PUT "$R/pulls/$n/merge" -f merge_method=merge --jq .message && echo "#$n merged"
      sleep 15; break
    fi
    echo "#$n state $st after checks; retrying"; sleep 30
  done
  [ "$(gh pr view "$n" --json state -q .state)" = "MERGED" ] || { echo "#$n not merged after 5 rounds"; exit 1; }
done
echo "all merged"
