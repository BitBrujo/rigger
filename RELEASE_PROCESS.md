# Release Process Guide

This document outlines the automated release workflow for Rigger.

## Overview

Rigger uses an automated release system that:
- Follows Semantic Versioning (SemVer)
- Generates changelogs from git history
- Creates GitHub releases with documentation assets
- Validates version consistency across the monorepo

## Prerequisites

Before creating a release, ensure:
- ✅ All tests pass locally
- ✅ Code is merged to `main` branch
- ✅ No uncommitted changes in working directory
- ✅ GitHub Actions has write permissions

## Release Types

### Patch Release (1.0.X)
**When**: Bug fixes, minor improvements, security patches
**Breaking Changes**: None
**Example**: 1.0.0 → 1.0.1

```bash
node scripts/bump-version.js patch
```

### Minor Release (1.X.0)
**When**: New features, non-breaking changes, deprecations
**Breaking Changes**: None
**Example**: 1.0.0 → 1.1.0

```bash
node scripts/bump-version.js minor
```

### Major Release (X.0.0)
**When**: Breaking changes, major refactors, API changes
**Breaking Changes**: Expected
**Example**: 1.0.0 → 2.0.0

```bash
node scripts/bump-version.js major
```

## Step-by-Step Release Process

### 1. Prepare the Release

Ensure your working directory is clean and up to date:

```bash
# Pull latest changes
git checkout main
git pull origin main

# Verify working directory is clean
git status
```

### 2. Update Version Numbers

Use the version bump script to update both package.json files:

```bash
# For patch release
node scripts/bump-version.js patch

# For minor release
node scripts/bump-version.js minor

# For major release
node scripts/bump-version.js major

# Or set explicit version
node scripts/bump-version.js 1.2.3
```

This script will:
- ✅ Verify current versions match between frontend and backend
- ✅ Calculate and update the new version
- ✅ Create a git commit with message: `chore: bump version to X.Y.Z`
- ✅ Create a git tag: `vX.Y.Z`

### 3. Push Changes and Tag

Push the commit and tag to trigger the automated release:

```bash
# Push commit
git push origin main

# Push tag (this triggers the release workflow)
git push origin vX.Y.Z
```

### 4. Monitor the Release

The GitHub Actions workflow will automatically:
1. Validate version consistency
2. Install dependencies
3. Run linters
4. Build frontend and backend
5. Generate changelog from git history
6. Create release documentation package
7. Publish GitHub release with assets

Monitor the workflow at:
```
https://github.com/yourusername/rigger/actions
```

### 5. Verify the Release

Once complete, verify:
- ✅ GitHub release created at: `https://github.com/yourusername/rigger/releases`
- ✅ CHANGELOG.md generated with commit history
- ✅ Release includes documentation assets
- ✅ Tag points to correct commit

## Automated Workflow Details

### Triggered By
```yaml
on:
  push:
    tags:
      - 'v*.*.*'
```

### Validation Steps
1. **Version Consistency Check**: Ensures tag version matches package.json versions
2. **Build Validation**: Compiles frontend and backend to catch errors
3. **Lint Check**: Runs ESLint to ensure code quality

### Generated Assets
The release includes:
- `README.md` - Project overview
- `CLAUDE.md` - Developer guidance
- `CHANGELOG.md` - Generated release notes
- `INSTALLATION.md` - Setup instructions
- `RELEASE_NOTES.md` - If exists

## Manual Release (Fallback)

If automated release fails, you can create manually:

1. Generate changelog:
```bash
node scripts/generate-changelog.js vX.Y.Z
```

2. Create GitHub release manually at:
```
https://github.com/yourusername/rigger/releases/new
```

3. Upload assets from `release-assets/` directory

## Rollback Procedure

If a release has critical issues:

### Option 1: Patch Release (Recommended)
1. Fix the issue in a new branch
2. Merge to main
3. Create a new patch release (X.Y.Z+1)

### Option 2: Delete and Retry
1. Delete the tag locally and remotely:
```bash
git tag -d vX.Y.Z
git push origin :refs/tags/vX.Y.Z
```

2. Delete the GitHub release
3. Fix issues
4. Create a new release

### Option 3: Mark as Pre-release
1. Edit the GitHub release
2. Check "This is a pre-release"
3. Add warning in release notes

## Best Practices

### Before Release
- ✅ Run full test suite
- ✅ Update documentation
- ✅ Review CLAUDE.md for accuracy
- ✅ Test locally with production build

### Commit Messages
Follow conventional commits for better changelogs:
```
feat(component): add new feature
fix(api): resolve connection issue
docs: update installation guide
chore: bump version to 1.2.3
```

### Changelog Quality
- Use descriptive commit messages
- Reference issues/PRs in commits
- Group related changes in single commits
- Write clear breaking change notes

### Release Cadence
- **Patch**: As needed for bugs/security
- **Minor**: Monthly for new features
- **Major**: Quarterly or when breaking changes accumulate

## Troubleshooting

### "Version mismatch" Error
**Cause**: Frontend and backend package.json versions don't match

**Solution**:
```bash
# Manually sync versions, then retry
# Edit package.json and backend/package.json
node scripts/bump-version.js patch --no-git
```

### Workflow Fails on Build
**Cause**: Build errors in code

**Solution**:
1. Delete the tag: `git push origin :refs/tags/vX.Y.Z`
2. Fix build errors locally
3. Test with `npm run build`
4. Create new release

### Changelog Empty
**Cause**: No commits between tags or tag not found

**Solution**:
- Ensure previous tag exists
- Check git history: `git log --oneline`
- Manually edit CHANGELOG.md if needed

## Release Checklist

Use this checklist for each release:

- [ ] All tests passing locally
- [ ] Documentation updated
- [ ] CLAUDE.md reflects current architecture
- [ ] Working directory clean
- [ ] On `main` branch with latest changes
- [ ] Version bumped with script
- [ ] Tag pushed to remote
- [ ] Workflow completed successfully
- [ ] Release verified on GitHub
- [ ] Release announcement prepared (if major/minor)

## Security Releases

For critical security fixes:
1. Create patch immediately
2. Coordinate disclosure timeline
3. Update security documentation
4. Notify users through channels

## Support

For questions or issues with the release process:
- GitHub Issues: https://github.com/yourusername/rigger/issues
- Review workflow logs for errors
- Check VERSIONING.md for policy details
