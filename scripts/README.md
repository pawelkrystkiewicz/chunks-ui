# Scripts

This directory contains utility scripts for the project.

## check-playwright-version.ts

Fails when the Playwright version differs between `@playwright/test` (packages/ui), `playwright` (apps/docs), the `mcr.microsoft.com/playwright` images in the workflows and the Docker recipe in `TESTING_STRATEGY.md`. Also fails on an image reference without a `v<version>` tag, on workflows that pin different digests, and when the recipe cites another digest than the workflows. It makes no network calls.

```bash
bun run check:playwright
```

Runs in the `lint` job of `quality-gates.yml`. Tests: `scripts/__specs__/check-playwright-version.spec.ts`.

## check-tailwind-compat.ts

Compiles `packages/ui/dist` with Tailwind 4.0.0 and with the installed version, and fails when 4.0.0 does not generate a class the installed version does. The installed version uses the Tailwind packages in `bun.lock`. 4.0.0 installs from the fixture in `tailwind-4.0/` with `bun install --frozen-lockfile` in a temporary directory. The fixture files are named `package.fixture.json` and `bun.fixture.lock` so that Renovate leaves them alone.

```bash
bun run check:tailwind   # builds chunks-ui first, needs the network
```

Runs in the `typecheck` job of `quality-gates.yml`. Tests: `scripts/__specs__/check-tailwind-compat.spec.ts`.

## calculate-next-version.ts

Calculates the next semantic version based on changeset files. This script eliminates duplication in the GitHub Actions workflow by providing a single source of truth for version calculation logic.

### Usage

**JSON output (default):**

```bash
bun run version:next
# or directly:
bun run ./scripts/calculate-next-version.ts
```

Output:

```json
{
  "currentVersion": "0.0.1",
  "nextVersion": "0.1.0",
  "bumpType": "minor",
  "hasChangesets": true
}
```


**GitHub Actions output format:**

```bash
bun run ./scripts/calculate-next-version.ts github
```

Output:

```text
current_version=0.0.1
next_version=0.1.0
bump_type=minor
has_changesets=true
```

### How it works

1. Reads the current version from `packages/ui/package.json`
2. Scans `.changeset/*.md` files (excluding README.md)
3. Determines the highest bump type:
   - `major` takes precedence over everything
   - `minor` takes precedence over `patch`
   - `patch` is the default
4. Calculates the next semantic version based on the bump type

### Testing

Run the test suite:

```bash
# From the monorepo root:
bun run test
# or directly:
bun test scripts/__specs__/calculate-next-version.spec.ts
```

### Local testing

To test the script with different scenarios:

1. **No changesets:**

   ```bash
   bun run version:next
   # Returns current version
   ```

2. **With patch changeset:**

   ```bash
   echo '---
   "chunks-ui": patch
   ---

   Fix something' > .changeset/test.md
   bun run version:next
   rm .changeset/test.md
   ```

3. **With minor changeset:**

   ```bash
   echo '---
   "chunks-ui": minor
   ---

   Add new feature' > .changeset/test.md
   bun run version:next
   rm .changeset/test.md
   ```

4. **With major changeset:**

   ```bash
   echo '---
   "chunks-ui": major
   ---

   Breaking change' > .changeset/test.md
   bun run version:next
   rm .changeset/test.md
   ```

### Integration with GitHub Actions

The script is used in [.github/workflows/release-changeset.yml](../.github/workflows/release-changeset.yml) to:

1. Calculate version information once
2. Use the calculated version for PR titles
3. Use the calculated version when generating automatic changesets

This approach:

- Eliminates code duplication
- Makes testing easier (can be tested locally)
- Provides consistent version calculation across the workflow
- Improves maintainability
