# Rigger v1.0.0 - Initial Production Release

**Rigger** is a comprehensive visual testing interface for the Claude Agent SDK. This initial release provides a full-featured web application for configuring AI agents, testing tools, monitoring execution, and managing agent workflows.

---

## 🚀 Feature Overview

### Core Agent SDK Integration
- **19 Built-in Tools** with categorized organization:
  - 📁 File Operations: Read, Write, Edit, Glob, Grep
  - ⚙️ Execution: Bash, BashOutput, KillShell
  - 🌐 Web Access: WebFetch, WebSearch
  - 📋 Planning & Interaction: TodoWrite, Task, AskUserQuestion, ExitPlanMode
  - 🤖 Agent System: Skill, SlashCommand
- **Real-time Streaming**: Server-Sent Events (SSE) for responsive UI updates
- **Debug Metrics**: Comprehensive tracking of tokens, costs, cache statistics, and timing
- **Conversation Persistence**: Full chat history with database storage

### Session Management
- **Persistent Execution Contexts**: Track agent activity across multiple requests
- **Two-Tier Emergency Stop**:
  - ⏸️ Graceful Stop: Allow current operation to finish cleanly (5-second grace period)
  - 🛑 Force Kill: Immediate termination with complete resource cleanup
- **Resource Monitoring**: Real-time tracking of tokens, costs, turns, and tool usage
- **Auto-Cleanup**: Automatic termination of idle sessions (5-minute timeout)

### Configuration Management
- **Presets System**: Save and load complete agent configurations as named presets
- **Import/Export**: JSON-based configuration portability for sharing
- **Change Detection**: Visual indicators when active config differs from loaded preset
- **30+ Configuration Parameters**: Full control over Agent SDK settings

### Advanced Capabilities

#### 🔌 MCP (Model Context Protocol) Servers
External plugin support for extending Claude with additional tools:
- Pre-configured templates for: GitHub, Playwright, Notion, Filesystem, Git, Memory, Time
- Custom environment variable configuration
- Dynamic tool discovery

#### 📚 Skills System
- Packaged agent workflows loaded from `.claude/skills/`
- Built-in examples: PDF Processing, Data Transformation, Code Review
- Auto-discovery and management UI
- Create, edit, and delete skills directly from the interface

#### 🤝 Subagents
Specialized AI agents with custom prompts and tools:
- Built-in templates: Code Reviewer, Bug Hunter, Doc Writer, Refactorer, Test Generator
- Independent model and temperature settings
- Tool access restrictions for security

#### 🪝 Hooks System
Event-driven automation with pre-built templates:
- Triggers: on-prompt-submit, on-response-complete, on-tool-use, on-error
- Templates: Git Auto-Commit, Slack Notifications, Error Logging, Code Formatting, Backups, API Webhooks
- Variable interpolation for dynamic configurations

#### 📎 File Upload System
- Upload files up to 10MB for agent context
- Supported formats: text, JSON, CSV, PDF, images, code files
- Multiple integration methods: System Prompt, Working Directory, or Both
- Global vs conversation-scoped files

---

## 🖥️ User Interface

### Three-Panel Layout
The application features a responsive three-panel design:

**Left Panel - Sidebar Navigation** (10 tabs):
- Sessions, Configuration, Basic Config, Tools
- MCP Servers, Skills, Subagents, Hooks, Files, Advanced

**Center Panel - Configuration Content**:
- Tab-specific configuration and management UIs
- Real-time form validation
- Persistent settings across sessions

**Right Panel - Chat Interface** (4 tabs):
- 💬 **Chat**: Message history with streaming responses
- 🐛 **Debug**: Token usage, costs, cache metrics, API latency
- 🔧 **Tools**: Tool execution timeline with parameters and results
- ✅ **Todo**: Agent-created task list visualization

---

## 🛠️ Technical Architecture

### Frontend Stack
- **Framework**: Next.js 16 with React 19
- **Language**: TypeScript (full type safety)
- **Styling**: Tailwind CSS 4 with shadcn/ui components
- **State Management**: Zustand (no provider wrapping needed)
- **Real-time**: Server-Sent Events (SSE)

### Backend Stack
- **Framework**: Express.js with Node.js
- **Language**: TypeScript
- **Database**: PostgreSQL with JSONB for flexible schema
- **Agent SDK**: `@anthropic-ai/claude-agent-sdk` with full tool support
- **Containerization**: Docker Compose for easy deployment

