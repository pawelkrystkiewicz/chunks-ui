#!/usr/bin/env bash
# Merge PRs one after another: branch up to date, all required checks green, no unresolved CodeRabbit threads,
# exact checked sha. Never the release PR. Never asks for or waits on a CodeRabbit review; its status is info only.
# Usage: .claude/commands/merge-pr.sh <pr> [<pr>...]   — one call, PRs in merge order.
# Exit 0 = all merged. Exit 1 = stopped; the last line says why.
set -uo pipefail
die() { echo "$*"; exit 1; }
repo=$(gh repo view --json nameWithOwner -q .nameWithOwner) || die "cannot resolve the repo"
R=repos/$repo
need=$(gh api "$R/branches/master/protection/required_status_checks" --jq '.contexts | length') || die "cannot read branch protection"
[ "$need" -gt 0 ] || die "master has no required checks configured"

# CodeRabbit's commit status from the last commit with code in it (anything but an update-branch merge by web-flow) onward: reviewed | pending | rate-limited | skipped | none.
coderabbit() {
  local s d=""
  for s in $(gh api "$R/pulls/$1/commits" --paginate --jq '.[] | "\(.sha) \((.parents | length) == 1 or .committer.login != "web-flow")"' |
    awk '{ s[NR] = $1 } $2 == "true" { c = NR } END { for (i = c; i <= NR; i++) print s[i] }'); do
    d+=$(gh api "$R/commits/$s/status" --jq '.statuses[] | select(.context == "CodeRabbit") | .state + " " + .description')$'\n'
  done
  case $d in
    *"Review completed"*) echo reviewed ;;
    *"rate limited"*) echo rate-limited ;;
    *"Review in progress"*) echo pending ;;
    *"Review skipped"*) echo skipped ;;
    *) echo none ;;
  esac
}

# ponytail: first 100 threads only; paginate if a PR ever collects more.
open_threads() {
  gh api graphql -F n="$1" -f owner="${repo%/*}" -f name="${repo#*/}" -f query='
    query($owner: String!, $name: String!, $n: Int!) { repository(owner: $owner, name: $name) { pullRequest(number: $n) {
      reviewThreads(first: 100) { nodes { isResolved comments(first: 1) { nodes { author { login } } } } } } } }' \
    --jq '[.data.repository.pullRequest.reviewThreads.nodes[] | select((.isResolved | not) and .comments.nodes[0].author.login == "coderabbitai")] | length'
}

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

    # CodeRabbit is optional: any status passes, read once for the merge line. Threads it has posted by now still block.
    # ponytail: no settle sleep; its inline comments land with the review, seconds before "Review completed".
    verdict=$(coderabbit "$n")
    threads=$(open_threads "$n") || die "#$n cannot read review threads"
    [ "$threads" -eq 0 ] || die "#$n has $threads unresolved CodeRabbit threads — triage, fix, reply, resolve each, rerun"

    # Merge only the commit that was checked, and only while it is up to date with master.
    # UNSTABLE = a non-required check (e.g. the docs preview) failed; required ones are green.
    # ponytail: master can still move between this read and the PUT (admin merge skips strict mode); window is seconds.
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
