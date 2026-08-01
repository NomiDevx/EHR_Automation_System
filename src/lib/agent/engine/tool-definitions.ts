/**
 * Groq-compatible tool definitions for the MediCore EHR AI Agent.
 * These follow the OpenAI function-calling JSON schema spec.
 */
export const AGENT_TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'lookupPatient',
      description:
        'Look up the patient record for the current user. Call this first when you need the patient ID, name, or date of birth.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'getClinicInfo',
      description:
        'Return clinic hours, phone number, address, available services, and insurance info.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'listDoctors',
      description:
        'List all available doctors at the clinic with their specialty and availability.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'getUpcomingAppointments',
      description:
        "Fetch the patient's upcoming scheduled appointments. Use when the patient asks about their next visit, schedule, or upcoming appointments.",
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'getAvailableSlots',
      description:
        'Get available appointment time slots for a specific doctor. Returns a list of ISO datetime strings.',
      parameters: {
        type: 'object',
        properties: {
          doctor_id: {
            type: 'string',
            description:
              'The UUID of the doctor to get slots for. Leave blank to get slots for any available doctor.',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'bookAppointment',
      description:
        'Book a new appointment for the patient. Only call this AFTER you have confirmed: the appointment type, doctor, and time slot with the patient.',
      parameters: {
        type: 'object',
        properties: {
          doctor_id: {
            type: 'string',
            description: 'The UUID of the chosen doctor.',
          },
          slot_iso: {
            type: 'string',
            description: 'The ISO 8601 datetime string for the appointment slot.',
          },
          appointment_type: {
            type: 'string',
            enum: ['new_patient', 'follow_up', 'urgent', 'telehealth', 'wellness'],
            description: 'The type of appointment to book.',
          },
          chief_complaint: {
            type: 'string',
            description: 'Optional brief reason or chief complaint for the visit.',
          },
        },
        required: ['slot_iso', 'appointment_type'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'cancelAppointment',
      description:
        "Cancel the patient's upcoming appointment. Only call this after the patient explicitly confirms they want to cancel.",
      parameters: {
        type: 'object',
        properties: {
          appointment_id: {
            type: 'string',
            description:
              'The UUID of the appointment to cancel. If not provided, the soonest upcoming appointment is cancelled.',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'rescheduleAppointment',
      description:
        "Reschedule the patient's existing appointment to a new time slot.",
      parameters: {
        type: 'object',
        properties: {
          appointment_id: {
            type: 'string',
            description: 'The UUID of the appointment to reschedule.',
          },
          new_slot_iso: {
            type: 'string',
            description: 'The new ISO 8601 datetime string for the rescheduled appointment.',
          },
        },
        required: ['new_slot_iso'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'getLabResults',
      description:
        "Fetch the patient's lab test results, blood work, pathology, or diagnostic reports.",
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'getMedications',
      description:
        "Fetch the patient's current and past medications and prescriptions.",
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'getPatientHistory',
      description:
        "Fetch a summary of the patient's medical history including conditions, allergies, and previous visits.",
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
] as const;

export type AgentToolName =
  | 'lookupPatient'
  | 'getClinicInfo'
  | 'listDoctors'
  | 'getUpcomingAppointments'
  | 'getAvailableSlots'
  | 'bookAppointment'
  | 'cancelAppointment'
  | 'rescheduleAppointment'
  | 'getLabResults'
  | 'getMedications'
  | 'getPatientHistory';
