import Groq from 'groq-sdk';
import { ChatMessage } from './types';
import { AGENT_TOOLS } from './tool-definitions';

let groqClient: Groq | null = null;

function getGroqClient(): Groq {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY is missing from environment variables.');
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

const MODEL = () => process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

export interface ToolCallRequest {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

export interface AgentLLMResponse {
  reply: string | null;            // null means tool calls are pending
  toolCalls: ToolCallRequest[];    // empty if LLM is done
  rawFinishReason: string;
}

/**
 * Send the conversation history (including any tool results) to the LLM.
 * Returns either tool call requests (LLM wants to call tools) or a final reply.
 */
export async function callLLM(
  systemPrompt: string,
  messages: ChatMessage[],
  useTools = true,
): Promise<AgentLLMResponse> {
  const groq = getGroqClient();

  // Map our ChatMessage to Groq's message format
  const groqMessages = messages.map((m) => {
    if (m.role === 'tool') {
      return {
        role: 'tool' as const,
        content: m.content,
        tool_call_id: m.tool_call_id || 'unknown',
      };
    }
    return {
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    };
  });

  const requestParams: any = {
    model: MODEL(),
    messages: [{ role: 'system', content: systemPrompt }, ...groqMessages],
    temperature: 0.4,
    max_tokens: 1024,
  };

  if (useTools) {
    requestParams.tools = AGENT_TOOLS;
    requestParams.tool_choice = 'auto';
  }

  const response = await groq.chat.completions.create(requestParams);
  const choice = response.choices[0];
  const finishReason = choice.finish_reason || '';
  const msg = choice.message;

  // If LLM chose to call tools
  if (finishReason === 'tool_calls' && msg.tool_calls && msg.tool_calls.length > 0) {
    const toolCalls: ToolCallRequest[] = msg.tool_calls.map((tc) => ({
      id: tc.id,
      name: tc.function.name,
      arguments: (() => {
        try { return JSON.parse(tc.function.arguments || '{}'); }
        catch { return {}; }
      })(),
    }));
    return { reply: null, toolCalls, rawFinishReason: finishReason };
  }

  // LLM produced a final text reply
  const reply = msg.content?.trim() || "I'm here to help. Could you please repeat that?";
  return { reply, toolCalls: [], rawFinishReason: finishReason };
}

/**
 * Build the assistant message to inject into history when the LLM made tool calls.
 * This is required by Groq's API — the assistant's tool-calling turn must appear in history.
 */
export function buildAssistantToolCallMessage(toolCalls: ToolCallRequest[]): any {
  return {
    role: 'assistant',
    content: null,
    tool_calls: toolCalls.map((tc) => ({
      id: tc.id,
      type: 'function',
      function: {
        name: tc.name,
        arguments: JSON.stringify(tc.arguments),
      },
    })),
  };
}
