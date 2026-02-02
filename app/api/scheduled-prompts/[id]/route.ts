import { CronExpressionParser } from "cron-parser";
import { auth } from "@/app/(auth)/auth";
import {
  deleteScheduledPrompt,
  getScheduledPromptById,
  updateScheduledPrompt,
} from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:scheduled-prompt").toResponse();
  }

  if (session.user.type === "guest") {
    return new ChatSDKError(
      "forbidden:scheduled-prompt",
      "Guest users cannot update scheduled prompts"
    ).toResponse();
  }

  const { id } = await params;
  const prompt = await getScheduledPromptById({ id });

  if (!prompt) {
    return new ChatSDKError("not_found:scheduled-prompt").toResponse();
  }

  if (prompt.userId !== session.user.id) {
    return new ChatSDKError("forbidden:scheduled-prompt").toResponse();
  }

  const { isActive, cronExpression }: { isActive?: boolean; cronExpression?: string } =
    await request.json();

  let nextRunAt: Date | undefined;

  // If cronExpression is being updated, validate and calculate new nextRunAt
  if (cronExpression) {
    try {
      const interval = CronExpressionParser.parse(cronExpression);
      nextRunAt = interval.next().toDate();
    } catch {
      return new ChatSDKError(
        "bad_request:api",
        "Invalid cron expression."
      ).toResponse();
    }
  }

  // If being reactivated, recalculate nextRunAt from current cron
  if (isActive === true && !cronExpression) {
    try {
      const interval = CronExpressionParser.parse(prompt.cronExpression);
      nextRunAt = interval.next().toDate();
    } catch {
      return new ChatSDKError(
        "bad_request:api",
        "Stored cron expression is invalid."
      ).toResponse();
    }
  }

  const updated = await updateScheduledPrompt({
    id,
    isActive,
    cronExpression,
    nextRunAt,
  });

  return Response.json(updated, { status: 200 });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:scheduled-prompt").toResponse();
  }

  if (session.user.type === "guest") {
    return new ChatSDKError(
      "forbidden:scheduled-prompt",
      "Guest users cannot delete scheduled prompts"
    ).toResponse();
  }

  const { id } = await params;
  const prompt = await getScheduledPromptById({ id });

  if (!prompt) {
    return new ChatSDKError("not_found:scheduled-prompt").toResponse();
  }

  if (prompt.userId !== session.user.id) {
    return new ChatSDKError("forbidden:scheduled-prompt").toResponse();
  }

  await deleteScheduledPrompt({ id });

  return new Response("Scheduled prompt deleted", { status: 200 });
}
