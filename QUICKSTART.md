# Quick Start Guide

Get up and running with the Claude Agent SDK Tester in 5 minutes.

## Prerequisites

Make sure you have:
- Node.js 20+ installed
- Docker and Docker Compose installed
- An Anthropic API key

## Step 1: Install Backend Dependencies

```bash
cd backend
npm install
cd ..
```

## Step 2: Configure Environment

Create the backend environment file:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and add your Anthropic API key:

```env
ANTHROPIC_API_KEY=your_api_key_here
```

## Step 3: Start Docker Services

Start PostgreSQL and the backend API:

```bash
docker-compose up -d
```

Wait a few seconds for services to start, then verify:

```bash
# Check if services are running
docker-compose ps

# Check backend health
curl http://localhost:3001/health
```

You should see: `{"status":"ok","timestamp":"..."}`

## Step 4: Start Frontend

```bash
npm run dev
```

## Step 5: Open the App

Visit [http://localhost:3334](http://localhost:3334)

## First Steps

1. **Select a Model** (left panel) - Choose Claude 3.5 Sonnet to start
2. **Configure Tools** (left panel) - Enable/disable tools via Tool Selector
3. **Type a Message** - Ask Claude anything in the chat tab
4. **View Debug Info** - Click the Debug tab to see metrics and API details
5. **Monitor Tools** - Check the Tools tab (in right panel) to see tool executions

## Testing Different Configurations

### Try Different Models

- **Sonnet**: Best balance of speed and capability
- **Haiku**: Fastest, great for simple tasks
- **Opus**: Most capable, best for complex reasoning

### Enable Extended Thinking

- **Max Thinking Tokens**: Set to 1000+ to enable Claude's extended thinking mode
- Available in Advanced Settings section

### Use System Prompts

Try the Claude Code Preset or manual templates:
- Full Agent
- Code Assistant
- Research Agent
- DevOps Agent
- Data Analyst

### Configure Tools

Use the Tool Selector to enable/disable tools:
- **File Operations**: Read, Write, Edit, Glob, Grep
- **Execution**: Bash, BashOutput, KillShell
- **Web**: WebFetch, WebSearch
- **Task Management**: TodoWrite, Task
- **Agent System**: AskUserQuestion, ExitPlanMode, Skill, SlashCommand

### Save Presets

1. Configure your ideal settings
2. Click "Save Preset"
3. Give it a name
4. Load it anytime from "Load Preset"

## Troubleshooting

### Backend won't start

```bash
# Check logs
docker-compose logs backend

# Restart services
docker-compose restart
```

### Can't connect to database

```bash
# Reset database
docker-compose down -v
docker-compose up -d
```

### Port already in use

If port 3334 or 3001 is taken:

```bash
# Stop conflicting services or change ports in:
# - docker-compose.yml (backend port: 3001)
# - package.json (frontend port: 3334 in "dev" script)
```

## Next Steps

- Read the [full README](README.md) for detailed documentation
- Explore API endpoints at `http://localhost:3001/api`
- Check out the database schema in `backend/db/schema.sql`
- View usage analytics in the database

## Stopping Services

```bash
# Stop frontend: Ctrl+C in terminal

# Stop Docker services
docker-compose down

# Stop and remove database
docker-compose down -v
```

## Need Help?

Check the [README](README.md) or open an issue on GitHub.
