#!/usr/bin/env bun

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import YAML from "js-yaml";

interface VersionInfo {
  currentVersion: string;
  nextVersion: string;
  bumpType: "major" | "minor" | "patch";
  hasChangesets: boolean;
}

/**
 * Parses a semver version string into its components
 */
function parseVersion(version: string): [number, number, number] {
  const parts = version.split(".").map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    throw new Error(`Invalid version format: ${version}`);
  }
  return parts as [number, number, number];
}

/**
 * Calculates the next version based on the bump type
 */
function calculateNextVersion(
  currentVersion: string,
  bumpType: "major" | "minor" | "patch",
): string {
  const [major, minor, patch] = parseVersion(currentVersion);

  switch (bumpType) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
  }
}

/**
 * Returns the YAML between the front matter delimiters of a changeset file, or null when the
 * file has no front matter
 */
function readFrontMatter(content: string): string | null {
  // Find the front matter delimiters
  const frontMatterStart = content.indexOf("---");
  if (frontMatterStart !== 0) {
    // Front matter must start at the beginning of the file
    return null;
  }

  const frontMatterEnd = content.indexOf("---", 3); // Start searching after the first ---
  if (frontMatterEnd === -1) {
    // No closing delimiter found
    return null;
  }

  return content.slice(3, frontMatterEnd).trim();
}

/**
 * Extracts and parses YAML front matter from a changeset file
 */
function parseChangesetFrontMatter(content: string): "major" | "minor" | "patch" | null {
  const yamlContent = readFrontMatter(content);
  if (yamlContent === null) {
    return null;
  }

  try {
    // Parse the YAML
    const parsed = YAML.load(yamlContent) as Record<string, string>;

    // Find the bump value (the value in the YAML object)
    // Changeset format: "package-name": "major" | "minor" | "patch"
    const bumpValue = Object.values(parsed)[0]?.toLowerCase();

    if (bumpValue === "major" || bumpValue === "minor" || bumpValue === "patch") {
      return bumpValue;
    }

    return null;
  } catch {
    // Invalid YAML, treat as patch
    return null;
  }
}

/**
 * An empty changeset (`bunx changeset --empty`) has front matter that names no package: it
 * releases nothing and adds no changelog entry, so it must not count as a pending release
 */
function isEmptyChangeset(content: string): boolean {
  const yamlContent = readFrontMatter(content);
  if (yamlContent === null) {
    return false;
  }

  try {
    const parsed = YAML.load(yamlContent);
    return (
      parsed === undefined ||
      parsed === null ||
      (typeof parsed === "object" && Object.keys(parsed).length === 0)
    );
  } catch {
    // Invalid YAML is not an empty changeset
    return false;
  }
}

/**
 * Determines the highest bump type from all changeset files
 */
function determineBumpType(changesetDir: string): "major" | "minor" | "patch" {
  const files = readdirSync(changesetDir);
  let bumpType: "major" | "minor" | "patch" = "patch";

  for (const file of files) {
    if (file === "README.md" || !file.endsWith(".md")) {
      continue;
    }

    const content = readFileSync(join(changesetDir, file), "utf-8");
    const fileBumpType = parseChangesetFrontMatter(content);

    if (fileBumpType === "major") {
      return "major"; // Major is highest priority, return immediately
    } else if (fileBumpType === "minor") {
      bumpType = "minor"; // Minor overrides patch
    }
    // If fileBumpType is null or 'patch', continue (patch is the default)
  }

  return bumpType;
}

/**
 * Checks if there are any changeset files that release something (excluding README.md and empty
 * changesets)
 */
function hasChangesets(changesetDir: string): boolean {
  try {
    const files = readdirSync(changesetDir);
    return files.some(
      (file) =>
        file !== "README.md" &&
        file.endsWith(".md") &&
        !isEmptyChangeset(readFileSync(join(changesetDir, file), "utf-8")),
    );
  } catch {
    return false;
  }
}

/**
 * Gets the current version from package.json
 */
function getCurrentVersion(packagePath: string): string {
  const pkg = JSON.parse(readFileSync(packagePath, "utf-8"));
  if (!pkg.version) {
    throw new Error(`No "version" field found in ${packagePath}`);
  }
  return pkg.version;
}

/**
 * Main function to calculate version information
 */
function calculateVersionInfo(packagePath: string, changesetDir: string): VersionInfo {
  const currentVersion = getCurrentVersion(packagePath);
  const hasChanges = hasChangesets(changesetDir);

  if (!hasChanges) {
    return {
      currentVersion,
      nextVersion: currentVersion,
      bumpType: "patch",
      hasChangesets: false,
    };
  }

  const bumpType = determineBumpType(changesetDir);
  const nextVersion = calculateNextVersion(currentVersion, bumpType);

  return {
    currentVersion,
    nextVersion,
    bumpType,
    hasChangesets: true,
  };
}

// CLI execution
if (import.meta.main) {
  const args = process.argv.slice(2);
  const format = args[0] || "json"; // 'json' or 'github'

  const projectRoot = join(import.meta.dir, "..");
  const packagePath = join(projectRoot, "packages/ui/package.json");
  const changesetDir = join(projectRoot, ".changeset");

  try {
    const versionInfo = calculateVersionInfo(packagePath, changesetDir);

    if (format === "github") {
      // Output in GitHub Actions format
      console.log(`current_version=${versionInfo.currentVersion}`);
      console.log(`next_version=${versionInfo.nextVersion}`);
      console.log(`bump_type=${versionInfo.bumpType}`);
      console.log(`has_changesets=${versionInfo.hasChangesets}`);
    } else {
      // Output as JSON
      console.log(JSON.stringify(versionInfo, null, 2));
    }

    process.exit(0);
  } catch (error) {
    console.error("Error calculating version:", error);
    process.exit(1);
  }
}

export {
  calculateNextVersion,
  calculateVersionInfo,
  determineBumpType,
  getCurrentVersion,
  hasChangesets,
  isEmptyChangeset,
  parseChangesetFrontMatter,
  parseVersion,
};
