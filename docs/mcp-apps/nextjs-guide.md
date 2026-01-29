# Next.js + MCP Apps Integration Guide

> **Senior-level implementation guide** for building a Next.js application that acts as both an **MCP client** (connecting to MCP servers) and an **MCP Apps host** (rendering standardized MCP Apps in sandboxed iframes).

**Last Verified**: January 2026 | **MCP Apps SDK**: v1.0.1 | **Next.js**: 16.x

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Concepts](#core-concepts)
3. [Dual-Role Implementation](#dual-role-implementation)
4. [MCP Client Implementation](#mcp-client-implementation)
5. [MCP Apps Host Implementation](#mcp-apps-host-implementation)
6. [MCP Server Implementation (Optional)](#mcp-server-implementation-optional)
7. [Next.js Configuration](#nextjs-configuration)
8. [Security Considerations](#security-considerations)
9. [Implementation Patterns](#implementation-patterns)
10. [Testing & Development](#testing--development)
11. [References](#references)

---

## Architecture Overview

### Three Roles Your Next.js App Can Play

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        MCP ECOSYSTEM ROLES                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. MCP CLIENT          2. MCP APPS HOST        3. MCP SERVER           │
│  ─────────────          ────────────────        ──────────────          │
│  Connects to external   Renders Views in       Exposes tools &          │
│  MCP servers            sandboxed iframes      UI resources             │
│                                                                          │
│  • List tools           • AppBridge setup      • registerAppTool        │
│  • Call tools           • postMessage bridge   • registerAppResource    │
│  • Read resources       • CSP enforcement      • Handle tool calls      │
│  • Get prompts          • Theme injection      • Serve HTML UIs         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Official MCP Apps Architecture (from specification)

```
┌─────────────────┐     MCP Protocol      ┌─────────────────┐
│   MCP Server    │◄────────────────────►│      Host       │
│                 │                       │  (Chat Client)  │
│  ┌───────────┐  │                       │                 │
│  │   Tools   │  │                       │  ┌───────────┐  │
│  └───────────┘  │                       │  │ AppBridge │  │
│  ┌───────────┐  │                       │  └─────┬─────┘  │
│  │UI Resources│ │                       │        │        │
│  └───────────┘  │                       │        │        │
└─────────────────┘                       └────────┼────────┘
                                                   │
                                          postMessage (JSON-RPC)
                                                   │
                                          ┌────────▼────────┐
                                          │  View (iframe)  │
                                          │                 │
                                          │  ┌───────────┐  │
                                          │  │    App    │  │
                                          │  └───────────┘  │
                                          └─────────────────┘
```

**Key terminology**:
- **Server** — MCP server that declares tools and UI resources
- **Host** — Chat client (Claude, VS Code, your Next.js app) that embeds Views
- **View** — UI running inside a sandboxed iframe, uses the `App` class
- **AppBridge** — Host-side class that manages iframe communication

---

## Core Concepts

### MCP Apps = Tool + UI Resource

Every MCP App consists of two parts linked by a `ui://` resource URI:

```typescript
// 1. Tool with UI metadata
{
  name: "get-weather",
  description: "Get weather forecast",
  _meta: {
    ui: {
      resourceUri: "ui://weather/forecast.html"  // Links to UI
    }
  }
}

// 2. UI Resource (HTML served when tool is called)
{
  uri: "ui://weather/forecast.html",
  mimeType: "text/html;profile=mcp-app",
  text: "<!DOCTYPE html>..."
}
```

### Lifecycle Flow

```
1. Discovery     → Host calls tools/list, learns about UI-enabled tools
2. Initialization → Host renders iframe, View sends ui/initialize
3. Data Delivery → Host sends ui/notifications/tool-input and tool-result
4. Interactive   → User interacts, View calls tools via Host proxy
5. Teardown      → Host sends ui/resource-teardown before unmounting
```

### Progressive Enhancement

MCP Apps are designed for graceful degradation:
- If host doesn't support MCP Apps → tools return text only
- UI is an enhancement, not a requirement
- Server checks host capabilities before registering UI tools

---

## Dual-Role Implementation

### Package Dependencies

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.25.2",
    "@modelcontextprotocol/ext-apps": "^1.0.1"
  }
}
```

Install with:

```bash
pnpm add @modelcontextprotocol/sdk @modelcontextprotocol/ext-apps
```

### Package Breakdown

| Package | Purpose | Used For |
|---------|---------|----------|
| `@modelcontextprotocol/sdk` | Core MCP protocol | Client connections, server creation |
| `@modelcontextprotocol/ext-apps` | MCP Apps extension | `App` (View), `AppBridge` (Host), server helpers |

---

## Should You Use `mcp-handler`? (Feb 2026 Analysis)

### What is `mcp-handler`?

`mcp-handler` (v1.0.7, published by Vercel) is a **higher-level adapter** that simplifies creating MCP servers in Next.js. It wraps `@modelcontextprotocol/sdk` and handles:

- Transport layer (Streamable HTTP + SSE fallback)
- Route setup via `createMcpHandler()`
- Authorization via `withMcpAuth()`
- Redis integration for SSE resumability

```typescript
// mcp-handler approach (simplified)
import { createMcpHandler } from "mcp-handler";

const handler = createMcpHandler((server) => {
  server.tool("roll_dice", "Roll a dice", { sides: z.number() }, async ({ sides }) => {
    return { content: [{ type: "text", text: `Rolled ${Math.random() * sides}` }] };
  });
});

export { handler as GET, handler as POST };
```

### ⚠️ Recommendation: DO NOT Use `mcp-handler` for MCP Apps

**For MCP Apps (UI resources), use `@modelcontextprotocol/sdk` directly.**

| Aspect | `mcp-handler` | Direct SDK |
|--------|---------------|------------|
| **MCP Apps Support** | ❌ No built-in support | ✅ Full support via ext-apps |
| **`registerAppTool`** | ❌ Not exposed | ✅ Works with `McpServer` |
| **`registerAppResource`** | ❌ Not exposed | ✅ Works with `McpServer` |
| **UI resource serving** | ❌ No `ui://` handling | ✅ Full support |
| **Transport** | ✅ Auto-handled | ⚠️ Manual setup |
| **Authorization** | ✅ `withMcpAuth()` | ⚠️ Manual implementation |
| **Best For** | Simple tool-only servers | MCP Apps with interactive UIs |

### Why `mcp-handler` Doesn't Work for MCP Apps

1. **No ext-apps integration**: `mcp-handler` uses `server.tool()` which is the standard SDK method. MCP Apps require `registerAppTool()` from `@modelcontextprotocol/ext-apps/server` to properly set `_meta.ui` metadata.

2. **No UI resource handling**: MCP Apps need `registerAppResource()` to serve `ui://` resources. `mcp-handler` doesn't expose this capability.

3. **Callback limitation**: While `mcp-handler` gives you access to the server instance, mixing ext-apps helpers with mcp-handler's abstraction is untested and may cause issues.

### When TO Use `mcp-handler`

✅ Use `mcp-handler` if:
- Building a **tool-only MCP server** (no UI)
- Deploying to **Vercel** and want optimized infrastructure
- Need **authorization** without custom implementation
- Want **SSE fallback** with Redis for older clients

### When NOT to Use `mcp-handler`

❌ Don't use `mcp-handler` if:
- Building **MCP Apps with interactive UIs** ← This is your case
- Need full control over `_meta.ui` metadata
- Using `registerAppTool` / `registerAppResource`
- Building a host that renders MCP Apps

### Recommended Approach for This Project

Since your goal is to build a Next.js app that:
1. Acts as an **MCP Client** (connects to external servers)
2. Acts as an **MCP Apps Host** (renders UIs in iframes)
3. Optionally acts as an **MCP Server** with UI-enabled tools

**Use the direct SDK approach:**

```typescript
// ✅ Correct: Direct SDK with ext-apps
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { registerAppTool, registerAppResource } from '@modelcontextprotocol/ext-apps/server';

const server = new McpServer({ name: 'my-server', version: '1.0.0' });

registerAppTool(server, 'my-tool', {
  _meta: { ui: { resourceUri: 'ui://my-app/view.html' } },
  // ...
}, async () => { /* ... */ });

registerAppResource(server, 'My UI', 'ui://my-app/view.html', {}, async () => {
  return { contents: [{ uri: 'ui://my-app/view.html', text: htmlContent }] };
});
```

### Summary Table

| Your Use Case | Package Choice |
|---------------|----------------|
| MCP Client (connect to servers) | `@modelcontextprotocol/sdk` |
| MCP Apps Host (render UIs) | `@modelcontextprotocol/ext-apps` |
| MCP Server with UI tools | `@modelcontextprotocol/sdk` + `ext-apps` |
| Simple tool-only server on Vercel | `mcp-handler` (optional) |

---

## MCP Client Implementation

### Server-Side MCP Client (Recommended for Next.js)

Create an MCP client that connects to external servers:

**`lib/mcp/client.ts`**

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

export class MCPClientManager {
  private clients: Map<string, Client> = new Map();

  async connectToServer(name: string, url: string): Promise<Client> {
    if (this.clients.has(name)) {
      return this.clients.get(name)!;
    }

    const client = new Client({
      name: 'nextjs-mcp-client',
      version: '1.0.0',
    });

    const transport = new StreamableHTTPClientTransport(new URL(url));
    await client.connect(transport);

    this.clients.set(name, client);
    return client;
  }

  async listTools(serverName: string) {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`Server ${serverName} not connected`);
    }
    return await client.listTools();
  }

  async callTool(serverName: string, toolName: string, args: unknown) {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`Server ${serverName} not connected`);
    }
    return await client.callTool({
      name: toolName,
      arguments: args,
    });
  }

  async listResources(serverName: string) {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`Server ${serverName} not connected`);
    }
    return await client.listResources();
  }

  async readResource(serverName: string, uri: string) {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`Server ${serverName} not connected`);
    }
    return await client.readResource({ uri });
  }
}

