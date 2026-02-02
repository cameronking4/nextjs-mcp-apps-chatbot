import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { getChatById, saveChat, saveMessages } from "@/lib/db/queries";
import type { DBMessage } from "@/lib/db/schema";
import { ChatSDKError } from "@/lib/errors";

// Schema for saving ephemeral chats
const saveRequestBodySchema = z.object({
  id: z.string().uuid(),
  messages: z.array(
    z.object({
      id: z.string(),
      role: z.string(),
      parts: z.array(z.any()),
      attachments: z.array(z.any()).optional(),
    })
  ),
  title: z.string().optional(),
  visibility: z.enum(["public", "private"]).default("private"),
});

export type SaveRequestBody = z.infer<typeof saveRequestBodySchema>;

export async function POST(request: Request) {
  let requestBody: SaveRequestBody;

  try {
    const json = await request.json();
    requestBody = saveRequestBodySchema.parse(json);
  } catch (_) {
    return new ChatSDKError("bad_request:api").toResponse();
  }

  try {
    const { id, messages, title, visibility } = requestBody;

    const session = await auth();

    if (!session?.user) {
      return new ChatSDKError("unauthorized:chat").toResponse();
    }

    // Check if chat already exists
    const existingChat = await getChatById({ id });

    if (existingChat) {
      // Chat already saved - this could happen if user clicks save multiple times
      if (existingChat.userId !== session.user.id) {
        return new ChatSDKError("forbidden:chat").toResponse();
      }
      return Response.json(
        { success: true, message: "Chat already saved" },
        { status: 200 }
      );
    }

    // Generate a title from the first user message if not provided
    let chatTitle = title ?? "Side Panel Chat";
    if (!title && messages.length > 0) {
      const firstUserMessage = messages.find((m) => m.role === "user");
      if (firstUserMessage) {
        const textPart = firstUserMessage.parts.find(
          (p: { type: string }) => p.type === "text"
        ) as { type: string; text: string } | undefined;
        if (textPart?.text) {
          // Truncate to first 50 chars for title
          chatTitle = textPart.text.slice(0, 50) + (textPart.text.length > 50 ? "..." : "");
        }
      }
    }

    // Save the chat
    await saveChat({
      id,
      userId: session.user.id,
      title: chatTitle,
      visibility,
    });

    // Save all messages
    if (messages.length > 0) {
      const dbMessages: DBMessage[] = messages.map((msg) => ({
        id: msg.id,
        chatId: id,
        role: msg.role,
        parts: msg.parts,
        attachments: msg.attachments ?? [],
        createdAt: new Date(),
      }));

      await saveMessages({ messages: dbMessages });
    }

    return Response.json(
      { success: true, message: "Chat saved successfully" },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    console.error("Error saving ephemeral chat:", error);
    return new ChatSDKError("bad_request:database").toResponse();
  }
}
