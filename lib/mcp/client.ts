/**
 * MCP Client Manager
 *
 * Singleton class to manage connections to multiple MCP servers.
 * Uses direct HTTP/JSON-RPC for communication with our simplified demo server.
 */

import type { MCPServerConfig, MCPTool } from "./servers";

interface MCPConnection {
  config: MCPServerConfig;
  tools: MCPTool[];
  baseUrl: string;
}

// JSON-RPC response types
interface JsonRpcResponse<T = unknown> {
  jsonrpc: "2.0";
  id: string | number;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

interface ToolsListResult {
  tools: Array<{
    name: string;
    description?: string;
    inputSchema: Record<string, unknown>;
    _meta?: {
      ui?: {
        resourceUri: string;
        initialHeight?: number;
        resizable?: boolean;
      };
    };
  }>;
}

interface ResourcesListResult {
  resources: Array<{
    uri: string;
    name: string;
    mimeType?: string;
  }>;
}

interface ReadResourceResult {
  contents: Array<{
    uri: string;
    mimeType?: string;
    text?: string;
    blob?: string;
  }>;
}

interface CallToolResult {
  content: Array<{
    type: string;
    text?: string;
    data?: unknown;
  }>;
  _meta?: Record<string, unknown>;
  isError?: boolean;
}

class MCPClientManager {
  private readonly connections: Map<string, MCPConnection> = new Map();
  private readonly connecting: Map<string, Promise<MCPConnection>> = new Map();
  private requestId = 0;

  /**
   * Get the next request ID
   */
  private getNextId(): number {
    return ++this.requestId;
  }

  /**
   * Make a JSON-RPC request to an MCP server
   */
  private async jsonRpcRequest<T>(
    baseUrl: string,
    method: string,
    params?: Record<string, unknown>
  ): Promise<T> {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: this.getNextId(),
        method,
        params: params ?? {},
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
    }

    const result: JsonRpcResponse<T> = await response.json();

    if (result.error) {
      throw new Error(`JSON-RPC error: ${result.error.message}`);
    }

    return result.result as T;
  }

  /**
   * Resolve a URL to absolute
   */
  private resolveUrl(url: string): string {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }

    // Handle relative URLs
    let baseUrl: string;
    if (typeof window !== "undefined") {
      // Client-side: use browser's origin
      baseUrl = window.location.origin;
    } else {
      // Server-side: Use production domain to avoid Vercel deployment protection
      // VERCEL_PROJECT_PRODUCTION_URL is the custom production domain (e.g., mcp-apps-demo.vercel.app)
      // Fall back to VERCEL_URL for preview deployments, but prefer production
      const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_BRANCH_URL;
      
      if (productionUrl) {
        baseUrl = `https://${productionUrl}`;
      } else if (process.env.VERCEL_URL) {
        // Fallback to regular VERCEL_URL
        const protocol = process.env.VERCEL_ENV === "development" ? "http" : "https";
        baseUrl = `${protocol}://${process.env.VERCEL_URL}`;
      } else {
        // Local development: use localhost
        const port = process.env.PORT ?? "3000";
        baseUrl = `http://localhost:${port}`;
      }
    }

