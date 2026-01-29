/**
 * MCP Server API Route
 *
 * Exposes interactive MCP tools with UI resources:
 * - ask-user-questions: Multiple-choice questions for user input
 * - task-orchestrator: Hierarchical task management for multi-step workflows
 */

import { NextResponse } from "next/server";
import { getAskUserQuestionsViewHtml } from "@/lib/mcp/demo-server/ui/ask-user-questions-view";
import { getTaskOrchestratorViewHtml } from "@/lib/mcp/demo-server/ui/task-orchestrator-view";
import {
  getOrCreateOrchestrator,
  type TaskStatus,
} from "@/lib/mcp/demo-server/task-orchestrator";

const SERVER_INFO = {
  name: "demo-mcp-server",
  version: "1.0.0",
};

const PROTOCOL_VERSION = "2024-11-05";

const TOOLS = [
  {
    name: "ask-user-questions",
    description:
      "Ask the user multiple-choice questions and wait for their response. Each question can have 1-6 options. Users can also provide an 'Other' text response.",
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
                maxItems: 6,
                description: "Available answer options",
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
  // Task Orchestrator Tools
  {
    name: "task-orchestrator",
    description:
      "Manage a hierarchical task plan for complex, multi-step workflows. Use action 'create_plan' to start a new plan with a root goal, 'add_task' to add subtasks, 'update_task' to change task status/notes/results, and 'get_plan' to retrieve current state. The plan is displayed to the user with a visual progress tracker.",
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["create_plan", "add_task", "update_task", "get_plan"],
          description: "The action to perform on the task plan",
        },
        chatId: {
          type: "string",
          description: "Optional chat ID to scope the plan. If not provided, uses a shared default plan.",
        },
        // create_plan params
        rootGoal: {
          type: "string",
          description: "The root goal for the plan (required for create_plan action)",
        },
        // add_task params
        taskId: {
          type: "string",
          description: "Unique identifier for the task (required for add_task and update_task)",
        },
        title: {
          type: "string",
          description: "Task title (required for add_task, optional for update_task)",
        },
        description: {
          type: "string",
          description: "Task description (optional)",
        },
        parentId: {
          type: "string",
          description: "Parent task ID to create a subtask (optional for add_task)",
        },
        // update_task params
        status: {
          type: "string",
          enum: ["pending", "in_progress", "completed", "failed", "skipped"],
          description: "Task status (optional for add_task, commonly used with update_task)",
        },
        notes: {
          type: "string",
          description: "Additional notes for the task (optional for update_task)",
        },
        result: {
          type: "string",
          description: "Result or output of the task (optional for update_task)",
        },
      },
      required: ["action"],
    },
    _meta: {
      ui: {
        resourceUri: "ui://demo/task-orchestrator",
        initialHeight: 400,
        resizable: true,
      },
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

function executeTool(
  name: string,
  args: Record<string, unknown>
): { content: Array<{ type: string; text: string }>; _meta?: unknown } {
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
      const action = args.action as string;
      const chatId = args.chatId as string | undefined;

      if (!action) {
        throw new Error("Missing required parameter: action");
      }

      const orchestrator = getOrCreateOrchestrator(chatId);

      switch (action) {
        case "create_plan": {
          const rootGoal = args.rootGoal as string;
          if (!rootGoal) {
            throw new Error("create_plan requires rootGoal parameter");
          }
          const plan = orchestrator.createPlan(rootGoal);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  action: "create_plan",
                  message: `Plan created with goal: "${rootGoal}"`,
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

        case "add_task": {
          const taskId = args.taskId as string;
          const title = args.title as string;
          if (!taskId || !title) {
            throw new Error("add_task requires taskId and title parameters");
          }
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
                  message: `Task "${title}" added`,
                  taskId,
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

        case "update_task": {
          const taskId = args.taskId as string;
          if (!taskId) {
            throw new Error("update_task requires taskId parameter");
          }
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
            _meta: {
              ui: {
                resourceUri: "ui://demo/task-orchestrator",
                initialHeight: 400,
                resizable: true,
              },
            },
          };
        }

        case "get_plan": {
          const plan = orchestrator.getPlan();
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  action: "get_plan",
                  message: plan.rootGoal
                    ? `Plan: "${plan.rootGoal}" - ${plan.completedCount}/${plan.totalCount} tasks complete`
                    : "No plan exists yet. Use create_plan to start.",
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

        default:
          throw new Error(`Unknown task-orchestrator action: ${action}`);
      }
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function readResource(uri: string): {
  contents: Array<{ uri: string; mimeType: string; text: string }>;
} {
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

function handleJsonRpcRequest(request: {
  jsonrpc: string;
  id?: string | number;
  method: string;
  params?: Record<string, unknown>;
}): {
  jsonrpc: string;
  id?: string | number;
  result?: unknown;
  error?: { code: number; message: string };
} {
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
      case "tools/list":
        return {
          jsonrpc: "2.0",
          id,
          result: { tools: TOOLS },
        };
      case "tools/call": {
        const toolParams = params as {
          name: string;
          arguments?: Record<string, unknown>;
        };
        const result = executeTool(toolParams.name, toolParams.arguments ?? {});
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
      const responses = body.map(handleJsonRpcRequest);
      return NextResponse.json(responses);
    }

    const response = handleJsonRpcRequest(body);
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