// Singleton instance
export const mcpClientManager = new MCPClientManager();
```

### API Route for MCP Client Operations

**`app/api/mcp/client/route.ts`**

```typescript
import { mcpClientManager } from '@/lib/mcp/client';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { action, serverName, ...params } = await request.json();

    switch (action) {
      case 'connect': {
        const { url } = params;
        await mcpClientManager.connectToServer(serverName, url);
        return NextResponse.json({ success: true });
      }

      case 'listTools': {
        const tools = await mcpClientManager.listTools(serverName);
        return NextResponse.json(tools);
      }

      case 'callTool': {
        const { toolName, arguments: args } = params;
        const result = await mcpClientManager.callTool(
          serverName,
          toolName,
          args
        );
        return NextResponse.json(result);
      }

      case 'listResources': {
        const resources = await mcpClientManager.listResources(serverName);
        return NextResponse.json(resources);
      }

      case 'readResource': {
        const { uri } = params;
        const resource = await mcpClientManager.readResource(serverName, uri);
        return NextResponse.json(resource);
      }

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
```

---

## MCP Apps Host Implementation

### Understanding Host vs View

**Critical distinction**:
- **Host** (your Next.js app) uses `AppBridge` to manage the iframe
- **View** (inside iframe) uses `App` to communicate with the host

```
Your Next.js App (Host)          │         Iframe (View)
─────────────────────────────────│─────────────────────────────
import { AppBridge }             │  import { App }
from 'ext-apps/app-bridge'       │  from 'ext-apps'
                                 │
const bridge = new AppBridge()   │  const app = new App()
bridge.onrequest = ...           │  app.ontoolresult = ...
bridge.sendToolResult(...)       │  app.callServerTool(...)
```

### Core Host Component (AppBridge)

The host renders MCP Apps in sandboxed iframes using `AppBridge`.

**`components/mcp-app-host.tsx`**

```typescript
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppBridge,
  buildAllowAttribute,
  getToolUiResourceUri,
} from '@modelcontextprotocol/ext-apps/app-bridge';
import type {
  McpUiHostContext,
  McpUiToolMeta,
} from '@modelcontextprotocol/ext-apps';

