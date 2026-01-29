"use client";

/**
 * MCP Provider Component
 *
 * React context provider that wraps the app and manages MCP connections.
 * Auto-connects to enabled servers on mount and provides tools via context.
 */

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  MCPConnectionStatus,
  MCPServerConfig,
  MCPServerState,
  MCPToolWithServer,
} from "@/lib/mcp/servers";
import {
  generateServerId,
  loadServerConfigs,
  saveServerConfigs,
} from "@/lib/mcp/servers";

interface MCPContextValue {
  /** All server states */
  servers: MCPServerState[];
  /** All tools from all connected servers */
  allTools: MCPToolWithServer[];
  /** Whether the provider is initializing connections */
  isInitializing: boolean;
  /** Connect to a server */
  connectToServer: (config: MCPServerConfig) => Promise<void>;
  /** Disconnect from a server */
  disconnectFromServer: (serverId: string) => Promise<void>;
  /** Add a new server configuration */
  addServer: (config: Omit<MCPServerConfig, "id">) => void;
  /** Remove a server configuration */
  removeServer: (serverId: string) => void;
  /** Update a server configuration */
  updateServer: (serverId: string, updates: Partial<MCPServerConfig>) => void;
  /** Refresh tools from all connected servers */
  refreshTools: () => Promise<void>;
  /** Get tools for a specific server */
  getServerTools: (serverId: string) => MCPToolWithServer[];
}

const MCPContext = createContext<MCPContextValue | null>(null);

