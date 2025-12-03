# Release Notes - v1.0.1

**Release Date**: 2025-12-03

**Changes since**: v1.0.0

## Summary

- 22 commits
- 2 contributors

### ✨ Features

- add Claude Opus 4.5 model support ([017174b](../../commit/017174b21bccd72621c4ed08e30a9bf52559475d))

### 🐛 Bug Fixes

- improve chat scrolling with proper flexbox height constraints ([0a4b4ba](../../commit/0a4b4ba640deb4027f7f11bf1e107fdd8e06f3b4))

### 🧹 Chores

- bump version to 1.0.1 ([0330a52](../../commit/0330a52177cfa60aa53f02746427ba6780b445de))
-  ([- Add o](../../commit/- Add overflow-hidden to TabsContent to prevent parent overflow conflicts))
-  ([- Wrap ](../../commit/- Wrap ScrollArea in flex container with min-h-0 for proper height constraint))
-  ([- Chang](../../commit/- Change ScrollArea from flex-1 to h-full for correct sizing))
-  ([- Add b](../../commit/- Add bg-background to input bar for visual separation))
-  ([🤖 Gene](../../commit/🤖 Generated with [Claude Code](https://claude.com/claude-code)))
-  ([Co-Auth](../../commit/Co-Authored-By: Claude <noreply@anthropic.com>))
- gitignore ([6adb406](../../commit/6adb4062d3baf5b7ee9b52d231abb256652f1c05))
- Fix chat window auto-scroll by removing CSS overflow conflict ([6e9a724](../../commit/6e9a7240264b09aed8b3cd846d3dcc4739d00caf))
-  ([the Scr](../../commit/the ScrollArea from establishing proper scroll context. Improved scroll))
-  ([impleme](../../commit/implementation to directly access Radix UI viewport for reliable scrolling.))
-  ([🤖 Gene](../../commit/🤖 Generated with [Claude Code](https://claude.com/claude-code)))
-  ([Co-Auth](../../commit/Co-Authored-By: Claude <noreply@anthropic.com>))
-  ([- Updat](../../commit/- Update model descriptions with SWE-bench performance))
-  ([- Upgra](../../commit/- Upgrade Agent SDK from v0.1.37 to v0.1.57))
-  ([- Reord](../../commit/- Reorder models: Opus 4.5 > Sonnet 4.5 > Haiku 4.5))
-  ([- Updat](../../commit/- Update CLAUDE.md documentation with Opus 4.5 guidance))
-  ([🤖 Gene](../../commit/🤖 Generated with [Claude Code](https://claude.com/claude-code)))
-  ([Co-Auth](../../commit/Co-Authored-By: Claude <noreply@anthropic.com>))
- Create RELEASE_NOTES_v1.0.0.md ([cab28ac](../../commit/cab28ac0e55680ead8e6c8653b2467cd7516cd07))

## Contributors

- bitbrujo
- 

## Installation

```bash
git clone https://github.com/yourusername/rigger.git
cd rigger
git checkout v1.0.1
```

## Upgrading from v1.0.0

1. Backup your database
2. Pull latest changes: `git pull && git checkout v1.0.1`
3. Rebuild containers: `docker-compose down && docker-compose up -d --build`
4. Update frontend: `npm install && npm run dev`

---

**Full Changelog**: [v1.0.0...v1.0.1](../../compare/v1.0.0...v1.0.1)