interface MCPAppHostProps {
  /** The tool that was called */
  tool: {
    name: string;
    _meta?: { ui?: McpUiToolMeta };
  };
  /** Tool input arguments */
  toolInput?: Record<string, unknown>;
  /** Tool result (when available) */
  toolResult?: {
    content: Array<{ type: string; text?: string }>;
    structuredContent?: unknown;
    _meta?: { viewUUID?: string };
  };
  /** Callback to call server tools from the View */
  onToolCall: (name: string, args: unknown) => Promise<unknown>;
  /** Callback when View updates model context */
  onContextUpdate?: (content: Array<{ type: string; text?: string }>) => void;
  /** Callback when View sends a message */
  onMessage?: (message: { role: string; content: unknown }) => void;
  /** HTML content for the UI resource */
  uiHtml: string;
  /** Current theme */
  theme?: 'light' | 'dark';
}

export function MCPAppHost({
  tool,
  toolInput,
  toolResult,
  onToolCall,
  onContextUpdate,
  onMessage,
  uiHtml,
  theme = 'light',
}: MCPAppHostProps) {
  const outerIframeRef = useRef<HTMLIFrameElement>(null);
  const bridgeRef = useRef<AppBridge | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [displayMode, setDisplayMode] = useState<'inline' | 'fullscreen'>('inline');

  // Build host context
  const hostContext: McpUiHostContext = {
    theme,
    displayMode,
    availableDisplayModes: ['inline', 'fullscreen'],
    platform: 'web',
    styles: {
      variables: {
        '--color-background-primary': theme === 'dark' ? '#1a1a1a' : '#ffffff',
        '--color-text-primary': theme === 'dark' ? '#ffffff' : '#000000',
        // Add more CSS variables as needed
      },
    },
  };

  // Initialize AppBridge when iframe loads
  const handleIframeLoad = useCallback(() => {
    if (!outerIframeRef.current?.contentWindow) return;

    const bridge = new AppBridge({
      iframe: outerIframeRef.current,
      hostContext,
      hostCapabilities: {
        tools: { call: true },
        resources: { read: true },
        displayModes: ['inline', 'fullscreen'],
      },
    });

    // Handle requests from View
    bridge.onrequest = async (request) => {
      switch (request.method) {
        case 'tools/call': {
          const { name, arguments: args } = request.params as {
            name: string;
            arguments: unknown;
          };
          try {
            const result = await onToolCall(name, args);
            return { content: [{ type: 'text', text: JSON.stringify(result) }] };
          } catch (error) {
            return {
              isError: true,
              content: [{ type: 'text', text: String(error) }],
            };
          }
        }

        case 'ui/update-model-context': {
          const { content } = request.params as {
            content: Array<{ type: string; text?: string }>;
          };
          onContextUpdate?.(content);
          return {};
        }

        case 'ui/message': {
          const message = request.params as { role: string; content: unknown };
          onMessage?.(message);
          return {};
        }

        case 'ui/request-display-mode': {
          const { mode } = request.params as { mode: 'inline' | 'fullscreen' };
          setDisplayMode(mode);
          return { mode };
        }

        case 'ui/open-link': {
          const { url } = request.params as { url: string };
          window.open(url, '_blank', 'noopener,noreferrer');
          return {};
        }

        default:
          return { error: { code: -32601, message: 'Method not found' } };
      }
    };

    bridgeRef.current = bridge;
    setIsReady(true);

    // Send initial tool input if available
    if (toolInput) {
      bridge.sendToolInput({
        name: tool.name,
        arguments: toolInput,
      });
    }
  }, [tool.name, toolInput, hostContext, onToolCall, onContextUpdate, onMessage]);

  // Send tool result when it becomes available
  useEffect(() => {
    if (!bridgeRef.current || !isReady || !toolResult) return;

    bridgeRef.current.sendToolResult({
      name: tool.name,
      content: toolResult.content,
      structuredContent: toolResult.structuredContent,
      _meta: toolResult._meta,
    });
  }, [tool.name, toolResult, isReady]);

  // Notify View when host context changes
  useEffect(() => {
    if (!bridgeRef.current || !isReady) return;

    bridgeRef.current.sendHostContextChange(hostContext);
  }, [theme, displayMode, isReady]);

  // Cleanup
  useEffect(() => {
    return () => {
      bridgeRef.current?.close();
    };
  }, []);

  // Get sandbox allow attribute from tool metadata
  const allowAttribute = buildAllowAttribute(tool._meta?.ui?.permissions);

  return (
    <div
      className={`mcp-app-host ${displayMode === 'fullscreen' ? 'fixed inset-0 z-50' : ''}`}
    >
      <iframe
        ref={outerIframeRef}
        srcDoc={uiHtml}
        sandbox="allow-scripts allow-same-origin"
        allow={allowAttribute}
        onLoad={handleIframeLoad}
        className="w-full border-0 rounded-lg bg-background"
        style={{
          minHeight: displayMode === 'fullscreen' ? '100vh' : '400px',
          borderRadius: displayMode === 'fullscreen' ? 0 : undefined,
        }}
        title={`MCP App: ${tool.name}`}
      />
    </div>
  );
}
```

### View Component (Inside Iframe)

The View uses the `App` class to communicate with the host. This runs inside the sandboxed iframe.

**Example View HTML with embedded script:**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="color-scheme" content="light dark" />
    <title>My MCP App</title>
    <style>
      :root {
        background: var(--color-background-primary, #ffffff);
        color: var(--color-text-primary, #000000);
        font-family: var(--font-sans, system-ui, sans-serif);
      }
    </style>
  </head>
  <body>
    <div id="app">Loading...</div>
    <script type="module">
      import { App } from '@modelcontextprotocol/ext-apps';

      const app = new App({ name: 'MyApp', version: '1.0.0' });
      
      // IMPORTANT: Set handlers BEFORE calling connect()
      app.ontoolresult = (result) => {
        document.getElementById('app').innerHTML = 
          `<pre>${JSON.stringify(result.structuredContent, null, 2)}</pre>`;
      };
      
      app.ontoolinput = (input) => {
        console.log('Tool input:', input.arguments);
      };
      
      app.onhostcontextchanged = (ctx) => {
        if (ctx.theme) {
          document.documentElement.dataset.theme = ctx.theme;
        }
      };
      
      app.onteardown = async () => {
        // Cleanup before unmount
        return {};
      };
      
      // Connect to host
      await app.connect();
    </script>
  </body>
</html>
```

