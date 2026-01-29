/**
 * MCP Client API Route
 *
 * REST API to proxy MCP operations from client components.
 * This enables browser-based components to interact with MCP servers.
 */

import { NextResponse } from "next/server";
import { mcpClientManager } from "@/lib/mcp/client";
import type { MCPServerConfig } from "@/lib/mcp/servers";

type MCPAction =
  | "connect"
  | "disconnect"
  | "listTools"
  | "callTool"
  | "listResources"
  | "readResource"
  | "status";

interface MCPRequest {
  action: MCPAction;
  serverId?: string;
  serverConfig?: MCPServerConfig;
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  resourceUri?: string;
}

export async function POST(request: Request) {
  try {
    const body: MCPRequest = await request.json();
    const { action } = body;

    switch (action) {
      case "connect": {
        if (!body.serverConfig) {
          return NextResponse.json(
            { error: "serverConfig is required for connect action" },
            { status: 400 }
          );
        }
        const result = await mcpClientManager.connectToServer(
          body.serverConfig
        );
        return NextResponse.json(result);
      }

      case "disconnect": {
        if (!body.serverId) {
          return NextResponse.json(
            { error: "serverId is required for disconnect action" },
            { status: 400 }
          );
        }
        await mcpClientManager.disconnect(body.serverId);
        return NextResponse.json({ success: true });
      }

      case "listTools": {
        if (!body.serverId) {
          return NextResponse.json(
            { error: "serverId is required for listTools action" },
            { status: 400 }
          );
        }
        const tools = await mcpClientManager.listTools(body.serverId);
        return NextResponse.json(tools);
      }

      case "callTool": {
        if (!body.serverId || !body.toolName) {
          return NextResponse.json(
            { error: "serverId and toolName are required for callTool action" },
            { status: 400 }
          );
        }
        const result = await mcpClientManager.callTool(
          body.serverId,
          body.toolName,
          body.toolArgs ?? {}
        );
        return NextResponse.json(result);
      }

      case "listResources": {
        if (!body.serverId) {
          return NextResponse.json(
            { error: "serverId is required for listResources action" },
            { status: 400 }
          );
        }
        const resources = await mcpClientManager.listResources(body.serverId);
        return NextResponse.json(resources);
      }

      case "readResource": {
        if (!body.serverId || !body.resourceUri) {
          return NextResponse.json(
            {
              error:
                "serverId and resourceUri are required for readResource action",
            },
            { status: 400 }
          );
        }
        const resource = await mcpClientManager.readResource(
          body.serverId,
          body.resourceUri
        );
        return NextResponse.json(resource);
      }

      case "status": {
        const allTools = mcpClientManager.getAllToolsWithServerInfo();
        const connectionStatus = mcpClientManager.getConnectionStatus();
        return NextResponse.json({
          tools: allTools,
          connections: Object.fromEntries(connectionStatus),
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("MCP Client API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        code: "MCP_ERROR",
      },
      { status: 500 }
    );
  }
}

export function GET() {
  // Return status of all connections
  const allTools = mcpClientManager.getAllToolsWithServerInfo();
  const connectionStatus = mcpClientManager.getConnectionStatus();

  return NextResponse.json({
    tools: allTools,
    connections: Object.fromEntries(connectionStatus),
  });
}
