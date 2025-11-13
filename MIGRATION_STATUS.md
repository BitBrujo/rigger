# 🎯 Migration Status: Messages API → Agent SDK Only

**Last Updated:** 2025-11-13
**Overall Completion:** 60% (11/18 tasks)

---

## ✅ Completed Tasks (11)

### Phase 1-2: Database & Types
- [x] Update database schema with SDK-specific columns (`backend/db/schema.sql`)
- [x] Create database migration script (`backend/db/migrations/001_migrate_to_sdk_only.sql`)
- [x] Update TypeScript types in `lib/types.ts` for SDK-only

### Phase 3: State Management
- [x] Update Zustand store to remove sdkMode and add SDK config (`lib/store.ts`)

### Phase 4: Backend
- [x] Delete Messages API backend routes (`agent.ts`)
- [x] Update agent-sdk.ts to handle all 30+ SDK parameters (renamed to `agent.ts`)
- [x] Update backend `server.ts` route mounting

### Phase 5: UI Components
- [x] Create multi-input UI component (`components/ui/multi-input.tsx`)
- [x] Create key-value-editor UI component (`components/ui/key-value-editor.tsx`)
- [x] Create json-editor UI component (`components/ui/json-editor.tsx`)
- [x] Create tool-selector component with grouped categories (`components/tool-selector.tsx`)

---

## 🚧 Remaining Tasks (7)

### Phase 6: Frontend Component Updates (CRITICAL - Blocking)
- [ ] **Redesign config-panel.tsx for SDK-only with all parameters**
  - Status: Not started
  - Priority: CRITICAL
  - Estimated time: 2-3 hours
  - Blocks: All frontend functionality
  - Notes: Remove Messages API controls, add 5 sections with 30+ SDK parameters

- [ ] **Update chat-interface.tsx to remove Messages API logic**
  - Status: Not started
  - Priority: HIGH
  - Estimated time: 30 minutes
  - Blocks: Message sending functionality
  - Notes: Remove dual-API conditionals, simplify to SDK-only

- [ ] **Update debug-panel.tsx for SDK-only metrics**
  - Status: Not started
  - Priority: HIGH
  - Estimated time: 20 minutes
  - Notes: Remove API mode toggle, always show SDK metrics

- [ ] **Update api-client.ts to remove Messages API methods**
  - Status: Not started
  - Priority: HIGH
  - Estimated time: 15 minutes
  - Notes: Rename SDK methods to primary, update endpoints

### Phase 7: Database
- [ ] **Update conversations routes for new schema**
  - Status: Not started
  - Priority: HIGH
  - Estimated time: 30 minutes
  - File: `backend/src/routes/conversations.ts`
  - Notes: Update SQL queries for new column names

- [ ] **Update presets routes for new schema**
  - Status: Not started
  - Priority: MEDIUM
  - Estimated time: 20 minutes
  - File: `backend/src/routes/presets.ts`
  - Notes: Same changes as conversations routes

- [ ] **Reset database and verify new schema**
  - Status: Not started
  - Priority: CRITICAL
  - Estimated time: 5 minutes
  - Command: `docker-compose down -v && docker-compose up -d`
  - Notes: Will delete all existing data

### Phase 8: Documentation
- [ ] **Update CLAUDE.md documentation for SDK-only**
  - Status: Not started
  - Priority: LOW
  - Estimated time: 30 minutes
  - Notes: Remove Messages API references, document all SDK parameters

### Phase 9: Testing
- [ ] **Test all SDK parameters end-to-end**
  - Status: Not started
  - Priority: HIGH
  - Estimated time: 1-2 hours
  - Notes: See testing checklist below

---

## 🔥 Critical Path (Must Do Next)

1. **Reset Database** (5 min) - Blocks backend testing
2. **Update Conversations/Presets Routes** (50 min) - Blocks CRUD operations
3. **Update Config Panel** (2-3 hours) - Blocks all frontend functionality
4. **Update Chat Interface** (30 min) - Blocks message sending
5. **Update Debug Panel** (20 min) - Blocks metrics display
6. **Update API Client** (15 min) - Finalizes frontend
7. **End-to-End Testing** (1-2 hours) - Validation

**Total Remaining Time:** 5-7 hours

---

## 📊 Progress by Area

| Area | Completion | Status |
|------|------------|--------|
| **Database Schema** | 100% | ✅ Complete (reset pending) |
| **Backend API** | 100% | ✅ Complete |
| **Type System** | 100% | ✅ Complete |
| **State Management** | 100% | ✅ Complete |
| **UI Components** | 100% | ✅ Complete |
| **Frontend Views** | 0% | ⏳ Pending |
| **Database Routes** | 0% | ⏳ Pending |
| **Documentation** | 0% | ⏳ Pending |
| **Testing** | 0% | ⏳ Pending |

