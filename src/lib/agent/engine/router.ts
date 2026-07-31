import { AgentState, ConversationNode } from './types';
import { classifyIntentWithLLM } from './llm';

const RESTART_PHRASES = ['restart', 'start over', 'reset', 'begin again', 'start again'];
const HUMAN_PHRASES = [
  'real person',
  'receptionist',
  'talk to a person',
  'talk to human',
  'talk to someone',
  'speak to receptionist',
  'speak to human',
  'transfer me',
  'operator',
];
const CANCEL_PHRASES = ['cancel appointment', 'cannot make it', "can't make it", 'cancel visit', 'want to cancel'];
const RESCHEDULE_PHRASES = ['reschedule', 'change time', 'change date', 'move appointment', 'change appointment'];
const UPCOMING_PHRASES = [
  'upcoming appointment',
  'next appointment',
  'when is my appointment',
  'view appointment',
  'check my appointment',
];
const PATIENT_HISTORY_PHRASES = [
  'patient info',
  'patient history',
  'patient record',
  'my medical history',
  'my records',
  'my health',
  'my allergies',
  'my conditions',
  'my blood type',
  'tell me about me',
  'info about me',
];
const DOCTOR_INFO_PHRASES = [
  'tell me about the doctor',
  'who are your doctors',
  'list of doctors',
  'doctor profile',
  'about doctor',
  'doctor info',
  'our doctors',
];
const SYSTEM_INFO_PHRASES = [
  'clinic hours',
  'opening hours',
  'what time do you open',
  'where are you located',
  'clinic address',
  'phone number',
  'insurance',
  'parking',
  'cancellation policy',
  'clinic info',
  'about the clinic',
];

// ─── Lab Results ──────────────────────────────────────────────────────────────
const LAB_RESULTS_PHRASES = [
  'lab report',
  'lab reports',
  'lab result',
  'lab results',
  'my labs',
  'blood test',
  'blood results',
  'blood work',
  'test results',
  'my test results',
  'pathology',
  'cholesterol result',
  'glucose result',
  'show my labs',
  'view my labs',
  'check my labs',
  'lab findings',
  'what did my labs say',
  'what were my results',
  'any abnormal',
];

// ─── Medications ──────────────────────────────────────────────────────────────
const MEDICATIONS_PHRASES = [
  'my medication',
  'my medications',
  'my meds',
  'my prescription',
  'my prescriptions',
  'what drugs',
  'what medicine',
  'what am i taking',
  'current medication',
  'active prescription',
  'show my meds',
  'view my meds',
  'drug list',
  'dosage',
  'how many refills',
  'medication list',
  'what medication am i on',
  'medicine i take',
  'medicine i am taking',
];

const BOOKING_FLOW_NODES: ConversationNode[] = [
  'COLLECT_INFO',
  'CHOOSE_TYPE',
  'CHOOSE_DOCTOR',
  'CHOOSE_SLOT',
  'CONFIRM',
  'BOOK',
  'VERIFY_PATIENT',
];

const OPEN_NODES: ConversationNode[] = [
  'GREET', 'SYSTEM_INFO', 'DOCTOR_INFO', 'PATIENT_HISTORY',
  'LAB_RESULTS', 'MEDICATIONS', 'HUMAN_HANDOFF', 'DONE',
];

export async function routeTurn(state: AgentState, lastUserMessage: string): Promise<ConversationNode> {
  const current = state.current_node || 'GREET';
  const text = lastUserMessage.toLowerCase().trim();

  if (!text) return current;

  // ── Layer 1: Fast phrase matching ───────────────────────────────────────────
  if (RESTART_PHRASES.some((p) => text.includes(p))) return 'GREET';
  if (HUMAN_PHRASES.some((p) => text.includes(p))) return 'HUMAN_HANDOFF';
  if (CANCEL_PHRASES.some((p) => text.includes(p))) return 'CANCEL';
  if (RESCHEDULE_PHRASES.some((p) => text.includes(p))) return 'RESCHEDULE';
  if (UPCOMING_PHRASES.some((p) => text.includes(p))) return 'CHECK_UPCOMING';

  // These must be before PATIENT_HISTORY so specific intents win
  if (LAB_RESULTS_PHRASES.some((p) => text.includes(p))) return 'LAB_RESULTS';
  if (MEDICATIONS_PHRASES.some((p) => text.includes(p))) return 'MEDICATIONS';

  if (PATIENT_HISTORY_PHRASES.some((p) => text.includes(p))) return 'PATIENT_HISTORY';
  if (DOCTOR_INFO_PHRASES.some((p) => text.includes(p))) return 'DOCTOR_INFO';
  if (SYSTEM_INFO_PHRASES.some((p) => text.includes(p))) return 'SYSTEM_INFO';

  // If mid-booking, stay on current node unless explicit phrase was matched
  if (BOOKING_FLOW_NODES.includes(current)) {
    return current;
  }

  if (current === 'DONE') return 'GREET';

  // ── Layer 2: LLM classifier for open conversational turns ───────────────────
  if (OPEN_NODES.includes(current)) {
    const intent = await classifyIntentWithLLM(lastUserMessage);
    switch (intent) {
      case 'PATIENT_HISTORY':  return 'PATIENT_HISTORY';
      case 'DOCTOR_INFO':      return 'DOCTOR_INFO';
      case 'SYSTEM_INFO':      return 'SYSTEM_INFO';
      case 'LAB_RESULTS':      return 'LAB_RESULTS';
      case 'MEDICATIONS':      return 'MEDICATIONS';
      case 'BOOK':             return 'GREET';
      case 'CHECK_UPCOMING':   return 'CHECK_UPCOMING';
      case 'RESCHEDULE':       return 'RESCHEDULE';
      case 'CANCEL':           return 'CANCEL';
      case 'HUMAN_HANDOFF':    return 'HUMAN_HANDOFF';
      default:                 return 'GREET';
    }
  }

  return current;
}
