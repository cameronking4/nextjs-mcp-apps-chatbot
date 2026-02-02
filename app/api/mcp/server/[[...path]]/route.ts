/**
 * MCP Server API Route
 *
 * Exposes interactive MCP tools with UI resources:
 * - ask-user-questions: Multiple-choice questions for user input
 * - task-orchestrator: Hierarchical task management for multi-step workflows
 * - generate-ui: Dynamically generate interactive UIs on-demand using LLMs (generative UX)
 */

import { NextResponse } from "next/server";
import { getAskUserQuestionsViewHtml } from "@/lib/mcp/demo-server/ui/ask-user-questions-view";
import { getTaskOrchestratorViewHtml } from "@/lib/mcp/demo-server/ui/task-orchestrator-view";
import {
  getOrCreateOrchestrator,
  type TaskStatus,
} from "@/lib/mcp/demo-server/task-orchestrator";
import {
  generateAndStoreUI,
  getGeneratedUI,
  isGeneratedUI,
  type UISpecification,
} from "@/lib/mcp/demo-server/ui/generative-ui";

const SERVER_INFO = {
  name: "demo-mcp-server",
  version: "1.0.0",
};

const PROTOCOL_VERSION = "2024-11-05";

const TOOLS = [
  {
    name: "ask-user-questions",
    description:
      "Ask the user multiple-choice questions and wait for their response. Each question can have 1-5 options, and an 'Other' option with text input is automatically added for custom responses.",
    inputSchema: {
      type: "object",
      properties: {
        questions: {
          type: "array",
          minItems: 1,
          description: "Array of questions to ask the user",
          items: {
            type: "object",
            properties: {
              id: { type: "string", description: "Unique identifier for the question" },
              text: { type: "string", description: "The question text to display" },
              options: {
                type: "array",
                minItems: 1,
                maxItems: 5,
                description: "Available answer options (an 'Other' option is automatically added)",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string", description: "Option identifier (e.g., 'A', 'B', 'C')" },
                    label: { type: "string", description: "Option display text" },
                  },
                  required: ["id", "label"],
                },
              },
            },
            required: ["id", "text", "options"],
          },
        },
      },
      required: ["questions"],
    },
    _meta: {
      ui: {
        resourceUri: "ui://demo/ask-user-questions",
        initialHeight: 420,
        resizable: false,
      },
    },
  },
  // Task Orchestrator - Creates and displays a task plan widget (use ONCE to create a plan)
  {
    name: "task-orchestrator",
    description:
      "Create and display a hierarchical task plan for complex, multi-step workflows. Use this tool ONCE at the start to create a plan with a root goal. The plan widget will be displayed to the user and will automatically update as you use task-add and task-update tools. Do NOT call this tool multiple times - use task-add and task-update instead to modify the plan.",
    inputSchema: {
      type: "object",
      properties: {
        chatId: {
          type: "string",
          description: "Optional chat ID to scope the plan. If not provided, uses a shared default plan.",
        },
        rootGoal: {
          type: "string",
          description: "The root goal for the plan (required)",
        },
      },
      required: ["rootGoal"],
    },
    _meta: {
      ui: {
        resourceUri: "ui://demo/task-orchestrator",
        initialHeight: 400,
        resizable: true,
      },
    },
  },
  // Task Add - Adds a task to the existing plan (no UI rendered)
  {
    name: "task-add",
    description:
      "Add a task to an existing task plan. The task orchestrator widget will automatically update to show the new task. Use this after creating a plan with task-orchestrator.",
    inputSchema: {
      type: "object",
      properties: {
        chatId: {
          type: "string",
          description: "Optional chat ID to scope the plan. Must match the chatId used when creating the plan.",
        },
        taskId: {
          type: "string",
          description: "Unique identifier for the task",
        },
        title: {
          type: "string",
          description: "Task title",
        },
        description: {
          type: "string",
          description: "Task description (optional)",
        },
        parentId: {
          type: "string",
          description: "Parent task ID to create a subtask (optional)",
        },
        status: {
          type: "string",
          enum: ["pending", "in_progress", "completed", "failed", "skipped"],
          description: "Initial task status (default: pending)",
        },
      },
      required: ["taskId", "title"],
    },
    // No _meta.ui - this tool does NOT render a widget
  },
  // Task Update - Updates an existing task (no UI rendered)
  {
    name: "task-update",
    description:
      "Update an existing task's status, notes, or result. The task orchestrator widget will automatically update to reflect changes. Use this to mark tasks as in_progress, completed, failed, or skipped.",
    inputSchema: {
      type: "object",
      properties: {
        chatId: {
          type: "string",
          description: "Optional chat ID to scope the plan. Must match the chatId used when creating the plan.",
        },
        taskId: {
          type: "string",
          description: "The ID of the task to update",
        },
        status: {
          type: "string",
          enum: ["pending", "in_progress", "completed", "failed", "skipped"],
          description: "New task status",
        },
        notes: {
          type: "string",
          description: "Additional notes for the task",
        },
        result: {
          type: "string",
          description: "Result or output of the task",
        },
        title: {
          type: "string",
          description: "Updated task title (optional)",
        },
        description: {
          type: "string",
          description: "Updated task description (optional)",
        },
      },
      required: ["taskId"],
    },
    // No _meta.ui - this tool does NOT render a widget
  },
  // Task Status - App-only tool for widget polling (hidden from LLM)
  {
    name: "task-status",
    description:
      "Get the current status of the task plan. This is an app-only tool used by the task orchestrator widget to poll for updates.",
    inputSchema: {
      type: "object",
      properties: {
        chatId: {
          type: "string",
          description: "Optional chat ID to scope the plan.",
        },
      },
      required: [],
    },
    _meta: {
      ui: {
        visibility: ["app"], // App-only - hidden from LLM tool list
      },
    },
  },
  // Generative UI Tool
  {
    name: "generate-ui",
    description:
      "Generate an interactive UI on-demand based on a specification. This tool uses AI to create custom HTML interfaces just-in-time, enabling dynamic UX generation without predefined templates. Perfect for creating forms, dashboards, data visualizations, or any custom interactive interface.",
    inputSchema: {
      type: "object",
      properties: {
        description: {
          type: "string",
          description:
            "A detailed description of the UI to generate. Describe the purpose, components, layout, and behavior.",
        },
        title: {
          type: "string",
          description: "Optional title for the UI",
        },
        components: {
          type: "array",
          description:
            "Optional array of component specifications (buttons, inputs, selects, etc.)",
          items: {
            type: "object",
            properties: {
              type: {
                type: "string",
                enum: [
                  "button",
                  "input",
                  "select",
                  "textarea",
                  "card",
                  "list",
                  "form",
                  "custom",
                ],
                description: "Type of component",
              },
              id: {
                type: "string",
                description: "Unique identifier for the component",
              },
              label: {
                type: "string",
                description: "Label text for the component",
              },
              placeholder: {
                type: "string",
                description: "Placeholder text (for inputs)",
              },
              options: {
                type: "array",
                description: "Options for select components",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    label: { type: "string" },
                  },
                },
              },
            },
          },
        },
        data: {
          type: "object",
          description: "Optional initial data to display in the UI",
        },
        layout: {
          type: "string",
          enum: ["card", "form", "list", "custom"],
          description: "Layout style for the UI",
        },
        actions: {
          type: "array",
          description: "Optional action buttons (submit, cancel, etc.)",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              label: { type: "string" },
              type: {
                type: "string",
                enum: ["submit", "cancel", "custom"],
              },
            },
          },
        },
        initialHeight: {
          type: "number",
          description: "Optional initial height in pixels (default: 400)",
        },
        resizable: {
          type: "boolean",
          description: "Whether the UI should be resizable (default: true)",
        },
      },
      required: ["description"],
    },
  },
];

