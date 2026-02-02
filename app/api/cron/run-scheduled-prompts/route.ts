import { CronExpressionParser } from "cron-parser";
import {
  getDueScheduledPrompts,
  saveChat,
  saveMessages,
  updateScheduledPrompt,
} from "@/lib/db/queries";
import { generateUUID } from "@/lib/utils";

export const maxDuration = 60;

export async function GET(request: Request) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const duePrompts = await getDueScheduledPrompts();

  if (duePrompts.length === 0) {
    return Response.json({ processed: 0 });
  }

  const results: { id: string; chatId: string; success: boolean; error?: string }[] = [];

  for (const prompt of duePrompts) {
    try {
      // Create a new chat for this scheduled prompt
      const chatId = generateUUID();
      const messageId = generateUUID();
      const now = new Date();

      await saveChat({
        id: chatId,
        userId: prompt.userId,
        title: prompt.promptText.slice(0, 50) + (prompt.promptText.length > 50 ? "..." : ""),
        visibility: "private",
      });

      // Save the user message
      await saveMessages({
        messages: [
          {
            id: messageId,
            chatId,
            role: "user",
            parts: [{ type: "text", text: prompt.promptText }],
            attachments: [],
            createdAt: now,
          },
        ],
      });

      // Calculate next run time
      let nextRunAt: Date;
      try {
        const interval = CronExpressionParser.parse(prompt.cronExpression);
        nextRunAt = interval.next().toDate();
      } catch {
        // If cron parsing fails, disable the prompt
        await updateScheduledPrompt({
          id: prompt.id,
          isActive: false,
          lastRunAt: now,
        });
        results.push({
          id: prompt.id,
          chatId,
          success: false,
          error: "Invalid cron expression, prompt disabled",
        });
        continue;
      }

      // Update the scheduled prompt
      await updateScheduledPrompt({
        id: prompt.id,
        lastRunAt: now,
        nextRunAt,
      });

      results.push({ id: prompt.id, chatId, success: true });
    } catch (error) {
      results.push({
        id: prompt.id,
        chatId: "",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return Response.json({
    processed: duePrompts.length,
    results,
  });
}
