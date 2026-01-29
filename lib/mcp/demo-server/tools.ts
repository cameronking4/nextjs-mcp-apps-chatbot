/**
 * Demo MCP Server Tools
 *
 * Defines the demo tools for the built-in MCP server.
 * This server exposes a single Ask User Questions tool.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getAskUserQuestionsViewHtml } from "@/lib/mcp/demo-server/ui/ask-user-questions-view";

/**
 * Register all demo tools and resources on the MCP server
 */
export function registerDemoTools(server: McpServer): void {
  server.resource(
    "ui://demo/ask-user-questions",
    "ask-user-questions.html",
    async () => ({
      contents: [
        {
          uri: "ui://demo/ask-user-questions",
          mimeType: "text/html",
          text: getAskUserQuestionsViewHtml(),
        },
      ],
    })
  );

  server.tool(
    "ask-user-questions",
    "Ask the user multiple-choice questions and wait for their response. Each question can have 1-5 options. For flexibility, an 'Other' option is automatically added for custom text input so no need to include a choice for 'Other' option.",
    {
      questions: z
        .array(
          z.object({
            id: z.string().describe("Unique identifier for the question"),
            text: z.string().describe("The question text to display"),
            options: z
              .array(
                z.object({
                  id: z.string().describe("Option identifier (e.g., 'A', 'B', 'C')"),
                  label: z.string().describe("Option display text"),
                })
              )
              .min(1)
              .max(5)
              .describe("Available answer options"),
          })
        )
        .min(1)
        .describe("Array of questions to ask the user"),
    },
    (args) => {
      const questions = args.questions.map((question) => ({
        id: question.id,
        text: question.text,
        options: question.options,
      }));

      return Promise.resolve({
        content: [
          {
            type: "text",
            text: JSON.stringify({
              status: "waiting_for_user_input",
              message: "Questions have been displayed to the user. Waiting for their response...",
              questionCount: questions.length,
              questions,
            }),
          },
        ],
        _meta: {
          ui: {
            resourceUri: "ui://demo/ask-user-questions",
            initialHeight: 600,
            resizable: true,
          },
        },
      });
    }
  );
}

/**
 * Get the list of LLM-facing tools (excludes app-only tools)
 */
export function getLLMTools(): string[] {
  return ["ask-user-questions"];
}

/**
 * Get the list of app-only tools
 */
export function getAppOnlyTools(): string[] {
  return [];
}