const RESOURCES = [
  {
    uri: "ui://demo/ask-user-questions",
    name: "ask-user-questions.html",
    mimeType: "text/html",
  },
  {
    uri: "ui://demo/task-orchestrator",
    name: "task-orchestrator.html",
    mimeType: "text/html",
  },
];

interface Question {
  id: string;
  text: string;
  options: Array<{ id: string; label: string }>;
}

function normalizeQuestions(raw: unknown): Question[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const normalized: Question[] = [];
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      continue;
    }
    const question = item as Record<string, unknown>;
    
    // More flexible field matching - try multiple field names
    const id = typeof question.id === "string" ? question.id : 
               typeof question.questionId === "string" ? question.questionId : 
               `q${i + 1}`;
    const text = typeof question.text === "string" ? question.text : 
                 typeof question.question === "string" ? question.question :
                 typeof question.prompt === "string" ? question.prompt : "";
    
    const optionsRaw = Array.isArray(question.options) ? question.options : 
                       Array.isArray(question.choices) ? question.choices : [];
    const options: Array<{ id: string; label: string }> = [];

    for (let j = 0; j < optionsRaw.length; j++) {
      const opt = optionsRaw[j];
      
      // Handle string options (convert to { id, label })
      if (typeof opt === "string") {
        const letter = String.fromCharCode(65 + j); // A, B, C, D...
        options.push({ id: letter, label: opt });
        continue;
      }
      
      if (!opt || typeof opt !== "object" || Array.isArray(opt)) continue;
      const optObj = opt as Record<string, unknown>;
      
      // More flexible option field matching
      const optId = typeof optObj.id === "string" ? optObj.id : 
                    typeof optObj.value === "string" ? optObj.value :
                    String.fromCharCode(65 + j); // A, B, C, D...
      const label = typeof optObj.label === "string" ? optObj.label : 
                    typeof optObj.text === "string" ? optObj.text :
                    typeof optObj.value === "string" ? optObj.value : "";
      
      if (label) {
        options.push({ id: optId, label });
      }
    }

    if (text && options.length > 0) {
      normalized.push({ id, text, options });
    }
  }

  return normalized;
}

