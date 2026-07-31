const SESSION_STORAGE_KEY = 'ehr_agent_session_id';

/**
 * Returns the persisted session ID, creating and storing a new UUID on first visit.
 * Session survives page refresh so the external agent can continue the conversation.
 */
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  const existing = localStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const sessionId = crypto.randomUUID();
  localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  return sessionId;
}
