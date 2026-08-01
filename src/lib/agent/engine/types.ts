export interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  tool_call_id?: string;
  name?: string;
}

export interface AgentState {
  session_id: string;
  user_id?: string;
  patient_id?: string;
  patient_name?: string;
  patient_dob?: string;
  messages: ChatMessage[];
  reply: string;
  options: string[];
}

export interface AgentTurnResult {
  reply: string;
  options: string[];
}

export type AppointmentType =
  | 'new_patient'
  | 'follow_up'
  | 'urgent'
  | 'telehealth'
  | 'wellness';
