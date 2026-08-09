/**
 * POST /api/notifications/test-email
 * DEV-ONLY — sends all 4 test emails to a hardcoded address.
 * Remove this file before going to production.
 */

import { NextResponse } from 'next/server';
import { notificationService } from '@/lib/notifications';

// ── Hardcoded test recipient ──────────────────────────────────────────────────
const TEST_EMAIL = 'nomiash1122@gmail.com';
const TEST_FIRST = 'Nomi';
const TEST_LAST  = 'Dev';

export async function POST(): Promise<NextResponse> {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(); // +3 days
    const cancelDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(); // +5 days

    await Promise.allSettled([
      // 1. Signup confirmation
      notificationService.sendSignupConfirmation(TEST_EMAIL, TEST_FIRST, TEST_LAST),

      // 2. Login welcome
      notificationService.sendLoginWelcome(
        TEST_EMAIL, TEST_FIRST, TEST_LAST,
        new Date().toISOString(),
        '192.168.1.1',
      ),

      // 3. Appointment booking confirmation (patient + doctor copy)
      notificationService.sendAppointmentConfirmation({
        id: 'test-appt-0001',
        patient_id: 'test-patient-id',
        type: 'follow_up',
        status: 'scheduled',
        scheduled_at: futureDate,
        duration_mins: 30,
        chief_complaint: 'Routine follow-up and medication review',
        patient: {
          first_name: TEST_FIRST,
          last_name: TEST_LAST,
          email: TEST_EMAIL,
          mrn: 'MRN-TEST-001',
        },
        provider: {
          first_name: 'Sarah',
          last_name: 'Johnson',
          email: TEST_EMAIL, // doctor copy also goes to test address
          specialty: 'Internal Medicine',
        },
      }),

      // 4. Appointment cancellation email
      notificationService.sendAppointmentUpdate(
        {
          id: 'test-appt-0002',
          patient_id: 'test-patient-id',
          type: 'general_consultation',
          status: 'cancelled',
          scheduled_at: cancelDate,
          duration_mins: 45,
          patient: {
            first_name: TEST_FIRST,
            last_name: TEST_LAST,
            email: TEST_EMAIL,
          },
          provider: {
            first_name: 'Michael',
            last_name: 'Patel',
            specialty: 'Cardiology',
          },
        },
        'cancelled',
        'Doctor unavailable — please rebook at your convenience.',
      ),
    ]);

    return NextResponse.json({
      success: true,
      message: `4 test emails sent to ${TEST_EMAIL}`,
      sentTo: TEST_EMAIL,
      types: ['signup_confirmation', 'login_welcome', 'appointment_confirmation', 'appointment_cancelled'],
    });
  } catch (err: any) {
    console.error('[/api/notifications/test-email]', err?.message);
    return NextResponse.json({ error: err?.message || 'Failed to send emails' }, { status: 500 });
  }
}
