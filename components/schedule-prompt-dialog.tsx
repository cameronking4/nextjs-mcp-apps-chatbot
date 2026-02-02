"use client";

import { CronExpressionParser } from "cron-parser";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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

type PresetInterval = "daily" | "weekly" | "monthly" | "custom";

const PRESET_CRONS: Record<Exclude<PresetInterval, "custom">, string> = {
  daily: "0 9 * * *",
  weekly: "0 9 * * 1",
  monthly: "0 9 1 * *",
};

const PRESET_LABELS: Record<Exclude<PresetInterval, "custom">, string> = {
  daily: "Daily at 9:00 AM",
  weekly: "Weekly on Monday at 9:00 AM",
  monthly: "Monthly on the 1st at 9:00 AM",
};

interface SchedulePromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promptText: string;
}

export function SchedulePromptDialog({
  open,
  onOpenChange,
  promptText,
}: SchedulePromptDialogProps) {
  const [preset, setPreset] = useState<PresetInterval>("daily");
  const [customCron, setCustomCron] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get the active cron expression
  const cronExpression = useMemo(() => {
    if (preset === "custom") {
      return customCron;
    }
    return PRESET_CRONS[preset];
  }, [preset, customCron]);

  // Calculate next run time
  const nextRunTime = useMemo(() => {
    if (!cronExpression) return null;
    try {
      const interval = CronExpressionParser.parse(cronExpression);
      return interval.next().toDate();
    } catch {
      return null;
    }
  }, [cronExpression]);

  // Format next run time for display
  const formattedNextRun = useMemo(() => {
    if (!nextRunTime) return "Invalid cron expression";
    return nextRunTime.toLocaleString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
  }, [nextRunTime]);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setPreset("daily");
      setCustomCron("");
      setShowAdvanced(false);
    }
  }, [open]);

  const handleSubmit = useCallback(async () => {
    if (!cronExpression || !nextRunTime) {
      toast.error("Please enter a valid schedule");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/scheduled-prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptText,
          cronExpression,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message ?? "Failed to create scheduled prompt");
      }

      toast.success("Prompt scheduled successfully!");
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to schedule prompt"
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [cronExpression, nextRunTime, promptText, onOpenChange]);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Prompt</DialogTitle>
          <DialogDescription>
            Set up a recurring schedule to automatically send this prompt.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Prompt preview */}
          <div className="grid gap-2">
            <Label className="text-muted-foreground">Prompt</Label>
            <p className="text-sm rounded-md bg-muted p-3 line-clamp-3">
              {promptText}
            </p>
          </div>

          {/* Schedule preset selector */}
          <div className="grid gap-2">
            <Label htmlFor="schedule">Schedule</Label>
            <Select
              onValueChange={(value: PresetInterval) => setPreset(value)}
              value={preset}
            >
              <SelectTrigger id="schedule">
                <SelectValue placeholder="Select schedule" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">{PRESET_LABELS.daily}</SelectItem>
                <SelectItem value="weekly">{PRESET_LABELS.weekly}</SelectItem>
                <SelectItem value="monthly">{PRESET_LABELS.monthly}</SelectItem>
                <SelectItem value="custom">Custom cron expression</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom cron input */}
          {preset === "custom" && (
            <div className="grid gap-2">
              <Label htmlFor="cron">Cron Expression</Label>
              <Input
                id="cron"
                onChange={(e) => setCustomCron(e.target.value)}
                placeholder="* * * * *"
                value={customCron}
              />
              <p className="text-xs text-muted-foreground">
                Format: minute hour day month weekday
              </p>
            </div>
          )}

          {/* Advanced toggle for preset schedules */}
          {preset !== "custom" && (
            <button
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowAdvanced(!showAdvanced)}
              type="button"
            >
              {showAdvanced ? (
                <ChevronUp className="size-4" />
              ) : (
                <ChevronDown className="size-4" />
              )}
              {showAdvanced ? "Hide" : "Show"} cron expression
            </button>
          )}

          {/* Show cron expression for preset */}
          {showAdvanced && preset !== "custom" && (
            <div className="grid gap-2">
              <Label className="text-muted-foreground">Cron Expression</Label>
              <code className="text-sm rounded-md bg-muted p-2 font-mono">
                {cronExpression}
              </code>
            </div>
          )}

          {/* Next run preview */}
          <div className="grid gap-2 pt-2 border-t">
            <Label className="text-muted-foreground">Next run</Label>
            <p className="text-sm font-medium">
              {formattedNextRun}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            disabled={isSubmitting || !nextRunTime}
            onClick={handleSubmit}
          >
            {isSubmitting ? "Scheduling..." : "Schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
