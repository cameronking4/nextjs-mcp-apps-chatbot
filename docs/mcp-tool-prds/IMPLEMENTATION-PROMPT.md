# MCP Tools Implementation Prompt

> Use this prompt when instructing an AI agent to implement the MCP tools defined in this folder.

---

## Prompt

You are implementing interactive MCP (Model Context Protocol) tools for a Next.js AI chatbot. The infrastructure is already built and working—your job is to add new tools following established patterns.

### Project Context

This is a Next.js 15+ App Router project with:
- AI SDK (`ai` package) for LLM integration with streaming
- Custom MCP client/server implementation (NOT using `StreamableHTTPClientTransport`)
- Interactive UIs rendered in sandboxed iframes using `postMessage` protocol
- shadcn/ui components with Tailwind CSS
- TypeScript throughout

### Architecture Overview

```
User asks question
    ↓
AI decides to call MCP tool (e.g., `mcp_demo-server_kanban-board`)
    ↓
Tool executes on server, returns { content, _mcpMeta: { uiHtml, uiMeta } }
    ↓
Chat UI renders MCPToolResult component
    ↓
MCPAppHost embeds uiHtml in sandboxed iframe
    ↓
Iframe JS uses postMessage to call app-only tools
    ↓
Host proxies tool calls back to MCP server
```

### Key Files You Must Understand

Read these files before implementing:

1. **`lib/mcp/demo-server/tools.ts`** - Existing tool definitions with Zod schemas. This is where you ADD new tools.

2. **`lib/mcp/demo-server/ui/counter-view.ts`** - Reference implementation of an interactive UI. Shows the exact postMessage protocol.

3. **`lib/mcp/demo-server/ui/time-view.ts`** - Another UI example with different patterns (real-time updates).

4. **`app/api/mcp/server/[[...path]]/route.ts`** - The MCP server handler. Processes JSON-RPC calls.

5. **`components/mcp-app-host.tsx`** - The iframe host component. Handles postMessage communication.

6. **`components/mcp-tool-result.tsx`** - Renders tool outputs, delegates to MCPAppHost for interactive UIs.

### Critical Implementation Patterns

#### 1. Tool Definition Pattern (in `tools.ts`)

```typescript
import { z } from "zod";

// Schema for the PRIMARY tool (called by AI)
export const kanbanBoardSchema = z.object({
  title: z.string().optional().default("My Tasks"),
  columns: z.array(z.object({
    id: z.string(),
    title: z.string(),
    color: z.string().optional(),
  })).optional(),
  tasks: z.array(z.object({
    id: z.string(),
    title: z.string(),
    columnId: z.string(),
    // ... more fields
  })).optional(),
});

// Schemas for APP-ONLY tools (called from iframe)
export const kanbanAddTaskSchema = z.object({
  columnId: z.string(),
  title: z.string(),
  description: z.string().optional(),
});

export const kanbanMoveTaskSchema = z.object({
  taskId: z.string(),
  targetColumnId: z.string(),
  position: z.number().optional(),
});

// Tool definitions array
export const DEMO_TOOLS: DemoTool[] = [
  // PRIMARY TOOL - has UI
  {
    name: "kanban-board",
    description: "Display an interactive Kanban task board",
    inputSchema: kanbanBoardSchema,
    hasUI: true,
    uiResourceUri: "mcp://demo-server/ui/kanban",
  },
  // APP-ONLY TOOLS - no UI, called from iframe
  {
    name: "kanban-add-task",
    description: "Add a task to the Kanban board",
    inputSchema: kanbanAddTaskSchema,
    hasUI: false,
    appOnly: true, // Mark as app-only
  },
  {
    name: "kanban-move-task",
    description: "Move a task between columns",
    inputSchema: kanbanMoveTaskSchema,
    hasUI: false,
    appOnly: true,
  },
];
```

#### 2. Tool Handler Pattern (in `route.ts`)

Add cases to the `tools/call` handler:

