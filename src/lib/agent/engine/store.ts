import { AgentState } from './types';

const sessionStore = new Map<string, AgentState>();

export function getInitialState(sessionId: string, userId?: string): AgentState {
  return {
    session_id: sessionId,
    user_id: userId,
    reply: '',
    options: [],
    messages: [],
  };
}

export function getSessionState(sessionId: string, userId?: string): AgentState {
  let state = sessionStore.get(sessionId);
  if (!state) {
    state = getInitialState(sessionId, userId);
    sessionStore.set(sessionId, state);
  } else if (userId && !state.user_id) {
    state.user_id = userId;
  }
  return state;
}

export function saveSessionState(sessionId: string, state: AgentState): void {
  sessionStore.set(sessionId, state);
}

export function clearSessionState(sessionId: string): void {
  sessionStore.delete(sessionId);
}
