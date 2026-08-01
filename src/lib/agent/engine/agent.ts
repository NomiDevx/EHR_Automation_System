import Groq from 'groq-sdk';
import { AgentState, AgentTurnResult } from './types';
import { CLINIC_HOURS, CLINIC_NAME, CLINIC_PHONE } from './prompts';
import { AGENT_TOOLS, AgentToolName } from './tool-definitions';
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

const MAX_TOOL_ROUNDS = 6;

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

// ─── System Prompt ─────────────────────────────────────────────────────────────
function buildSystemPrompt(state: AgentState): string {
  const patientLine = state.patient_name
    ? `The patient is ${state.patient_name}${state.patient_dob ? `, DOB ${state.patient_dob}` : ''}.`
    : 'Patient not yet identified. Call lookupPatient before answering any personal questions.';

  return `You are Sarah, an AI medical receptionist for ${CLINIC_NAME}.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ABSOLUTE RULES — NEVER BREAK THESE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. YOU MUST CALL A TOOL before answering ANY question about patient data, appointments, lab results, medications, or medical history. No exceptions.
2. NEVER invent, guess, or hallucinate any information. If a tool returns no data, say "I don't have that on file" and offer next steps.
3. NEVER use your training knowledge to answer medical questions about the patient. All answers must come from tool results only.
4. NEVER say something like "based on your history" or "you are currently taking" unless a tool actually returned that data in this conversation.
5. If asked about something not covered by your tools (e.g. general medical advice), say: "I'm not able to give medical advice. Please consult your doctor."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHEN TO CALL EACH TOOL:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Patient asks about lab results, blood work, or test results → getLabResults
• Patient asks about medications, prescriptions, or drugs → getMedications
• Patient asks about upcoming visits or their schedule → getUpcomingAppointments
• Patient asks about their health history, conditions, or allergies → getPatientHistory
• Patient asks about clinic hours, location, phone, or services → getClinicInfo
• Patient asks about doctors or specialties → listDoctors
• Patient wants to book an appointment → listDoctors, then getAvailableSlots, confirm details, then bookAppointment
• Patient wants to cancel → getUpcomingAppointments, confirm with patient, then cancelAppointment
• Patient wants to reschedule → getUpcomingAppointments, then getAvailableSlots, confirm, then rescheduleAppointment
• Patient identity needed → lookupPatient (call this first if patient_id is unknown)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESPONSE RULES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• If a tool returns empty or "no data found" → tell the patient exactly that. Do NOT fill in with guesses.
• Use bullet points (•) for lists of data.
• Keep responses concise and warm. This system serves senior patients.
• If the patient seems confused or needs human help: "You can reach our front desk at ${CLINIC_PHONE}."

CLINIC: ${CLINIC_NAME} | Phone: ${CLINIC_PHONE} | Hours: ${CLINIC_HOURS}
PATIENT: ${patientLine}

At the very end of your message, on its own line, output:
QUICK_REPLIES:["option1","option2"]
Choose 2-4 natural follow-up actions. Omit this line entirely if none apply.`;
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
        const patient = await lookupPatientByUserId(state.user_id);
        if (!patient) return JSON.stringify({ error: 'No patient record found.' });
        state.patient_id   = patient.id;
        state.patient_name = `${patient.first_name} ${patient.last_name}`;
        state.patient_dob  = patient.dob;
        return JSON.stringify({
          id: patient.id, first_name: patient.first_name, last_name: patient.last_name,
          dob: patient.dob, email: patient.email, phone: patient.phone, gender: patient.gender,
        });
      }

      case 'getClinicInfo':
        return JSON.stringify({
          name: CLINIC_NAME, phone: CLINIC_PHONE, hours: CLINIC_HOURS,
          services: ['Primary Care', 'Cardiology', 'Wellness Checkups', 'Telehealth', 'Urgent Care'],
          insurance: 'We accept most major insurance plans. Call for specific coverage questions.',
          parking: 'Free parking available in our main lot.',
          cancellation_policy: 'Please cancel or reschedule at least 24 hours in advance.',
        });

      case 'listDoctors': {
        const docs = await listDoctors();
        return JSON.stringify(docs.map((d) => ({
          id: d.id, name: `Dr. ${d.first_name} ${d.last_name}`, specialty: d.specialty || 'General Practice',
        })));
      }

      case 'getUpcomingAppointments': {
        const appts = await getUpcomingAppointments(state.user_id, state.patient_id);
        if (!appts.length) return JSON.stringify({ message: 'No upcoming appointments found.' });
        return JSON.stringify(appts.map((a: any) => ({
          id: a.id, type: a.type, doctor: a.doctor_name,
          scheduled_at: a.start_time || a.scheduled_at,
        })));
      }

      case 'getAvailableSlots': {
        const doctorId = typeof args.doctor_id === 'string' ? args.doctor_id : undefined;
        const slots = await getAvailableSlots(doctorId);
        if (!slots.length) return JSON.stringify({ message: 'No available slots. Please call the clinic.' });
        return JSON.stringify({
          slots: slots.map((s) => ({
            iso: s,
            display: new Date(s).toLocaleString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit',
            }),
          })),
        });
      }

      case 'bookAppointment': {
        if (!state.patient_id) return JSON.stringify({ success: false, error: 'Patient not identified. Call lookupPatient first.' });
        const result = await bookAppointment({
          patientId: state.patient_id,
          doctorId: typeof args.doctor_id === 'string' ? args.doctor_id : undefined,
          slotIso: args.slot_iso as string,
          appointmentType: args.appointment_type as string,
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
        await rescheduleAppointment(rId, args.new_slot_iso as string);
        return JSON.stringify({ success: true, new_slot: args.new_slot_iso });
      }

      case 'getLabResults': {
        if (!state.patient_id) return JSON.stringify({ error: 'Patient not identified. Call lookupPatient first.' });
        const labs = await getPatientLabResults(state.patient_id);
        if (!labs.length) return JSON.stringify({ message: 'No lab results on file.' });
        return JSON.stringify(labs.map((r) => ({
          test: (r.lab_order as any)?.test_name || 'Lab Test',
          component: r.component_name,
          value: `${r.value} ${r.unit || ''}`.trim(),
          flag: r.flag,
          reference: r.reference_low && r.reference_high
            ? `${r.reference_low}–${r.reference_high} ${r.unit || ''}`
            : null,
          date: r.resulted_at?.slice(0, 10),
        })));
      }

      case 'getMedications': {
        if (!state.patient_id) return JSON.stringify({ error: 'Patient not identified. Call lookupPatient first.' });
        const meds = await getPatientMedications(state.patient_id);
        return JSON.stringify({
          active: meds.active.map((m) => ({
            drug: m.drug_name, generic: m.drug_generic_name,
            dosage: m.dosage, frequency: m.frequency,
            refills_remaining: m.refills_remaining, instructions: m.instructions,
          })),
          past: meds.past.slice(0, 5).map((m) => ({ drug: m.drug_name, status: m.status })),
        });
      }

      case 'getPatientHistory': {
        return await getPatientHistorySummary(state.user_id);
      }

      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (err: any) {
    console.error(`[Tool Error] ${name}:`, err.message);
    return JSON.stringify({ error: err.message || 'Tool execution failed.' });
  }
}

// ─── Parse Quick Replies ────────────────────────────────────────────────────────
function extractQuickReplies(rawReply: string): { reply: string; options: string[] } {
  const lines = rawReply.split('\n');
  let qrLineIndex = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].trim().startsWith('QUICK_REPLIES:')) {
      qrLineIndex = i;
      break;
    }
  }
  if (qrLineIndex === -1) return { reply: rawReply.trim(), options: [] };

  let options: string[] = [];
  try {
    const jsonPart = lines[qrLineIndex].trim().replace('QUICK_REPLIES:', '').trim();
    options = JSON.parse(jsonPart);
  } catch { options = []; }

  return { reply: lines.slice(0, qrLineIndex).join('\n').trim(), options };
}

