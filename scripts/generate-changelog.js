#!/usr/bin/env node

/**
 * Changelog Generator for Rigger
 *
 * Generates release notes from git commit history
 * Supports conventional commits and groups by type
 *
 * Usage:
 *   node scripts/generate-changelog.js [tag]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHANGELOG_PATH = path.join(__dirname, '..', 'CHANGELOG.md');

/**
 * Execute git command and return output
 */
function gitCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8' }).trim();
  } catch (err) {
    return '';
  }
}

/**
 * Get the previous tag
 */
function getPreviousTag(currentTag) {
  const tags = gitCommand('git tag --sort=-version:refname').split('\n');
  const currentIndex = tags.indexOf(currentTag);

  if (currentIndex === -1) {
    return null;
  }

  return tags[currentIndex + 1] || null;
}

/**
 * Get commits between two references
 */
function getCommits(from, to) {
  const range = from ? `${from}..${to}` : to;
  const log = gitCommand(`git log ${range} --pretty=format:"%H|||%s|||%b|||%an|||%ae|||%ad" --date=short`);

  if (!log) {
    return [];
  }

  return log.split('\n').map((line) => {
    const parts = line.split('|||');
    const [hash, subject, body, author, email, date] = parts;
    return {
      hash: hash || '',
      subject: subject || '',
      body: body || '',
      author: author || '',
      email: email || '',
      date: date || ''
    };
  }).filter(commit => commit.hash); // Filter out empty entries
}

/**
 * Parse conventional commit
 */
function parseConventionalCommit(subject) {
  // Handle undefined or empty subjects
  if (!subject || typeof subject !== 'string') {
    return {
      type: 'other',
      scope: null,
      description: '',
    };
  }

  // Match: type(scope): description or type: description
  const match = subject.match(/^(\w+)(?:\(([^)]+)\))?: (.+)$/);

  if (match) {
    return {
      type: match[1].toLowerCase(),
      scope: match[2] || null,
      description: match[3],
    };
  }

  return {
    type: 'other',
    scope: null,
    description: subject,
  };
}

/**
 * Group commits by type
 */
function groupCommits(commits) {
  const groups = {
    breaking: [],
    feat: [],
    fix: [],
    perf: [],
    docs: [],
    style: [],
    refactor: [],
    test: [],
    build: [],
    ci: [],
    chore: [],
    other: [],
  };

  commits.forEach((commit) => {
    const parsed = parseConventionalCommit(commit.subject);

    // Check for breaking changes
    if (
      commit.body.includes('BREAKING CHANGE') ||
      commit.subject.includes('!')
    ) {
      groups.breaking.push({ ...commit, parsed });
    }

    // Add to type group
    const type = groups[parsed.type] ? parsed.type : 'other';
    groups[type].push({ ...commit, parsed });
  });

  return groups;
}

/**
 * Format commit for changelog
 */
function formatCommit(commit) {
  const shortHash = commit.hash.substring(0, 7);
  const scope = commit.parsed.scope ? `**${commit.parsed.scope}**: ` : '';
  return `- ${scope}${commit.parsed.description} ([${shortHash}](../../commit/${commit.hash}))`;
}

/**
 * Generate markdown section
 */
function generateSection(title, commits) {
  if (commits.length === 0) {
    return '';
  }

  let section = `### ${title}\n\n`;
  commits.forEach((commit) => {
    section += formatCommit(commit) + '\n';
  });
  section += '\n';

  return section;
}

/**
 * Generate full changelog
 */
function generateChangelog(currentTag, previousTag, commits) {
  const groups = groupCommits(commits);
  const date = new Date().toISOString().split('T')[0];

  let changelog = `# Release Notes - ${currentTag}\n\n`;
  changelog += `**Release Date**: ${date}\n\n`;

  if (previousTag) {
    changelog += `**Changes since**: ${previousTag}\n\n`;
  } else {
    changelog += `**Initial Release**\n\n`;
  }

  // Statistics
  const totalCommits = commits.length;
  const contributors = [...new Set(commits.map((c) => c.author))];

  changelog += `## Summary\n\n`;
  changelog += `- ${totalCommits} commit${totalCommits !== 1 ? 's' : ''}\n`;
  changelog += `- ${contributors.length} contributor${contributors !== 1 ? 's' : ''}\n\n`;

  // Breaking changes (most important)
  changelog += generateSection('⚠️ Breaking Changes', groups.breaking);

  // Features
  changelog += generateSection('✨ Features', groups.feat);

  // Bug fixes
  changelog += generateSection('🐛 Bug Fixes', groups.fix);

  // Performance improvements
  changelog += generateSection('⚡ Performance', groups.perf);

  // Documentation
  changelog += generateSection('📚 Documentation', groups.docs);

  // Refactoring
  changelog += generateSection('♻️ Refactoring', groups.refactor);

  // Tests
  changelog += generateSection('✅ Tests', groups.test);

  // Build/CI
  const buildCi = [...groups.build, ...groups.ci];
  changelog += generateSection('🔧 Build & CI', buildCi);

  // Chores and others
  const misc = [...groups.chore, ...groups.style, ...groups.other];
  changelog += generateSection('🧹 Chores', misc);

  // Contributors
  if (contributors.length > 0) {
    changelog += `## Contributors\n\n`;
    contributors.forEach((contributor) => {
      changelog += `- ${contributor}\n`;
    });
    changelog += `\n`;
  }

  // Installation
  changelog += `## Installation\n\n`;
  changelog += `\`\`\`bash\n`;
  changelog += `git clone https://github.com/yourusername/rigger.git\n`;
  changelog += `cd rigger\n`;
  changelog += `git checkout ${currentTag}\n`;
  changelog += `\`\`\`\n\n`;

  // Upgrade
  if (previousTag) {
    changelog += `## Upgrading from ${previousTag}\n\n`;
    changelog += `1. Backup your database\n`;
    changelog += `2. Pull latest changes: \`git pull && git checkout ${currentTag}\`\n`;
    changelog += `3. Rebuild containers: \`docker-compose down && docker-compose up -d --build\`\n`;
    changelog += `4. Update frontend: \`npm install && npm run dev\`\n\n`;
  }

  // Full changelog link
  if (previousTag) {
    changelog += `---\n\n`;
    changelog += `**Full Changelog**: [${previousTag}...${currentTag}](../../compare/${previousTag}...${currentTag})\n`;
  }

  return changelog;
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: node scripts/generate-changelog.js [tag]');
    console.error('Example: node scripts/generate-changelog.js v1.0.0');
    process.exit(1);
  }

  const currentTag = args[0];
  const previousTag = getPreviousTag(currentTag);

  console.log(`📝 Generating changelog for ${currentTag}`);

  if (previousTag) {
    console.log(`   Comparing with ${previousTag}`);
  } else {
    console.log(`   Initial release - no previous tag found`);
  }

  const commits = getCommits(previousTag, currentTag);

  if (commits.length === 0) {
    console.log('⚠️  No commits found in range');
    process.exit(0);
  }

  console.log(`   Found ${commits.length} commits`);

  const changelog = generateChangelog(currentTag, previousTag, commits);

  // Write to CHANGELOG.md
  fs.writeFileSync(CHANGELOG_PATH, changelog, 'utf8');

  console.log(`✅ Changelog written to ${CHANGELOG_PATH}`);
}

// Run the script
main();