### Database Schema
8 core tables with optimized indexing:
- `conversations`: Chat history and messages
- `agent_sessions`: Session lifecycle, metrics, emergency control
- `presets`: Saved agent configurations
- `usage_logs`: Per-request metrics and analytics
- `tool_usage_logs`: Per-tool execution tracking
- `todos` / `todo_items`: Task list management
- `custom_agents`: User-defined subagent definitions
- `uploaded_files`: File uploads for agent context

### Key Design Decisions
- **Session-based execution**: Persistent contexts with abort controls
- **Event-driven hooks**: Automation triggers for common workflows
- **Type-safe throughout**: Full TypeScript coverage for reliability
- **Docker-ready**: Complete containerization with single-command startup
- **Real-time streaming**: SSE for responsive UI updates without polling

---

## 📦 Installation Guide

### Prerequisites
- **Node.js** 18 or higher
- **Docker** and **Docker Compose**
- **Anthropic API Key** (get one at https://console.anthropic.com/)

### Quick Start

1. **Clone the repository**:
   ```bash
   git clone https://github.com/BitBrujo/rigger.git
   cd rigger
   ```

2. **Configure environment variables**:

   Create `backend/.env`:
   ```env
   DATABASE_URL=postgresql://agent_user:agent_pass@postgres:5432/agent_db
   ANTHROPIC_API_KEY=your_api_key_here
   PORT=3001
   ```

   Create `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3333/api
   ```

3. **Start backend and database**:
   ```bash
   docker-compose up -d
   ```

   Wait ~10 seconds for PostgreSQL initialization.

4. **Install frontend dependencies**:
   ```bash
   npm install
   ```

5. **Start development server**:
   ```bash
   npm run dev
   ```

6. **Access the application**:

   Open http://localhost:3334 in your browser.

### Port Configuration
- **Frontend**: 3334 (Next.js)
- **Backend API**: 3333 (Express - external)
- **Database**: 5335 (PostgreSQL - external)

### Verification
Test the backend health endpoint:
```bash
curl http://localhost:3333/health
```

---

## 📚 Documentation

- **README.md**: Project overview and quick start guide
- **CHANGELOG.md**: Complete feature documentation and version history
- **CLAUDE.md**: Comprehensive architecture and developer documentation (1000+ lines)
  - Complete application structure
  - Request flow diagrams
  - Database schema details
  - Development patterns
  - Troubleshooting guide
- **Skills Documentation**: `.claude/skills/README.md`

---

## 🎯 Use Cases

**Development & Testing**:
- Test Claude Agent SDK integrations before production deployment
- Experiment with different tool combinations and configurations
- Debug agent behavior with comprehensive metrics

**Workflow Automation**:
- Create custom skills for repetitive tasks
- Set up hooks for event-driven automation
- Integrate external tools via MCP servers

**Team Collaboration**:
- Share agent configurations via presets
- Export/import JSON configurations across projects
- Manage conversation history for review

**Learning & Experimentation**:
- Explore Claude's capabilities with 19 built-in tools
- Understand token usage and costs with real-time metrics
- Test subagents with specialized prompts

---

## 📸 Screenshots

The application features a modern, responsive interface with:
- **Dark mode support** with next-themes
- **Resizable panels** for customized layouts
- **Real-time streaming** with visual indicators
- **Comprehensive debug panels** showing all API metrics
- **Tool execution timeline** with parameters and results
- **Session controls** with emergency stop buttons

*(Screenshots can be added to the repository wiki or documentation site)*

---

## 🔮 Future Plans

- Enhanced analytics dashboard with charts and visualizations
- Team collaboration features (shared sessions, comments)
- Custom theme support beyond dark/light modes
- Plugin marketplace for MCP servers and skills
- API documentation generator from tool usage
- Performance profiling tools for optimization
- Export conversations to various formats (PDF, Markdown, JSON)

---

## 🤝 Contributing

Contributions are welcome! Please see the repository for contribution guidelines.

---

## 📄 License

This project is licensed under the MIT License. See the LICENSE file for details.

---

## 🙏 Acknowledgments

Built with:
- [Claude Agent SDK](https://github.com/anthropics/claude-agent-sdk) by Anthropic
- [Next.js](https://nextjs.org/) by Vercel
- [shadcn/ui](https://ui.shadcn.com/) components
- [Zustand](https://github.com/pmndrs/zustand) state management
- [PostgreSQL](https://www.postgresql.org/) database

---

**Thank you for trying Rigger v1.0.0!** 🎉

For issues, questions, or feature requests, please visit the [GitHub Issues](https://github.com/BitBrujo/rigger/issues) page.
