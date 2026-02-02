"use client";

import { CronExpressionParser } from "cron-parser";
import { CalendarClock, ChevronRight, Pause, Pencil, Play, Trash2 } from "lucide-react";
import type { User } from "next-auth";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { ScheduledPrompt } from "@/lib/db/schema";
import { fetcher } from "@/lib/utils";

type PresetInterval = "daily" | "weekly" | "monthly" | "custom";

const PRESET_CRONS: Record<Exclude<PresetInterval, "custom">, string> = {
  daily: "0 9 * * *",
  weekly: "0 9 * * 1",
  monthly: "0 9 1 * *",
};

const PRESET_LABELS: Record<PresetInterval, string> = {
  daily: "Daily at 9:00 AM",
  weekly: "Weekly on Monday at 9:00 AM",
  monthly: "Monthly on the 1st at 9:00 AM",
  custom: "Custom cron expression",
};

function getPresetFromCron(cron: string): PresetInterval {
  for (const [key, value] of Object.entries(PRESET_CRONS)) {
    if (value === cron) return key as PresetInterval;
  }
  return "custom";
}

export function SidebarScheduledPrompts({ user }: { user: User | undefined }) {
  const [isOpen, setIsOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState<ScheduledPrompt | null>(null);
  const [editPreset, setEditPreset] = useState<PresetInterval>("daily");
  const [editCustomCron, setEditCustomCron] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: prompts, mutate } = useSWR<ScheduledPrompt[]>(
    user ? "/api/scheduled-prompts" : null,
    fetcher
  );

  // Initialize edit form when opening
  useEffect(() => {
    if (editPrompt) {
      const preset = getPresetFromCron(editPrompt.cronExpression);
      setEditPreset(preset);
      setEditCustomCron(preset === "custom" ? editPrompt.cronExpression : "");
    }
  }, [editPrompt]);

  const editCronExpression = useMemo(() => {
    if (editPreset === "custom") return editCustomCron;
    return PRESET_CRONS[editPreset];
  }, [editPreset, editCustomCron]);

  const editNextRunTime = useMemo(() => {
    if (!editCronExpression) return null;
    try {
      const interval = CronExpressionParser.parse(editCronExpression);
      return interval.next().toDate();
    } catch {
      return null;
    }
  }, [editCronExpression]);

  const handleToggle = async (prompt: ScheduledPrompt) => {
    const newState = !prompt.isActive;
    
    try {
      const response = await fetch(`/api/scheduled-prompts/${prompt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newState }),
      });

      if (!response.ok) throw new Error("Failed to update");

      mutate(
        (currentPrompts) =>
          currentPrompts?.map((p) =>
            p.id === prompt.id ? { ...p, isActive: newState } : p
          ),
        { revalidate: false }
      );

      toast.success(newState ? "Prompt activated" : "Prompt paused");
    } catch {
      toast.error("Failed to update prompt");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const deletePromise = fetch(`/api/scheduled-prompts/${deleteId}`, {
      method: "DELETE",
    });

    toast.promise(deletePromise, {
      loading: "Deleting...",
      success: () => {
        mutate(
          (currentPrompts) => currentPrompts?.filter((p) => p.id !== deleteId),
          { revalidate: false }
        );
        setDeleteId(null);
        return "Prompt deleted";
      },
      error: "Failed to delete prompt",
    });
  };

  const handleEditSave = async () => {
    if (!editPrompt || !editNextRunTime) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/scheduled-prompts/${editPrompt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cronExpression: editCronExpression }),
      });

      if (!response.ok) throw new Error("Failed to update");

      const updated = await response.json();
      mutate(
        (currentPrompts) =>
          currentPrompts?.map((p) => (p.id === editPrompt.id ? updated : p)),
        { revalidate: false }
      );

      toast.success("Schedule updated");
      setEditPrompt(null);
    } catch {
      toast.error("Failed to update schedule");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't show for guests or if no user
  if (!user) return null;

  // Don't show if no prompts
  if (!prompts || prompts.length === 0) return null;

  return (
    <>
      <SidebarGroup className="pb-0">
        <Collapsible onOpenChange={setIsOpen} open={isOpen}>
          <CollapsibleTrigger asChild>
            <button
              className="flex w-full items-center gap-2 px-2 py-1.5 text-xs text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
              type="button"
            >
              <CalendarClock className="size-3.5" />
              <span>Scheduled ({prompts.length})</span>
              <ChevronRight
                className={`ml-auto size-3.5 transition-transform ${isOpen ? "rotate-90" : ""}`}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarGroupContent>
              <SidebarMenu>
                {prompts.map((prompt) => (
                  <SidebarMenuItem key={prompt.id}>
                    <div className="group/item flex items-center gap-1 rounded-md px-2 py-1.5 text-sm hover:bg-sidebar-accent">
                      <span
                        className={`flex-1 truncate ${!prompt.isActive ? "text-muted-foreground line-through" : ""}`}
                        title={prompt.promptText}
                      >
                        {prompt.promptText.slice(0, 30)}
                        {prompt.promptText.length > 30 ? "..." : ""}
                      </span>
                      <div className="flex shrink-0 opacity-0 group-hover/item:opacity-100 transition-opacity">
                        <Button
                          className="size-6 p-0"
                          onClick={() => setEditPrompt(prompt)}
                          size="icon"
                          title="Edit schedule"
                          variant="ghost"
                        >
                          <Pencil className="size-3" />
                        </Button>
                        <Button
                          className="size-6 p-0"
                          onClick={() => handleToggle(prompt)}
                          size="icon"
                          title={prompt.isActive ? "Pause" : "Activate"}
                          variant="ghost"
                        >
                          {prompt.isActive ? (
                            <Pause className="size-3" />
                          ) : (
                            <Play className="size-3" />
                          )}
                        </Button>
                        <Button
                          className="size-6 p-0 text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(prompt.id)}
                          size="icon"
                          title="Delete"
                          variant="ghost"
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </div>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </CollapsibleContent>
        </Collapsible>
      </SidebarGroup>

      <AlertDialog onOpenChange={() => setDeleteId(null)} open={!!deleteId}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete scheduled prompt?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this scheduled prompt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog onOpenChange={() => setEditPrompt(null)} open={!!editPrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Schedule</DialogTitle>
            <DialogDescription className="line-clamp-2">
              {editPrompt?.promptText}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="edit-schedule">Schedule</Label>
              <Select
                onValueChange={(value: PresetInterval) => setEditPreset(value)}
                value={editPreset}
              >
                <SelectTrigger id="edit-schedule">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">{PRESET_LABELS.daily}</SelectItem>
                  <SelectItem value="weekly">{PRESET_LABELS.weekly}</SelectItem>
                  <SelectItem value="monthly">{PRESET_LABELS.monthly}</SelectItem>
                  <SelectItem value="custom">{PRESET_LABELS.custom}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {editPreset === "custom" && (
              <div className="grid gap-2">
                <Label htmlFor="edit-cron">Cron Expression</Label>
                <Input
                  id="edit-cron"
                  onChange={(e) => setEditCustomCron(e.target.value)}
                  placeholder="* * * * *"
                  value={editCustomCron}
                />
                <p className="text-xs text-muted-foreground">
                  Format: minute hour day month weekday
                </p>
              </div>
            )}

            <div className="grid gap-1 pt-2 border-t">
              <Label className="text-muted-foreground text-xs">Next run</Label>
              <p className="text-sm">
                {editNextRunTime
                  ? editNextRunTime.toLocaleString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Invalid cron expression"}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              disabled={isSubmitting}
              onClick={() => setEditPrompt(null)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={isSubmitting || !editNextRunTime}
              onClick={handleEditSave}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