export function MCPProvider({ children }: { children: ReactNode }) {
  const [servers, setServers] = useState<MCPServerState[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);

  // Compute all tools from all connected servers
  const allTools = useMemo(() => {
    const tools: MCPToolWithServer[] = [];
    for (const server of servers) {
      if (server.status === "connected") {
        for (const tool of server.tools) {
          tools.push({
            ...tool,
            serverId: server.config.id,
            serverName: server.config.name,
          });
        }
      }
    }
    return tools;
  }, [servers]);

  // Connect to a single server
  const connectToServer = useCallback(async (config: MCPServerConfig) => {
    // Update status to connecting
    setServers((prev) => {
      const existing = prev.find((s) => s.config.id === config.id);
      if (existing) {
        return prev.map((s) =>
          s.config.id === config.id
            ? {
                ...s,
                status: "connecting" as MCPConnectionStatus,
                error: undefined,
              }
            : s
        );
      }
      return [
        ...prev,
        {
          config,
          status: "connecting" as MCPConnectionStatus,
          tools: [],
        },
      ];
    });

    try {
      const response = await fetch("/api/mcp/client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "connect",
          serverConfig: config,
        }),
      });

      const result = await response.json();

      if (result.connected) {
        setServers((prev) =>
          prev.map((s) =>
            s.config.id === config.id
              ? {
                  ...s,
                  status: "connected" as MCPConnectionStatus,
                  tools: result.tools,
                  lastConnected: new Date(),
                  error: undefined,
                }
              : s
          )
        );
      } else {
        setServers((prev) =>
          prev.map((s) =>
            s.config.id === config.id
              ? {
                  ...s,
                  status: "error" as MCPConnectionStatus,
                  error: result.error ?? "Connection failed",
                }
              : s
          )
        );
      }
    } catch (error) {
      setServers((prev) =>
        prev.map((s) =>
          s.config.id === config.id
            ? {
                ...s,
                status: "error" as MCPConnectionStatus,
                error: error instanceof Error ? error.message : "Unknown error",
              }
            : s
        )
      );
    }
  }, []);

  // Disconnect from a server
  const disconnectFromServer = useCallback(async (serverId: string) => {
    try {
      await fetch("/api/mcp/client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "disconnect",
          serverId,
        }),
      });
    } catch (error) {
      console.error(`Error disconnecting from ${serverId}:`, error);
    }

    setServers((prev) =>
      prev.map((s) =>
        s.config.id === serverId
          ? { ...s, status: "disconnected" as MCPConnectionStatus, tools: [] }
          : s
      )
    );
  }, []);

  // Add a new server
  const addServer = useCallback(
    (config: Omit<MCPServerConfig, "id">) => {
      const newConfig: MCPServerConfig = {
        ...config,
        id: generateServerId(),
      };

      setServers((prev) => [
        ...prev,
        {
          config: newConfig,
          status: "disconnected" as MCPConnectionStatus,
          tools: [],
        },
      ]);

      // Save to localStorage
      const allConfigs = servers.map((s) => s.config);
      saveServerConfigs([...allConfigs, newConfig]);

      // Auto-connect if enabled
      if (newConfig.enabled) {
        connectToServer(newConfig);
      }
    },
    [servers, connectToServer]
  );

  // Remove a server
  const removeServer = useCallback(
    async (serverId: string) => {
      // Disconnect first
      await disconnectFromServer(serverId);

      setServers((prev) => prev.filter((s) => s.config.id !== serverId));

      // Update localStorage
      const remainingConfigs = servers
        .filter((s) => s.config.id !== serverId)
        .map((s) => s.config);
      saveServerConfigs(remainingConfigs);
    },
    [servers, disconnectFromServer]
  );

  // Update a server configuration
  const updateServer = useCallback(
    (serverId: string, updates: Partial<MCPServerConfig>) => {
      setServers((prev) =>
        prev.map((s) =>
          s.config.id === serverId
            ? { ...s, config: { ...s.config, ...updates } }
            : s
        )
      );

      // Save to localStorage
      const updatedConfigs = servers.map((s) =>
        s.config.id === serverId ? { ...s.config, ...updates } : s.config
      );
      saveServerConfigs(updatedConfigs);
    },
    [servers]
  );

  // Refresh tools from all connected servers
  const refreshTools = useCallback(async () => {
    const connectedServers = servers.filter((s) => s.status === "connected");

    for (const server of connectedServers) {
      try {
        const response = await fetch("/api/mcp/client", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "listTools",
            serverId: server.config.id,
          }),
        });

        const result = await response.json();

        if (result.tools) {
          setServers((prev) =>
            prev.map((s) =>
              s.config.id === server.config.id
                ? { ...s, tools: result.tools }
                : s
            )
          );
        }
      } catch (error) {
        console.error(
          `Error refreshing tools from ${server.config.name}:`,
          error
        );
      }
    }
  }, [servers]);

  // Get tools for a specific server
  const getServerTools = useCallback(
    (serverId: string): MCPToolWithServer[] => {
      const server = servers.find((s) => s.config.id === serverId);
      if (!server || server.status !== "connected") {
        return [];
      }
      return server.tools.map((tool) => ({
        ...tool,
        serverId: server.config.id,
        serverName: server.config.name,
      }));
    },
    [servers]
  );

  // Initialize: Load configs and auto-connect to enabled servers
  useEffect(() => {
    const initializeMCPServers = async () => {
      setIsInitializing(true);

      const configs = loadServerConfigs();

      // Initialize server states
      const initialStates: MCPServerState[] = configs.map((config) => ({
        config,
        status: config.enabled ? "connecting" : "disconnected",
        tools: [],
      }));

      setServers(initialStates);

      // Connect to enabled servers
      const enabledConfigs = configs.filter((c) => c.enabled);

      // Connect in parallel but don't block
      await Promise.allSettled(
        enabledConfigs.map(async (config) => {
          try {
            const response = await fetch("/api/mcp/client", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "connect",
                serverConfig: config,
              }),
            });

            const result = await response.json();

            if (result.connected) {
              setServers((prev) =>
                prev.map((s) =>
                  s.config.id === config.id
                    ? {
                        ...s,
                        status: "connected",
                        tools: result.tools,
                        lastConnected: new Date(),
                      }
                    : s
                )
              );
            } else {
              setServers((prev) =>
                prev.map((s) =>
                  s.config.id === config.id
                    ? {
                        ...s,
                        status: "error",
                        error: result.error ?? "Connection failed",
                      }
                    : s
                )
              );
            }
          } catch (error) {
            console.error(`Failed to connect to ${config.name}:`, error);
            setServers((prev) =>
              prev.map((s) =>
                s.config.id === config.id
                  ? {
                      ...s,
                      status: "error",
                      error:
                        error instanceof Error
                          ? error.message
                          : "Unknown error",
                    }
                  : s
              )
            );
          }
        })
      );

      setIsInitializing(false);
    };

    initializeMCPServers();
  }, []);

  const contextValue: MCPContextValue = useMemo(
    () => ({
      servers,
      allTools,
      isInitializing,
      connectToServer,
      disconnectFromServer,
      addServer,
      removeServer,
      updateServer,
      refreshTools,
      getServerTools,
    }),
    [
      servers,
      allTools,
      isInitializing,
      connectToServer,
      disconnectFromServer,
      addServer,
      removeServer,
      updateServer,
      refreshTools,
      getServerTools,
    ]
  );

  return (
    <MCPContext.Provider value={contextValue}>{children}</MCPContext.Provider>
  );
}

export function useMCPContext() {
  const context = useContext(MCPContext);
  if (!context) {
    throw new Error("useMCPContext must be used within an MCPProvider");
  }
  return context;
}

// Export a hook that doesn't throw if used outside provider (for optional use)
export function useMCPContextSafe() {
  return useContext(MCPContext);
}
