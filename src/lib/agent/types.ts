/** Request body sent to the external FastAPI agent at POST /chat */
export interface AgentChatRequest {
  session_id: string;
  message: string;
  user_id?: string;
}

/** Response body returned by the external FastAPI agent */
export interface AgentChatResponse {
  reply: string;
  current_node: string;
  options: string[];
}

export type AgentApiErrorCode = 'CONFIG' | 'NETWORK' | 'HTTP' | 'PARSE';

export class AgentApiError extends Error {
  constructor(
    message: string,
    public readonly code: AgentApiErrorCode,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'AgentApiError';
  }
}
