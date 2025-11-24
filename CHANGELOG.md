# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-23

### 🎉 Initial Release

**Rigger** - A comprehensive visual testing interface for the Claude Agent SDK.

### Core Features

#### Agent SDK Integration
- **19 Built-in Tools**: Full support for Claude Agent SDK tools
  - File Operations: Read, Write, Edit, Glob, Grep
  - Execution: Bash, BashOutput, KillShell
  - Web Access: WebFetch, WebSearch
  - Planning & Interaction: TodoWrite, Task, AskUserQuestion, ExitPlanMode
  - Agent System: Skill, SlashCommand
- **Real-time Streaming**: Server-Sent Events (SSE) for streaming responses
- **Debug Metrics**: Comprehensive tracking of tokens, costs, cache stats, and timing
- **Tool Configuration**: Easy UI for selecting and configuring available tools
- **Conversation Persistence**: Full conversation history with database storage

#### Session Management
- **Persistent Execution Contexts**: Sessions track agent activity across multiple requests
- **Two-Tier Emergency Stop**:
  - Graceful Stop: Allow current operation to finish cleanly
  - Force Kill: Immediate termination with resource cleanup
- **Resource Monitoring**: Real-time tracking of tokens, costs, turns, and tool usage
- **Auto-Cleanup**: Automatic termination of idle sessions (5-minute timeout)
- **Session History**: View and manage all past sessions

#### Configuration Management
- **Presets System**: Save and load complete agent configurations
- **Import/Export**: JSON-based configuration portability
- **Change Detection**: Visual indicators when active config differs from loaded preset
- **30+ Configuration Parameters**: Full control over Agent SDK settings
  - Model selection (Sonnet, Opus, Haiku)
  - Temperature, max turns, token budgets
  - Permission modes and sandbox controls
  - Thinking budget and cache control

#### Advanced Capabilities

##### MCP (Model Context Protocol) Servers
- External plugin support for extending Claude with additional tools
- Pre-configured templates for popular servers:
  - GitHub (repository management)
  - Playwright (browser automation)
  - Notion (workspace integration)
  - Filesystem, Git, Memory, Time, and more
- Environment variable configuration for API keys and secrets

##### Skills System
- Packaged agent workflows loaded from `.claude/skills/`
- Auto-discovery and management UI
- Built-in examples:
  - PDF Processing
  - Data Transformation
  - Code Review
- Create, edit, and delete skills via UI

##### Subagents
- Specialized AI agents with custom prompts and tools
- Built-in templates:
  - Code Reviewer (analyze code quality, security, performance)
  - Bug Hunter (find bugs, trace errors)
  - Doc Writer (technical documentation)
  - Refactorer (improve code structure)
  - Test Generator (unit/integration tests)
- Model and temperature overrides per agent
- Tool access restrictions for security

##### Hooks System
- Event-driven automation and workflows
- Trigger types:
  - on-prompt-submit (pre-processing, backups)
  - on-response-complete (notifications, post-processing)
  - on-tool-use (auto-commit, formatting)
  - on-error (monitoring, alerting)
- Pre-built templates:
  - Git Auto-Commit
  - Slack Notifications
  - Error Logging
  - Code Formatting
  - Backup Creation
  - API Webhooks
- Variable interpolation for dynamic configurations

##### File Upload System
- Upload files up to 10MB for agent context
- Supported formats: text, JSON, CSV, PDF, images, code files
- Multiple integration methods:
  - System Prompt: Inject content into system prompt
  - Working Directory: Copy file to agent workspace
  - Both: Combined approach
- Global vs conversation-scoped files
- Enable/disable individual files

#### User Interface

##### Three-Panel Layout
- **Sidebar Navigation**: Collapsible navigation (10 tabs)
  - Sessions, Configuration, Basic Config, Tools
  - MCP Servers, Skills, Subagents, Hooks, Files, Advanced
- **Center Content**: Tab-specific configuration and management UIs
- **Chat Panel**: Multi-tabbed interface
  - Chat: Message history with streaming
  - Debug: Token usage, costs, API metrics
  - Tools: Tool execution timeline
  - Todo: Task list visualization

##### State Management
- Zustand store for efficient state management
- No provider wrapping required
- Reactive updates across all components
- TypeScript-enforced type safety

### Technical Stack

#### Frontend
- **Framework**: Next.js 16, React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Components**: shadcn/ui (Radix primitives)
- **State**: Zustand
- **Real-time**: Server-Sent Events (SSE)

#### Backend
- **Framework**: Express.js, Node.js
- **Language**: TypeScript
- **Database**: PostgreSQL with JSONB
- **Agent SDK**: `@anthropic-ai/claude-agent-sdk`
- **Containerization**: Docker Compose

#### Database Schema
- `conversations`: Chat history and messages
- `agent_sessions`: Session lifecycle, metrics, emergency control
- `presets`: Saved agent configurations
- `usage_logs`: Per-request metrics and analytics
- `tool_usage_logs`: Per-tool execution tracking
- `todos` / `todo_items`: Task list management
- `custom_agents`: User-defined subagent definitions
- `uploaded_files`: File uploads for agent context

### Architecture Highlights

- **Session-based execution**: Persistent contexts with abort controls
- **Event-driven hooks**: Automation triggers for common workflows
- **Flexible configuration**: 30+ parameters for fine-tuned control
- **Real-time streaming**: SSE for responsive UI updates
- **Type-safe**: Full TypeScript coverage
- **Docker-ready**: Complete containerization with docker-compose
- **Analytics**: Usage tracking, cost analysis, performance metrics

### Getting Started

**Prerequisites:**
- Node.js 18+
- Docker and Docker Compose
- Anthropic API key

**Quick Start:**
```bash
# Start backend and database
docker-compose up -d

# Install frontend dependencies
npm install

# Start frontend development server
npm run dev
```

Visit http://localhost:3334 to access the application.

### Documentation

- **README.md**: Quick start guide and overview
- **CLAUDE.md**: Comprehensive architecture and developer documentation
- **Skills Documentation**: `.claude/skills/README.md`

### License

MIT License - See LICENSE file for details

---

## Future Plans

- Enhanced analytics dashboard
- Team collaboration features
- Custom theme support
- Plugin marketplace for MCP servers and skills
- API documentation generator
- Performance profiling tools

[1.0.0]: https://github.com/yourusername/rigger/releases/tag/v1.0.0
