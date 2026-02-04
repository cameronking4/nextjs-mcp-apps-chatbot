import { simulateReadableStream } from "ai";
import { MockLanguageModelV3 } from "ai/test";
import { getResponseChunksByPrompt } from "@/tests/prompts/utils";

const mockUsage = {
  inputTokens: { total: 10, noCache: 10, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 20, text: 20, reasoning: 0 },
};

const finishReason = "stop" as const;

const makeGenerateResult = (text: string) =>
  ({
    finishReason,
    usage: mockUsage,
    content: [{ type: "text", text }],
    warnings: [],
  }) as any;

export const chatModel = new MockLanguageModelV3({
  doGenerate: async () => makeGenerateResult("Hello, world!"),
  doStream: async ({ prompt }) =>
    ({
      stream: simulateReadableStream({
        chunkDelayInMs: 500,
        initialDelayInMs: 1000,
        chunks: getResponseChunksByPrompt(prompt),
      }),
    }) as any,
});

export const reasoningModel = new MockLanguageModelV3({
  doGenerate: async () => makeGenerateResult("Hello, world!"),
  doStream: async ({ prompt }) =>
    ({
      stream: simulateReadableStream({
        chunkDelayInMs: 500,
        initialDelayInMs: 1000,
        chunks: getResponseChunksByPrompt(prompt, true),
      }),
    }) as any,
});

export const titleModel = new MockLanguageModelV3({
  doGenerate: async () => makeGenerateResult("This is a test title"),
  doStream: async () =>
    ({
      stream: simulateReadableStream({
      chunkDelayInMs: 500,
      initialDelayInMs: 1000,
      chunks: [
        { id: "1", type: "text-start" },
        { id: "1", type: "text-delta", delta: "This is a test title" },
        { id: "1", type: "text-end" },
        {
          type: "finish",
          finishReason,
          usage: mockUsage,
        },
      ],
      }),
    }) as any,
});

export const artifactModel = new MockLanguageModelV3({
  doGenerate: async () => makeGenerateResult("Hello, world!"),
  doStream: async ({ prompt }) =>
    ({
      stream: simulateReadableStream({
        chunkDelayInMs: 50,
        initialDelayInMs: 100,
        chunks: getResponseChunksByPrompt(prompt),
      }),
    }) as any,
});
