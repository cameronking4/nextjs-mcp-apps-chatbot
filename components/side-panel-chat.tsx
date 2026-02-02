"use client";

import { X, Minimize2, Maximize2, PanelRightClose, Move, Save, Check } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { cn } from "@/lib/utils";
import { Chat } from "./chat";
import { DataStreamHandler } from "./data-stream-handler";
import { DataStreamProvider } from "./data-stream-provider";
import { useSidePanel } from "./side-panel-context";
import { getChatHistoryPaginationKey } from "./sidebar-history";
import { toast } from "./toast";
import type { ChatMessage } from "@/lib/types";

type ResizeDirection = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw" | null;

export function SidePanelChat() {
  const {
    mode,
    chat,
    position,
    size,
    setPosition,
    setSize,
    setMode,
    minimize,
    close,
    updateMessages,
    isSaved,
    markAsSaved,
  } = useSidePanel();

  const { mutate } = useSWRConfig();
  const panelRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<ResizeDirection>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, posX: 0, posY: 0 });

  // Handle dragging for floating mode
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (mode !== "floating") return;
      
      // Only drag from header area
      if (!headerRef.current?.contains(e.target as Node)) return;
      
      // Don't drag if clicking on buttons
      if ((e.target as HTMLElement).closest("button")) return;
      
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    },
    [mode, position]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = Math.max(0, Math.min(window.innerWidth - size.width, e.clientX - dragOffset.x));
      const newY = Math.max(0, Math.min(window.innerHeight - 100, e.clientY - dragOffset.y));
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset, setPosition, size.width]);

  // Handle resize start
  const handleResizeStart = useCallback(
    (e: React.MouseEvent, direction: ResizeDirection) => {
      if (mode !== "floating") return;
      e.preventDefault();
      e.stopPropagation();
      
      setIsResizing(true);
      setResizeDirection(direction);
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: size.width,
        height: size.height,
        posX: position.x,
        posY: position.y,
      });
    },
    [mode, size, position]
  );

  // Handle resize
  useEffect(() => {
    if (!isResizing || !resizeDirection) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;

      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;
      let newX = resizeStart.posX;
      let newY = resizeStart.posY;

      // Handle horizontal resize
      if (resizeDirection.includes("e")) {
        newWidth = resizeStart.width + deltaX;
      }
      if (resizeDirection.includes("w")) {
        newWidth = resizeStart.width - deltaX;
        newX = resizeStart.posX + deltaX;
      }

      // Handle vertical resize
      if (resizeDirection.includes("s")) {
        newHeight = resizeStart.height + deltaY;
      }
      if (resizeDirection.includes("n")) {
        newHeight = resizeStart.height - deltaY;
        newY = resizeStart.posY + deltaY;
      }

      // Apply constraints
      const minWidth = 320;
      const minHeight = 400;
      const maxWidth = Math.min(800, window.innerWidth - newX);
      const maxHeight = Math.min(900, window.innerHeight - newY);

      newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));

      // Adjust position if resizing from top/left edges
      if (resizeDirection.includes("w") && newWidth > minWidth) {
        newX = Math.max(0, resizeStart.posX + (resizeStart.width - newWidth));
      }
      if (resizeDirection.includes("n") && newHeight > minHeight) {
        newY = Math.max(0, resizeStart.posY + (resizeStart.height - newHeight));
      }

      setSize({ width: newWidth, height: newHeight });
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeDirection(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, resizeDirection, resizeStart, setSize, setPosition]);

  // Handle messages update from embedded chat
  const handleMessagesChange = useCallback(
    (messages: ChatMessage[]) => {
      updateMessages(messages);
    },
    [updateMessages]
  );

  // Handle save to history
  const handleSave = useCallback(async () => {
    if (!chat || isSaved) return;
    
    try {
      // Call the save endpoint to persist the ephemeral chat
      const response = await fetch("/api/chat/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: chat.id,
          messages: chat.messages,
          visibility: "private",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save chat");
      }

      // Mark as saved locally
      markAsSaved();
      
      // Refresh sidebar history to show the saved chat
      mutate(unstable_serialize(getChatHistoryPaginationKey));
      
      toast({
        type: "success",
        description: "Chat saved to history",
      });
    } catch (error) {
      console.error("Failed to save chat:", error);
      toast({
        type: "error",
        description: "Failed to save chat",
      });
    }
  }, [chat, isSaved, markAsSaved, mutate]);

  // Don't render if closed or no chat
  if (mode === "closed" || mode === "minimized" || !chat) {
    return null;
  }

  const isFloating = mode === "floating";
  const isDocked = mode === "docked";

  // Truncate prompt for display
  const displayPrompt = chat.initialPrompt.length > 50
    ? chat.initialPrompt.slice(0, 50) + "..."
    : chat.initialPrompt;

  return (
    <div
      ref={panelRef}
      className={cn(
        "flex flex-col border-l bg-background",
        isDocked && "h-full w-[35%] min-w-xl max-w-5xl",
        isFloating && "fixed z-50 rounded-lg border shadow-2xl",
        (isDragging || isResizing) && "select-none"
      )}
      style={
        isFloating
          ? {
              left: position.x,
              top: position.y,
              width: size.width,
              height: size.height,
            }
          : undefined
      }
    >
      {/* Resize handles for floating mode */}
      {isFloating && (
        <>
          {/* Edge handles */}
          <div
            className="absolute top-0 left-2 right-2 h-1 cursor-n-resize"
            onMouseDown={(e) => handleResizeStart(e, "n")}
          />
          <div
            className="absolute bottom-0 left-2 right-2 h-1 cursor-s-resize"
            onMouseDown={(e) => handleResizeStart(e, "s")}
          />
          <div
            className="absolute left-0 top-2 bottom-2 w-1 cursor-w-resize"
            onMouseDown={(e) => handleResizeStart(e, "w")}
          />
          <div
            className="absolute right-0 top-2 bottom-2 w-1 cursor-e-resize"
            onMouseDown={(e) => handleResizeStart(e, "e")}
          />
          {/* Corner handles */}
          <div
            className="absolute top-0 left-0 size-2 cursor-nw-resize"
            onMouseDown={(e) => handleResizeStart(e, "nw")}
          />
          <div
            className="absolute top-0 right-0 size-2 cursor-ne-resize"
            onMouseDown={(e) => handleResizeStart(e, "ne")}
          />
          <div
            className="absolute bottom-0 left-0 size-2 cursor-sw-resize"
            onMouseDown={(e) => handleResizeStart(e, "sw")}
          />
          <div
            className="absolute bottom-0 right-0 size-2 cursor-se-resize"
            onMouseDown={(e) => handleResizeStart(e, "se")}
          />
        </>
      )}
      {/* Header */}
      <div
        ref={headerRef}
        className={cn(
          "flex items-center gap-2 border-b bg-muted/50 px-3 py-2",
          isFloating && "cursor-grab rounded-t-lg",
          isDragging && "cursor-grabbing"
        )}
        onMouseDown={handleMouseDown}
      >
        {isFloating && (
          <Move className="size-4 text-muted-foreground" />
        )}
        
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">
            {displayPrompt}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {isSaved ? (
              <>
                <Check className="size-3 text-green-500" />
                <span>Saved</span>
              </>
            ) : (
              <span>Unsaved</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Save button */}
          {!isSaved && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="size-7"
                  onClick={handleSave}
                  size="icon"
                  variant="ghost"
                >
                  <Save className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Save to history</TooltipContent>
            </Tooltip>
          )}

          {/* Toggle dock/float */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="size-7"
                onClick={() => setMode(isDocked ? "floating" : "docked")}
                size="icon"
                variant="ghost"
              >
                {isDocked ? (
                  <Maximize2 className="size-4" />
                ) : (
                  <PanelRightClose className="size-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isDocked ? "Pop out" : "Dock to side"}
            </TooltipContent>
          </Tooltip>

          {/* Minimize */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="size-7"
                onClick={minimize}
                size="icon"
                variant="ghost"
              >
                <Minimize2 className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Minimize</TooltipContent>
          </Tooltip>

          {/* Close */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="size-7"
                onClick={close}
                size="icon"
                variant="ghost"
              >
                <X className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Close</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Chat content */}
      <div className="min-h-0 flex-1 overflow-hidden">
        {/* Key on DataStreamProvider ensures fresh state for each chat */}
        <DataStreamProvider key={chat.id}>
          <Chat
            autoResume={false}
            containerClassName="h-full"
            ephemeral={!isSaved}
            id={chat.id}
            initialChatModel={DEFAULT_CHAT_MODEL}
            initialMessages={[]}
            initialPrompt={chat.initialPrompt}
            initialVisibilityType="private"
            isReadonly={false}
            key={chat.id}
            mode="embedded"
            onMessagesChange={handleMessagesChange}
          />
          <DataStreamHandler />
        </DataStreamProvider>
      </div>
    </div>
  );
}
