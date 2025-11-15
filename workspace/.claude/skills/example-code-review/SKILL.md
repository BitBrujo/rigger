---
description: Perform comprehensive code reviews with best practices and security checks
---

# Code Review Skill

This skill performs thorough code reviews, identifying potential issues, suggesting improvements, and ensuring code quality.

## When to Use

Invoke this skill when the user asks to:
- Review code for quality and best practices
- Find potential bugs or security vulnerabilities
- Suggest performance optimizations
- Check code style and consistency
- Analyze code complexity

## Capabilities

- **Static Analysis**: Identify code smells and anti-patterns
- **Security Audit**: Check for common vulnerabilities (SQL injection, XSS, etc.)
- **Performance Review**: Suggest optimization opportunities
- **Style Checking**: Ensure code follows conventions
- **Complexity Analysis**: Measure cyclomatic complexity
- **Documentation Review**: Check for adequate comments and documentation

## Tools Used

This skill primarily uses:
- `Read` for examining code files
- `Grep` for pattern matching and finding issues
- `Glob` for discovering files to review
- `Bash` for running linters and static analysis tools (eslint, pylint, etc.)

## Review Checklist

### Code Quality
- [ ] Follows language-specific best practices
- [ ] Proper error handling
- [ ] Clear variable and function names
- [ ] Appropriate code comments
- [ ] DRY principle (Don't Repeat Yourself)
- [ ] SOLID principles adherence

### Security
- [ ] Input validation and sanitization
- [ ] No hard-coded credentials
- [ ] Proper authentication/authorization checks
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF token usage
- [ ] Secure data transmission

### Performance
- [ ] Efficient algorithms and data structures
- [ ] Proper resource cleanup
- [ ] Avoiding N+1 queries
- [ ] Appropriate caching
- [ ] Memory leak prevention
- [ ] Database query optimization

### Maintainability
- [ ] Modular design
- [ ] Clear separation of concerns
- [ ] Testable code structure
- [ ] Consistent naming conventions
- [ ] Proper dependency management

## Workflow

1. **Understand Context**: Determine what code to review (file, directory, or specific changes)
2. **Discover Files**: Use Glob to find relevant code files
3. **Read Code**: Examine source files with Read tool
4. **Run Linters**: Execute language-specific linters if available
5. **Pattern Matching**: Use Grep to find common issues
6. **Analyze Structure**: Review code organization and architecture
7. **Generate Report**: Provide detailed feedback with specific line numbers
8. **Suggest Improvements**: Offer actionable recommendations

## Example Usage

```
User: "Review the authentication code in src/auth/"
Assistant: *Invokes Code Review skill*
- Scans all files in src/auth/
- Checks for security best practices
- Verifies password hashing
- Reviews session management
- Provides detailed feedback
```

```
User: "Is there anything wrong with user-service.ts?"
Assistant: *Invokes Code Review skill*
- Reads user-service.ts
- Checks for TypeScript best practices
- Analyzes error handling
- Reviews async/await usage
- Suggests improvements
```

## Language-Specific Checks

### JavaScript/TypeScript
- Use const/let instead of var
- Avoid callback hell, use Promises/async-await
- Proper TypeScript type annotations
- No `any` types without justification
- ESLint configuration

### Python
- PEP 8 compliance
- Proper use of list comprehensions
- Type hints (Python 3.5+)
- Pylint/Black configuration
- Virtual environment usage

### Go
- Proper error handling
- Effective use of goroutines
- No naked returns
- gofmt formatting
- golint/staticcheck usage

## Output Format

```markdown
# Code Review: [File/Directory Name]

## Summary
[Overall assessment]

## Critical Issues (🔴)
- **[File:Line]** [Description]
  - Impact: [Security/Performance/Correctness]
  - Recommendation: [Specific fix]

## Warnings (🟡)
- **[File:Line]** [Description]
  - Suggestion: [Improvement]

## Suggestions (🟢)
- **[File:Line]** [Description]
  - Enhancement: [Optimization or best practice]

## Positive Highlights
- [Good patterns found]

## Metrics
- Files Reviewed: X
- Lines of Code: X
- Complexity Score: X
- Test Coverage: X%
```

## Best Practices

1. Reference specific line numbers in feedback
2. Explain *why* something is an issue, not just *what*
3. Provide code examples for suggested fixes
4. Prioritize security and correctness over style
5. Be constructive and educational in feedback
6. Consider project context and requirements