```typescript
case "kanban-board": {
  const input = kanbanBoardSchema.parse(params.arguments);
  // Generate initial state or process input
  const boardState = {
    title: input.title,
    columns: input.columns ?? DEFAULT_COLUMNS,
    tasks: input.tasks ?? [],
  };
  return {
    content: [{ type: "text", text: JSON.stringify(boardState) }],
    _meta: {
      ui: {
        resourceUri: "mcp://demo-server/ui/kanban",
        initialHeight: 500,
        resizable: true,
      },
    },
  };
}

case "kanban-add-task": {
  const input = kanbanAddTaskSchema.parse(params.arguments);
  // Process the action, return new state
  const newTask = {
    id: `task-${Date.now()}`,
    ...input,
  };
  return {
    content: [{ type: "text", text: JSON.stringify({ task: newTask }) }],
  };
}
```

#### 3. UI View Pattern (CRITICAL - follow exactly)

Create `lib/mcp/demo-server/ui/kanban-view.ts`:

```typescript
export function getKanbanViewHtml(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    :root {
      --bg: #ffffff;
      --text: #1a1a1a;
      --border: #e5e5e5;
      --accent: #3b82f6;
    }
    body.dark {
      --bg: #1a1a1a;
      --text: #f5f5f5;
      --border: #333333;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: var(--bg);
      color: var(--text);
      padding: 16px;
    }
    /* Your component styles... */
  </style>
</head>
<body>
  <!-- Your HTML structure -->
  <div id="board"></div>

  <script>
    // STATE
    let state = { columns: [], tasks: [] };

    // RENDER FUNCTION
    function render() {
      const board = document.getElementById('board');
      // Build your UI from state...
    }

    // CALL MCP TOOL (app-only tools)
    async function callTool(name, args) {
      return new Promise((resolve, reject) => {
        const id = Date.now().toString();
        
        function handler(event) {
          const { type, payload } = event.data || {};
          if (type === 'mcp:toolResult' && payload?.id === id) {
            window.removeEventListener('message', handler);
            if (payload.error) {
              reject(new Error(payload.error));
            } else {
              resolve(payload.result);
            }
          }
        }
        
        window.addEventListener('message', handler);
        window.parent.postMessage({
          type: 'mcp:callTool',
          payload: { id, name, arguments: args }
        }, '*');
        
        // Timeout after 30s
        setTimeout(() => {
          window.removeEventListener('message', handler);
          reject(new Error('Tool call timeout'));
        }, 30000);
      });
    }

    // HANDLE HOST MESSAGES
    window.addEventListener('message', (event) => {
      const { type, payload } = event.data || {};
      
      // Initial tool result (primary tool output)
      if (type === 'mcp:toolResult' && payload?.content?.[0]?.text) {
        try {
          const data = JSON.parse(payload.content[0].text);
          state = { ...state, ...data };
          render();
        } catch (e) {
          console.error('Failed to parse initial state:', e);
        }
      }
      
      // Theme updates
      if (type === 'mcp:hostContext' && payload?.theme) {
        document.body.classList.toggle('dark', payload.theme === 'dark');
      }
    });

    // SIGNAL READY
    window.parent.postMessage({ type: 'mcp:ready' }, '*');
    
    // Initial render
    render();
  </script>
</body>
</html>
`;
}
```

#### 4. Register UI Resource (in `route.ts`)

Add to the resources/read handler:

```typescript
case "mcp://demo-server/ui/kanban": {
  const { getKanbanViewHtml } = await import("@/lib/mcp/demo-server/ui/kanban-view");
  return {
    contents: [{
      uri,
      mimeType: "text/html",
      text: getKanbanViewHtml(),
    }],
  };
}
```

And add to resources/list:

```typescript
{
  uri: "mcp://demo-server/ui/kanban",
  name: "Kanban Board UI",
  mimeType: "text/html",
}
```

### PostMessage Protocol Reference

Messages FROM iframe TO host:
```typescript
// Signal iframe is ready
{ type: 'mcp:ready' }

// Call an app-only tool
{ type: 'mcp:callTool', payload: { id: string, name: string, arguments: object } }

// Report size change (if resizable)
{ type: 'mcp:sizeChange', payload: { height: number } }
```

Messages FROM host TO iframe:
```typescript
// Initial tool result data
{ type: 'mcp:toolResult', payload: { content: [...], id?: string, error?: string } }

