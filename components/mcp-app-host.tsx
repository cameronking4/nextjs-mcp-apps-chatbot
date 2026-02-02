"use client";

/**
 * MCP App Host Component
 *
 * Renders MCP App Views in sandboxed iframes.
 * Provides a simplified approach that works without full AppBridge protocol
 * while still supporting tool calls via postMessage.
 */

import { useTheme } from "next-themes";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface MCPAppHostProps {
  /** The HTML content to render in the iframe */
  uiHtml: string;
  /** The tool name */
  toolName: string;
  /** The tool input arguments */
  toolInput?: Record<string, unknown>;
  /** The tool result (if available) */
  toolResult?: {
    content: Array<{
      type: string;
      text?: string;
      data?: unknown;
    }>;
    isError?: boolean;
  };
  /** The MCP server ID */
  serverId: string;
  /** UI metadata from the tool */
  uiMeta?: {
    resourceUri?: string;
    initialHeight?: number;
    resizable?: boolean;
  };
  /** Callback when the View requests a tool call */
  onToolCall?: (
    toolName: string,
    args: Record<string, unknown>
  ) => Promise<unknown>;
  /** Callback when the View wants to update model context */
  onContextUpdate?: (content: unknown[]) => void;
  /** Callback when the View wants to send a message to the main chat */
  onSendMessage?: (text: string) => void;
  /** Callback when the View wants to open a side panel chat with a prompt (Bloomberg only) */
  onOpenSideChat?: (prompt: string) => void;
  /** Additional class names */
  className?: string;
  /** Whether to fill the available height (for fullscreen mode) */
  fillHeight?: boolean;
}

export function MCPAppHost({
  uiHtml,
  toolName,
  toolInput,
  toolResult,
  serverId,
  uiMeta,
  onToolCall,
  onSendMessage,
  onOpenSideChat,
  className,
  fillHeight = false,
}: MCPAppHostProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();

  // Calculate iframe height - start small and let content report its height
  const initialHeight = uiMeta?.initialHeight ?? 100;
  const [height, setHeight] = useState(initialHeight);

  // Handle tool calls from the View via postMessage
  const handleToolCall = useCallback(
    async (name: string, args: Record<string, unknown>) => {
      if (onToolCall) {
        return onToolCall(name, args);
      }

      // Default: proxy to MCP server via API
      try {
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
      } catch (err) {
        console.error("Error calling tool from View:", err);
        throw err;
      }
    },
    [onToolCall, serverId]
  );

  // Listen for messages from the iframe
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Only handle messages from our iframe
      if (event.source !== iframeRef.current?.contentWindow) {
        return;
      }

      const { type, payload } = event.data || {};

      // Handle tool call requests from the iframe
      if (type === "mcp:callTool") {
        try {
          const result = await handleToolCall(payload.name, payload.arguments);
          // Send result back to iframe
          iframeRef.current?.contentWindow?.postMessage(
            { type: "mcp:toolResult", payload: result },
            "*"
          );
        } catch (err) {
          iframeRef.current?.contentWindow?.postMessage(
            {
              type: "mcp:toolResult",
              payload: {
                isError: true,
                content: [
                  {
                    type: "text",
                    text: err instanceof Error ? err.message : "Tool call failed",
                  },
                ],
              },
            },
            "*"
          );
        }
      }

      // Handle size change requests (always allow height updates)
      if (type === "mcp:sizeChange" && payload?.height) {
        setHeight(payload.height);
      }

      // Handle ready signal from iframe
      if (type === "mcp:ready") {
        setIsLoaded(true);
        // Send initial data to iframe
        sendInitialData();
      }

      // Handle send message requests from iframe
      // If onOpenSideChat is provided (Bloomberg tools), open side panel
      // Otherwise, use onSendMessage to add to main chat
      if (type === "mcp:sendMessage" && payload?.text) {
        if (onOpenSideChat) {
          onOpenSideChat(payload.text);
        } else if (onSendMessage) {
          onSendMessage(payload.text);
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleToolCall, uiMeta?.resizable, onOpenSideChat, onSendMessage]);

  // Send initial data to iframe
  const sendInitialData = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;

    // Send tool input
    if (toolInput) {
      iframe.contentWindow.postMessage(
        { type: "mcp:toolInput", payload: { arguments: toolInput } },
        "*"
      );
    }

    // Send tool result
    if (toolResult) {
      iframe.contentWindow.postMessage(
        { type: "mcp:toolResult", payload: toolResult },
        "*"
      );
    }

    // Send theme and display mode context
    iframe.contentWindow.postMessage(
      {
        type: "mcp:hostContext",
        payload: {
          theme: resolvedTheme === "dark" ? "dark" : "light",
          displayMode: fillHeight ? "fullscreen" : "inline",
        },
      },
      "*"
    );
  }, [toolInput, toolResult, resolvedTheme, fillHeight]);

  // Handle iframe load
  const handleIframeLoad = useCallback(() => {
    // Set a short timeout to allow the iframe JS to initialize
    const timer = setTimeout(() => {
      setIsLoaded(true);
      sendInitialData();
    }, 500);

    return () => clearTimeout(timer);
  }, [sendInitialData]);

  // Update theme when it changes
  useEffect(() => {
    if (isLoaded && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: "mcp:hostContext",
          payload: {
            theme: resolvedTheme === "dark" ? "dark" : "light",
          },
        },
        "*"
      );
    }
  }, [resolvedTheme, isLoaded]);

  // Send updated tool result when it changes
  useEffect(() => {
    if (isLoaded && toolResult && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: "mcp:toolResult", payload: toolResult },
        "*"
      );
    }
  }, [toolResult, isLoaded]);

  if (error) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-lg border border-red-200 bg-red-50 p-4 text-red-600 dark:border-red-800 dark:bg-red-950/50 dark:text-red-400",
          className
        )}
      >
        <div className="text-sm">
          <strong>MCP App Error:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("relative overflow-hidden border", className)}
      style={fillHeight ? { height: "100%" } : undefined}
    >
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Loading {toolName}...
          </div>
        </div>
      )}
      <iframe
        className="w-full border-0"
        onLoad={handleIframeLoad}
        ref={iframeRef}
        sandbox="allow-scripts allow-same-origin"
        srcDoc={uiHtml}
        style={{ height: fillHeight ? "100%" : `${height}px` }}
        title={`MCP App: ${toolName}`}
      />
    </div>
  );
}

export default MCPAppHost;
