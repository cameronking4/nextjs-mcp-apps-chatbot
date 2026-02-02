"use client";

import { MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useSidePanel } from "./side-panel-context";

export function MinimizedChatTab() {
  const { mode, chat, restore, close } = useSidePanel();

  // Only show when minimized and there's a chat
  if (mode !== "minimized" || !chat) {
    return null;
  }

  // Truncate prompt for display
  const displayPrompt =
    chat.initialPrompt.length > 30
      ? chat.initialPrompt.slice(0, 30) + "..."
      : chat.initialPrompt;

  return (
    <div className="fixed right-4 bottom-4 z-50 flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className={cn(
              "group flex h-auto max-w-3xl items-center gap-2 rounded-full px-4 py-2",
              "bg-primary text-primary-foreground shadow-lg",
              "hover:bg-primary/90 hover:shadow-xl",
              "transition-all duration-200"
            )}
            onClick={restore}
          >
            <MessageSquare className="size-4 shrink-0" />
            <span className="truncate text-sm">{displayPrompt}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>Click to restore side chat</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className="size-8 rounded-full shadow-lg"
            onClick={close}
            size="icon"
            variant="secondary"
          >
            <X className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>Close side chat</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