// ─── Main Agent Runner ─────────────────────────────────────────────────────────
/**
 * KEY DESIGN DECISION: Tool-call messages are ephemeral within a single turn.
 * Between turns, only plain user/assistant text messages are persisted in state.messages.
 * This prevents Groq from rejecting history that contains tool-call assistant messages
 * without their corresponding tool_calls arrays (which causes the "empty output" error).
 */
export async function runAgent(
  state: AgentState,
  _userMessage: string,
): Promise<AgentTurnResult> {
  const groq = getGroq();
  const systemPrompt = buildSystemPrompt(state);

  // Build the base history from persisted text messages only (user + assistant text)
  // This is safe to send across turns — no tool_calls, no null content
  const baseHistory: any[] = state.messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({ role: m.role, content: m.content }));

  // Within-turn working history — starts as a copy, grows as tools are called
  const turnHistory: any[] = [...baseHistory];

  let finalReply = "I'm here to help. How can I assist you today?";
  let finalOptions: string[] = ['Book Appointment', 'My Appointments', 'Call Clinic'];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    let response: any;
    try {
      response = await groq.chat.completions.create({
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: systemPrompt }, ...turnHistory],
        temperature: 0.45,
        max_tokens: 1024,
        tools: AGENT_TOOLS as any,
        tool_choice: 'auto',
      });
    } catch (err: any) {
      console.error('[Agent LLM Error]:', err.message);
      return {
        reply: "I'm having trouble connecting right now. Please try again or call our clinic.",
        options: ['Try Again', 'Call Clinic'],
      };
    }

    const choice = response.choices[0];
    const msg = choice.message;
    const finishReason = choice.finish_reason;

    // ── LLM wants to call tools ─────────────────────────────────
    if (finishReason === 'tool_calls' && msg.tool_calls?.length) {
      // Add the full assistant tool-call message (with tool_calls array) to turn history
      turnHistory.push({
        role: 'assistant',
        content: msg.content ?? null,
        tool_calls: msg.tool_calls,
      });

      // Execute every requested tool and append results
      for (const tc of msg.tool_calls) {
        let toolArgs: Record<string, unknown> = {};
        try { toolArgs = JSON.parse(tc.function.arguments || '{}'); } catch { toolArgs = {}; }

        const result = await executeTool(tc.function.name as AgentToolName, toolArgs, state);

        turnHistory.push({
          role: 'tool',
          content: result,
          tool_call_id: tc.id,
        });
      }
      // Loop: let LLM see the tool results and produce its response
      continue;
    }

    // ── LLM produced a final text reply ────────────────────────
    const rawReply = (msg.content || '').trim();
    if (!rawReply) break; // Safety: empty reply, exit loop

    const parsed = extractQuickReplies(rawReply);
    finalReply   = parsed.reply || rawReply;
    finalOptions = parsed.options.length > 0 ? parsed.options : finalOptions;
    break;
  }

  // Persist ONLY plain text messages back to state (no tool_calls, no null content)
  // The current user message is already in state.messages (added by route.ts before calling runAgent)
  // We just need to ensure we don't double-add anything — state.messages is the source of truth
  // for next-turn context.

  return { reply: finalReply, options: finalOptions };
}
