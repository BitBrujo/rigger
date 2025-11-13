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

Visit [http://localhost:3000](http://localhost:3000)

## First Steps

1. **Select a Model** (left panel) - Choose Claude 3.5 Sonnet to start
2. **Adjust Temperature** - Try 0.7 for balanced responses
3. **Type a Message** - Ask Claude anything in the center panel
4. **View Debug Info** - Check the right panel for metrics and API details

## Testing Different Configurations

### Try Different Models

- **Sonnet**: Best balance of speed and capability
- **Haiku**: Fastest, great for simple tasks
- **Opus**: Most capable, best for complex reasoning

### Experiment with Temperature

- **0.0-0.3**: Deterministic, consistent responses
- **0.4-0.7**: Balanced creativity
- **0.8-1.0**: Highly creative and varied

### Use System Prompts

Click "Templates" in the System Prompt section to try:
- Code Assistant
- Creative Writer
- Data Analyst
- Technical Documenter

### Toggle Streaming

Use the switch at the top of the chat panel to compare:
- **Streaming**: See responses token-by-token in real-time
- **Batch**: Wait for complete response

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

If port 3000 or 3001 is taken:

```bash
# Stop conflicting services or change ports in:
# - docker-compose.yml (backend port)
# - Next.js will auto-detect and suggest alternative
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