// Host context (theme, etc.)
{ type: 'mcp:hostContext', payload: { theme: 'light' | 'dark', displayMode: string } }

// Tool input (if needed)
{ type: 'mcp:toolInput', payload: { ... } }
```

### Common Pitfalls to Avoid

1. **DO NOT use the MCP SDK AppBridge** - We use a simpler postMessage protocol. The SDK had initialization issues.

2. **DO NOT use external scripts in iframes without `allow-same-origin`** - The sandbox already includes it, but if you modify sandbox attrs, keep it.

3. **ALWAYS signal ready** - The iframe MUST send `mcp:ready` or the host won't send initial data.

4. **ALWAYS handle theme** - Check for `mcp:hostContext` and apply dark mode class.

5. **JSON parse safely** - Always wrap JSON.parse in try/catch.

6. **Use CSS variables for theming** - Define in :root and override in body.dark.

7. **Keep iframes self-contained** - All CSS/JS inline in the HTML string. No external dependencies except CDN (esm.sh) if absolutely needed.

### Testing Your Implementation

1. Start dev server: `npm run dev`

2. Ask the AI to use your tool:
   - "Show me a kanban board"
   - "Create a calendar for next week"
   - "Visualize this data as a chart: [paste data]"

3. Verify:
   - Tool appears in MCP status badge dialog
   - AI can call the tool
   - Interactive UI renders (not raw JSON)
   - Theme switches work
   - App-only tool calls work from UI

4. Check browser console for errors in both main page and iframe (right-click iframe → Inspect)

### Implementation Order

Implement in this order (increasing complexity):

1. **Interactive Data Visualizer** - Use Chart.js from CDN, straightforward render
2. **Markdown Editor** - Use a simple contenteditable or textarea with preview
3. **Kanban Board** - Drag-drop is complex but well-documented
4. **API Tester** - Needs server proxy for CORS, more moving parts
5. **Calendar** - Most complex state management and date handling

### File Checklist Per Tool

For each tool, create/modify:

- [ ] `lib/mcp/demo-server/tools.ts` - Add tool schemas and definitions
- [ ] `lib/mcp/demo-server/ui/{tool}-view.ts` - Create UI HTML generator
- [ ] `app/api/mcp/server/[[...path]]/route.ts` - Add tool handlers and resource
- [ ] Test end-to-end in chat

### PRD Reference

Detailed requirements for each tool are in:
- `docs/mcp-tool-prds/kanban-task-board.md`
- `docs/mcp-tool-prds/calendar-scheduler.md`
- `docs/mcp-tool-prds/interactive-data-visualizer.md`
- `docs/mcp-tool-prds/markdown-rich-text-editor.md`
- `docs/mcp-tool-prds/api-tester.md`

Read the PRD for the tool you're implementing to understand the full requirements.

---

## Example Starting Point

Here's how to begin implementing the Data Visualizer:

```
1. Read the PRD: docs/mcp-tool-prds/interactive-data-visualizer.md

2. Read existing patterns:
   - lib/mcp/demo-server/tools.ts (see how counter/time tools are defined)
   - lib/mcp/demo-server/ui/counter-view.ts (see postMessage pattern)

3. Create the tool schema in tools.ts:
   - data-visualizer (primary, hasUI: true)
   - viz-change-type (app-only)
   - viz-export (app-only)

4. Create lib/mcp/demo-server/ui/data-viz-view.ts:
   - Import Chart.js from esm.sh CDN
   - Render chart from initial data
   - Handle chart type changes via app-only tools

5. Add handlers in route.ts:
   - tools/call case for "data-visualizer"
   - tools/call cases for app-only tools
   - resources/read case for the UI
   - resources/list entry

6. Test: "Visualize this as a bar chart: [{x: 'A', y: 10}, {x: 'B', y: 20}]"
```

Now implement all 5 tools following this pattern. Start with the Data Visualizer, verify it works end-to-end, then proceed to the next.

---

*Good luck! The infrastructure is solid—just follow the patterns.*
