import { AgentApiError, type AgentChatRequest, type AgentChatResponse } from './types';

function getAgentApiUrl(): string {
  const url = process.env.NEXT_PUBLIC_AGENT_API_URL;
  if (!url) {
    throw new AgentApiError(
      'The appointment assistant is not configured. Please contact the clinic.',
      'CONFIG',
    );
  }
  return url.replace(/\/$/, '');
}

function parseAgentResponse(data: unknown): AgentChatResponse {
  if (
    typeof data !== 'object' ||
    data === null ||
    typeof (data as AgentChatResponse).reply !== 'string' ||
    typeof (data as AgentChatResponse).current_node !== 'string' ||
    !Array.isArray((data as AgentChatResponse).options)
  ) {
    throw new AgentApiError('Received an unexpected response from the assistant.', 'PARSE');
  }

  const response = data as AgentChatResponse;
  return {
    reply: response.reply,
    current_node: response.current_node,
    options: response.options.filter((option): option is string => typeof option === 'string'),
  };
}

/**
 * External agent API connection point.
 * Sends the user's message to the FastAPI backend at POST {NEXT_PUBLIC_AGENT_API_URL}/chat.
 */
export async function sendAgentMessage(
  sessionId: string,
  message: string,
  userId?: string,
): Promise<AgentChatResponse> {
  const baseUrl = getAgentApiUrl();
  const body: AgentChatRequest = { session_id: sessionId, message, user_id: userId };

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AgentApiError(
      'Unable to reach the appointment assistant. Please check your connection and try again.',
      'NETWORK',
    );
  }

  if (!response.ok) {
    throw new AgentApiError(
      'The appointment assistant encountered a problem. Please try again.',
      'HTTP',
      response.status,
    );
  }

  try {
    const data: unknown = await response.json();
    return parseAgentResponse(data);
  } catch (error) {
    if (error instanceof AgentApiError) {
      throw error;
    }
    throw new AgentApiError('Received an unexpected response from the assistant.', 'PARSE');
  }
}
