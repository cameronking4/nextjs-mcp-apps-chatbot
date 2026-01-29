"use client";

/**
 * MCP Settings Component
 *
 * UI for managing MCP server connections.
 * Allows users to view, add, remove, and configure MCP servers.
 */

import { useState } from "react";
import {
  ServerIcon,
  WrenchIcon,
  SparklesIcon,
  ChevronRightIcon,
  PlusIcon,
  XIcon,
  RefreshCwIcon,
  CircleIcon,
  Loader2Icon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMCPContext } from "./mcp-provider";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";

export function MCPSettings() {
  const {
    servers,
    isInitializing,
    connectToServer,
    disconnectFromServer,
    addServer,
    removeServer,
  } = useMCPContext();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newServerName, setNewServerName] = useState("");
  const [newServerUrl, setNewServerUrl] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAddServer = () => {
    if (!newServerName.trim() || !newServerUrl.trim()) {
      return;
    }

    setIsAdding(true);
    addServer({
      name: newServerName.trim(),
      url: newServerUrl.trim(),
      enabled: true,
    });

    setNewServerName("");
    setNewServerUrl("");
    setIsAddDialogOpen(false);
    setIsAdding(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "bg-green-500";
      case "connecting":
        return "bg-yellow-500 animate-pulse";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "connected":
        return "Connected";
      case "connecting":
        return "Connecting...";
      case "error":
        return "Error";
      default:
        return "Disconnected";
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-lg">MCP Servers</h2>
          <p className="text-muted-foreground text-sm">
            Manage Model Context Protocol server connections
          </p>
        </div>
        <Dialog onOpenChange={setIsAddDialogOpen} open={isAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">Add Server</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add MCP Server</DialogTitle>
              <DialogDescription>
                Connect to a new MCP server to access its tools and resources.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  onChange={(e) => setNewServerName(e.target.value)}
                  placeholder="My MCP Server"
                  value={newServerName}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  onChange={(e) => setNewServerUrl(e.target.value)}
                  placeholder="https://example.com/mcp"
                  value={newServerUrl}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => setIsAddDialogOpen(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={isAdding} onClick={handleAddServer}>
                {isAdding ? "Adding..." : "Add Server"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isInitializing ? (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Initializing MCP connections...
          </div>
        </div>
      ) : servers.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">
            No MCP servers configured. Add a server to get started.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {servers.map((server) => (
            <div
              className="flex items-center justify-between rounded-lg border p-4"
              key={server.config.id}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "size-2 rounded-full",
                    getStatusColor(server.status)
                  )}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{server.config.name}</span>
                    {server.status === "connected" && (
                      <Badge className="text-xs" variant="secondary">
                        {server.tools.length} tools
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {server.config.url}
                  </p>
                  {server.error && (
                    <p className="mt-1 text-red-500 text-xs">{server.error}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  className="text-xs"
                  variant={
                    server.status === "connected" ? "default" : "secondary"
                  }
                >
                  {getStatusText(server.status)}
                </Badge>
                {server.status === "connected" ? (
                  <Button
                    onClick={() => disconnectFromServer(server.config.id)}
                    size="sm"
                    variant="outline"
                  >
                    Disconnect
                  </Button>
                ) : server.status === "error" ||
                  server.status === "disconnected" ? (
                  <Button
                    onClick={() => connectToServer(server.config)}
                    size="sm"
                    variant="outline"
                  >
                    Connect
                  </Button>
                ) : null}
                {server.config.id !== "demo" && (
                  <Button
                    className="text-red-500 hover:text-red-600"
                    onClick={() => removeServer(server.config.id)}
                    size="sm"
                    variant="ghost"
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tools Preview */}
      {servers.some((s) => s.status === "connected" && s.tools.length > 0) && (
        <div className="mt-4">
          <h3 className="mb-2 font-medium text-sm">Available Tools</h3>
          <div className="flex flex-wrap gap-2">
            {servers
              .filter((s) => s.status === "connected")
              .flatMap((s) =>
                s.tools.map((tool) => (
                  <Badge
                    className="text-xs"
                    key={`${s.config.id}-${tool.name}`}
                    variant="outline"
                  >
                    {tool.name}
                    {tool._meta?.ui && (
                      <span className="ml-1 text-blue-500">✦</span>
                    )}
                  </Badge>
                ))
              )}
          </div>
          <p className="mt-2 text-muted-foreground text-xs">
            <span className="text-blue-500">✦</span> indicates tools with
            interactive UI
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Compact MCP status indicator for the chat header
 * Opens a rich dialog to browse available tools on click
 */
export function MCPStatusIndicator() {
  const {
    servers,
    isInitializing,
    connectToServer,
    refreshTools,
  } = useMCPContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const connectedCount = servers.filter((s) => s.status === "connected").length;
  const totalTools = servers
    .filter((s) => s.status === "connected")
    .reduce((acc, s) => acc + s.tools.length, 0);

  const connectedServers = servers.filter((s) => s.status === "connected");

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshTools();
    setIsRefreshing(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CircleIcon className="size-2.5 fill-green-500 text-green-500" />;
      case "connecting":
        return <Loader2Icon className="size-2.5 animate-spin text-yellow-500" />;
      case "error":
        return <CircleIcon className="size-2.5 fill-red-500 text-red-500" />;
      default:
        return <CircleIcon className="size-2.5 fill-gray-400 text-gray-400" />;
    }
  };

  // Badge content
  const badgeContent = isInitializing ? (
    <>
      <Loader2Icon className="size-3 animate-spin" />
      <span>MCP</span>
    </>
  ) : connectedCount === 0 ? (
    <>
      <CircleIcon className="size-2 fill-muted-foreground text-muted-foreground" />
      <span>MCP: Offline</span>
    </>
  ) : (
    <>
      <CircleIcon className="size-2 fill-green-500 text-green-500" />
      <span>MCP: {totalTools} tools</span>
    </>
  );

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
            "hover:bg-accent hover:text-accent-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            connectedCount > 0
              ? "border-green-500/50 text-green-600 dark:text-green-400"
              : "border-border text-muted-foreground"
          )}
          type="button"
        >
          {badgeContent}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between mt-4">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <ServerIcon className="size-5" />
                MCP Tools & Servers
              </DialogTitle>
              <DialogDescription className="mt-1">
                Browse available tools from connected MCP servers
              </DialogDescription>
            </div>
            <Button
              className="size-8"
              disabled={isRefreshing}
              onClick={handleRefresh}
              size="icon"
              variant="ghost"
            >
              <RefreshCwIcon
                className={cn("size-4", isRefreshing && "animate-spin")}
              />
            </Button>
          </div>
        </DialogHeader>

        <div className="mt-2">
          {/* Stats Bar */}
          <div className="mb-4 flex gap-4 rounded-lg border bg-muted/50 p-3">
            <div className="flex items-center gap-2">
              <ServerIcon className="size-4 text-muted-foreground" />
              <span className="font-medium text-sm">{connectedCount}</span>
              <span className="text-muted-foreground text-sm">
                server{connectedCount !== 1 && "s"} connected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <WrenchIcon className="size-4 text-muted-foreground" />
              <span className="font-medium text-sm">{totalTools}</span>
              <span className="text-muted-foreground text-sm">
                tool{totalTools !== 1 && "s"} available
              </span>
            </div>
          </div>

          {connectedServers.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
              <ServerIcon className="mb-3 size-10 text-muted-foreground/50" />
              <p className="font-medium text-muted-foreground">
                No servers connected
              </p>
              <p className="mt-1 text-muted-foreground text-sm">
                MCP servers provide tools that extend the AI&apos;s capabilities
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <Accordion
                className="w-full"
                defaultValue={connectedServers[0]?.config.id}
                type="single"
                collapsible
              >
                {connectedServers.map((server) => (
                  <AccordionItem
                    key={server.config.id}
                    value={server.config.id}
                  >
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(server.status)}
                        <span className="font-medium">{server.config.name}</span>
                        <Badge className="ml-2 text-xs" variant="secondary">
                          {server.tools.length} tools
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid gap-2 pl-5">
                        {server.tools.length === 0 ? (
                          <p className="py-2 text-muted-foreground text-sm">
                            No tools available from this server
                          </p>
                        ) : (
                          server.tools.map((tool) => (
                            <div
                              className="group flex items-start gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50"
                              key={tool.name}
                            >
                              <div
                                className={cn(
                                  "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md",
                                  tool._meta?.ui
                                    ? "bg-blue-500/10 text-blue-500"
                                    : "bg-muted text-muted-foreground"
                                )}
                              >
                                {tool._meta?.ui ? (
                                  <SparklesIcon className="size-4" />
                                ) : (
                                  <WrenchIcon className="size-4" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">
                                    {tool.name}
                                  </span>
                                  {tool._meta?.ui && (
                                    <Badge
                                      className="text-[10px]"
                                      variant="outline"
                                    >
                                      Interactive UI
                                    </Badge>
                                  )}
                                </div>
                                <p className="mt-0.5 line-clamp-2 text-muted-foreground text-xs">
                                  {tool.description ?? "No description available"}
                                </p>
                              </div>
                              <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                            </div>
                          ))
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              {/* Disconnected Servers */}
              {servers.filter((s) => s.status !== "connected").length > 0 && (
                <div className="mt-4 border-t pt-4">
                  <h4 className="mb-2 text-muted-foreground text-xs font-medium uppercase tracking-wider">
                    Other Servers
                  </h4>
                  <div className="grid gap-2">
                    {servers
                      .filter((s) => s.status !== "connected")
                      .map((server) => (
                        <div
                          className="flex items-center justify-between rounded-lg border p-3"
                          key={server.config.id}
                        >
                          <div className="flex items-center gap-2">
                            {getStatusIcon(server.status)}
                            <span className="text-sm">{server.config.name}</span>
                            {server.error && (
                              <span className="text-red-500 text-xs">
                                ({server.error})
                              </span>
                            )}
                          </div>
                          <Button
                            onClick={() => connectToServer(server.config)}
                            size="sm"
                            variant="outline"
                          >
                            Connect
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </ScrollArea>
          )}
        </div>

        <DialogFooter className="mt-4 flex-row justify-between sm:justify-between">
          <p className="text-muted-foreground text-xs">
            <SparklesIcon className="mr-1 inline size-3 text-blue-500" />
            Tools with interactive UI provide rich visual feedback
          </p>
          <Button onClick={() => setIsOpen(false)} variant="outline">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default MCPSettings;