### React Hook for Views (useApp)

For React-based Views, use the official `useApp` hook:

**`view-components/my-app.tsx`** (bundled into View HTML)

```typescript
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import { useEffect, useState } from 'react';
import type { McpUiHostContext } from '@modelcontextprotocol/ext-apps';

export function MyMCPApp() {
  const [data, setData] = useState<unknown>(null);
  const [hostContext, setHostContext] = useState<McpUiHostContext>();

  const { app, isConnected } = useApp({
    appInfo: { name: 'MyApp', version: '1.0.0' },
    capabilities: {},
    onAppCreated: (app) => {
      // Set handlers before connection completes
      app.ontoolresult = (result) => {
        setData(result.structuredContent);
      };
      
      app.onhostcontextchanged = (ctx) => {
        setHostContext((prev) => ({ ...prev, ...ctx }));
      };
    },
  });

  // Get initial host context after connection
  useEffect(() => {
    if (app && isConnected) {
      setHostContext(app.getHostContext());
    }
  }, [app, isConnected]);

  const handleRefresh = async () => {
    if (!app) return;
    const result = await app.callServerTool({
      name: 'get-data',
      arguments: { page: 1 },
    });
    setData(result.structuredContent);
  };

  if (!isConnected) return <div>Connecting...</div>;

  return (
    <div data-theme={hostContext?.theme}>
      <button onClick={handleRefresh}>Refresh</button>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
```

---

## MCP Server Implementation (Optional)

If your Next.js app also serves as an MCP server, here's how to implement it.

### API Route as MCP Server

