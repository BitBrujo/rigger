#!/usr/bin/env node

/**
 * Version Bump Script for Rigger Monorepo
 *
 * Handles version updates across frontend and backend package.json files
 * Follows Semantic Versioning (MAJOR.MINOR.PATCH)
 *
 * Usage:
 *   node scripts/bump-version.js [major|minor|patch]
 *   node scripts/bump-version.js 1.2.3
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ Error: ${message}`, 'red');
  process.exit(1);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function info(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Paths to package.json files
const FRONTEND_PKG = path.join(__dirname, '..', 'package.json');
const BACKEND_PKG = path.join(__dirname, '..', 'backend', 'package.json');

/**
 * Parse semantic version string
 */
function parseVersion(versionString) {
  const match = versionString.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    error(`Invalid version format: ${versionString}. Expected: MAJOR.MINOR.PATCH`);
  }
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

/**
 * Format version object to string
 */
function formatVersion(version) {
  return `${version.major}.${version.minor}.${version.patch}`;
}

/**
 * Bump version based on type
 */
function bumpVersion(currentVersion, bumpType) {
  const version = parseVersion(currentVersion);

  switch (bumpType) {
    case 'major':
      version.major += 1;
      version.minor = 0;
      version.patch = 0;
      break;
    case 'minor':
      version.minor += 1;
      version.patch = 0;
      break;
    case 'patch':
      version.patch += 1;
      break;
    default:
      error(`Invalid bump type: ${bumpType}. Use: major, minor, or patch`);
  }

  return formatVersion(version);
}

/**
 * Read and parse package.json
 */
function readPackageJson(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    error(`Failed to read ${filePath}: ${err.message}`);
  }
}

/**
 * Write package.json with proper formatting
 */
function writePackageJson(filePath, packageData) {
  try {
    const content = JSON.stringify(packageData, null, 2) + '\n';
    fs.writeFileSync(filePath, content, 'utf8');
  } catch (err) {
    error(`Failed to write ${filePath}: ${err.message}`);
  }
}

/**
 * Check if working directory is clean
 */
function checkGitStatus() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    if (status.trim()) {
      warning('Working directory has uncommitted changes');
      return false;
    }
    return true;
  } catch (err) {
    warning('Not a git repository or git not available');
    return false;
  }
}

/**
 * Create git commit and tag
 */
function createGitCommitAndTag(version, skipGit = false) {
  if (skipGit) {
    info('Skipping git commit and tag creation');
    return;
  }

  try {
    // Add package.json files
    execSync('git add package.json backend/package.json', { stdio: 'inherit' });

    // Create commit
    execSync(`git commit -m "chore: bump version to ${version}"`, { stdio: 'inherit' });
    success(`Created commit for version ${version}`);

    // Create tag
    execSync(`git tag -a v${version} -m "Release v${version}"`, { stdio: 'inherit' });
    success(`Created tag v${version}`);

    info('To push changes and trigger release:');
    console.log(`  git push && git push origin v${version}`);
  } catch (err) {
    error(`Failed to create git commit/tag: ${err.message}`);
  }
}

/**
 * Main version bump logic
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node scripts/bump-version.js [major|minor|patch|X.Y.Z]');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/bump-version.js patch    # 1.0.0 → 1.0.1');
    console.log('  node scripts/bump-version.js minor    # 1.0.0 → 1.1.0');
    console.log('  node scripts/bump-version.js major    # 1.0.0 → 2.0.0');
    console.log('  node scripts/bump-version.js 1.2.3    # Set to 1.2.3');
    process.exit(0);
  }

  const input = args[0].toLowerCase();
  const skipGit = args.includes('--no-git');

  log('\n🚀 Rigger Version Bump Tool\n', 'blue');

  // Read current versions
  const frontendPkg = readPackageJson(FRONTEND_PKG);
  const backendPkg = readPackageJson(BACKEND_PKG);

  const frontendVersion = frontendPkg.version;
  const backendVersion = backendPkg.version;

  info(`Current frontend version: ${frontendVersion}`);
  info(`Current backend version: ${backendVersion}`);

  // Verify versions match
  if (frontendVersion !== backendVersion) {
    error(
      `Version mismatch!\n  Frontend: ${frontendVersion}\n  Backend: ${backendVersion}\n  Please manually sync versions first.`
    );
  }

  // Calculate new version
  let newVersion;
  if (['major', 'minor', 'patch'].includes(input)) {
    newVersion = bumpVersion(frontendVersion, input);
    info(`Bumping ${input} version: ${frontendVersion} → ${newVersion}`);
  } else {
    // Assume explicit version provided
    newVersion = input.replace(/^v/, ''); // Remove 'v' prefix if present
    parseVersion(newVersion); // Validate format
    info(`Setting explicit version: ${frontendVersion} → ${newVersion}`);
  }

  // Check git status
  if (!skipGit) {
    const isClean = checkGitStatus();
    if (!isClean) {
      warning('Continuing with uncommitted changes...');
    }
  }

  // Update package.json files
  frontendPkg.version = newVersion;
  backendPkg.version = newVersion;

  writePackageJson(FRONTEND_PKG, frontendPkg);
  writePackageJson(BACKEND_PKG, backendPkg);

  success(`Updated package.json files to version ${newVersion}`);

  // Create git commit and tag
  if (!skipGit) {
    createGitCommitAndTag(newVersion);
  }

  log('\n✨ Version bump complete!\n', 'green');
}

// Run the script
main();
