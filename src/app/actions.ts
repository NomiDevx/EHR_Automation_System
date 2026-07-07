'use server';

import { createAdminClient } from '@/lib/supabase/server';
import type { Gender, AppointmentType } from '@/lib/types/database';

export interface BookingInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: Gender;
  providerId: string;
  appointmentType: AppointmentType;
  scheduledAt: string;
  chiefComplaint?: string;
}

export async function bookPublicAppointment(data: BookingInput) {
  const supabase = createAdminClient();

  // 1. Look up if patient already exists by email and date of birth
  const { data: existingPatient, error: lookupError } = await supabase
    .from('patients')
    .select('id, mrn')
    .eq('email', data.email)
    .eq('date_of_birth', data.dateOfBirth)
    .maybeSingle();

  if (lookupError) {
    throw new Error(`Failed to lookup patient: ${lookupError.message}`);
  }

  let patientId = existingPatient?.id;
  let mrn = existingPatient?.mrn;

  // 2. If patient does not exist, create a new one
  if (!patientId) {
    // Generate a unique patient record
    const { data: newPatient, error: createError } = await supabase
      .from('patients')
      .insert({
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        date_of_birth: data.dateOfBirth,
        gender: data.gender,
        is_active: true,
        consent_obtained: true,
        consent_date: new Date().toISOString(),
      })
      .select('id, mrn')
      .single();

    if (createError) {
      throw new Error(`Failed to register patient: ${createError.message}`);
    }

    patientId = newPatient.id;
    mrn = newPatient.mrn;
  }

  // 3. Create the appointment
  const { data: appointment, error: appointmentError } = await supabase
    .from('appointments')
    .insert({
      patient_id: patientId,
      provider_id: data.providerId,
      type: data.appointmentType,
      status: 'scheduled',
      scheduled_at: data.scheduledAt,
      duration_mins: 30,
      chief_complaint: data.chiefComplaint || null,
    })
    .select('id')
    .single();

  if (appointmentError) {
    throw new Error(`Failed to create appointment: ${appointmentError.message}`);
  }

  return { success: true, appointmentId: appointment.id, mrn };
}
