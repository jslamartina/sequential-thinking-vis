# Cursor Rules for Sequential Thinking Visualization

This directory contains Cursor rules to guide AI-assisted development of the MCP Sequential Thinking Visualization extension.

## Available Rules

### Always Applied Rules

These rules are automatically included in every AI conversation:

- **[project-structure.mdc](./project-structure.mdc)** - Project architecture, directory layout, and core files
- **[code-quality.mdc](./code-quality.mdc)** - Linting, formatting, code review, and quality standards

### File-Type Specific Rules

These rules apply automatically to specific file types:

- **[typescript-standards.mdc](./typescript-standards.mdc)** - TypeScript coding conventions, naming, patterns (_.ts, _.tsx)
- **[testing-standards.mdc](./testing-standards.mdc)** - Test structure, mocking, assertions (test/\*_/_.ts)
- **[documentation.mdc](./documentation.mdc)** - Documentation style and standards (_.md, docs/\*\*/_)

### On-Demand Rules

These rules can be referenced when needed for specific tasks:

- **[mcp-sdk-integration.mdc](./mcp-sdk-integration.mdc)** - MCP SDK integration for connecting to MCP servers
- **[vscode-extension-patterns.mdc](./vscode-extension-patterns.mdc)** - VS Code Extension API patterns and best practices
- **[ui-visualization.mdc](./ui-visualization.mdc)** - UI design, visualization patterns, and accessibility
- **[mcp-tools-guide.mdc](./mcp-tools-guide.mdc)** - MCP development tools available to the coding agent

## Rule Categories

### 🏗️ Architecture & Structure

- Project organization
- Directory layout
- Module boundaries
- Dependency management

### 💻 Code Standards

- TypeScript conventions
- Code quality metrics
- Linting and formatting
- Error handling patterns

### 🧪 Testing

- Test structure and organization
- Mocking strategies
- Integration testing
- Coverage requirements

### 🎨 UI/UX

- Visualization design
- Theme compatibility
- Accessibility standards
- User interaction patterns

### 🔌 MCP Integration

- Server communication
- Event handling
- Real-time updates
- Protocol compliance

### 📚 Documentation

- Code comments
- API documentation
- User guides
- Changelog maintenance

## Using These Rules

### For AI Assistants

Rules are automatically loaded based on:

1. **Context** - Always-applied rules load in every conversation
2. **File type** - Glob patterns match current files
3. **Explicit reference** - Can be referenced by description

### For Developers

Read these rules to understand:

- Project conventions
- Best practices
- Architecture decisions
- Quality standards

## Adding New Rules

To create a new rule:

1. Create a `.mdc` file in this directory
2. Add frontmatter with metadata:
   ```yaml
   ---
   alwaysApply: true  # or false
   globs: *.ts        # optional: file patterns
   description: "..."  # optional: searchable description
   ---
   ```
3. Write content in Markdown
4. Reference other files with `[filename](mdc:path/to/file)`

## Rule Priorities

When rules conflict:

1. Always-applied rules take precedence
2. File-specific rules override general rules
3. More specific rules override broader rules
4. Newer rules override older rules (update as needed)

## Maintenance

### Regular Reviews

- Quarterly review of all rules
- Update for new patterns and practices
- Remove outdated conventions
- Align with VS Code API changes

### Rule Quality Checklist

- [ ] Clear and actionable guidance
- [ ] Examples provided
- [ ] Links to relevant files
- [ ] Consistent with other rules
- [ ] No conflicts or contradictions

## Related Documentation

- [README.md](../README.md) - Project overview
- [CHANGELOG.md](../CHANGELOG.md) - Version history
- [package.json](../package.json) - Extension manifest
- [tsconfig.json](../tsconfig.json) - TypeScript configuration

## Questions?

If rules are unclear or incomplete:

1. Check related documentation
2. Review example code in `/src`
3. Consult VS Code Extension API docs
4. Ask for clarification and update rules accordingly

---

**Note:** These rules guide development but aren't absolute. Use judgment and adapt when situations warrant different approaches.