**`app/api/mcp/route.ts`**

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  registerAppTool,
  registerAppResource,
  RESOURCE_MIME_TYPE,
} from '@modelcontextprotocol/ext-apps/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Create server instance
function createServer(): McpServer {
  const server = new McpServer({
    name: 'NextJS MCP Server',
    version: '1.0.0',
  });

  const resourceUri = 'ui://dashboard/view.html';

  // Register tool with UI metadata
  registerAppTool(
    server,
    'get-dashboard-data',
    {
      title: 'Dashboard Data',
      description: 'Get dashboard statistics',
      inputSchema: {
        timeRange: z.enum(['day', 'week', 'month']).default('day'),
      },
      _meta: {
        ui: { resourceUri },
      },
    },
    async ({ timeRange }) => {
      const data = await fetchDashboardData(timeRange);
      return {
        content: [{ type: 'text', text: `Dashboard for ${timeRange}` }],
        structuredContent: data,  // Rich data for the UI
      };
    }
  );

  // Register app-only tool (hidden from model)
  registerAppTool(
    server,
    'refresh-widget',
    {
      title: 'Refresh Widget',
      description: 'Refresh a specific widget',
      inputSchema: { widgetId: z.string() },
      _meta: {
        ui: {
          resourceUri,
          visibility: ['app'],  // Only callable by View, not model
        },
      },
    },
    async ({ widgetId }) => {
      const widgetData = await refreshWidget(widgetId);
      return {
        content: [{ type: 'text', text: 'Refreshed' }],
        structuredContent: widgetData,
      };
    }
  );

  // Register UI resource
  registerAppResource(
    server,
    'Dashboard UI',
    resourceUri,
    { mimeType: RESOURCE_MIME_TYPE },
    async () => {
      // In production, serve bundled HTML
      const html = await fs.readFile('./dist/dashboard.html', 'utf-8');
      return {
        contents: [{ uri: resourceUri, mimeType: RESOURCE_MIME_TYPE, text: html }],
      };
    }
  );

  return server;
}

// Handle MCP requests
export async function POST(request: NextRequest) {
  const server = createServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,  // Stateless mode
  });

  try {
    await server.connect(transport);
    
    const body = await request.json();
    
    // Create a response that will be written to by the transport
    const responsePromise = new Promise<Response>((resolve) => {
      const chunks: Uint8Array[] = [];
      const encoder = new TextEncoder();
      
      transport.handleRequest(
        { body, headers: Object.fromEntries(request.headers) },
        {
          writeHead: () => {},
          write: (data: string) => chunks.push(encoder.encode(data)),
          end: () => {
            const body = chunks.length > 0 
              ? new Blob(chunks).text() 
              : JSON.stringify({ jsonrpc: '2.0', result: {} });
            resolve(new Response(body, {
              headers: { 'Content-Type': 'application/json' },
            }));
          },
        },
        body
      );
    });

    return await responsePromise;
  } catch (error) {
    return NextResponse.json(
      { jsonrpc: '2.0', error: { code: -32603, message: 'Internal error' }, id: null },
      { status: 500 }
    );
  } finally {
    await transport.close();
    await server.close();
  }
}

// Helper functions (implement based on your needs)
async function fetchDashboardData(timeRange: string) {
  // Your data fetching logic
  return { widgets: [], stats: {} };
}

async function refreshWidget(widgetId: string) {
  // Your widget refresh logic
  return { id: widgetId, data: {} };
}
```

---

## Next.js Configuration

### Required Configuration Updates

**`next.config.ts`**

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Required for iframe rendering of MCP Apps
  // Ensures static assets load correctly in sandboxed contexts
  assetPrefix: process.env.NODE_ENV === 'production' 
    ? process.env.NEXT_PUBLIC_ASSET_PREFIX 
    : undefined,
  
  // Allow iframe embedding
  headers: async () => {
    return [
      {
        source: '/sandbox.html',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'unsafe-inline' 'unsafe-eval'; style-src 'unsafe-inline';",
          },
        ],
      },
    ];
  },
  
  // Existing config...
  cacheComponents: true,
  images: {
    remotePatterns: [
      {
        hostname: 'avatar.vercel.sh',
      },
    ],
  },
};

export default nextConfig;
```

### Middleware for CORS (if needed)

**`middleware.ts`**

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Handle CORS for MCP server endpoints
  if (request.nextUrl.pathname.startsWith('/api/mcp')) {
    const response = NextResponse.next();
    
    // Allow iframe embedding
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, OPTIONS'
    );
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization'
    );
    
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/api/mcp/:path*',
};
```

---

## Security Considerations

### 1. Content Security Policy (CSP)

Always set CSP headers (not just meta tags) to prevent XSS:

```typescript
// In your API route or middleware
response.headers.set(
  'Content-Security-Policy',
  "default-src 'self'; script-src 'unsafe-inline' 'unsafe-eval'; style-src 'unsafe-inline'; frame-src 'self';"
);
```

### 2. Sandbox Attributes

Use restrictive sandbox attributes on iframes:

```typescript
<iframe
  sandbox="allow-scripts allow-same-origin"
  // Do NOT include: allow-top-navigation, allow-popups, etc.
/>
```

### 3. Origin Validation

Validate message origins in postMessage handlers:

```typescript
window.addEventListener('message', (event) => {
  // In production, validate origin
  if (process.env.NODE_ENV === 'production') {
    const allowedOrigins = ['https://your-domain.com'];
    if (!allowedOrigins.includes(event.origin)) {
      return;
    }
  }
  // Handle message...
});
```

### 4. Resource URI Validation

Validate `ui://` resource URIs before fetching:

