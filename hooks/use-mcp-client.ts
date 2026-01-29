"use client";

/**
 * React Hook for MCP Client Operations
 *
 * Provides a simple interface for components to interact with MCP servers
 * through the API proxy.
 */

import { useCallback, useState } from "react";
import type { MCPServerConfig, MCPToolWithServer } from "@/lib/mcp/servers";

interface MCPClientState {
  isLoading: boolean;
  error: string | null;
}

interface CallToolResult {
  content: Array<{
    type: string;
    text?: string;
    data?: unknown;
  }>;
  _meta?: {
    ui?: {
      resourceUri: string;
    };
  };
  isError?: boolean;
}

interface ReadResourceResult {
  contents: Array<{
    uri: string;
    mimeType?: string;
    text?: string;
    blob?: string;
  }>;
}

export function useMCPClient() {
  const [state, setState] = useState<MCPClientState>({
    isLoading: false,
    error: null,
  });

  const makeRequest = useCallback(
    async <T>(
      action: string,
      params: Record<string, unknown> = {}
    ): Promise<T> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch("/api/mcp/client", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, ...params }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error ?? "Request failed");
        }

        const data = await response.json();
        setState((prev) => ({ ...prev, isLoading: false }));
        return data as T;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setState({ isLoading: false, error: errorMessage });
        throw error;
      }
    },
    []
  );

  const connect = useCallback(
    (
      serverConfig: MCPServerConfig
    ): Promise<{ connected: boolean; tools: MCPToolWithServer[] }> => {
      return makeRequest("connect", { serverConfig });
    },
    [makeRequest]
  );

  const disconnect = useCallback(
    (serverId: string): Promise<{ success: boolean }> => {
      return makeRequest("disconnect", { serverId });
    },
    [makeRequest]
  );

  const listTools = useCallback(
    (serverId: string): Promise<{ tools: MCPToolWithServer[] }> => {
      return makeRequest("listTools", { serverId });
    },
    [makeRequest]
  );

  const callTool = useCallback(
    (
      serverId: string,
      toolName: string,
      toolArgs: Record<string, unknown> = {}
    ): Promise<CallToolResult> => {
      return makeRequest("callTool", { serverId, toolName, toolArgs });
    },
    [makeRequest]
  );

  const listResources = useCallback(
    (
      serverId: string
    ): Promise<{ resources: Array<{ uri: string; name?: string }> }> => {
      return makeRequest("listResources", { serverId });
    },
    [makeRequest]
  );

  const readResource = useCallback(
    (serverId: string, resourceUri: string): Promise<ReadResourceResult> => {
      return makeRequest("readResource", { serverId, resourceUri });
    },
    [makeRequest]
  );

  const getStatus = useCallback((): Promise<{
    tools: MCPToolWithServer[];
    connections: Record<string, { connected: boolean; toolCount: number }>;
  }> => {
    return makeRequest("status");
  }, [makeRequest]);

  return {
    ...state,
    connect,
    disconnect,
    listTools,
    callTool,
    listResources,
    readResource,
    getStatus,
  };
}

export type UseMCPClientReturn = ReturnType<typeof useMCPClient>;
