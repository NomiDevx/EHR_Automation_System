export type ConversationNode =
  | 'GREET'
  | 'VERIFY_PATIENT'
  | 'COLLECT_INFO'
  | 'CHOOSE_TYPE'
  | 'CHOOSE_DOCTOR'
  | 'CHOOSE_SLOT'
  | 'CONFIRM'
  | 'BOOK'
  | 'DONE'
  | 'HUMAN_HANDOFF'
  | 'EMAIL_CHECK'
  | 'CHECK_UPCOMING'
  | 'RESCHEDULE'
  | 'CANCEL'
  | 'SYSTEM_INFO'
  | 'DOCTOR_INFO'
  | 'PATIENT_HISTORY'
  | 'ERROR';

export type AppointmentType =
  | 'new_patient'
  | 'follow_up'
  | 'urgent'
  | 'telehealth'
  | 'wellness';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AgentState {
  session_id: string;
  user_id?: string;
  patient_id?: string;
  patient_name?: string;
  patient_dob?: string;

  appointment_type?: AppointmentType;
  provider_id?: string;
  provider_name?: string;
  chosen_slot?: string;

  available_slots?: string[];

  confirmed?: boolean;
  appointment_id?: string;
  reschedule_appointment_id?: string;

  current_node: ConversationNode;
  reply: string;
  options: string[];

  messages: ChatMessage[];
}

export interface TurnOutput {
  reply: string;
  options?: string[];
  advance?: boolean;
  patient_name?: string;
  patient_dob?: string;
  appointment_type?: string;
  provider_id?: string;
  chosen_slot?: string;
  confirmed?: boolean;
}
