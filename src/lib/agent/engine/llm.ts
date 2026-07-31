import Groq from 'groq-sdk';
import { ChatMessage, TurnOutput } from './types';
import { SYSTEM_PROMPT } from './prompts';

let groqClient: Groq | null = null;

function getGroqClient(): Groq {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is missing from environment variables.');
    }
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

export async function callLLMWithStructuredOutput(
  nodeInstructions: string,
  history: ChatMessage[],
): Promise<TurnOutput> {
  try {
    const groq = getGroqClient();

    const systemMessage = `${SYSTEM_PROMPT}\n\nCURRENT INSTRUCTIONS:\n${nodeInstructions}\n\nCRITICAL: Respond ONLY with a JSON object matching this exact TypeScript structure:\n{\n  "reply": "string (the exact message to show the patient - warm, clear, senior-friendly)",\n  "options": ["string"] (up to 4 quick reply chips or empty array),\n  "advance": boolean (true ONLY if this node has gathered all required info),\n  "patient_name": "string" (optional),\n  "patient_dob": "YYYY-MM-DD" (optional),\n  "appointment_type": "new_patient | follow_up | urgent | telehealth | wellness" (optional),\n  "provider_id": "string" (optional),\n  "chosen_slot": "ISO datetime string" (optional),\n  "confirmed": boolean (optional)\n}`;

    const messages = [
      { role: 'system', content: systemMessage },
      ...history.map((m) => ({
        role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.content,
      })),
    ];

    const response = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      messages,
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 512,
    });

    const content = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content) as TurnOutput;

    return {
      reply: parsed.reply || 'How can I assist you with your appointment today?',
      options: Array.isArray(parsed.options) ? parsed.options : [],
      advance: Boolean(parsed.advance),
      patient_name: parsed.patient_name,
      patient_dob: parsed.patient_dob,
      appointment_type: parsed.appointment_type,
      provider_id: parsed.provider_id,
      chosen_slot: parsed.chosen_slot,
      confirmed: parsed.confirmed,
    };
  } catch (err) {
    console.error('[callLLMWithStructuredOutput] LLM error:', err);
    return {
      reply: "I'm having a little trouble connecting right now. Please try again or call our clinic directly.",
      options: ['Try again', 'Call clinic'],
      advance: false,
    };
  }
}

export async function classifyIntentWithLLM(userMessage: string): Promise<string> {
  try {
    const groq = getGroqClient();

    const intentPrompt = `You are an intent classifier for a medical clinic chat assistant.
Classify the patient's message into EXACTLY ONE of these intents:
- PATIENT_HISTORY : wants personal medical records, allergies, history, past appointments.
- DOCTOR_INFO     : wants info about doctors, staff, or specialties.
- SYSTEM_INFO     : wants clinic info (hours, address, phone, services, insurance).
- BOOK            : wants to schedule a new appointment.
- CHECK_UPCOMING  : wants to check upcoming appointments.
- RESCHEDULE      : wants to change an appointment time.
- CANCEL          : wants to cancel an appointment.
- HUMAN_HANDOFF   : wants to talk to a receptionist / real person.
- GREET           : greeting, small talk, or unclear.

Patient message: "${userMessage}"

Respond with ONLY the single intent label (e.g. PATIENT_HISTORY). No extra words.`;

    const response = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: intentPrompt }],
      temperature: 0.1,
      max_tokens: 20,
    });

    const intent = response.choices[0]?.message?.content?.trim().toUpperCase() || 'GREET';
    const valid = [
      'PATIENT_HISTORY',
      'DOCTOR_INFO',
      'SYSTEM_INFO',
      'BOOK',
      'CHECK_UPCOMING',
      'RESCHEDULE',
      'CANCEL',
      'HUMAN_HANDOFF',
      'GREET',
    ];

    const matched = valid.find((v) => intent.includes(v));
    return matched || 'GREET';
  } catch (err) {
    console.error('[classifyIntentWithLLM] Error:', err);
    return 'GREET';
  }
}
