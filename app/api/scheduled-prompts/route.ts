import { CronExpressionParser } from "cron-parser";
import { auth } from "@/app/(auth)/auth";
import {
  createScheduledPrompt,
  getScheduledPromptsByUserId,
} from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:scheduled-prompt").toResponse();
  }

  if (session.user.type === "guest") {
    return new ChatSDKError(
      "forbidden:scheduled-prompt",
      "Guest users cannot access scheduled prompts"
    ).toResponse();
  }

  const prompts = await getScheduledPromptsByUserId({
    userId: session.user.id,
  });

  return Response.json(prompts, { status: 200 });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:scheduled-prompt").toResponse();
  }

  if (session.user.type === "guest") {
    return new ChatSDKError(
      "forbidden:scheduled-prompt",
      "Guest users cannot create scheduled prompts"
    ).toResponse();
  }

  const { promptText, cronExpression }: { promptText: string; cronExpression: string } =
    await request.json();

  if (!promptText || !cronExpression) {
    return new ChatSDKError(
      "bad_request:api",
      "Parameters promptText and cronExpression are required."
    ).toResponse();
  }

  // Validate cron expression and calculate next run time
  let nextRunAt: Date;
  try {
    const interval = CronExpressionParser.parse(cronExpression);
    nextRunAt = interval.next().toDate();
  } catch {
    return new ChatSDKError(
      "bad_request:api",
      "Invalid cron expression."
    ).toResponse();
  }

  const prompt = await createScheduledPrompt({
    userId: session.user.id,
    promptText,
    cronExpression,
    nextRunAt,
  });

  return Response.json(prompt, { status: 201 });
}