---

## ⚠️ Known Issues

### Compilation Errors (Expected)
The frontend **will not compile** until these updates are complete:
- `config-panel.tsx` - References removed `sdkMode`, old `AgentConfig` type
- `chat-interface.tsx` - References Messages API methods
- `debug-panel.tsx` - References `sdkMode` conditionals
- `api-client.ts` - Has duplicate method names

### Database Errors (Expected)
Backend routes will fail until:
- Database is reset with new schema
- Conversations/Presets routes updated for new column names

---

## 🎯 Key Changes Summary

### What Was Removed
- ❌ Messages API routes (`/api/agent/*` old endpoints)
- ❌ `sdkMode` toggle in UI and state
- ❌ Messages API types (`AgentConfig`, temperature, top_p, top_k, stop_sequences)
- ❌ Manual cost calculation
- ❌ Dual-API conditionals throughout frontend

### What Was Added
- ✅ 30+ SDK configuration parameters
- ✅ Comprehensive type system (`AgentSDKConfig`)
- ✅ Tool categorization (6 categories, 18 tools)
- ✅ Advanced UI components (multi-input, key-value, json-editor, tool-selector)
- ✅ Session management support
- ✅ MCP, hooks, plugins configuration
- ✅ Workspace customization
- ✅ Budget and token limits

### What Changed
- 🔄 Database schema (complete overhaul)
- 🔄 Backend routes (unified SDK-only endpoint)
- 🔄 Zustand store structure
- 🔄 Default configurations and presets

---

## 📁 File Inventory

### Backend Files

| File | Status | Changes |
|------|--------|---------|
| `backend/db/schema.sql` | ✅ Modified | Complete schema overhaul |
| `backend/db/migrations/001_migrate_to_sdk_only.sql` | ✅ Created | Migration script |
| `backend/src/routes/agent.ts` | ✅ Replaced | New SDK-only routes |
| `backend/src/routes/agent-sdk.ts` | ✅ Deleted | Merged into agent.ts |
| `backend/src/routes/conversations.ts` | ⏳ Needs Update | SQL queries need updating |
| `backend/src/routes/presets.ts` | ⏳ Needs Update | SQL queries need updating |
| `backend/src/server.ts` | ✅ Modified | Removed Messages API route |

### Frontend Files

| File | Status | Changes |
|------|--------|---------|
| `lib/types.ts` | ✅ Modified | SDK-only types |
| `lib/store.ts` | ✅ Modified | Removed sdkMode, added SDK config |
| `lib/api-client.ts` | ⏳ Needs Update | Remove Messages API methods |
| `components/ui/multi-input.tsx` | ✅ Created | Array input component |
| `components/ui/key-value-editor.tsx` | ✅ Created | Record input component |
| `components/ui/json-editor.tsx` | ✅ Created | JSON object editor |
| `components/tool-selector.tsx` | ✅ Created | Grouped tool selection |
| `components/config-panel.tsx` | ⏳ Needs Major Redesign | Add all SDK parameters |
| `components/chat-interface.tsx` | ⏳ Needs Update | Remove Messages API logic |
| `components/debug-panel.tsx` | ⏳ Needs Update | SDK-only metrics |

### Documentation Files

| File | Status | Changes |
|------|--------|---------|
| `CLAUDE.md` | ⏳ Needs Update | Remove Messages API references |
| `MIGRATION_STATUS.md` | ✅ Created | This file |

---

## 🧪 Testing Checklist

### Basic Functionality
- [ ] Frontend compiles without errors
- [ ] Backend compiles and starts
- [ ] Database initializes with new schema
- [ ] Can create new conversation
- [ ] Can send message (streaming mode)
- [ ] Can send message (batch mode)
- [ ] Cost calculation works automatically
- [ ] Token metrics display correctly

### SDK Core Parameters
- [ ] Model selection works (3 models)
- [ ] System prompt updates
- [ ] Max turns limit enforced (test with maxTurns=2)
- [ ] Max budget USD stops execution (test with $0.01)
- [ ] Max thinking tokens limits usage (test with 100)

### Permissions & Tools
- [ ] Permission mode changes respected
- [ ] Tool selection enables/disables tools
- [ ] Can select/deselect by category
- [ ] Can select/deselect individual tools
- [ ] Tool usage tracked in usage_logs

### Workspace
- [ ] Working directory accessible
- [ ] Additional directories work
- [ ] Environment variables passed to agent
- [ ] Executable selection works (node/bun/deno)
- [ ] Executable args work

