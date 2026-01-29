# MCP Apps — A Practical, End-to-End Guide for Builders

> **MCP Apps** extend the Model Context Protocol (MCP) so tools can ship **interactive UIs**—not just text—directly inside chat clients like Claude, VS Code, and ChatGPT.

This document explains **what MCP Apps are**, **how they work**, **how clients and servers cooperate**, and **what to watch out for** when building them in the real world.

---

## 1. What are MCP Apps, how do they work, and why do they matter?

### What MCP Apps are

At a high level:

> **An MCP App = an MCP tool + a UI resource**

Traditional MCP tools return text or structured JSON. MCP Apps add a **standardized way to attach an interactive UI**—HTML/JS rendered inline in the conversation.

Instead of this:

> *“Here’s a table. Tell me which row you want.”*

You can do this:

> *Render the table. Let the user click, filter, zoom, and submit choices directly.*

Official definition and SDK:
- https://modelcontextprotocol.github.io/ext-apps/api/
- Specification (stable, 2026-01-26):  
  https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx

---

### How MCP Apps work (conceptual flow)

1. **Tool declares a UI**
   - The tool metadata includes a `ui://...` resource URI pointing to an HTML interface.

2. **Model (or user) triggers the tool**
   - Normal MCP tool invocation.

3. **Host renders the UI**
   - The MCP client fetches the `ui://` resource.
   - It renders it inside a **sandboxed iframe**, inline in the chat.

4. **Bidirectional communication**
   - Tool inputs/results are streamed to the UI.
   - The UI can call other tools, update model context, or request host actions.

Official overview:
- https://modelcontextprotocol.github.io/ext-apps/api/documents/Overview.html
- MCP blog announcement:  
  https://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/

---

### Why MCP Apps matter

**Before MCP Apps**
- All interaction flows through text.
- Complex tasks require repeated prompting.
- Visualization, media, and structured interaction are clumsy.

**With MCP Apps**
- UI becomes a *first-class citizen* of the conversation.
- The model reasons; the UI handles interaction.
- One app works across many hosts.

Supported or announced hosts include:
- Claude (web + desktop)
- VS Code (Insiders)
- Goose
- ChatGPT  
Source: https://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/

**Analogy**  
Think of MCP Apps like **React components for conversations**: declarative, sandboxed, reusable, and portable across environments.

---

## 2. How MCP clients render apps and how users engage with them

### The MCP client’s role (the “host”)

An MCP client (Claude, VS Code, ChatGPT, etc.) acts as the **host**:

- Detects tools with UI metadata
- Fetches `ui://` resources from the server
- Renders them in a sandboxed iframe
- Bridges messages between:
  - the MCP server
  - the model
  - the embedded UI

Host-side SDK:
- `@modelcontextprotocol/ext-apps/app-bridge`
- API docs:  
  https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html

---

### Rendering model

- Each MCP App runs in an **isolated iframe**
- Communication uses JSON-RPC over `postMessage`
- No direct DOM or JS access to the host
- Host controls:
  - permissions
  - allowed domains
  - display modes (inline, modal, fullscreen)

This design makes apps:
- auditable
- safe
- predictable across hosts

---

### User interaction model

From the user’s perspective:

1. They invoke a tool (explicitly or implicitly).
2. The UI appears inline in the chat.
3. They interact with the UI:
   - click buttons
   - fill forms
   - zoom charts
   - scrub video
4. Their actions may:
   - call app-only tools
   - call server tools
   - update the model’s context

The model stays “in the loop” without micromanaging UI details.

---

### UI-side API (what runs in the iframe)

The UI uses the **App SDK**:

