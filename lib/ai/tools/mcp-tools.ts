/**
 * MCP Tools Integration
 *
 * Bridge between AI SDK tools and MCP tools.
 * Wraps MCP tools for use with the AI SDK and handles progress states.
 */

import type { UIMessageStreamWriter } from "ai";
import { tool } from "ai";
import { z } from "zod";
import { mcpClientManager } from "@/lib/mcp/client";
import {
  DEFAULT_MCP_SERVERS,
  type MCPToolWithServer,
} from "@/lib/mcp/servers";

/**
 * Ensure MCP servers are connected before using tools
 * This handles serverless cold starts where singleton state is lost
 */
export async function ensureMCPConnections(): Promise<void> {
  // Get enabled servers from defaults
  const enabledServers = DEFAULT_MCP_SERVERS.filter((s) => s.enabled);

  // Connect to each enabled server if not already connected
  await Promise.allSettled(
    enabledServers.map(async (config) => {
      if (!mcpClientManager.isConnected(config.id)) {
        try {
          await mcpClientManager.connectToServer(config);
        } catch (error) {
          console.error(`Failed to connect to MCP server ${config.name}:`, error);
        }
      }
    })
  );
}

/**
 * Check if a tool should be visible to the model
 * Tools with _meta.ui.visibility: ["app"] are only accessible via UI, not the LLM
 */
function isToolVisibleToModel(mcpTool: MCPToolWithServer): boolean {
  const visibility = (mcpTool._meta as { ui?: { visibility?: string[] } } | undefined)?.ui?.visibility;
  
  // If no visibility is specified, default to visible to model
  if (!visibility || !Array.isArray(visibility)) {
    return true;
  }
  
  // Tool is visible to model if "model" is in the visibility array
  // or if the visibility array is empty (default behavior)
  return visibility.length === 0 || visibility.includes("model");
}

/**
 * Get all MCP tools from connected servers for use in chat
 * Filters out app-only tools that should not be visible to the LLM
 */
export function getMCPToolsForChat(): MCPToolWithServer[] {
  const allTools = mcpClientManager.getAllToolsWithServerInfo();
  return allTools.filter(isToolVisibleToModel);
}

/**
 * Create an AI SDK tool wrapper for an MCP tool
 */
export function createMCPToolWrapper(
  mcpTool: MCPToolWithServer,
  dataStream: UIMessageStreamWriter
) {
  // Convert MCP input schema to Zod schema
  const zodSchema = convertToZodSchema(mcpTool.inputSchema);

  return tool({
    description: mcpTool.description ?? `MCP tool: ${mcpTool.name}`,
    inputSchema: zodSchema,

    execute: async (args) => {
      const hasUI = !!mcpTool._meta?.ui?.resourceUri;

      // 1. Signal tool execution started
      dataStream.write({
        type: "data-mcp-tool-start",
        data: {
          serverId: mcpTool.serverId,
          serverName: mcpTool.serverName,
          toolName: mcpTool.name,
          hasUI,
        },
        transient: true,
      });

      try {
        // 2. Call the actual MCP tool
        const result = await mcpClientManager.callTool(
          mcpTool.serverId,
          mcpTool.name,
          args as Record<string, unknown>
        );

        // 3. If tool has UI, fetch the HTML resource
        // Check both the tool definition's _meta AND the execution result's _meta
        let uiHtml: string | undefined;
        const resultMeta = result._meta as { ui?: { resourceUri?: string; initialHeight?: number; resizable?: boolean } } | undefined;
        const resourceUri = mcpTool._meta?.ui?.resourceUri ?? resultMeta?.ui?.resourceUri;
        const uiMeta = mcpTool._meta?.ui ?? resultMeta?.ui;

        if (resourceUri) {
          dataStream.write({
            type: "data-mcp-tool-loading-ui",
            data: {
              serverId: mcpTool.serverId,
              resourceUri,
            },
            transient: true,
          });

          try {
            const resource = await mcpClientManager.readResource(
              mcpTool.serverId,
              resourceUri
            );
            // Handle both text and blob content types
            const content = resource.contents[0];
            if (content && "text" in content && content.text) {
              uiHtml = content.text;
            }
          } catch (uiError) {
            console.error("Failed to fetch MCP UI resource:", uiError);
          }
        }

        // 4. Signal completion with full metadata
        dataStream.write({
          type: "data-mcp-tool-complete",
          data: {
            serverId: mcpTool.serverId,
            serverName: mcpTool.serverName,
            toolName: mcpTool.name,
            hasUI: !!uiHtml,
            uiHtml,
            uiMeta,
          },
          transient: true,
        });

        // Return the result with metadata attached
        return {
          ...result,
          _mcpMeta: {
            serverId: mcpTool.serverId,
            serverName: mcpTool.serverName,
            uiHtml,
            uiMeta,
          },
        };
      } catch (error) {
        console.error("[MCP Tool] Execution error:", mcpTool.name, error instanceof Error ? error.message : String(error));

        dataStream.write({
          type: "data-mcp-tool-error",
          data: {
            serverId: mcpTool.serverId,
            toolName: mcpTool.name,
            error: error instanceof Error ? error.message : "Unknown error",
          },
          transient: true,
        });
        throw error;
      }
    },
  });
}

