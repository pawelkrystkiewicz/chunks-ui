#!/usr/bin/env bash
# Merge PRs one after another once required checks are green and CodeRabbit has reviewed with no unresolved threads.
# Usage: .claude/commands/merge-pr.sh <pr> [<pr>...]   — one call, PRs in merge order.
# Exit 0 = all merged. Exit 1 = stopped; the last line says why.
set -uo pipefail
die() { echo "$*"; exit 1; }
repo=$(gh repo view --json nameWithOwner -q .nameWithOwner) || die "cannot resolve the repo"
R=repos/$repo
need=$(gh api "$R/branches/master/protection/required_status_checks" --jq '.contexts | length') || die "cannot read branch protection"

# CodeRabbit's commit status from the last non-merge commit onward: reviewed | pending | rate-limited | skipped | none.
coderabbit() {
  local s d=""
  for s in $(gh api "$R/pulls/$1/commits" --paginate --jq '.[] | "\(.sha) \(.parents | length)"' |
    awk '{ s[NR] = $1 } $2 == 1 { c = NR } END { for (i = c; i <= NR; i++) print s[i] }'); do
    d+=$(gh api "$R/commits/$s/status" --jq '.statuses[] | select(.context == "CodeRabbit") | .state + " " + .description')$'\n'
  done
  case $d in
    *"Review completed"*) echo reviewed ;;
    *pending*) echo pending ;;
    *"rate limited"*) echo rate-limited ;;
    *"Review skipped"*) echo skipped ;;
    *) echo none ;;
  esac
}

# ponytail: first 100 threads only; paginate if a PR ever collects more.
open_threads() {
  gh api graphql -F n="$1" -F owner="${repo%/*}" -F name="${repo#*/}" -f query='
    query($owner: String!, $name: String!, $n: Int!) { repository(owner: $owner, name: $name) { pullRequest(number: $n) {
      reviewThreads(first: 100) { nodes { isResolved comments(first: 1) { nodes { author { login } } } } } } } }' \
    --jq '[.data.repository.pullRequest.reviewThreads.nodes[] | select((.isResolved | not) and .comments.nodes[0].author.login == "coderabbitai")] | length'
}

for n in "$@"; do
  ref=$(gh pr view "$n" --json headRefName -q .headRefName) || die "#$n not found"
  [ "$ref" != "changeset-release/master" ] || die "#$n is the Version Packages release PR — the maintainer merges it"
  asked=""
  for round in 1 2 3 4 5; do
    read -r state mstate head < <(gh pr view "$n" --json state,mergeStateStatus,headRefOid -q '"\(.state) \(.mergeStateStatus) \(.headRefOid)"')
    [ -n "${state:-}" ] || die "#$n cannot read PR state"
    echo "$(date +%H:%M) #$n round $round: $state $mstate ${head:0:7}"
    case "$state $mstate" in
      MERGED*) break ;;
      CLOSED*) die "#$n is closed" ;;
      *DIRTY) die "#$n conflicts with master — merge origin/master in the worktree, run the gates, push, rerun" ;;
      *BEHIND) gh api -X PUT "$R/pulls/$n/update-branch" >/dev/null && echo "#$n branch updated"; sleep 60; continue ;;
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

    # CodeRabbit: ask for a review when the push was skipped (no auto-review on this repo), wait up to 30 min for a verdict.
    verdict=none
    for _ in $(seq 60); do
      verdict=$(coderabbit "$n")
      case $verdict in reviewed | rate-limited) break ;; esac
      if [ "$verdict" = skipped ] && [ "$asked" != "$head" ]; then
        gh pr comment "$n" --body "@coderabbitai review" >/dev/null && asked=$head && echo "#$n asked CodeRabbit to review ${head:0:7}"
      fi
      sleep 30
    done
    case $verdict in reviewed | rate-limited) ;; *) die "#$n no CodeRabbit verdict after 30 min (status: $verdict)" ;; esac
    threads=$(open_threads "$n") || die "#$n cannot read review threads"
    [ "$threads" -eq 0 ] || die "#$n has $threads unresolved CodeRabbit threads — triage, fix, reply, resolve each, rerun"

    # Merge only the commit that was checked, and only while it is up to date with master.
    read -r mstate now < <(gh pr view "$n" --json mergeStateStatus,headRefOid -q '"\(.mergeStateStatus) \(.headRefOid)"')
    if [ "$now" = "$head" ] && { [ "$mstate" = CLEAN ] || [ "$mstate" = UNSTABLE ]; } &&
      gh api -X PUT "$R/pulls/$n/merge" -f merge_method=merge -f sha="$head" --jq .message; then
      echo "#$n merged (CodeRabbit: $verdict)"; sleep 15; break
    fi
    echo "#$n not merged this round ($mstate, head ${now:0:7})"; sleep 30
  done
  [ "$(gh pr view "$n" --json state -q .state)" = MERGED ] || die "#$n not merged after 5 rounds"
done
echo "all merged"