### Session Management
- [ ] Continue session works
- [ ] Resume session by ID works
- [ ] Resume from message ID works
- [ ] Fork session works

### Advanced Features
- [ ] Fallback model activates on failure
- [ ] MCP servers configuration (if available)
- [ ] Custom agents work
- [ ] Hooks fire correctly
- [ ] Plugins load

### UI Components
- [ ] Tool selector shows all 18 tools
- [ ] Tool categories expand/collapse
- [ ] Multi-input adds/removes values
- [ ] Key-value editor manages env vars
- [ ] JSON editors validate input
- [ ] Config panel saves/loads presets
- [ ] Debug panel shows SDK metrics
- [ ] No References to "Messages API" or "SDK Mode" in UI

### Database Persistence
- [ ] Conversations persist all SDK fields
- [ ] Presets load correctly
- [ ] Usage logs capture tools_used array
- [ ] Arrays serialize/deserialize correctly
- [ ] JSONB fields work correctly
- [ ] Default presets exist (5 presets)

### Error Handling
- [ ] Invalid JSON in editors shows errors
- [ ] Budget exceeded stops execution gracefully
- [ ] Max turns exceeded stops gracefully
- [ ] Permission denials tracked correctly
- [ ] Tool errors handled properly

---

## 🐛 Common Issues & Solutions

### Issue: Frontend won't compile
**Error:** `Property 'sdkMode' does not exist on type 'AgentStore'`
**Solution:** Complete config-panel, chat-interface, debug-panel updates

### Issue: Database queries fail
**Error:** `column "temperature" does not exist`
**Solution:** Reset database with `docker-compose down -v && docker-compose up -d`

### Issue: Tools not working
**Error:** Tool calls fail or are ignored
**Solution:** Verify `allowedTools` array contains exact tool names from `ALL_SDK_TOOLS`

### Issue: Cost not calculating
**Check:** Ensure backend is using SDK's `total_cost_usd` field (should be automatic)

### Issue: Session management not working
**Check:** Verify `sessionId` is being tracked and passed in subsequent requests

---

## 📝 Implementation Notes

### Config Panel Redesign Guidelines
Use **Tabs** or **Accordion** to organize 5 sections:

1. **Core Settings** - Model, System Prompt, Max Turns, Budget, Thinking Tokens
2. **Tools & Permissions** - Permission Mode, Tool Selector Component
3. **Workspace** - Directory, Additional Dirs, Env Vars, Executable
4. **Session** - Continue, Resume, Fork options
5. **Advanced** - Fallback Model, MCP, Agents, Hooks, Plugins (collapsed by default)

### Backend Parameter Mapping
The `buildSdkOptions()` function in `backend/src/routes/agent.ts` handles all parameter mapping. It:
- Converts camelCase → SDK format
- Handles optional parameters correctly
- Provides sensible defaults
- Supports both `systemPrompt` and `system` (compatibility)

### Tool Categories
6 categories with icons:
- 📄 File Operations: Read, Write, Edit, Glob, Grep, NotebookEdit
- 💻 Execution: Bash, BashOutput, KillShell
- 🌐 Web: WebFetch, WebSearch
- ✅ Task Management: TodoWrite, Task
- 🔌 MCP Integration: ListMcpResources, ReadMcpResource
- 💡 Planning & Interaction: ExitPlanMode, TimeMachine, MultipleChoiceQuestion

---

## 🚀 Quick Start After Migration

1. **Reset database:**
   ```bash
   docker-compose down -v && docker-compose up -d
   ```

2. **Start development servers:**
   ```bash
   # Frontend
   npm run dev

   # Backend (in another terminal)
   cd backend && npm run dev
   ```

3. **Test basic flow:**
   - Open http://localhost:3000
   - Load "Full Agent Access" preset
   - Send a test message: "List files in the current directory"
   - Verify agent uses Read/Glob tools
   - Check debug panel for SDK metrics

4. **Test advanced features:**
   - Set maxTurns=2 and verify limit
   - Set maxBudgetUsd=0.01 and verify stop
   - Enable only Read/Grep tools and verify restriction
   - Add environment variable and verify it's passed

---

## 📞 Support

**Migration Author:** Claude Code Agent
**Migration Date:** 2025-11-13
**Estimated Completion:** 5-7 hours remaining

**Need Help?**
- Check `lib/types.ts` for type definitions
- Check `backend/src/routes/agent.ts` for supported parameters
- Check `components/tool-selector.tsx` for tool categories
- Review this file for status and next steps

---

**Status Legend:**
- ✅ Complete
- ⏳ Pending
- 🚧 In Progress
- ❌ Removed/Deleted
- 🔄 Changed
