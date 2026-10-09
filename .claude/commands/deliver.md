---
description: Take a GitHub issue (or a described behaviour) from triage to a merged PR, end to end, using subagents
argument-hint: <issue number(s) | issue URL | behaviour to change> [no merge]
---

# Deliver

Input: `$ARGUMENTS`

Deliver the change end to end: issue → worktree → implementation → independent review → one push → PR → green CI → merge → cleanup. Run autonomously; stop and ask only when blocked on a decision that is genuinely the maintainer's (a product call, a breaking API choice the issue leaves open). You are the controller: delegate implementation and review to subagents, keep the decisions and the triage yourself.

## Hard rules

- `bun` only, never npm/yarn/pnpm (npm only inside Docker to install bun).
- Never edit `CLAUDE.md`, `PRD.md` or `.claude/hooks.json`.
- Never merge the "Version Packages" PR (branch `changeset-release/master`). It triggers a release; the maintainer merges it.
- Push once per branch, after review and gates pass. Follow-up pushes only to answer CI or CodeRabbit, batched.
- Before every push, confirm the branch and its upstream (`git status -sb`). Never push to `master`.
- Merge when green unless the input says not to ("no merge", "don't merge", "draft", "wait for me"). Then stop at a green PR and report.

## 1. Resolve the issue

- **Number or URL:** `gh issue view <n> --comments`. If it is closed, or blocked by an open issue (`gh api repos/{owner}/{repo}/issues/<n>/dependencies/blocked_by`), stop and report.
- **Behaviour text:** search for a duplicate first (`gh issue list --state open --search "<keywords>"`). If one exists, use it. Otherwise create the issue right away (no approval round) with these sections: Context, Current state (with file paths, after a quick look at the code), Scope In/Out, Acceptance criteria as `- [ ]` checkboxes with observable outcomes, Verification commands.
- Add the issue to project board 1 and set Status to In Progress:
  `gh project item-add 1 --owner pawelkrystkiewicz --url <issue url>`, then `gh project item-edit` with the Status field.
- Several issues in the input: one worktree, branch and PR each. Run them in parallel, merge them one after another.

## 2. Fence the scope

**Today** is the issue's acceptance criteria and whatever solving them requires. Everything else you notice (deeper coverage, polish, related bugs) goes on a numbered **Also possible** list for the final report. Do not build it. The exceptions are a security hole, a data-loss risk or a broken build in code the change touches: fix those and say why.

## 3. Research

Read the affected code yourself if it is a couple of files; use an Explore subagent for anything wider. Find the existing pattern to follow and the specs that cover the area. If the code contradicts the issue (already fixed, different root cause), comment on the issue with the evidence and stop.

## 4. Worktree

```bash
W="$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")-worktrees"
git fetch origin
git worktree add -q $W/<slug> -b <type>/<slug> origin/master
(cd $W/<slug> && bun install --frozen-lockfile)
```

`<type>` is the conventional-commit type: `fix`, `feat`, `docs`, `test`, `chore`.

## 5. Implement (builder subagent)

Spawn one implementer per independent file set. Start its prompt with the System Prompt from `.claude/agents/builder.md`, then give it:

- the worktree path and branch, the issue body, the Today scope and the file scope;
- **TDD:** a failing test first for every behaviour change, then the fix;
- the conventions in `CLAUDE.md` (Base UI compound parts, `render` not `asChild`, CVA in `*.Variants.ts`, Motion presets from `src/lib/motion.ts`, a CSS fallback without Motion, `prefers-reduced-motion`, fake timers for date-dependent visual tests);
- a changeset in `.changeset/<slug>.md` for any user-facing change to `packages/ui`: `patch` for fixes, `minor` for features or breaking changes (we are on 0.x);
- docs in `apps/docs/content/` when public API or behaviour changes;
- **gates before committing:** the targeted specs (`cd packages/ui && bunx vitest run <spec>`), `bun run check-types`, `bun run lint`;
- **visual baselines** when rendering changes. Commit first, then regenerate the Linux baselines in Docker and copy them back:
  ```bash
  D=<scratchpad>/ui-visual; rm -rf $D && mkdir -p $D && git -C <worktree> archive HEAD | tar -x -C $D
  docker run --rm -v $D:/work -w /work mcr.microsoft.com/playwright:v1.64.0-noble bash -lc \
    'curl -fsSL https://bun.sh/install | bash >/dev/null 2>&1; export PATH=$HOME/.bun/bin:$PATH; bun install --frozen-lockfile >/dev/null 2>&1; cd packages/ui && bun run test:visual:update'
  rsync -a --include='*/' --include='*-linux.png' --exclude='*' $D/packages/ui/src/ <worktree>/packages/ui/src/
  ```
  Darwin baselines come from `bun run test:visual:update` on the host. Look at every changed PNG before committing it.
- commit with `type(scope): message` and the co-author trailer; **no push**. Report back the commits, the test results and anything it left undone.

## 6. Review (fresh reviewer subagent)

1. Package the diff: `git -C <worktree> log --oneline origin/master..HEAD`, `git diff --stat origin/master...HEAD` and `git diff -U10 origin/master...HEAD`, all into one file in the scratchpad.
2. Spawn a **fresh** reviewer: the System Prompt from `.claude/agents/reviewer.md`, the diff file path, one paragraph on what the change is for, and that the gates already passed. Give it no implementer report and no earlier findings. Rubric:
   - correctness and edge cases: cleanup on unmount, reduced motion toggled mid-animation, StrictMode double effects, ref merging, SSR and hydration, RTL;
   - accessibility;
   - tests that assert behaviour, not implementation;
   - changeset and docs accuracy;
   - scope creep.
   It reports Critical/Important/Minor with `file:line`, why and the fix.
3. **Triage it yourself.** Verify each finding against the code. Drop false positives and record why. Out-of-scope ideas go on the Also possible list.
4. Send the kept findings to the implementer (SendMessage, or a new builder) for a fix wave with the same gates.
5. If the fix wave was substantial (new logic, not wording), run another fresh review on the new head.

## 7. Final gates, push, PR

```bash
cd <worktree> && bun run lint && bun run check-types && bun run test
git status -sb   # confirm branch and upstream
git push -u origin <type>/<slug>
gh pr create --base master --title "<type>(<scope>): <summary>" --body-file <scratchpad>/pr.md
gh pr comment <pr> --body "@coderabbitai review"
```

The PR body has: Summary (what changed and why), `Closes #<n>`, the review findings fixed and dropped (one line each), a Test plan, and the Claude Code attribution line.

## 8. Merge

Run `.claude/commands/merge-pr.sh <pr>` in the background. It updates a branch that has fallen behind, waits for the required checks (lint, test, typecheck, visual-regression-test) and a CodeRabbit verdict on the current head, refuses the release PR, and merges.

When it stops, read its last line:
- **Red check:** `gh run view <id> --log-failed`, fix it in the worktree, push, rerun the script.
- **CodeRabbit findings:** triage them like the reviewer's. Fix the valid ones, and reply on each thread with the fix commit or the reason for dropping it. Push once, rerun.
- **Conflicts:** merge `origin/master` into the branch, rerun the gates, push, rerun.

## 9. Clean up and report

```bash
git worktree remove $W/<slug> && git branch -D <type>/<slug>
```

Set the board item to Done if closing the issue did not already move it.

The final report covers:
- the issue and PR links and the merge commit;
- what changed, in two or three lines;
- the review findings dropped, with reasons;
- anything skipped;
- the numbered **Also possible** list.

End by asking which Also possible items should become issues.