/**
 * Convert MCP JSON Schema to Zod schema
 * Handles nested objects and arrays recursively
 */
function convertJsonSchemaToZod(
  schema: Record<string, unknown>
): z.ZodTypeAny {
  if (!schema || typeof schema !== "object") {
    return z.unknown();
  }

  const type = schema.type as string | undefined;

  switch (type) {
    case "string":
      if (schema.enum && Array.isArray(schema.enum)) {
        return z.enum(schema.enum as [string, ...string[]]);
      }
      return z.string();

    case "number":
    case "integer":
      return z.number();

    case "boolean":
      return z.boolean();

    case "array": {
      const items = schema.items as Record<string, unknown> | undefined;
      if (items) {
        return z.array(convertJsonSchemaToZod(items));
      }
      return z.array(z.unknown());
    }

    case "object": {
      const properties = schema.properties as
        | Record<string, Record<string, unknown>>
        | undefined;
      const required = schema.required as string[] | undefined;

      if (!properties) {
        return z.record(z.unknown());
      }

      const shape: Record<string, z.ZodTypeAny> = {};

      for (const [key, value] of Object.entries(properties)) {
        let fieldSchema = convertJsonSchemaToZod(value);

        // Add description if available
        if (value.description && typeof value.description === "string") {
          fieldSchema = fieldSchema.describe(value.description);
        }

        // Make optional if not in required array
        if (!required?.includes(key)) {
          fieldSchema = fieldSchema.optional();
        }

        shape[key] = fieldSchema;
      }

      return z.object(shape);
    }

    default:
      return z.unknown();
  }
}

/**
 * Convert MCP JSON Schema to Zod schema (entry point)
 */
function convertToZodSchema(
  inputSchema: Record<string, unknown>
): z.ZodTypeAny {
  if (!inputSchema || typeof inputSchema !== "object") {
    return z.object({});
  }

  // Handle top-level object schema
  if (inputSchema.type === "object") {
    return convertJsonSchemaToZod(inputSchema);
  }

  // Legacy handling for schemas without explicit type
  const properties = inputSchema.properties as
    | Record<string, Record<string, unknown>>
    | undefined;
  const required = inputSchema.required as string[] | undefined;

  if (!properties) {
    return z.object({});
  }

  const shape: Record<string, z.ZodTypeAny> = {};

  for (const [key, value] of Object.entries(properties)) {
    let fieldSchema = convertJsonSchemaToZod(value);

    // Add description if available
    if (value.description && typeof value.description === "string") {
      fieldSchema = fieldSchema.describe(value.description);
    }

    // Make optional if not in required array
    if (!required?.includes(key)) {
      fieldSchema = fieldSchema.optional();
    }

    shape[key] = fieldSchema;
  }

  return z.object(shape);
}

/**
 * Create all MCP tool wrappers for connected servers
 * Only includes tools that are visible to the model (filters out app-only tools)
 */
export function createAllMCPToolWrappers(
  dataStream: UIMessageStreamWriter
): Record<string, ReturnType<typeof createMCPToolWrapper>> {
  // Only get tools visible to the model (not app-only tools)
  const mcpTools = getMCPToolsForChat();
  const toolWrappers: Record<
    string,
    ReturnType<typeof createMCPToolWrapper>
  > = {};

  for (const mcpTool of mcpTools) {
    // Create a unique tool name with mcp_ prefix
    const toolKey = `mcp_${mcpTool.serverId}_${mcpTool.name}`;
    toolWrappers[toolKey] = createMCPToolWrapper(mcpTool, dataStream);
  }

  return toolWrappers;
}

/**
 * Get all MCP tool names for experimental_activeTools
 * Only includes tools visible to the model
 */
export function getMCPToolNames(): string[] {
  const mcpTools = getMCPToolsForChat();
  return mcpTools.map((mcpTool) => `mcp_${mcpTool.serverId}_${mcpTool.name}`);
}

/**
 * Check if a tool name is an MCP tool
 */
export function isMCPTool(toolName: string): boolean {
  return toolName.startsWith("mcp_");
}

/**
 * Parse MCP tool name to extract server ID and tool name
 */
export function parseMCPToolName(
  fullToolName: string
): { serverId: string; toolName: string } | null {
  if (!fullToolName.startsWith("mcp_")) {
    return null;
  }

  const parts = fullToolName.slice(4).split("_");
  if (parts.length < 2) {
    return null;
  }

  return {
    serverId: parts[0],
    toolName: parts.slice(1).join("_"),
  };
}
