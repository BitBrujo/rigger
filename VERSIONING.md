# Versioning Policy

Rigger follows [Semantic Versioning 2.0.0](https://semver.org/) (SemVer).

## Version Format

```
MAJOR.MINOR.PATCH
```

Example: `1.4.2`
- **MAJOR** version = 1
- **MINOR** version = 4
- **PATCH** version = 2

## Version Increment Rules

### MAJOR Version (X.0.0)

Increment when you make **incompatible API changes** or **breaking changes**.

#### Examples of Breaking Changes:
- Removing or renaming public API endpoints
- Changing API request/response formats
- Removing configuration options
- Changing database schema in non-backward-compatible ways
- Modifying environment variable names
- Removing support for a tool or feature
- Changing CLI command signatures
- Upgrading dependencies that require code changes

#### Breaking Change Commit Format:
```
feat!: change API endpoint structure

BREAKING CHANGE: /api/agent/stream now requires sessionId in request body
```

**Before MAJOR Release:**
- Document all breaking changes
- Provide migration guide
- Update CLAUDE.md architecture docs
- Consider deprecation period for removed features

---

### MINOR Version (1.X.0)

Increment when you add **new functionality** in a **backward-compatible manner**.

#### Examples of New Features:
- Adding new API endpoints
- Adding new configuration options
- Adding new tools or MCP servers
- Enhancing existing features without breaking them
- Adding new optional parameters
- Implementing new UI components
- Adding new database tables (backward-compatible)
- Adding new skills or subagents

#### Feature Commit Format:
```
feat(tools): add new WebSearch tool integration

- Implements WebSearch SDK tool
- Adds configuration UI in Tools tab
- Updates type definitions
```

**Before MINOR Release:**
- Ensure backward compatibility
- Add feature documentation
- Update README with new capabilities
- Add usage examples

---

### PATCH Version (1.0.X)

Increment when you make **backward-compatible bug fixes**.

#### Examples of Bug Fixes:
- Fixing crashes or errors
- Correcting UI rendering issues
- Fixing data validation problems
- Resolving security vulnerabilities
- Improving error messages
- Fixing memory leaks
- Correcting documentation typos
- Fixing broken links
- Performance optimizations without API changes

#### Bug Fix Commit Format:
```
fix(sessions): prevent memory leak in session cleanup

- Add proper cleanup of event listeners
- Fixes issue #123
```

**Before PATCH Release:**
- Verify fix doesn't introduce regressions
- Update relevant documentation
- Add test coverage for the fix

---

## Pre-release Versions

For testing releases before official publication:

```
1.0.0-alpha.1    # Alpha release
1.0.0-beta.2     # Beta release
1.0.0-rc.3       # Release candidate
```

### When to Use:
- **alpha**: Early testing, unstable, major features incomplete
- **beta**: Feature complete, testing for bugs
- **rc**: Release candidate, production-ready testing

---

## Version Lifecycle

### Current Version: 1.0.0
- Stable release
- Full production support
- Regular patch updates

### Version Support Policy
- **Current MAJOR**: Full support (features + fixes)
- **Previous MAJOR**: Security patches only (6 months)
- **Older versions**: End of life (no support)

Example with 2.0.0 release:
- `2.x.x` - Full support
- `1.x.x` - Security patches for 6 months
- `0.x.x` - No support

---

## Conventional Commits

Rigger uses [Conventional Commits](https://www.conventionalcommits.org/) for automated changelog generation.

### Commit Types

| Type | Description | Version Bump |
|------|-------------|--------------|
| `feat` | New feature | MINOR |
| `fix` | Bug fix | PATCH |
| `docs` | Documentation only | PATCH |
| `style` | Code style (formatting, etc.) | PATCH |
| `refactor` | Code refactoring | PATCH |
| `perf` | Performance improvement | PATCH |
| `test` | Adding tests | PATCH |
| `build` | Build system changes | PATCH |
| `ci` | CI/CD changes | PATCH |
| `chore` | Other changes | PATCH |

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Examples:**

```
feat(sessions): add force kill functionality

Implements emergency session termination with AbortController.
Includes UI button and confirmation dialog.

Closes #45
```

```
fix(chat): resolve scroll position on new messages

- Calculate proper scroll height
- Add smooth scroll behavior
- Fix anchor positioning

Fixes #67
```

```
docs: update installation instructions

Add Docker Compose setup steps and troubleshooting section.
```

### Scopes

Common scopes in Rigger:
- `sessions` - Session management
- `config` - Configuration system
- `tools` - SDK tools
- `mcp` - MCP servers
- `skills` - Skills system
- `hooks` - Hooks system
- `ui` - User interface
- `api` - Backend API
- `db` - Database
- `chat` - Chat interface

---

## Monorepo Versioning

Rigger is a monorepo with frontend and backend components.

### Version Synchronization
- ✅ Frontend and backend **MUST** have matching versions
- ✅ Version bump script updates both `package.json` files
- ✅ Automated workflow validates version consistency

### Why Unified Versioning?
1. **Simplicity**: One version number for the entire system
2. **Compatibility**: Ensures frontend and backend are in sync
3. **User Clarity**: Users know which versions work together
4. **Deployment**: Simplifies release coordination

---

## Version Decision Matrix

Use this matrix to determine version increment:

| Change Description | MAJOR | MINOR | PATCH |
|-------------------|-------|-------|-------|
| Breaking API change | ✅ | | |
| Remove feature | ✅ | | |
| Database schema breaking change | ✅ | | |
| Add new feature (backward-compatible) | | ✅ | |
| Add new API endpoint | | ✅ | |
| Add configuration option | | ✅ | |
| Bug fix | | | ✅ |
| Security patch | | | ✅ |
| Documentation update | | | ✅ |
| Performance improvement | | | ✅ |
| Refactoring (no API change) | | | ✅ |

---

## Examples from Rigger History

### 1.0.0 → 1.1.0 (MINOR)
```
feat: add Skills system with auto-discovery
feat: implement event-driven hooks
feat(tools): add Planning tool support
```

### 1.1.0 → 1.1.1 (PATCH)
```
fix(sessions): memory leak in session cleanup
fix(chat): scroll position on message append
docs: clarify MCP server configuration
```

### 1.x.x → 2.0.0 (MAJOR)
```
feat!: migrate to Agent SDK v2 API

BREAKING CHANGE:
- Renamed all tool configurations
- Changed session API structure
- Updated database schema
- See MIGRATION.md for upgrade guide
```

---

## FAQs

### Q: Should I bump version for internal refactoring?
**A**: Yes, PATCH version. Even internal changes should be tracked.

### Q: What if I'm not sure if a change is breaking?
**A**: If there's any doubt, assume it's breaking and bump MAJOR. Better safe than breaking user deployments.

### Q: Can I skip versions?
**A**: No. Version numbers should increment sequentially: 1.0.0 → 1.0.1 → 1.0.2

### Q: When should I create a 2.0.0 release?
**A**: When breaking changes accumulate and justify a major update. Consider user impact and provide migration paths.

### Q: What about hotfixes?
**A**: Hotfixes are PATCH releases. Branch from the MAJOR.MINOR tag, apply fix, and create new PATCH.

---

## Deprecation Policy

When planning to remove features:

1. **Announce**: Document deprecation in release notes
2. **Warning**: Add runtime warnings in code
3. **Timeline**: Provide at least one MINOR version notice
4. **Alternatives**: Document replacement approach
5. **Remove**: Remove in next MAJOR version

**Example Timeline:**
- `1.4.0` - Announce deprecation of `oldFeature`, recommend `newFeature`
- `1.5.0` - Add console warnings when `oldFeature` is used
- `2.0.0` - Remove `oldFeature` completely

---

## Version Metadata

### Git Tags
Format: `vMAJOR.MINOR.PATCH`

```bash
v1.0.0
v1.1.0
v1.1.1
v2.0.0
```

### Package.json
```json
{
  "version": "1.0.0"
}
```

### Release Notes
Each release should include:
- Version number and date
- Summary of changes
- Breaking changes (if MAJOR)
- Installation/upgrade instructions
- Contributors

---

## References

- [Semantic Versioning 2.0.0](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- Rigger Release Process: See `RELEASE_PROCESS.md`

---

**Last Updated**: 2025-12-03
**Current Version**: 1.0.0
