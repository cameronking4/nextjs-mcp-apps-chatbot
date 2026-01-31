/**
 * Generative UI System
 * 
 * Dynamically generates interactive HTML UIs using LLMs based on specifications.
 * This enables just-in-time UI generation without predefined templates.
 */

import { generateText } from "ai";
import { getArtifactModel } from "@/lib/ai/providers";

/**
 * UI Component Specification
 */
export interface UIComponentSpec {
  type: "button" | "input" | "select" | "textarea" | "card" | "list" | "form" | "custom";
  id?: string;
  label?: string;
  placeholder?: string;
  options?: Array<{ id: string; label: string }>;
  required?: boolean;
  validation?: string;
  [key: string]: unknown;
}

/**
 * UI Specification for generation
 */
export interface UISpecification {
  title?: string;
  description: string;
  components?: UIComponentSpec[];
  data?: Record<string, unknown>;
  layout?: "card" | "form" | "list" | "custom";
  actions?: Array<{
    id: string;
    label: string;
    type?: "submit" | "cancel" | "custom";
  }>;
  initialHeight?: number;
  resizable?: boolean;
}

/**
 * Storage for generated UIs
 * Maps URI -> HTML content
 */
const generatedUIStore = new Map<string, { html: string; createdAt: number; spec: UISpecification }>();

/**
 * Generate a unique URI for a generated UI
 */
function generateUIUri(spec: UISpecification): string {
  const hash = spec.description.slice(0, 50).replace(/[^a-z0-9]/gi, "").toLowerCase();
  const timestamp = Date.now();
  return `ui://generative/${hash}-${timestamp}`;
}

/**
 * Generate HTML UI from specification using LLM
 */
export async function generateUIFromSpec(spec: UISpecification): Promise<string> {
  const model = getArtifactModel();
  
  const systemPrompt = `You are an expert UI generator that creates interactive HTML interfaces for MCP Apps.

Your task is to generate a complete, self-contained HTML document that:
1. Implements the requested UI specification
2. Uses modern CSS with CSS variables for theming (light/dark mode)
3. Includes JavaScript for interactivity
4. Follows MCP App communication patterns (postMessage to parent)
5. Is accessible and follows best practices
6. Uses the shadcn/ui design system color scheme

IMPORTANT REQUIREMENTS:
- Use CSS variables for colors (--background, --foreground, --primary, etc.) matching shadcn/ui
- Support dark mode via \`body.dark\` class or \`@media (prefers-color-scheme: dark)\`
- Include JavaScript that listens for \`mcp:toolInput\` and \`mcp:toolResult\` messages
- Send user interactions via \`window.parent.postMessage({ type: 'mcp:sendMessage', payload: { text: ... } }, '*')\`
- Report height changes via \`window.parent.postMessage({ type: 'mcp:sizeChange', payload: { height: ... } }, '*')\`
- Signal ready with \`window.parent.postMessage({ type: 'mcp:ready' }, '*')\`
- Listen for theme updates via \`mcp:hostContext\` messages
- Make the UI responsive and accessible
- Use semantic HTML elements
- Include proper ARIA labels where needed

The UI should be production-ready, polished, and match modern design standards.`;

  const userPrompt = `Generate an interactive HTML UI with the following specification:

${JSON.stringify(spec, null, 2)}

Requirements:
- Create a complete HTML document with <!DOCTYPE html>
- Include embedded CSS in <style> tag
- Include embedded JavaScript in <script> tag
- Make it interactive based on the components specified
- Style it beautifully using the shadcn/ui color scheme
- Ensure it communicates with the parent window via postMessage
- Make it responsive and accessible

Generate ONLY the HTML code, no markdown formatting or code fences.`;

  try {
    const { text } = await generateText({
      model,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
      maxTokens: 8000,
    });

    // Extract HTML if wrapped in markdown code blocks
    let html = text.trim();
    if (html.startsWith("```html")) {
      html = html.replace(/^```html\n?/, "").replace(/\n?```$/, "");
    } else if (html.startsWith("```")) {
      html = html.replace(/^```\n?/, "").replace(/\n?```$/, "");
    }

    return html.trim();
  } catch (error) {
    console.error("Error generating UI:", error);
    throw new Error(`Failed to generate UI: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Generate and store a UI from specification
 * Returns the URI for the generated UI
 */
export async function generateAndStoreUI(spec: UISpecification): Promise<string> {
  const html = await generateUIFromSpec(spec);
  const uri = generateUIUri(spec);
  
  generatedUIStore.set(uri, {
    html,
    createdAt: Date.now(),
    spec,
  });

  // Clean up old UIs (older than 1 hour) to prevent memory leaks
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [key, value] of generatedUIStore.entries()) {
    if (value.createdAt < oneHourAgo) {
      generatedUIStore.delete(key);
    }
  }

  return uri;
}

/**
 * Get stored UI HTML by URI
 */
export function getGeneratedUI(uri: string): string | null {
  const stored = generatedUIStore.get(uri);
  return stored?.html ?? null;
}

/**
 * Check if a URI is a generated UI
 */
export function isGeneratedUI(uri: string): boolean {
  return uri.startsWith("ui://generative/");
}
