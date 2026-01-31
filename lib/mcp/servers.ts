/**
 * MCP Server Configuration
 *
 * This file defines the types and default configuration for MCP servers.
 * Users can add additional servers via the Settings UI.
 */

export interface MCPServerConfig {
  /** Unique identifier (e.g., 'demo', 'weather-api') */
  id: string;
  /** Display name for UI */
  name: string;
  /** MCP endpoint URL */
  url: string;
  /** Whether to auto-connect on app mount */
  enabled: boolean;
  /** Optional description */
  description?: string;
  /** Optional icon name for UI */
  icon?: string;
}

export interface MCPToolMeta {
  ui?: {
    resourceUri: string;
    initialHeight?: number;
    resizable?: boolean;
  };
}

export interface MCPTool {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
  _meta?: MCPToolMeta;
}

export interface MCPToolWithServer extends MCPTool {
  serverId: string;
  serverName: string;
}

export type MCPConnectionStatus =
  | "connecting"
  | "connected"
  | "error"
  | "disconnected";

export interface MCPServerState {
  config: MCPServerConfig;
  status: MCPConnectionStatus;
  tools: MCPTool[];
  error?: string;
  lastConnected?: Date;
}

/**
 * Default MCP servers - includes the built-in demo server and Bloomberg Terminal
 */
export const DEFAULT_MCP_SERVERS: MCPServerConfig[] = [
  {
    id: "demo",
    name: "Demo MCP Server",
    url: "/api/mcp/server/mcp",
    enabled: true,
    description: "Built-in demo server with interactive tools",
    icon: "sparkles",
  },
  {
    id: "bloomberg",
    name: "Bloomberg Terminal",
    url: "/api/mcp/bloomberg",
    enabled: true,
    description: "Financial data, research, and trading tools",
    icon: "chart-line",
  },
];

/**
 * Storage key for user-added servers in localStorage
 */
export const MCP_SERVERS_STORAGE_KEY = "mcp-servers";

/**
 * Load server configurations from defaults and localStorage
 */
export function loadServerConfigs(): MCPServerConfig[] {
  if (typeof window === "undefined") {
    return DEFAULT_MCP_SERVERS;
  }

  try {
    const stored = localStorage.getItem(MCP_SERVERS_STORAGE_KEY);
    if (stored) {
      const userServers: MCPServerConfig[] = JSON.parse(stored);
      // Merge defaults with user servers, user servers can override defaults
      const serverMap = new Map<string, MCPServerConfig>();
      for (const server of DEFAULT_MCP_SERVERS) {
        serverMap.set(server.id, server);
      }
      for (const server of userServers) {
        serverMap.set(server.id, server);
      }
      return Array.from(serverMap.values());
    }
  } catch (error) {
    console.error("Failed to load MCP server configs:", error);
  }

  return DEFAULT_MCP_SERVERS;
}

/**
 * Save user server configurations to localStorage
 */
export function saveServerConfigs(servers: MCPServerConfig[]): void {
  if (typeof window === "undefined") {
    return;
  }

  // Only save non-default servers
  const userServers = servers.filter(
    (s) => !DEFAULT_MCP_SERVERS.some((d) => d.id === s.id)
  );

  // Also save any modified default servers
  const modifiedDefaults = servers.filter((s) => {
    const defaultServer = DEFAULT_MCP_SERVERS.find((d) => d.id === s.id);
    if (!defaultServer) {
      return false;
    }
    return (
      defaultServer.enabled !== s.enabled ||
      defaultServer.url !== s.url ||
      defaultServer.name !== s.name
    );
  });

  const toSave = [...userServers, ...modifiedDefaults];

  try {
    localStorage.setItem(MCP_SERVERS_STORAGE_KEY, JSON.stringify(toSave));
  } catch (error) {
    console.error("Failed to save MCP server configs:", error);
  }
}

/**
 * Generate a unique server ID
 */
export function generateServerId(): string {
  return `server-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
