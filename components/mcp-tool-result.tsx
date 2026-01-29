"use client";

/**
 * MCP Tool Result Component
 *
 * Renders MCP tool invocations with progress states and
 * interactive UI when available.
 */

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { MCPAppHost } from "./mcp-app-host";
import { Badge } from "./ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";

// Tool invocation state types
type ToolState =
  | "input-streaming"
  | "input-available"
  | "approval-requested"
  | "approval-responded"
  | "output-available"
  | "output-denied"
  | "error";

interface MCPToolInvocation {
  toolCallId: string;
  toolName: string;
  state: ToolState;
  input?: Record<string, unknown>;
  output?: {
    content: Array<{
      type: string;
      text?: string;
      data?: unknown;
    }>;
    isError?: boolean;
  };
  serverId?: string;
  serverName?: string;
  uiHtml?: string;
  uiMeta?: {
    resourceUri?: string;
    initialHeight?: number;
    resizable?: boolean;
  };
  error?: string;
}

interface MCPToolResultProps {
  part: MCPToolInvocation;
  onToolCall?: (
    toolName: string,
    args: Record<string, unknown>
  ) => Promise<unknown>;
  /** Callback when the MCP App wants to send a message to the chat */
  onSendMessage?: (text: string) => void;
  className?: string;
}

export function MCPToolResult({
  part,
  onToolCall,
  onSendMessage,
  className,
}: MCPToolResultProps) {
  const {
    toolName,
    state,
    input,
    output,
    serverId,
    serverName,
    uiHtml,
    uiMeta,
    error,
  } = part;

  // Default to collapsed when complete, expanded when running
  const isComplete = state === "output-available" || state === "output-denied" || state === "error";
  const [isOpen, setIsOpen] = useState(!isComplete);
  const [fetchedUiHtml, setFetchedUiHtml] = useState<string | null>(null);
  const [uiLoading, setUiLoading] = useState(false);
  const [uiError, setUiError] = useState<string | null>(null);

  // Fetch UI HTML if we have a resourceUri but no html yet
  useEffect(() => {
    if (uiMeta?.resourceUri && !uiHtml && !fetchedUiHtml && serverId) {
      setUiLoading(true);
      setUiError(null);

      fetch("/api/mcp/client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "readResource",
          serverId,
          resourceUri: uiMeta.resourceUri,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.contents?.[0]?.text) {
            setFetchedUiHtml(data.contents[0].text);
          } else {
            setUiError("No UI content received");
          }
        })
        .catch((err) => {
          setUiError(err.message);
        })
        .finally(() => {
          setUiLoading(false);
        });
    }
  }, [uiMeta?.resourceUri, uiHtml, fetchedUiHtml, serverId]);

  // Handle tool calls from the MCP App View
  const handleToolCall = useCallback(
    async (name: string, args: Record<string, unknown>) => {
      if (onToolCall) {
        return onToolCall(name, args);
      }

      // Default: proxy to MCP server
      if (!serverId) {
        throw new Error("No server ID available");
      }

      const response = await fetch("/api/mcp/client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "callTool",
          serverId,
          toolName: name,
          toolArgs: args,
        }),
      });

      if (!response.ok) {
        throw new Error("Tool call failed");
      }

      return response.json();
    },
    [onToolCall, serverId]
  );

  // Extract display name from tool name (remove mcp_ prefix)
  const displayToolName = toolName.startsWith("mcp_")
    ? toolName.split("_").slice(2).join("_")
    : toolName;

  // Determine the actual UI HTML to use
  const actualUiHtml = uiHtml ?? fetchedUiHtml;
  const hasUi = Boolean(actualUiHtml) || Boolean(uiMeta?.resourceUri);

  // Render based on state
  const renderContent = () => {
    switch (state) {
      case "input-streaming":
        return (
          <div className="flex items-center gap-2 px-4 py-3 text-muted-foreground text-sm">
            <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Preparing {displayToolName}...
          </div>
        );

      case "input-available":
        return (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 px-4 py-3 text-muted-foreground text-sm">
              <span className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Calling {displayToolName}...
            </div>
            {input && (
              <div className="border-t px-4 py-2">
                <pre className="overflow-x-auto text-xs">
                  {JSON.stringify(input, null, 2)}
                </pre>
              </div>
            )}
          </div>
        );

      case "output-available":
        if (uiLoading) {
          return (
            <div className="flex items-center gap-2 px-4 py-3 text-muted-foreground text-sm">
              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Loading interactive UI...
            </div>
          );
        }

        if (uiError) {
          return (
            <div className="px-4 py-3">
              <div className="mb-2 text-red-500 text-sm">
                Failed to load UI: {uiError}
              </div>
              {output && (
                <pre className="overflow-x-auto rounded bg-muted p-2 text-xs">
                  {JSON.stringify(output, null, 2)}
                </pre>
              )}
            </div>
          );
        }

        if (actualUiHtml && serverId) {
          return (
            <MCPAppHost
              className="border-0"
              onSendMessage={onSendMessage}
              onToolCall={handleToolCall}
              serverId={serverId}
              toolInput={input}
              toolName={displayToolName}
              toolResult={output}
              uiHtml={actualUiHtml}
              uiMeta={uiMeta}
            />
          );
        }

        // Fallback: render JSON output
        return (
          <div className="px-4 py-3">
            <pre className="overflow-x-auto rounded bg-muted p-2 text-xs">
              {JSON.stringify(output, null, 2)}
            </pre>
          </div>
        );

      case "output-denied":
        return (
          <div className="px-4 py-3 text-muted-foreground text-sm">
            Tool execution was denied.
          </div>
        );

      case "error":
        return (
          <div className="px-4 py-3 text-red-500 text-sm">
            <strong>Error:</strong> {error ?? "Unknown error occurred"}
          </div>
        );

      default:
        return null;
    }
  };

  // Get status badge color based on state
  const getStatusBadge = () => {
    switch (state) {
      case "input-streaming":
      case "input-available":
        return (
          <Badge className="text-xs" variant="secondary">
            Running
          </Badge>
        );
      case "output-available":
        return (
          <Badge
            className="bg-green-500 text-xs hover:bg-green-600"
            variant="default"
          >
            Complete
          </Badge>
        );
      case "error":
      case "output-denied":
        return (
          <Badge className="text-xs" variant="destructive">
            {state === "error" ? "Error" : "Denied"}
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Collapsible
      className={cn(
        "w-full max-w-2xl rounded-lg border bg-background",
        className
      )}
      onOpenChange={setIsOpen}
      open={isOpen}
    >
      <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 hover:bg-muted/50">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "size-2 rounded-full",
              state === "output-available" && "bg-green-500",
              (state === "input-streaming" || state === "input-available") &&
                "animate-pulse bg-blue-500",
              (state === "error" || state === "output-denied") && "bg-red-500"
            )}
          />
          <span className="font-medium text-sm">{displayToolName}</span>
          {serverName && (
            <Badge className="text-xs" variant="outline">
              {serverName}
            </Badge>
          )}
          {hasUi && (
            <Badge className="text-xs" variant="secondary">
              Interactive
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          <svg
            className={cn(
              "size-4 text-muted-foreground transition-transform",
              isOpen && "rotate-180"
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M19 9l-7 7-7-7"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
            />
          </svg>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>{renderContent()}</CollapsibleContent>
    </Collapsible>
  );
}

export default MCPToolResult;
