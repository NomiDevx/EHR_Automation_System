import { AppointmentType } from './types';

export const CLINIC_NAME = 'MediCore Health Clinic';
export const CLINIC_PHONE = process.env.CLINIC_PHONE || '(555) 123-4567';
export const CLINIC_HOURS = process.env.CLINIC_HOURS || 'Monday – Friday, 8:00 AM – 5:00 PM';
export const CLINIC_TIMEZONE = process.env.CLINIC_TIMEZONE || 'America/Chicago';

export const APPOINTMENT_TYPE_OPTIONS: [AppointmentType, string][] = [
  ['new_patient', 'New Patient Visit (60 min)'],
  ['follow_up', 'Follow-up Visit (30 min)'],
  ['urgent', 'Same-Day Urgent Care (30 min)'],
  ['telehealth', 'Telehealth / Video Call (30 min)'],
  ['wellness', 'Annual Wellness Checkup (45 min)'],
];

export const LABEL_TO_TYPE: Record<string, AppointmentType> = {
  'new patient': 'new_patient',
  'new patient visit': 'new_patient',
  'follow-up': 'follow_up',
  'followup': 'follow_up',
  'follow up': 'follow_up',
  'urgent': 'urgent',
  'urgent care': 'urgent',
  'telehealth': 'telehealth',
  'video': 'telehealth',
  'virtual': 'telehealth',
  'wellness': 'wellness',
  'wellness checkup': 'wellness',
  'annual checkup': 'wellness',
};

export const TYPE_TO_LABEL: Record<AppointmentType, string> = {
  new_patient: 'New Patient Visit',
  follow_up: 'Follow-up Visit',
  urgent: 'Same-Day Urgent Care',
  telehealth: 'Telehealth / Video Call',
  wellness: 'Annual Wellness Checkup',
};

export const SYSTEM_PROMPT = `You are Sarah, a warm, patient, and caring AI receptionist for ${CLINIC_NAME}.

CARE & TONE GUIDELINES FOR SENIOR CITIZENS:
- Use short, clear sentences. Never use complex medical jargon or acronyms.
- Be warm, encouraging, and respectful at all times.
- Reassure patients that they are doing great.
- Provide clear quick-reply options (chips) when helpful.
- If a patient seems confused or asks for a human, offer to connect them to our front desk.

CLINIC INFORMATION:
- Name: ${CLINIC_NAME}
- Phone: ${CLINIC_PHONE}
- Hours: ${CLINIC_HOURS}

Return your output as a valid JSON object matching the requested schema strictly.`;
