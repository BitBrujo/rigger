# Rigger Skills Directory

This directory contains Agent Skills that extend Rigger with specialized capabilities. Skills are automatically discovered and can be invoked by Claude when relevant to the user's request.

## What are Skills?

Skills are packaged instructions that teach Claude how to perform specialized tasks. Each skill is a directory containing a `SKILL.md` file with:

- **Description**: When Claude should use the skill (in YAML frontmatter)
- **Instructions**: Step-by-step workflow and best practices
- **Tool Requirements**: Which tools the skill uses
- **Examples**: Sample usage patterns

## Directory Structure

```
.claude/skills/
├── README.md (this file)
├── example-pdf-processing/
│   └── SKILL.md
├── example-code-review/
│   └── SKILL.md
├── example-data-transform/
│   └── SKILL.md
└── your-custom-skill/
    └── SKILL.md
```

## Available Skills

### 1. PDF Processing (`example-pdf-processing`)
**Description**: Extract text and data from PDF documents

**Use Cases**:
- Extract text from PDFs
- Parse PDF forms or tables
- Read PDF metadata
- Convert PDFs to other formats

**Tools Used**: Bash, Read, Write

### 2. Code Review (`example-code-review`)
**Description**: Perform comprehensive code reviews with best practices and security checks

**Use Cases**:
- Review code for quality
- Find security vulnerabilities
- Suggest performance optimizations
- Check code style

**Tools Used**: Read, Grep, Glob, Bash

### 3. Data Transform (`example-data-transform`)
**Description**: Transform and convert data between different formats

**Use Cases**:
- Convert JSON ↔ CSV ↔ XML ↔ YAML
- Reshape or restructure data
- Filter and aggregate data
- Merge data sources

**Tools Used**: Read, Write, Bash, Grep

## Creating Custom Skills

### Basic Structure

1. Create a new directory in `.claude/skills/`:
   ```bash
   mkdir -p .claude/skills/my-custom-skill
   ```

2. Create `SKILL.md` with YAML frontmatter:
   ```markdown
   ---
   description: Brief description of when to use this skill
   ---

   # My Custom Skill

   Detailed instructions for performing the task...

   ## When to Use
   - Specific trigger phrases
   - Types of requests

   ## Workflow
   1. Step one
   2. Step two
   3. ...

   ## Tools Used
   - Tool1
   - Tool2

   ## Examples
   ...
   ```

### YAML Frontmatter Fields

**Required**:
- `description`: When Claude should invoke the skill (1-2 sentences)

**Optional** (Note: only works in Claude Code CLI, not Rigger):
- `allowed-tools`: Tool restrictions (use Rigger's UI instead)

### Writing Effective Descriptions

The `description` field is crucial - it determines when Claude invokes your skill:

✅ **Good**:
```yaml
description: Process and analyze log files to find errors and patterns
```

❌ **Too Vague**:
```yaml
description: Help with files
```

✅ **Specific Keywords**:
```yaml
description: Generate API documentation from TypeScript interfaces and JSDoc comments
```

## How Skills Work in Rigger

1. **Discovery**: Skills are loaded from `.claude/skills/` at startup
2. **Matching**: Claude checks skill descriptions against user requests
3. **Invocation**: When a match is found, Claude follows the skill's instructions
4. **Execution**: Skill uses specified tools to complete the task

## Configuration in Rigger

### Enabling Skills

1. Go to **Config Panel** → **Skills Configuration**
2. Skills are enabled by default (loads from `['project']` sources)
3. Ensure "Skill" tool is enabled in **Tool Selector**

### Viewing Available Skills

The Skills Manager in Rigger shows:
- All discovered skills
- Skill descriptions
- Skill status (enabled/disabled)
- Full SKILL.md content

## Best Practices

### Skill Design

1. **Single Responsibility**: Each skill should do one thing well
2. **Clear Description**: Use specific keywords users might say
3. **Detailed Instructions**: Provide step-by-step workflows
4. **Tool Requirements**: List exactly which tools are needed
5. **Examples**: Show concrete usage scenarios

### File Organization

```
your-skill/
├── SKILL.md           # Main skill definition (required)
├── templates/         # Optional: file templates
├── scripts/           # Optional: helper scripts
└── examples/          # Optional: sample inputs/outputs
```

### Naming Conventions

- Use kebab-case for directory names: `data-processing`, `api-integration`
- Keep names descriptive but concise
- Avoid generic names like `helper` or `utils`

## Debugging Skills

### Skill Not Being Invoked?

1. **Check the description**: Is it specific enough?
2. **Test manually**: Ask Claude "What skills are available?"
3. **Verify tool access**: Ensure required tools are enabled
4. **Check file location**: Must be in `.claude/skills/[name]/SKILL.md`

### YAML Syntax Errors?

```bash
# Validate YAML frontmatter
head -n 5 .claude/skills/your-skill/SKILL.md
```

Common issues:
- Missing closing `---`
- Incorrect indentation
- Unquoted strings with special characters

## Example Workflows

### Creating a Deployment Skill

```markdown
---
description: Deploy applications to production environments with safety checks
---

# Deployment Skill

## When to Use
- "Deploy to production"
- "Push this to prod"
- "Release version X"

## Workflow
1. Run tests
2. Build production bundle
3. Check environment variables
4. Create backup
5. Deploy
6. Run smoke tests
7. Rollback if needed

## Safety Checks
- Ensure on correct branch
- Verify tests pass
- Check for uncommitted changes
- Confirm environment
- Create rollback point
```

### Creating a Database Migration Skill

```markdown
---
description: Create and run database migrations safely
---

# Database Migration Skill

## When to Use
- "Create a migration for..."
- "Add a column to..."
- "Migrate the database"

## Workflow
1. Analyze schema change
2. Generate migration file
3. Test on development DB
4. Create backup
5. Run migration
6. Verify success
7. Update documentation
```

## Integration with Rigger

Skills integrate seamlessly with Rigger's features:

- **Tool Selector**: Control which tools skills can use
- **MCP Servers**: Skills can use MCP resources
- **Subagents**: Skills can invoke custom agents
- **Hooks**: Skills can trigger events
- **Streaming**: Watch skill execution in real-time

## Resources

- **Claude Agent SDK Docs**: https://docs.anthropic.com/agent-sdk
- **Skills Guide**: https://code.claude.com/docs/en/skills
- **Best Practices**: https://docs.anthropic.com/agents-and-tools/agent-skills/best-practices
- **Cookbook**: https://github.com/anthropics/claude-cookbooks/tree/main/skills

## Contributing

When creating skills for your team:

1. Commit skills to git: `.claude/skills/` is project-level
2. Document tool dependencies
3. Include usage examples
4. Test with real scenarios
5. Update this README

## Getting Help

- Check existing skills for patterns
- Read the SDK documentation
- Test skills manually before relying on auto-invocation
- Use the Skills Manager UI to inspect skill metadata

---

**Note**: These example skills demonstrate the pattern but may need additional tool installations (pdftools, linters, etc.) to function fully. Customize them for your specific needs!