```typescript
function isValidResourceUri(uri: string): boolean {
  return uri.startsWith('ui://') && /^ui:\/\/[a-z0-9-]+\/[a-z0-9-]+\.html$/.test(uri);
}
```

---

## Implementation Patterns

These patterns are documented in the official MCP Apps specification.

### Pattern 1: App-Only Tools (UI-Private Actions)

Tools that only the View can call, hidden from the model:

```typescript
// Server-side: Register app-only tool
registerAppTool(
  server,
  'update-quantity',
  {
    description: 'Update item quantity in cart',
    inputSchema: { itemId: z.string(), quantity: z.number() },
    _meta: {
      ui: {
        resourceUri: 'ui://shop/cart.html',
        visibility: ['app'],  // Hidden from model!
      },
    },
  },
  async ({ itemId, quantity }) => {
    const cart = await updateCartItem(itemId, quantity);
    return { content: [{ type: 'text', text: JSON.stringify(cart) }] };
  }
);

// View-side: Call the app-only tool
button.addEventListener('click', async () => {
  await app.callServerTool({
    name: 'update-quantity',
    arguments: { itemId: '123', quantity: 2 },
  });
});
```

### Pattern 2: Chunked Data Loading (Large Files)

For PDFs, images, or large datasets that exceed response limits:

```typescript
// Server-side: Chunked read tool
const MAX_CHUNK_BYTES = 500 * 1024; // 500KB

registerAppTool(
  server,
  'read_data_bytes',
  {
    title: 'Read Data Bytes',
    description: 'Load binary data in chunks',
    inputSchema: {
      id: z.string(),
      offset: z.number().min(0).default(0),
      byteCount: z.number().default(MAX_CHUNK_BYTES),
    },
    _meta: { ui: { visibility: ['app'] } },  // App-only
  },
  async ({ id, offset, byteCount }) => {
    const data = await loadData(id);
    const chunk = data.slice(offset, offset + byteCount);
    return {
      content: [{ type: 'text', text: `${chunk.length} bytes` }],
      structuredContent: {
        bytes: Buffer.from(chunk).toString('base64'),
        offset,
        byteCount: chunk.length,
        totalBytes: data.length,
        hasMore: offset + chunk.length < data.length,
      },
    };
  }
);

// View-side: Loop to load all chunks
async function loadAllChunks(id: string): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const result = await app.callServerTool({
      name: 'read_data_bytes',
      arguments: { id, offset },
    });
    
    const chunk = result.structuredContent as {
      bytes: string;
      hasMore: boolean;
      byteCount: number;
    };
    
    chunks.push(base64ToBytes(chunk.bytes));
    offset += chunk.byteCount;
    hasMore = chunk.hasMore;
  }

  return concatenateChunks(chunks);
}
```

### Pattern 3: Host Context Adaptation (Theming)

Adapt your View to match the host's theme and styles:

