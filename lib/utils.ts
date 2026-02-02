import type {
  AssistantModelMessage,
  ToolModelMessage,
  UIMessage,
  UIMessagePart,
} from 'ai';
import { type ClassValue, clsx } from 'clsx';
import { formatISO } from 'date-fns';
import { twMerge } from 'tailwind-merge';
import type { DBMessage, Document } from '@/lib/db/schema';
import { ChatSDKError, type ErrorCode } from './errors';
import type { ChatMessage, ChatTools, CustomUIDataTypes } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const fetcher = async (url: string) => {
  const response = await fetch(url);

  if (!response.ok) {
    const { code, cause } = await response.json();
    throw new ChatSDKError(code as ErrorCode, cause);
  }

  return response.json();
};

export async function fetchWithErrorHandlers(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  try {
    const response = await fetch(input, init);

    if (!response.ok) {
      const { code, cause } = await response.json();
      throw new ChatSDKError(code as ErrorCode, cause);
    }

    return response;
  } catch (error: unknown) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new ChatSDKError('offline:chat');
    }

    throw error;
  }
}

export function getLocalStorage(key: string) {
  if (typeof window !== 'undefined') {
    return JSON.parse(localStorage.getItem(key) || '[]');
  }
  return [];
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

type ResponseMessageWithoutId = ToolModelMessage | AssistantModelMessage;
type ResponseMessage = ResponseMessageWithoutId & { id: string };

export function getMostRecentUserMessage(messages: UIMessage[]) {
  const userMessages = messages.filter((message) => message.role === 'user');
  return userMessages.at(-1);
}

export function getDocumentTimestampByIndex(
  documents: Document[],
  index: number,
) {
  if (!documents) { return new Date(); }
  if (index > documents.length) { return new Date(); }

  return documents[index].createdAt;
}

export function getTrailingMessageId({
  messages,
}: {
  messages: ResponseMessage[];
}): string | null {
  const trailingMessage = messages.at(-1);

  if (!trailingMessage) { return null; }

  return trailingMessage.id;
}

export function sanitizeText(text: string) {
  return text.replace('<has_function_call>', '');
}

export function convertToUIMessages(messages: DBMessage[]): ChatMessage[] {
  return messages.map((message) => ({
    id: message.id,
    role: message.role as 'user' | 'assistant' | 'system',
    parts: message.parts as UIMessagePart<CustomUIDataTypes, ChatTools>[],
    metadata: {
      createdAt: formatISO(message.createdAt),
    },
  }));
}

export function getTextFromMessage(message: ChatMessage | UIMessage): string {
  return message.parts
    .filter((part) => part.type === 'text')
    .map((part) => (part as { type: 'text'; text: string}).text)
    .join('');
}

/**
 * Parsed answer from a questionnaire response
 */
export interface ParsedQuestionnaireAnswer {
  question: string;
  answer: string;
  isSkipped: boolean;
  isOther: boolean;
}

/**
 * Detects and parses questionnaire answers from a message text.
 * Returns null if the text doesn't match the expected format.
 */
export function parseQuestionnaireAnswers(text: string): ParsedQuestionnaireAnswer[] | null {
  const trimmedText = text.trim();
  
  // Check if the message starts with the questionnaire answer header
  if (!trimmedText.startsWith('Here are my answers to your questions:')) {
    return null;
  }
  
  // Parse "- Question: Answer" lines
  const lines = trimmedText.split('\n').filter(line => line.trim().startsWith('- '));
  
  if (lines.length === 0) {
    return null;
  }
  
  return lines.map(line => {
    // Remove the leading "- " and trim
    const content = line.trim().slice(2);
    
    // Split on first ": " to separate question from answer
    const colonIndex = content.indexOf(': ');
    
    if (colonIndex === -1) {
      return {
        question: content,
        answer: '',
        isSkipped: true,
        isOther: false,
      };
    }
    
    const question = content.slice(0, colonIndex);
    const answer = content.slice(colonIndex + 2);
    
    return {
      question,
      answer,
      isSkipped: answer === '(Skipped)',
      isOther: answer.startsWith('Other: '),
    };
  });
}
