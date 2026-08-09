import Groq from 'groq-sdk';
import { AgentState, AgentTurnResult } from './types';
import { CLINIC_HOURS, CLINIC_NAME, CLINIC_PHONE } from './prompts';
import { AgentToolName } from './tool-definitions';
import {
  bookAppointment,
  cancelAppointment,
  getAvailableSlots,
  getPatientHistorySummary,
  getPatientLabResults,
  getPatientMedications,
  getUpcomingAppointments,
  listDoctors,
  lookupPatientByUserId,
  rescheduleAppointment,
} from './tools';

const FALLBACK_REPLY = "I'm here to help. How can I assist you today?";
const FALLBACK_OPTIONS = ['Book Appointment', 'My Appointments', 'Call Clinic'];

// ─── Groq Client ───────────────────────────────────────────────────────────────
let _groq: Groq | null = null;
function getGroq(): Groq {
  if (!_groq) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY is missing');
    _groq = new Groq({ apiKey });
  }
  return _groq;
}
const MODEL = () => process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

// ─── Safe history builder ───────────────────────────────────────────────────────
type SafeMsg = { role: 'user' | 'assistant'; content: string };

function buildSafeHistory(state: AgentState): SafeMsg[] {
  return state.messages
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && (m.content || '').trim())
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content.trim() }));
}