    return url.startsWith("/") ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
  }

  /**
   * Connect to an MCP server
   */
  async connectToServer(config: MCPServerConfig): Promise<{
    connected: boolean;
    tools: MCPTool[];
    error?: string;
  }> {
    // Return existing connection if available
    const existing = this.connections.get(config.id);
    if (existing) {
      return { connected: true, tools: existing.tools };
    }

    // Wait for existing connection attempt
    const pendingConnection = this.connecting.get(config.id);
    if (pendingConnection) {
      try {
        const connection = await pendingConnection;
        return { connected: true, tools: connection.tools };
      } catch (error) {
        return { connected: false, tools: [], error: String(error) };
      }
    }

    // Start new connection
    const connectionPromise = this.establishConnection(config);
    this.connecting.set(config.id, connectionPromise);

    try {
      const connection = await connectionPromise;
      this.connections.set(config.id, connection);
      this.connecting.delete(config.id);
      return { connected: true, tools: connection.tools };
    } catch (error) {
      this.connecting.delete(config.id);
      console.error(`Failed to connect to MCP server ${config.name}:`, error);
      return { connected: false, tools: [], error: String(error) };
    }
  }

  private async establishConnection(
    config: MCPServerConfig
  ): Promise<MCPConnection> {
    const baseUrl = this.resolveUrl(config.url);

    // Initialize connection with the server
    await this.jsonRpcRequest(baseUrl, "initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: {
        name: "nextjs-mcp-client",
        version: "1.0.0",
      },
    });

    // Discover available tools
    const toolsResult = await this.jsonRpcRequest<ToolsListResult>(
      baseUrl,
      "tools/list"
    );

    const tools: MCPTool[] = toolsResult.tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      _meta: tool._meta,
    }));

    return {
      config,
      tools,
      baseUrl,
    };
  }

  /**
   * Disconnect from an MCP server
   */
  async disconnect(serverId: string): Promise<void> {
    this.connections.delete(serverId);
  }

  /**
   * Disconnect from all servers
   */
  async disconnectAll(): Promise<void> {
    this.connections.clear();
  }

  /**
   * List tools from a specific server
   */
  async listTools(serverId: string): Promise<ToolsListResult> {
    const connection = this.connections.get(serverId);
    if (!connection) {
      throw new Error(`Not connected to server: ${serverId}`);
    }
    return this.jsonRpcRequest<ToolsListResult>(
      connection.baseUrl,
      "tools/list"
    );
  }

  /**
   * Refresh tool list for a connected server
   */
  async refreshTools(serverId: string): Promise<MCPTool[]> {
    const connection = this.connections.get(serverId);
    if (!connection) {
      throw new Error(`Not connected to server: ${serverId}`);
    }

    const toolsResult = await this.jsonRpcRequest<ToolsListResult>(
      connection.baseUrl,
      "tools/list"
    );

    const tools: MCPTool[] = toolsResult.tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      _meta: tool._meta,
    }));

    connection.tools = tools;
    return tools;
  }

  /**
   * Get all tools from all connected servers
   */
  getAllTools(): MCPTool[] {
    const allTools: MCPTool[] = [];
    for (const connection of this.connections.values()) {
      allTools.push(...connection.tools);
    }
    return allTools;
  }

  /**
   * Get all tools with server info
   */
  getAllToolsWithServerInfo(): Array<
    MCPTool & { serverId: string; serverName: string }
  > {
    const allTools: Array<MCPTool & { serverId: string; serverName: string }> =
      [];
    for (const connection of this.connections.values()) {
      for (const tool of connection.tools) {
        allTools.push({
          ...tool,
          serverId: connection.config.id,
          serverName: connection.config.name,
        });
      }
    }
    return allTools;
  }

  /**
   * Call a tool on a specific server
   */
  async callTool(
    serverId: string,
    toolName: string,
    args: Record<string, unknown>
  ): Promise<CallToolResult> {
    const connection = this.connections.get(serverId);
    if (!connection) {
      throw new Error(`Not connected to server: ${serverId}`);
    }
    return this.jsonRpcRequest<CallToolResult>(connection.baseUrl, "tools/call", {
      name: toolName,
      arguments: args,
    });
  }

  /**
   * List resources from a specific server
   */
  async listResources(serverId: string): Promise<ResourcesListResult> {
    const connection = this.connections.get(serverId);
    if (!connection) {
      throw new Error(`Not connected to server: ${serverId}`);
    }
    return this.jsonRpcRequest<ResourcesListResult>(
      connection.baseUrl,
      "resources/list"
    );
  }

  /**
   * Read a resource from a specific server
   */
  async readResource(serverId: string, uri: string): Promise<ReadResourceResult> {
    const connection = this.connections.get(serverId);
    if (!connection) {
      throw new Error(`Not connected to server: ${serverId}`);
    }
    return this.jsonRpcRequest<ReadResourceResult>(
      connection.baseUrl,
      "resources/read",
      { uri }
    );
  }

  /**
   * Check if connected to a specific server
   */
  isConnected(serverId: string): boolean {
    return this.connections.has(serverId);
  }

  /**
   * Get connection status for all servers
   */
  getConnectionStatus(): Map<
    string,
    { connected: boolean; toolCount: number }
  > {
    const status = new Map<string, { connected: boolean; toolCount: number }>();
    for (const [serverId, connection] of this.connections) {
      status.set(serverId, {
        connected: true,
        toolCount: connection.tools.length,
      });
    }
    return status;
  }
}

// Export singleton instance
export const mcpClientManager = new MCPClientManager();

// Also export the class for testing
export { MCPClientManager };
