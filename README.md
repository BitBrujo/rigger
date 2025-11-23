# Rigger

**The visual dashboard for Claude's Agent SDK.** Test, debug, and manage your AI agents without writing code.

<img width="3058" height="1772" alt="screencapture-100-87-169-2-3334-2025-11-23-17_43_27" src="https://github.com/user-attachments/assets/cd3d679c-01a5-4726-b6d4-c58e3add98b1" />

## What Is This?

If you're working with the [Claude Agent SDK](https://github.com/anthropics/claude-agent-sdk-ts), you know it's powerful—but running agents from the command line or writing test scripts gets old fast.

**Rigger is mission control for the Agent SDK.** It gives you a visual interface to:
- Configure all 30+ SDK parameters with forms instead of JSON
- Test agents with real-time streaming and debug metrics
- Monitor sessions with token usage, costs, and execution timelines
- Manage tools, MCP servers, skills, and subagents visually
- Save and share agent configurations as presets

<img width="3024" height="1646" alt="screencapture-100-87-169-2-3334-2025-11-23-17_41_41" src="https://github.com/user-attachments/assets/ca85f2fb-4fcd-47e2-bc00-da2721846f89" />

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Anthropic API key ([get one here](https://console.anthropic.com))

### Quick Setup

**1. Clone and install:**
```bash
git clone <repository-url>
cd rigger
npm install
cd backend && npm install && cd ..
```

**2. Configure API key:**
```bash
# Copy environment templates
cp .env.local.example .env.local
cp backend/.env.example backend/.env

# Edit backend/.env and add your Anthropic API key
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

**3. Start services:**
```bash
# Start backend + database
docker-compose up -d

# Start frontend (in a new terminal)
npm run dev
```

**4. Open http://localhost:3334**

You'll see the SDK dashboard with sidebar navigation on the left and chat interface on the right.

## Documentation

- **`CLAUDE.md`** → Complete architecture and SDK integration details
- **`.claude/skills/README.md`** → Skills system deep dive
- **[Agent SDK Docs](https://github.com/anthropics/claude-agent-sdk-ts)** → Official SDK documentation

## Contributing

This is a tool for the Agent SDK community. Contributions welcome:

- **Bug reports** → Open an issue
- **Feature requests** → Describe your SDK use case
- **Pull requests** → Add features that help SDK development

## License

MIT — use it however helps your SDK development.

---

Built for developers working with the Claude Agent SDK. Makes testing and debugging agents visual and fast.