// ─── Tool Executor ─────────────────────────────────────────────────────────────
async function executeTool(
  name: AgentToolName,
  args: Record<string, unknown>,
  state: AgentState,
): Promise<string> {
  console.log(`[Agent Tool] ${name}`, args);
  try {
    switch (name) {
      case 'lookupPatient': {
        if (!state.user_id) return JSON.stringify({ error: 'No logged-in user.' });
        const p = await lookupPatientByUserId(state.user_id);
        if (!p) return JSON.stringify({ error: 'No patient record found.' });
        state.patient_id   = p.id;
        state.patient_name = `${p.first_name} ${p.last_name}`;
        state.patient_dob  = p.dob;
        return JSON.stringify({ id: p.id, first_name: p.first_name, last_name: p.last_name, dob: p.dob, email: p.email, phone: p.phone });
      }
      case 'getClinicInfo':
        return JSON.stringify({ name: CLINIC_NAME, phone: CLINIC_PHONE, hours: CLINIC_HOURS, services: ['Primary Care', 'Cardiology', 'Wellness Checkups', 'Telehealth', 'Urgent Care'] });
      case 'listDoctors': {
        const docs = await listDoctors();
        return JSON.stringify(docs.map(d => ({ id: d.id, name: `Dr. ${d.first_name} ${d.last_name}`, specialty: d.specialty || 'General Practice' })));
      }
      case 'getUpcomingAppointments': {
        const appts = await getUpcomingAppointments(state.user_id, state.patient_id);
        if (!appts.length) return JSON.stringify({ message: 'No upcoming appointments found.' });
        return JSON.stringify(appts.map((a: any) => ({ id: a.id, type: a.type, doctor: a.doctor_name, scheduled_at: a.scheduled_at || a.start_time, duration_mins: a.duration_mins, provider_id: a.provider_id })));
      }
      case 'getAvailableSlots': {
        const doctorId = typeof args.doctor_id === 'string' ? args.doctor_id : undefined;
        const slots = await getAvailableSlots(doctorId);
        if (!slots.length) return JSON.stringify({ message: 'No available slots. Please call the clinic.' });
        return JSON.stringify({ slots: slots.map(s => ({ iso: s, display: new Date(s).toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' }) })) });
      }
      case 'bookAppointment': {
        if (!state.patient_id) return JSON.stringify({ success: false, error: 'Patient not identified. Call lookupPatient first.' });
        const result = await bookAppointment({
          patientId: state.patient_id,
          doctorId: typeof args.doctor_id === 'string' ? args.doctor_id : undefined,
          slotIso: args.slot_iso as string,
          appointmentType: args.appointment_type as string,
          chiefComplaint: typeof args.chief_complaint === 'string' ? args.chief_complaint : undefined,
        });
        return JSON.stringify(result);
      }
      case 'cancelAppointment': {
        const appts = await getUpcomingAppointments(state.user_id, state.patient_id);
        const apptId = (args.appointment_id as string) || (appts[0] as any)?.id;
        if (!apptId) return JSON.stringify({ success: false, error: 'No appointment found to cancel.' });
        await cancelAppointment(apptId);
        return JSON.stringify({ success: true, cancelled_id: apptId });
      }
      case 'rescheduleAppointment': {
        const upcoming = await getUpcomingAppointments(state.user_id, state.patient_id);
        const rId = (args.appointment_id as string) || (upcoming[0] as any)?.id;
        if (!rId) return JSON.stringify({ success: false, error: 'No appointment to reschedule.' });
        const ok = await rescheduleAppointment(rId, args.new_slot_iso as string);
        return JSON.stringify({ success: ok, appointment_id: rId, new_slot: args.new_slot_iso });
      }
      case 'getLabResults': {
        if (!state.patient_id) return JSON.stringify({ error: 'Patient not identified. Call lookupPatient first.' });
        const labs = await getPatientLabResults(state.patient_id);
        if (!labs.length) return JSON.stringify({ message: 'No lab results on file.' });
        return JSON.stringify(labs.map(r => ({ test: (r.lab_order as any)?.test_name || 'Lab Test', component: r.component_name, value: `${r.value} ${r.unit || ''}`.trim(), flag: r.flag, date: r.resulted_at?.slice(0, 10) })));
      }
      case 'getMedications': {
        if (!state.patient_id) return JSON.stringify({ error: 'Patient not identified. Call lookupPatient first.' });
        const meds = await getPatientMedications(state.patient_id);
        return JSON.stringify({ active: meds.active.map(m => ({ drug: m.drug_name, dosage: m.dosage, frequency: m.frequency, refills_remaining: m.refills_remaining })), past: meds.past.slice(0, 3).map(m => ({ drug: m.drug_name, status: m.status })) });
      }
      case 'getPatientHistory':
        return await getPatientHistorySummary(state.user_id);
      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (err: any) {
    console.error(`[Tool Error] ${name}:`, err.message);
    return JSON.stringify({ error: err.message || 'Tool execution failed.' });
  }
}

// ─── Step 1: Plan which tools to call (JSON mode) ─────────────────────────────
interface ToolCall { name: AgentToolName; args: Record<string, unknown>; }
interface ToolPlan {
  tools: ToolCall[];
  needs_clarification: boolean;
  clarification_message: string;
}

async function planTools(history: SafeMsg[], state: AgentState): Promise<ToolPlan> {
  const groq = getGroq();
  const patientCtx = state.patient_id
    ? `Patient identified: ${state.patient_name}, patient_id=${state.patient_id}`
    : 'Patient NOT identified in system yet.';

  const planPrompt = `You are a medical clinic assistant planning tool calls.

SESSION CONTEXT: ${patientCtx}

AVAILABLE TOOLS:
- lookupPatient — get patient info by user_id
- getClinicInfo — clinic hours, phone, address, services
- listDoctors — all available doctors with IDs and specialties
- getUpcomingAppointments — patient's scheduled upcoming visits
- getAvailableSlots — args: {doctor_id?} — open time slots
- bookAppointment — args: {doctor_id, slot_iso, appointment_type} — ONLY call after user explicitly confirms the final booking summary!
- cancelAppointment — args: {appointment_id?} — cancel after user confirms
- rescheduleAppointment — args: {appointment_id, new_slot_iso} — after user picks slot
- getLabResults — lab results
- getMedications — medications
- getPatientHistory — medical history

TOOL SELECTION RULES:
1. If user says they want to book an appointment:
   - Call "lookupPatient" (if user_id present and patient not identified) and "listDoctors".
2. If user selected or specified a doctor:
   - Call "getAvailableSlots" with { doctor_id }.
3. DO NOT call "bookAppointment" unless the user has explicitly agreed to the final booking details (e.g. "Yes, confirm booking").

Return ONLY valid JSON (no markdown):
{"tools":[{"name":"toolName","args":{}}],"needs_clarification":false,"clarification_message":""}`;

  const recentHistory = history.slice(-6);

  try {
    const resp = await groq.chat.completions.create({
      model: MODEL(),
      messages: [
        { role: 'system', content: planPrompt },
        ...recentHistory,
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 400,
    });
    const raw = (resp.choices[0]?.message?.content || '{}').trim();
    const parsed = JSON.parse(raw);
    return {
      tools: Array.isArray(parsed.tools) ? parsed.tools : [],
      needs_clarification: false,
      clarification_message: '',
    };
  } catch (err: any) {
    console.error('[planTools] Error:', err.message);
    return { tools: [], needs_clarification: false, clarification_message: '' };
  }
}

// ─── Step 2: Generate reply using tool results (JSON mode) ────────────────────
async function generateReply(
  history: SafeMsg[],
  toolResultsContext: string,
  state: AgentState,
): Promise<AgentTurnResult> {
  const groq = getGroq();
  const patientLine = state.patient_name ? `Log-in Patient: ${state.patient_name}` : '';

  const toolSection = toolResultsContext
    ? `\n\nDATA FROM CLINIC SYSTEMS:\n${toolResultsContext}`
    : '';

  const systemContent = `You are Sarah, a warm AI medical receptionist for ${CLINIC_NAME}.
${patientLine}

MANDATORY APPOINTMENT BOOKING CONVERSATION FLOW:
Follow these steps IN ORDER when helping a patient book an appointment:

STEP 1: ASK WHO THE APPOINTMENT IS FOR
When user first asks to book an appointment (e.g., "book an appointment", "I need to see a doctor"):
- Ask warmly: "Who are you booking this appointment for?"
- Options chips: ["For myself", "For someone else"]

STEP 2: IF FOR SOMEONE ELSE
- If user says "For someone else", ask: "Could you please provide the patient's full name and date of birth?"
- Options chips: ["Provide details"]

STEP 3: CHOOSE DOCTOR / SPECIALIST
- Once patient is clear (myself or someone else named), show the doctors from DATA FROM CLINIC SYSTEMS.
- Ask: "Which doctor or specialty would you like to visit?"
- Options chips: Provide exact doctor names from listDoctors data (e.g., ["Dr. Sarah Smith", "Dr. Robert Johnson"]).

STEP 4: CHOOSE DATE & TIME SLOT
- Once doctor is chosen, present the open time slots from DATA FROM CLINIC SYSTEMS clearly.
- Ask: "Here are available slots for [Doctor Name]. Which date and time works best for you?"
- Options chips: Provide clear time choices from getAvailableSlots (e.g., ["Monday 9:00 AM", "Monday 2:00 PM"]).

STEP 5: CONFIRMATION BEFORE BOOKING
- When user picks a slot, summarize the details:
  • Patient: [Name]
  • Doctor: [Doctor Name]
  • Date & Time: [Selected Time]
- Ask: "Would you like me to confirm and book this appointment for you?"
- Options chips: ["Yes, confirm booking", "Choose different doctor", "Cancel"]

STEP 6: FINAL BOOKING
- Only after user clicks/says "Yes, confirm booking", execute the booking and confirm with a friendly thank-you message and confirmation code.

CLINIC INFO: ${CLINIC_NAME} | ${CLINIC_PHONE} | ${CLINIC_HOURS}${toolSection}

ALWAYS RETURN VALID JSON strictly matching:
{"reply":"your clear message","options":["option 1","option 2"]}`;

  const recentHistory = history.slice(-8);

  try {
    const resp = await groq.chat.completions.create({
      model: MODEL(),
      messages: [
        { role: 'system', content: systemContent },
        ...recentHistory,
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 900,
    });
    const raw = (resp.choices[0]?.message?.content || '{}').trim();
    const parsed = JSON.parse(raw);
    const reply = (parsed.reply || '').trim();
    const options: string[] = Array.isArray(parsed.options) ? parsed.options.filter(Boolean) : [];
    if (reply) return { reply, options: options.length ? options : ['For myself', 'For someone else'] };
  } catch (err: any) {
    console.error('[generateReply] Error:', err.message, '| status:', err.status);
  }

  return { reply: FALLBACK_REPLY, options: FALLBACK_OPTIONS };
}

// ─── Main Agent Runner ─────────────────────────────────────────────────────────
export async function runAgent(
  state: AgentState,
  _userMessage: string,
): Promise<AgentTurnResult> {
  // 1. Build safe, clean conversation history
  const history = buildSafeHistory(state);

  // 2. Plan which tools to call
  const plan = await planTools(history, state);


  // 4. Execute all planned tools
  const toolResultParts: string[] = [];
  for (const tc of plan.tools) {
    const result = await executeTool(tc.name, tc.args || {}, state);
    toolResultParts.push(`[${tc.name}]: ${result}`);
  }
  const toolResultsContext = toolResultParts.join('\n\n');

  // 5. Generate the final patient-facing reply
  return generateReply(history, toolResultsContext, state);
}
