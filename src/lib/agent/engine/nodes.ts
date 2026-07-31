import { AgentState, ConversationNode } from './types';
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
      if (updatedState.user_id && !patientName) {
        const patient = await lookupPatientByUserId(updatedState.user_id);
        if (patient) {
          patientName = `${patient.first_name} ${patient.last_name}`;
          updatedState.patient_id = patient.id;
          updatedState.patient_name = patientName;
        }
      }

      if (patientName) {
        updatedState.reply = `Hello ${patientName}! Welcome back to MediCore Health. I can help you schedule an appointment, check your records, or answer any questions. What would you like to do today?`;
        updatedState.options = ['Book Appointment', 'Check Records', 'Clinic Hours', 'Talk to Receptionist'];
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