async function executeTool(
  name: string,
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: string; text: string }>; _meta?: unknown }> {
  switch (name) {
    case "ask-user-questions": {
      const questions = normalizeQuestions(args.questions);

      if (questions.length === 0) {
        throw new Error("Invalid questions input. Please provide at least one question with options.");
      }

      return {
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
      };
    }

    case "task-orchestrator": {
      // task-orchestrator now ONLY creates a plan and renders the widget ONCE
      const chatId = args.chatId as string | undefined;
      const rootGoal = args.rootGoal as string;

      if (!rootGoal) {
        throw new Error("task-orchestrator requires rootGoal parameter");
      }

      const orchestrator = getOrCreateOrchestrator(chatId);
      const plan = orchestrator.createPlan(rootGoal);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              action: "create_plan",
              message: `Plan created with goal: "${rootGoal}". The task orchestrator widget is now displayed. Use task-add to add tasks and task-update to update their status. The widget will automatically refresh to show changes.`,
              chatId: chatId ?? "default",
              plan,
            }),
          },
        ],
        _meta: {
          ui: {
            resourceUri: "ui://demo/task-orchestrator",
            initialHeight: 400,
            resizable: true,
          },
        },
      };
    }

    case "task-add": {
      // Add a task - NO UI rendered, widget polls for updates
      const chatId = args.chatId as string | undefined;
      const taskId = args.taskId as string;
      const title = args.title as string;

      if (!taskId || !title) {
        throw new Error("task-add requires taskId and title parameters");
      }

      const orchestrator = getOrCreateOrchestrator(chatId);
      const plan = orchestrator.addTask({
        id: taskId,
        title,
        description: args.description as string | undefined,
        parentId: args.parentId as string | undefined,
        status: (args.status as TaskStatus) || "pending",
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              action: "add_task",
              message: `Task "${title}" added to plan`,
              taskId,
              plan,
            }),
          },
        ],
        // NO _meta.ui - this does NOT render a new widget
      };
    }

    case "task-update": {
      // Update a task - NO UI rendered, widget polls for updates
      const chatId = args.chatId as string | undefined;
      const taskId = args.taskId as string;

      if (!taskId) {
        throw new Error("task-update requires taskId parameter");
      }

      const orchestrator = getOrCreateOrchestrator(chatId);
      const plan = orchestrator.updateTask({
        id: taskId,
        status: args.status as TaskStatus | undefined,
        notes: args.notes as string | undefined,
        result: args.result as string | undefined,
        title: args.title as string | undefined,
        description: args.description as string | undefined,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              action: "update_task",
              message: `Task "${taskId}" updated`,
              taskId,
              plan,
            }),
          },
        ],
        // NO _meta.ui - this does NOT render a new widget
      };
    }

    case "task-status": {
      // App-only tool for widget polling - returns current plan state
      const chatId = args.chatId as string | undefined;
      const orchestrator = getOrCreateOrchestrator(chatId);
      const plan = orchestrator.getPlan();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              action: "get_status",
              message: plan.rootGoal
                ? `Plan: "${plan.rootGoal}" - ${plan.completedCount}/${plan.totalCount} tasks complete`
                : "No plan exists yet.",
              plan,
            }),
          },
        ],
        // NO _meta.ui - this is for polling only
      };
    }

    case "generate-ui": {
      const description = args.description as string;
      if (!description) {
        throw new Error("generate-ui requires description parameter");
      }

      const spec: UISpecification = {
        description,
        title: args.title as string | undefined,
        components: args.components as UISpecification["components"],
        data: args.data as Record<string, unknown> | undefined,
        layout: args.layout as UISpecification["layout"],
        actions: args.actions as UISpecification["actions"],
        initialHeight: (args.initialHeight as number | undefined) ?? 400,
        resizable: (args.resizable as boolean | undefined) ?? true,
      };

      try {
        const resourceUri = await generateAndStoreUI(spec);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                status: "ui_generated",
                message: `Generated interactive UI: ${spec.title || "Custom Interface"}`,
                resourceUri,
                spec: {
                  title: spec.title,
                  description: spec.description,
                  layout: spec.layout,
                },
              }),
            },
          ],
          _meta: {
            ui: {
              resourceUri,
              initialHeight: spec.initialHeight,
              resizable: spec.resizable,
            },
          },
        };
      } catch (error) {
        throw new Error(
          `Failed to generate UI: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function readResource(uri: string): {
  contents: Array<{ uri: string; mimeType: string; text: string }>;
} {
  // Check if it's a generated UI
  if (isGeneratedUI(uri)) {
    const html = getGeneratedUI(uri);
    if (!html) {
      throw new Error(`Generated UI not found: ${uri}`);
    }
    return {
      contents: [
        {
          uri,
          mimeType: "text/html",
          text: html,
        },
      ],
    };
  }

  // Handle predefined resources
  switch (uri) {
    case "ui://demo/ask-user-questions":
      return {
        contents: [
          {
            uri,
            mimeType: "text/html",
            text: getAskUserQuestionsViewHtml(),
          },
        ],
      };
    case "ui://demo/task-orchestrator":
      return {
        contents: [
          {
            uri,
            mimeType: "text/html",
            text: getTaskOrchestratorViewHtml(),
          },
        ],
      };
    default:
      throw new Error(`Unknown resource: ${uri}`);
  }
}

async function handleJsonRpcRequest(request: {
  jsonrpc: string;
  id?: string | number;
  method: string;
  params?: Record<string, unknown>;
}): Promise<{
  jsonrpc: string;
  id?: string | number;
  result?: unknown;
  error?: { code: number; message: string };
}> {
  const { id, method, params } = request;

  try {
    switch (method) {
      case "initialize":
        return {
          jsonrpc: "2.0",
          id,
          result: {
            protocolVersion: PROTOCOL_VERSION,
            serverInfo: SERVER_INFO,
            capabilities: {
              tools: {},
              resources: {},
            },
          },
        };
      case "tools/list": {
        // Filter out app-only tools (those with visibility: ["app"])
        // These are only callable by the widget, not the LLM
        const llmVisibleTools = TOOLS.filter((tool) => {
          const visibility = (tool as { _meta?: { ui?: { visibility?: string[] } } })._meta?.ui?.visibility;
          // If visibility is defined and only includes "app", hide from LLM
          if (visibility && visibility.length === 1 && visibility[0] === "app") {
            return false;
          }
          return true;
        });
        return {
          jsonrpc: "2.0",
          id,
          result: { tools: llmVisibleTools },
        };
      }
      case "tools/call": {
        const toolParams = params as {
          name: string;
          arguments?: Record<string, unknown>;
        };
        const result = await executeTool(toolParams.name, toolParams.arguments ?? {});
        return {
          jsonrpc: "2.0",
          id,
          result,
        };
      }
      case "resources/list":
        return {
          jsonrpc: "2.0",
          id,
          result: { resources: RESOURCES },
        };
      case "resources/read": {
        const resourceParams = params as { uri: string };
        const result = readResource(resourceParams.uri);
        return {
          jsonrpc: "2.0",
          id,
          result,
        };
      }
      case "ping":
        return {
          jsonrpc: "2.0",
          id,
          result: {},
        };
      default:
        return {
          jsonrpc: "2.0",
          id,
          error: {
            code: -32_601,
            message: `Method not found: ${method}`,
          },
        };
    }
  } catch (caughtError) {
    return {
      jsonrpc: "2.0",
      id,
      error: {
        code: -32_603,
        message:
          caughtError instanceof Error ? caughtError.message : "Internal error",
      },
    };
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (Array.isArray(body)) {
      const responses = await Promise.all(body.map(handleJsonRpcRequest));
      return NextResponse.json(responses);
    }

    const response = await handleJsonRpcRequest(body);
    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        error: {
          code: -32_700,
          message: "Parse error",
        },
        id: null,
      },
      { status: 400 }
    );
  }
}

export function GET() {
  return NextResponse.json({
    name: SERVER_INFO.name,
    version: SERVER_INFO.version,
    status: "running",
    capabilities: ["tools", "resources"],
    description: "MCP server with ask-user-questions and task-orchestrator tools",
  });
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