```ts
import { App } from "@modelcontextprotocol/ext-apps";

const app = new App();
await app.connect();

app.ontoolresult = (result) => {
  render(result.structuredContent);
};

await app.callServerTool({
  name: "fetch_more_data",
  arguments: { page: 2 }
});
````

Docs:

* [https://modelcontextprotocol.github.io/ext-apps/api/modules/app.html](https://modelcontextprotocol.github.io/ext-apps/api/modules/app.html)
* React hooks:
  [https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html)

---

## 3. How MCP servers serve apps and how users engage with them

### Server responsibilities

An MCP server that supports apps must:

1. **Register tools**
2. **Register UI resources**
3. **Bind tools to UI resources**
4. **Handle back-and-forth messaging**

Recommended helpers:

* `registerAppTool`
* `registerAppResource`

Docs:

* [https://modelcontextprotocol.github.io/ext-apps/api/modules/server-helpers.html](https://modelcontextprotocol.github.io/ext-apps/api/modules/server-helpers.html)

---

### Tool ↔ UI contract (the key idea)

A tool declares which UI to render:

```ts
_meta: {
  ui: {
    resourceUri: "ui://my-app/view.html"
  }
}
```

That’s the entire binding.

When the tool runs:

* The model sees text/structured output
* The host sees the UI metadata and renders the app

---

### Minimal server example

```ts
registerAppTool(
  server,
  "getTime",
  {
    title: "Server Time",
    description: "Get the current server time",
    inputSchema: z.object({}),
    _meta: { ui: { resourceUri: "ui://time/view.html" } }
  },
  async () => ({
    content: [{ type: "text", text: new Date().toISOString() }]
  })
);

registerAppResource(
  server,
  "Time UI",
  "ui://time/view.html",
  {},
  async () => ({
    contents: [{
      uri: "ui://time/view.html",
      text: "<!doctype html>...</html>"
    }]
  })
);
```

Source:

* [https://modelcontextprotocol.github.io/ext-apps/api/documents/Quickstart.html](https://modelcontextprotocol.github.io/ext-apps/api/documents/Quickstart.html)

---

### App-only tools (important pattern)

Some tools should **only be callable by the UI**, not the model:

```ts
_meta: {
  ui: { visibility: ["app"] }
}
```

Use cases:

* pagination
* sorting
* row selection
* incremental loading

Docs:

* [https://modelcontextprotocol.github.io/ext-apps/api/documents/Patterns.html](https://modelcontextprotocol.github.io/ext-apps/api/documents/Patterns.html)

---

### Back-and-forth lifecycle

**Server → UI**

* tool input notifications
* tool result notifications
* cancellation signals

**UI → Server**

* tool calls
* partial updates
* teardown requests

**UI → Model**

* context updates (`updateModelContext`)

All messages follow MCP schemas and are auditable.

---

## 4. Gotchas, constraints, and developer tips

### Gotchas

**1. Register handlers before `connect()`**
Events may arrive immediately after initialization.

* Migration guide:
  [https://modelcontextprotocol.github.io/ext-apps/api/documents/Migrate_OpenAI_App.html](https://modelcontextprotocol.github.io/ext-apps/api/documents/Migrate_OpenAI_App.html)

**2. UI resources must be deterministic**
Hosts may prefetch or cache UIs. Avoid user-specific secrets in raw HTML.

**3. Sandboxed iframe limitations**

* No unrestricted network access
* CSP and domain restrictions apply
* Treat it like a strict embedded environment

---

### Constraints to design around

* Tool response size limits → use **chunked loading**
* Latency → keep UI reactive, offload heavy logic to app-only tools
* Model context budget → don’t dump UI state into the model

Chunking pattern:

* [https://modelcontextprotocol.github.io/ext-apps/api/documents/Patterns.html](https://modelcontextprotocol.github.io/ext-apps/api/documents/Patterns.html)

---

### Good-to-know details

* UI MIME type is standardized:
  `text/html;profile=mcp-app`
* Host styling (theme, fonts, safe areas) is available—use it
* Display modes (inline vs fullscreen) must be requested, not assumed

---

### Practical dev tips

* Use **`examples/basic-host`** as your local dev harness
  [https://github.com/modelcontextprotocol/ext-apps/tree/main/examples/basic-host](https://github.com/modelcontextprotocol/ext-apps/tree/main/examples/basic-host)
* Start with one tool + one UI
* Add app-only tools early
* Test in a real host only after the UI is stable
* Treat the model as a collaborator, not a click handler

---

## References & further reading

* MCP Apps SDK & docs
  [https://modelcontextprotocol.github.io/ext-apps/api/](https://modelcontextprotocol.github.io/ext-apps/api/)
* MCP Apps specification
  [https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx](https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx)
* MCP Apps announcement blog
  [https://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/](https://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/)
* Patterns & best practices
  [https://modelcontextprotocol.github.io/ext-apps/api/documents/Patterns.html](https://modelcontextprotocol.github.io/ext-apps/api/documents/Patterns.html)
* Testing guide
  [https://modelcontextprotocol.github.io/ext-apps/api/documents/Testing_MCP_Apps.html](https://modelcontextprotocol.github.io/ext-apps/api/documents/Testing_MCP_Apps.html)