```typescript
// View-side: Adapt to host context
app.onhostcontextchanged = (ctx) => {
  // Theme
  if (ctx.theme) {
    document.documentElement.dataset.theme = ctx.theme;
  }
  
  // CSS variables
  if (ctx.styles?.variables) {
    for (const [key, value] of Object.entries(ctx.styles.variables)) {
      document.documentElement.style.setProperty(key, value);
    }
  }
  
  // Safe area insets (for mobile)
  if (ctx.safeAreaInsets) {
    document.body.style.paddingTop = `${ctx.safeAreaInsets.top}px`;
    document.body.style.paddingBottom = `${ctx.safeAreaInsets.bottom}px`;
  }
};

// CSS using host variables with fallbacks
const styles = `
  .container {
    background: var(--color-background-primary, #ffffff);
    color: var(--color-text-primary, #000000);
    font-family: var(--font-sans, system-ui, sans-serif);
    border-radius: var(--border-radius-lg, 8px);
  }
`;
```

### Pattern 4: Streaming Tool Input (Lower Latency)

Show preview UI while tool arguments are still streaming:

```typescript
// View-side: Handle partial inputs
app.ontoolinputpartial = (params) => {
  // Show streaming preview (e.g., code being typed)
  codePreview.textContent = (params.arguments?.code as string) ?? '';
  codePreview.style.display = 'block';
  canvas.style.display = 'none';
};

app.ontoolinput = (params) => {
  // Full input received - render final result
  codePreview.style.display = 'none';
  canvas.style.display = 'block';
  render(params.arguments?.code as string);
};
```

### Pattern 5: Chat Integration with MCP Apps

**`components/chat-with-mcp-apps.tsx`**

```typescript
'use client';

import { MCPAppHost } from './mcp-app-host';
import { useMCPClient } from '@/hooks/use-mcp-client';
import { useState, useCallback } from 'react';

interface ActiveApp {
  tool: { name: string; _meta?: { ui?: unknown } };
  toolInput: Record<string, unknown>;
  toolResult?: unknown;
  uiHtml: string;
}

export function ChatWithMCPApps() {
  const { client, callTool, readResource } = useMCPClient();
  const [activeApp, setActiveApp] = useState<ActiveApp | null>(null);
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);

  // When a tool with UI is called
  const handleToolInvocation = useCallback(async (
    tool: { name: string; _meta?: { ui?: { resourceUri?: string } } },
    args: Record<string, unknown>
  ) => {
    const resourceUri = tool._meta?.ui?.resourceUri;
    if (!resourceUri) return;

    // Fetch the UI HTML
    const resource = await readResource(resourceUri);
    const uiHtml = resource.contents[0]?.text;

    // Call the tool
    const result = await callTool(tool.name, args);

    // Activate the app
    setActiveApp({
      tool,
      toolInput: args,
      toolResult: result,
      uiHtml,
    });
  }, [callTool, readResource]);

  // Handle tool calls from the View
  const handleViewToolCall = useCallback(async (name: string, args: unknown) => {
    return await callTool(name, args as Record<string, unknown>);
  }, [callTool]);

  // Handle context updates from View
  const handleContextUpdate = useCallback((content: unknown) => {
    // Add to model context for next LLM call
    console.log('View context update:', content);
  }, []);

  // Handle messages from View
  const handleMessage = useCallback((message: { role: string; content: unknown }) => {
    setMessages((prev) => [...prev, {
      role: message.role,
      content: typeof message.content === 'string' 
        ? message.content 
        : JSON.stringify(message.content),
    }]);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Chat messages */}
      <div className="flex-1 overflow-auto">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
      </div>

      {/* MCP App rendered inline */}
      {activeApp && (
        <MCPAppHost
          tool={activeApp.tool}
          toolInput={activeApp.toolInput}
          toolResult={activeApp.toolResult}
          uiHtml={activeApp.uiHtml}
          onToolCall={handleViewToolCall}
          onContextUpdate={handleContextUpdate}
          onMessage={handleMessage}
        />
      )}
    </div>
  );
}
```

### Pattern 6: Persisting View State

Use `viewUUID` from tool result metadata for localStorage persistence:

```typescript
// Server-side: Include viewUUID in result
return {
  content: [{ type: 'text', text: 'Displaying PDF' }],
  structuredContent: { url, pageCount },
  _meta: {
    viewUUID: randomUUID(),  // Stable identifier
  },
};

// View-side: Persist state with viewUUID
let viewUUID: string | undefined;

app.ontoolresult = (result) => {
  viewUUID = result._meta?.viewUUID?.toString();
  
  // Restore saved state
  const saved = viewUUID ? localStorage.getItem(viewUUID) : null;
  if (saved) {
    const state = JSON.parse(saved);
    currentPage = state.currentPage;
  }
};

// Save state when it changes
function saveState() {
  if (viewUUID) {
    localStorage.setItem(viewUUID, JSON.stringify({ currentPage }));
  }
}
```

---

## Testing & Development

### Local Development Setup

1. **Start your Next.js app:**

```bash
pnpm dev
```

2. **Start a test MCP server** (or use the `basic-server-react` example):

```bash
# In another terminal
cd examples/basic-server-react
pnpm install
pnpm start
```

3. **Connect to the server:**

```typescript
// In your Next.js app
await fetch('/api/mcp/client', {
  method: 'POST',
  body: JSON.stringify({
    action: 'connect',
    serverName: 'test-server',
    url: 'http://localhost:3001/mcp',
  }),
});
```

### Using the Basic Host Example

The `basic-host` example from the MCP Apps SDK is an excellent reference:

```bash
git clone https://github.com/modelcontextprotocol/ext-apps.git
cd ext-apps/examples/basic-host
pnpm install
pnpm start
# Open http://localhost:8080
```

Study the implementation in:
- `src/implementation.ts` — Core AppBridge setup
- `src/sandbox.ts` — Sandbox iframe management
- `index.html` — Host UI

---

## Strategy Verification Checklist

### ✅ Verified Against Official Documentation

| Aspect | Source | Status |
|--------|--------|--------|
| Architecture (Server/Host/View) | Overview.html | ✅ Verified |
| `App` class for Views | Quickstart.html | ✅ Verified |
| `AppBridge` class for Hosts | app-bridge.html | ✅ Verified |
| `registerAppTool` / `registerAppResource` | Quickstart.html | ✅ Verified |
| Tool-UI linkage via `_meta.ui.resourceUri` | Overview.html | ✅ Verified |
| App-only tools (`visibility: ["app"]`) | Patterns.html | ✅ Verified |
| Chunked data loading pattern | Patterns.html | ✅ Verified |
| Host context/theming | Patterns.html | ✅ Verified |
| `StreamableHTTPClientTransport` | TypeScript SDK | ✅ Verified |
| `StreamableHTTPServerTransport` | TypeScript SDK | ✅ Verified |

### ✅ Key Implementation Decisions

1. **MCP Client**: Use `@modelcontextprotocol/sdk` with `StreamableHTTPClientTransport` for HTTP-based servers
2. **MCP Apps Host**: Use `AppBridge` from `@modelcontextprotocol/ext-apps/app-bridge`
3. **MCP Apps View**: Use `App` class from `@modelcontextprotocol/ext-apps`
4. **MCP Server**: Use `McpServer` + `registerAppTool` + `registerAppResource`
5. **Next.js Routes**: `StreamableHTTPServerTransport` in API routes
6. **Security**: Sandboxed iframes + CSP + origin validation

### ⚠️ Important Gotchas

1. **Register handlers BEFORE `connect()`** — Events may arrive immediately
2. **UI resources must be deterministic** — Hosts may prefetch/cache
3. **Use `structuredContent` for UI data** — Keep `content` minimal for model context
4. **Partial inputs are "healed" JSON** — Don't rely on them for critical operations

---

## References

### Official MCP Apps Documentation

| Resource | URL |
|----------|-----|
| **Overview** | https://modelcontextprotocol.github.io/ext-apps/api/documents/Overview.html |
| **Quickstart** | https://modelcontextprotocol.github.io/ext-apps/api/documents/Quickstart.html |
| **Patterns** | https://modelcontextprotocol.github.io/ext-apps/api/documents/Patterns.html |
| **API Reference** | https://modelcontextprotocol.github.io/ext-apps/api/ |
| **Specification** | https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx |
| **App Class** | https://modelcontextprotocol.github.io/ext-apps/api/classes/app.App.html |
| **AppBridge Class** | https://modelcontextprotocol.github.io/ext-apps/api/classes/app-bridge.AppBridge.html |

### MCP TypeScript SDK

| Resource | URL |
|----------|-----|
| **GitHub** | https://github.com/modelcontextprotocol/typescript-sdk |
| **Client Docs** | https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/client.md |
| **Server Docs** | https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/server.md |

### Next.js & Vercel Integration

| Resource | URL |
|----------|-----|
| **Next.js MCP Guide** | https://nextjs.org/docs/app/guides/mcp |
| **Vercel MCP Template** | https://vercel.com/templates/next.js/model-context-protocol-mcp-with-next-js |
| **Deploy MCP to Vercel** | https://vercel.com/docs/mcp/deploy-mcp-servers-to-vercel |
| **vercel-labs/mcp-for-next.js** | https://github.com/vercel-labs/mcp-for-next.js |
| **mcp-handler package** | https://www.npmjs.com/package/mcp-handler |

### Example Implementations

| Example | Description | URL |
|---------|-------------|-----|
| basic-host | Reference host implementation | https://github.com/modelcontextprotocol/ext-apps/tree/main/examples/basic-host |
| basic-server-react | React-based MCP App | https://github.com/modelcontextprotocol/ext-apps/tree/main/examples/basic-server-react |
| basic-server-vanillajs | Vanilla JS MCP App | https://github.com/modelcontextprotocol/ext-apps/tree/main/examples/basic-server-vanillajs |
| quickstart | Minimal tutorial app | https://github.com/modelcontextprotocol/ext-apps/tree/main/examples/quickstart |
| pdf-server | Chunked loading example | https://github.com/modelcontextprotocol/ext-apps/tree/main/examples/pdf-server |
| map-server | State persistence example | https://github.com/modelcontextprotocol/ext-apps/tree/main/examples/map-server |

### Key NPM Packages

```bash
# Core MCP SDK (use v1.25.2+ for security)
pnpm add @modelcontextprotocol/sdk@^1.25.2

# MCP Apps Extension (for App, AppBridge, server helpers)
pnpm add @modelcontextprotocol/ext-apps@^1.0.1

# ⚠️ mcp-handler - NOT recommended for MCP Apps (see analysis above)
# Only use for simple tool-only servers without UI
# pnpm add mcp-handler
```

### Package Decision Matrix

| Building... | Packages Needed |
|-------------|-----------------|
| MCP Client only | `@modelcontextprotocol/sdk` |
| MCP Apps Host only | `@modelcontextprotocol/ext-apps` |
| Full MCP Apps support | `@modelcontextprotocol/sdk` + `@modelcontextprotocol/ext-apps` |
| Simple tool server (no UI) | `mcp-handler` OR `@modelcontextprotocol/sdk` |

---

## Next Steps

### Phase 1: Foundation
1. ✅ Install `@modelcontextprotocol/sdk` and `@modelcontextprotocol/ext-apps`
2. ✅ Create MCP Client manager (`lib/mcp/client.ts`)
3. ✅ Create API route for client operations (`app/api/mcp/client/route.ts`)

### Phase 2: Host Implementation
4. Create `MCPAppHost` component with `AppBridge`
5. Implement sandbox iframe rendering
6. Add theme/context injection

### Phase 3: Integration
7. Integrate `MCPAppHost` into chat UI
8. Wire up tool invocations to render Views
9. Handle bidirectional communication (View ↔ Host ↔ Server)

### Phase 4: Optional Server
10. Create MCP server route (`app/api/mcp/route.ts`) if serving your own tools
11. Register tools with UI resources
12. Bundle View HTML with Vite

### Phase 5: Production
13. Add CSP headers and origin validation
14. Test with `basic-host` example
15. Deploy and verify iframe rendering

---

**Document Version**: 2.0  
**Last Updated**: January 28, 2026  
**Verified Against**: MCP Apps SDK v1.0.1, MCP TypeScript SDK, Next.js 16.x
