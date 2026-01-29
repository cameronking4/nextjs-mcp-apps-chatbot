# MCP Tool PRDs

Product Requirements Documents for interactive MCP tools to build.

> **For AI Agents**: See [IMPLEMENTATION-PROMPT.md](./IMPLEMENTATION-PROMPT.md) for complete implementation instructions, patterns, and code examples.

## Tools

| Tool | Description | Complexity | Status |
|------|-------------|------------|--------|
| [Kanban Task Board](./kanban-task-board.md) | Visual drag-and-drop task management | Medium | 📋 Planned |
| [Calendar Scheduler](./calendar-scheduler.md) | Interactive calendar with event booking | High | 📋 Planned |
| [Interactive Data Visualizer](./interactive-data-visualizer.md) | Charts and graphs from data | Medium | 📋 Planned |
| [Markdown/Rich Text Editor](./markdown-rich-text-editor.md) | WYSIWYG editor with AI assistance | Medium | 📋 Planned |
| [API Tester](./api-tester.md) | Mini-Postman for HTTP requests | Medium | 📋 Planned |

## PRD Structure

Each PRD includes:

1. **Overview** - What the tool does and why it's valuable
2. **Tool Definition** - MCP tool schema with inputs
3. **App-Only Tools** - Tools called from the UI (increment, save, etc.)
4. **UI Features** - Detailed interface specifications
5. **Data Flow** - Visual diagram of user interactions
6. **Technical Considerations** - Implementation notes
7. **Example Prompts** - How users might invoke the tool
8. **Future Enhancements** - Roadmap ideas

## Implementation Priority

### Phase 1 (Quick Wins)
1. **Interactive Data Visualizer** - High impact, moderate complexity
2. **Markdown Editor** - Builds on existing document tools

### Phase 2 (Core Productivity)
3. **Kanban Task Board** - Popular use case, showcases drag-drop
4. **API Tester** - Developer-focused, unique value

### Phase 3 (Advanced)
5. **Calendar Scheduler** - Complex state, timezone handling

## Development Guidelines

When implementing these tools:

1. **Start with the UI** - Build the iframe HTML/JS first
2. **Use postMessage** - Simple communication protocol with host
3. **Graceful fallbacks** - Work offline, handle errors
4. **Mobile-friendly** - Responsive design from the start
5. **Accessible** - Keyboard nav, screen reader support

## Adding New Tools

To propose a new MCP tool:

1. Copy the template structure from an existing PRD
2. Fill in all sections with detailed specifications
3. Include ASCII diagrams for UI layout
4. Add to the table above with "📋 Planned" status
