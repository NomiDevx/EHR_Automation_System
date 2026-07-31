import { AgentState, AppointmentType, ConversationNode } from './types';

import { callLLMWithStructuredOutput } from './llm';
import {
  APPOINTMENT_TYPE_OPTIONS,
  CLINIC_HOURS,
  CLINIC_PHONE,
  LABEL_TO_TYPE,
  TYPE_TO_LABEL,
} from './prompts';
import {
  bookAppointment,
  cancelAppointment,
  getAvailableSlots,
  getPatientHistorySummary,
  getPatientLabResults,
  getPatientMedications,
  getUpcomingAppointments,
  listDoctors,
  lookupPatientByNameDob,
  lookupPatientByUserId,
  rescheduleAppointment,
} from './tools';

export async function processNodeTurn(
  targetNode: ConversationNode,
  state: AgentState,
  userMessage: string,
): Promise<{ nextState: AgentState }> {
  const updatedState: AgentState = { ...state, current_node: targetNode };

  switch (targetNode) {
    case 'GREET': {
      let patientName = updatedState.patient_name;
      let patientDob  = updatedState.patient_dob;

      if (updatedState.user_id && !patientName) {
        const patient = await lookupPatientByUserId(updatedState.user_id);
        if (patient) {
          patientName = `${patient.first_name} ${patient.last_name}`;
          patientDob  = patient.dob;
          updatedState.patient_id   = patient.id;
          updatedState.patient_name = patientName;
          updatedState.patient_dob  = patientDob;
        }
      }

      if (patientName) {
        // Format DOB for display
        let dobDisplay = patientDob || '';
        if (patientDob) {
          try {
            const dt = new Date(patientDob);
            dobDisplay = dt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
          } catch (_) { /* keep raw */ }
        }
        updatedState.reply =
          `Welcome to MediCore EHR! 🎙️💬 You can speak using your voice or type your messages anytime.\n\n` +
          `According to my data, your name is **${patientName}**` +
          (dobDisplay ? ` and your date of birth is **${dobDisplay}**` : '') +
          `.\n\nWhat assistance do you need today? I can help you book an appointment, check upcoming visits, view your medical history, lab results, medications, or answer any questions about our clinic.`;
        updatedState.options = [
          'Book an appointment',
          'Check my upcoming visit',
          'My lab results',
          'My medications',
        ];
        updatedState.current_node = 'GREET';
      } else {
        const llmOut = await callLLMWithStructuredOutput(
          'Greet the patient warmly. Ask for their full name so we can look up their account.',
          updatedState.messages,
        );
        updatedState.reply = llmOut.reply;
        updatedState.options = ['Book an Appointment', 'Check Clinic Info', 'Talk to Receptionist'];
        updatedState.current_node = 'COLLECT_INFO';
      }
      break;
    }


    case 'COLLECT_INFO': {
      const llmOut = await callLLMWithStructuredOutput(
        'Extract patient name and date of birth if mentioned. If we have the name, ask for their date of birth (YYYY-MM-DD). If both are provided, set advance: true.',
        updatedState.messages,
      );

      if (llmOut.patient_name) updatedState.patient_name = llmOut.patient_name;
      if (llmOut.patient_dob) updatedState.patient_dob = llmOut.patient_dob;

      if (updatedState.patient_name && updatedState.patient_dob) {
        const patient = await lookupPatientByNameDob(
          updatedState.patient_name,
          updatedState.patient_dob,
        );
        if (patient) {
          updatedState.patient_id = patient.id;
        }
        updatedState.current_node = 'CHOOSE_TYPE';
        updatedState.reply = `Thank you! I found your account, ${updatedState.patient_name}. What type of visit would you like to schedule?`;
        updatedState.options = APPOINTMENT_TYPE_OPTIONS.map(([_, label]) => label);
      } else {
        updatedState.reply = llmOut.reply;
        updatedState.options = llmOut.options || [];
      }
      break;
    }

    case 'CHOOSE_TYPE': {
      const lower = userMessage.toLowerCase();
      let selectedType: AppointmentType | null = null;

      for (const [code, label] of APPOINTMENT_TYPE_OPTIONS) {
        if (lower.includes(label.toLowerCase()) || lower.includes(code.toLowerCase())) {
          selectedType = code;
          break;
        }
      }

      if (!selectedType) {
        for (const [key, code] of Object.entries(LABEL_TO_TYPE)) {
          if (lower.includes(key)) {
            selectedType = code;
            break;
          }
        }
      }

      if (selectedType) {
        updatedState.appointment_type = selectedType;
        const doctors = await listDoctors();
        updatedState.current_node = 'CHOOSE_DOCTOR';
        updatedState.reply = `Got it, a ${TYPE_TO_LABEL[selectedType as AppointmentType]}! Which doctor or specialist would you prefer to see?`;
        updatedState.options = doctors.map((d) => `Dr. ${d.last_name} (${d.specialty})`);

      } else {
        updatedState.reply = 'Please choose one of the following visit types:';
        updatedState.options = APPOINTMENT_TYPE_OPTIONS.map(([_, label]) => label);
      }
      break;
    }

    case 'CHOOSE_DOCTOR': {
      const doctors = await listDoctors();
      const lower = userMessage.toLowerCase();

      let chosenDoc = doctors.find(
        (d) =>
          lower.includes(d.last_name.toLowerCase()) ||
          lower.includes(d.first_name.toLowerCase()) ||
          (d.specialty && lower.includes(d.specialty.toLowerCase())),
      );

      if (!chosenDoc) chosenDoc = doctors[0];

      if (chosenDoc) {
        updatedState.provider_id = chosenDoc.id;
        updatedState.provider_name = `Dr. ${chosenDoc.first_name} ${chosenDoc.last_name}`;

        const slots = await getAvailableSlots(chosenDoc.id);
        updatedState.available_slots = slots;
        updatedState.current_node = 'CHOOSE_SLOT';

        const formattedSlots = slots.map((s) =>
          new Date(s).toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          }),
        );

        updatedState.reply = `Great! ${updatedState.provider_name} has availability. Which slot works best for you?`;
        updatedState.options = formattedSlots;
      }
      break;
    }

    case 'CHOOSE_SLOT': {
      const slots = updatedState.available_slots || (await getAvailableSlots(updatedState.provider_id));
      const lower = userMessage.toLowerCase();

      let chosenSlot = slots.find((s) => {
        const dtStr = new Date(s).toLocaleString('en-US').toLowerCase();
        return lower.includes(dtStr) || lower.includes(new Date(s).getDate().toString());
      });

      if (!chosenSlot && slots.length > 0) {
        chosenSlot = slots[0];
      }

      if (chosenSlot) {
        updatedState.chosen_slot = chosenSlot;
        updatedState.current_node = 'CONFIRM';

        const formattedTime = new Date(chosenSlot).toLocaleString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        });

        const visitLabel = updatedState.appointment_type
          ? TYPE_TO_LABEL[updatedState.appointment_type as AppointmentType]
          : 'Appointment';


        updatedState.reply = `Please confirm your details:\n• Visit: ${visitLabel}\n• Doctor: ${updatedState.provider_name || 'Clinic Physician'}\n• Date & Time: ${formattedTime}\n\nWould you like me to book this for you?`;
        updatedState.options = ['Yes, Confirm Booking', 'No, Choose Different Time', 'Cancel'];
      }
      break;
    }

    case 'CONFIRM': {
      const lower = userMessage.toLowerCase();
      if (lower.includes('yes') || lower.includes('confirm') || lower.includes('book')) {
        updatedState.current_node = 'BOOK';
        return processNodeTurn('BOOK', updatedState, userMessage);
      } else if (lower.includes('no') || lower.includes('different') || lower.includes('change')) {
        updatedState.current_node = 'CHOOSE_SLOT';
        const slots = await getAvailableSlots(updatedState.provider_id);
        updatedState.available_slots = slots;
        updatedState.reply = 'No problem! Here are other available time slots:';
        updatedState.options = slots.map((s) => new Date(s).toLocaleString('en-US'));
      } else {
        updatedState.reply = 'Would you like to confirm this booking? Tap "Yes, Confirm Booking" below.';
        updatedState.options = ['Yes, Confirm Booking', 'Cancel'];
      }
      break;
    }

    case 'BOOK': {
      const result = await bookAppointment({
        patientId: updatedState.patient_id || 'guest',
        doctorId: updatedState.provider_id,
        slotIso: updatedState.chosen_slot || new Date().toISOString(),
        appointmentType: updatedState.appointment_type,
      });

      if (result.success) {
        updatedState.appointment_id = result.appointmentId;
        updatedState.current_node = 'DONE';
        const slotText = updatedState.chosen_slot
          ? new Date(updatedState.chosen_slot).toLocaleString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })
          : '';

        updatedState.reply = `🎉 Success! Your appointment with ${updatedState.provider_name || 'our clinic'} has been confirmed for ${slotText}.\n\nA confirmation has been saved to your health portal. Is there anything else I can assist you with?`;
        updatedState.options = ['View My Appointments', 'Back to Home', 'Done'];
      } else {
        updatedState.current_node = 'GREET';
        updatedState.reply = `I apologize, but we could not complete the booking right now (${result.reason}). Please try selecting another slot or call our desk at ${CLINIC_PHONE}.`;
        updatedState.options = ['Try Again', 'Call Clinic'];
      }
      break;
    }

    case 'DONE': {
      updatedState.reply = 'You are all set! Have a wonderful day, and feel free to reach out if you need anything else.';
      updatedState.options = ['Start New Conversation'];
      break;
    }

    case 'HUMAN_HANDOFF': {
      updatedState.reply = `I am transferring your request to our front desk team. You can reach our clinic receptionist directly at ${CLINIC_PHONE} during operating hours (${CLINIC_HOURS}).`;
      updatedState.options = ['Call Receptionist', 'Return to Assistant'];
      break;
    }

    case 'PATIENT_HISTORY': {
      const summary = await getPatientHistorySummary(updatedState.user_id);
      updatedState.reply = `Here is your current medical record summary:\n\n${summary}`;
      updatedState.options = ['Book Appointment', 'Check Upcoming Visit', 'Main Menu'];
      break;
    }

    case 'LAB_RESULTS': {
      if (!updatedState.user_id) {
        updatedState.reply =
          '🔒 For your privacy, I can only show lab results when you are logged in.\n\nPlease log in to your patient portal and come back to view your lab reports.';
        updatedState.options = ['Book Appointment', 'Clinic Information', 'Talk to Receptionist'];
        break;
      }

      // Resolve patient_id
      let pid = updatedState.patient_id;
      if (!pid) {
        const p = await lookupPatientByUserId(updatedState.user_id);
        if (p) {
          pid = p.id;
          updatedState.patient_id = pid;
          if (!updatedState.patient_name) updatedState.patient_name = `${p.first_name} ${p.last_name}`;
        }
      }

      if (!pid) {
        updatedState.reply = "I wasn't able to locate your patient record. Please call our clinic for assistance.";
        updatedState.options = ['Call Clinic', 'Book Appointment'];
        break;
      }

      const labResults = await getPatientLabResults(pid);
      const firstName = updatedState.patient_name?.split(' ')[0] || 'there';

      if (labResults.length === 0) {
        updatedState.reply =
          `Hi ${firstName}! I checked our database, but there are no lab results on file for your account yet.\n\n` +
          `Lab results are added by our clinical team after your visit. If you recently had tests done, please call us.`;
        updatedState.options = ['Book Appointment', 'Talk to Receptionist', "I'm all set"];
        break;
      }

      const FLAG_ICON: Record<string, string> = {
        normal: '✅',
        low: '⬇️ Low',
        high: '⬆️ High',
        critical_low: '🚨 Critical Low',
        critical_high: '🚨 Critical High',
      };

      // Group by test name (plain object avoids --downlevelIteration requirement)
      const grouped: Record<string, typeof labResults> = {};
      for (const r of labResults) {
        const testName = (r.lab_order as any)?.test_name || 'Lab Test';
        if (!grouped[testName]) grouped[testName] = [];
        grouped[testName].push(r);
      }

      const sections: string[] = [];
      for (const [testName, rows] of Object.entries(grouped)) {
        const lines = [`🧪 **${testName}**`];
        for (const r of rows) {
          const flagIcon = FLAG_ICON[r.flag] || '';
          const ref =
            r.reference_low && r.reference_high
              ? ` (ref: ${r.reference_low}–${r.reference_high} ${r.unit || ''})`
              : '';
          const dateStr = r.resulted_at.slice(0, 10);
          lines.push(`  • ${r.component_name}: **${r.value} ${r.unit || ''}** ${flagIcon}${ref} — ${dateStr}`);
        }
        sections.push(lines.join('\n'));
      }

      const hasAbnormal = labResults.some((r) => r.flag !== 'normal');
      const abnormalNote = hasAbnormal
        ? '\n\n⚠️ *Some results are outside the normal range. Please discuss these with your doctor.*'
        : '';

      updatedState.reply =
        `Here are your recent lab results, ${firstName}:\n\n` +
        sections.join('\n\n') +
        abnormalNote +
        '\n\n🔒 *This information is private and visible only to you.*\n\n' +
        'Would you like to book a follow-up with your doctor to discuss these results?';
      updatedState.options = ['Book a Follow-up', 'Check Upcoming Appointment', "I'm all set"];
      updatedState.current_node = 'DONE';
      break;
    }

    case 'MEDICATIONS': {
      if (!updatedState.user_id) {
        updatedState.reply =
          '🔒 For your privacy, I can only show medication information when you are logged in.\n\nPlease log in to your patient portal to view your prescriptions.';
        updatedState.options = ['Book Appointment', 'Clinic Information', 'Talk to Receptionist'];
        break;
      }

      // Resolve patient_id
      let mpid = updatedState.patient_id;
      if (!mpid) {
        const mp = await lookupPatientByUserId(updatedState.user_id);
        if (mp) {
          mpid = mp.id;
          updatedState.patient_id = mpid;
          if (!updatedState.patient_name) updatedState.patient_name = `${mp.first_name} ${mp.last_name}`;
        }
      }

      if (!mpid) {
        updatedState.reply = "I wasn't able to locate your patient record. Please call our clinic for assistance.";
        updatedState.options = ['Call Clinic', 'Book Appointment'];
        break;
      }

      const meds = await getPatientMedications(mpid);
      const mFirstName = updatedState.patient_name?.split(' ')[0] || 'there';

      if (meds.active.length === 0 && meds.past.length === 0) {
        updatedState.reply =
          `Hi ${mFirstName}! I checked our records, but there are no prescriptions on file for your account yet.\n\n` +
          `Prescriptions are added by your doctor after a visit. If you think this is an error, please contact your care team.`;
        updatedState.options = ['Book Appointment', 'Talk to Receptionist', "I'm all set"];
        break;
      }

      const fmtMed = (r: (typeof meds.active)[0]): string => {
        const prescriber = r.prescriber as any;
        const doc = prescriber ? `Dr. ${prescriber.first_name} ${prescriber.last_name}` : 'Your doctor';
        let line = `💊 **${r.drug_name}**`;
        if (r.drug_generic_name) line += ` (${r.drug_generic_name})`;
        line += `\n   Dose: ${r.dosage} — ${r.frequency}`;
        if (r.route) line += ` (${r.route})`;
        line += `\n   Prescribed by: ${doc}   |   Started: ${r.start_date.slice(0, 10)}`;
        if (r.refills_remaining !== undefined && r.refills_remaining !== null) {
          line += `   |   Refills left: ${r.refills_remaining}`;
        }
        if (r.instructions) line += `\n   📋 ${r.instructions}`;
        return line;
      };

      const sections: string[] = [];
      if (meds.active.length > 0) {
        sections.push(['💚 **Active Medications**', ...meds.active.map(fmtMed)].join('\n\n'));
      }
      if (meds.past.length > 0) {
        const pastLines = meds.past.slice(0, 5).map((r) => {
          const status = r.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
          return fmtMed(r) + `\n   Status: ${status}`;
        });
        sections.push(['📁 **Past Medications**', ...pastLines].join('\n\n'));
      }

      updatedState.reply =
        `Here are your medications on file, ${mFirstName}:\n\n` +
        sections.join('\n\n─────────────────────\n\n') +
        '\n\n🔒 *This information is private and visible only to you.*\n\n' +
        'Would you like to book an appointment or is there anything else I can help you with?';
      updatedState.options = ['Book Appointment', 'View Lab Results', 'Check Upcoming Appointment', "I'm all set"];
      updatedState.current_node = 'DONE';
      break;
    }

    case 'DOCTOR_INFO': {
      const doctors = await listDoctors();
      const listStr = doctors.map((d) => `• Dr. ${d.first_name} ${d.last_name} (${d.specialty})`).join('\n');
      updatedState.reply = `Here are the physicians available at MediCore Health:\n\n${listStr}\n\nWould you like to book a visit with one of our doctors?`;
      updatedState.options = doctors.map((d) => `Book Dr. ${d.last_name}`);
      break;
    }

    case 'SYSTEM_INFO': {
      updatedState.reply = `MediCore Health Clinic Info:\n• Hours: ${CLINIC_HOURS}\n• Phone: ${CLINIC_PHONE}\n• Services: Primary Care, Cardiology, Wellness Checkups, Telehealth, Urgent Care.`;
      updatedState.options = ['Book Appointment', 'Our Doctors', 'Talk to Receptionist'];
      break;
    }

    case 'CHECK_UPCOMING': {
      const appts = await getUpcomingAppointments(updatedState.user_id, updatedState.patient_id);
      if (appts.length === 0) {
        updatedState.reply = 'You have no upcoming scheduled appointments at this time. Would you like to schedule one?';
        updatedState.options = ['Book Appointment', 'Main Menu'];
      } else {
        const apptStr = appts
          ? appts
              .map(
                (a) =>
                  `• ${a.type.toUpperCase()} with ${a.doctor_name} on ${new Date(a.start_time).toLocaleString('en-US')}`,
              )
              .join('\n')
          : '';
        updatedState.reply = `Here is your upcoming schedule:\n\n${apptStr}`;
        updatedState.options = ['Reschedule', 'Cancel Appointment', 'Main Menu'];
      }
      break;
    }

    case 'CANCEL': {
      const appts = await getUpcomingAppointments(updatedState.user_id, updatedState.patient_id);
      if (appts.length > 0) {
        await cancelAppointment(appts[0].id);
        updatedState.reply = `Your upcoming appointment on ${new Date(appts[0].start_time).toLocaleDateString()} has been cancelled.`;
        updatedState.options = ['Book New Appointment', 'Main Menu'];
      } else {
        updatedState.reply = 'No active upcoming appointment was found to cancel.';
        updatedState.options = ['Book Appointment', 'Main Menu'];
      }
      break;
    }

    case 'RESCHEDULE': {
      const appts = await getUpcomingAppointments(updatedState.user_id, updatedState.patient_id);
      if (appts.length > 0) {
        updatedState.reschedule_appointment_id = appts[0].id;
        updatedState.current_node = 'CHOOSE_SLOT';
        const slots = await getAvailableSlots();
        updatedState.available_slots = slots;
        updatedState.reply = 'Sure! Here are available time slots to reschedule your appointment:';
        updatedState.options = slots.map((s) => new Date(s).toLocaleString('en-US'));
      } else {
        updatedState.reply = 'No upcoming appointment was found to reschedule. Would you like to book a new one?';
        updatedState.options = ['Book Appointment', 'Main Menu'];
      }
      break;
    }

    default: {
      updatedState.reply = 'How can I assist you with your health services today?';
      updatedState.options = ['Book Appointment', 'Doctor Info', 'Clinic Hours'];
      break;
    }
  }

  return { nextState: updatedState };
}
