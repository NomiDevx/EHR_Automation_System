/**
 * MediSynx EHR — NotificationService
 *
 * Central service for all outbound email notifications.
 * All public methods are fire-and-forget (they never throw to callers).
 *
 * Usage:
 *   import { notificationService } from '@/lib/notifications';
 *   await notificationService.sendSignupConfirmation(email, firstName, lastName);
 */

import { sendMail } from './mailer';
import {
  signupConfirmationEmail,
  loginWelcomeEmail,
  appointmentConfirmationEmail,
  appointmentUpdateEmail,
  type UpdateType,
} from './email-templates';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AppointmentDetails {
  id: string;
  patient_id: string;
  provider_id?: string | null;
  type: string;
  status: string;
  scheduled_at: string;
  duration_mins: number;
  chief_complaint?: string | null;
  patient?: {
    first_name: string;
    last_name: string;
    email: string;
    mrn?: string;
  } | null;
  provider?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    specialty?: string;
  } | null;
}

// ─── NotificationService ─────────────────────────────────────────────────────

class NotificationService {
  private log(method: string, msg: string): void {
    console.log(`[NotificationService:${method}] ${msg}`);
  }

  private logError(method: string, err: unknown): void {
    console.error(`[NotificationService:${method}] Failed:`, err);
  }

  // ── 1. Signup Confirmation ───────────────────────────────────────────────

  async sendSignupConfirmation(
    email: string,
    firstName: string,
    lastName: string,
  ): Promise<void> {
    try {
      this.log('sendSignupConfirmation', `Sending to ${email}`);
      const html = signupConfirmationEmail({ firstName, lastName, email });
      await sendMail({
        to: email,
        subject: `🏥 Welcome to MediSynx, ${firstName}! Your account is ready`,
        html,
      });
      this.log('sendSignupConfirmation', `✓ Sent to ${email}`);
    } catch (err) {
      this.logError('sendSignupConfirmation', err);
      // Never rethrow — email failure must not block signup
    }
  }

  // ── 2. Login Welcome ─────────────────────────────────────────────────────

  async sendLoginWelcome(
    email: string,
    firstName: string,
    lastName: string,
    loginTime: string,
    ipAddress?: string,
  ): Promise<void> {
    try {
      this.log('sendLoginWelcome', `Sending to ${email}`);
      const html = loginWelcomeEmail({ firstName, lastName, email, loginTime, ipAddress });
      await sendMail({
        to: email,
        subject: `🔐 New sign-in to your MediSynx account`,
        html,
      });
      this.log('sendLoginWelcome', `✓ Sent to ${email}`);
    } catch (err) {
      this.logError('sendLoginWelcome', err);
    }
  }

  // ── 3. Appointment Confirmation (patient + doctor) ───────────────────────

  async sendAppointmentConfirmation(appt: AppointmentDetails): Promise<void> {
    try {
      const patient = appt.patient;
      const provider = appt.provider;

      if (!patient?.email) {
        this.log('sendAppointmentConfirmation', 'Skipping — no patient email');
        return;
      }

      const doctorName = provider
        ? `Dr. ${provider.first_name || ''} ${provider.last_name || ''}`.trim()
        : 'Your Doctor';

      const baseData = {
        patientFirstName: patient.first_name,
        patientLastName: patient.last_name,
        patientEmail: patient.email,
        doctorName,
        doctorSpecialty: provider?.specialty || 'General Practitioner',
        appointmentType: appt.type,
        scheduledAt: appt.scheduled_at,
        durationMins: appt.duration_mins || 30,
        chiefComplaint: appt.chief_complaint || undefined,
        appointmentId: appt.id,
        mrn: patient.mrn,
      };

      // Send to patient
      const patientHtml = appointmentConfirmationEmail({ ...baseData, recipientType: 'patient' });
      await sendMail({
        to: patient.email,
        subject: `📅 Appointment Confirmed — ${doctorName}`,
        html: patientHtml,
      });
      this.log('sendAppointmentConfirmation', `✓ Patient email sent to ${patient.email}`);

      // Send to doctor (if email available)
      if (provider?.email) {
        const doctorHtml = appointmentConfirmationEmail({ ...baseData, recipientType: 'doctor' });
        await sendMail({
          to: provider.email,
          subject: `📅 New Appointment: ${patient.first_name} ${patient.last_name}`,
          html: doctorHtml,
          replyTo: patient.email,
        });
        this.log('sendAppointmentConfirmation', `✓ Doctor email sent to ${provider.email}`);
      }
    } catch (err) {
      this.logError('sendAppointmentConfirmation', err);
    }
  }

  // ── 4. Appointment Update (reschedule / cancel / confirm) ────────────────

  async sendAppointmentUpdate(
    appt: AppointmentDetails,
    updateType: UpdateType,
    reason?: string,
  ): Promise<void> {
    try {
      const patient = appt.patient;
      if (!patient?.email) {
        this.log('sendAppointmentUpdate', 'Skipping — no patient email');
        return;
      }

      const doctorName = appt.provider
        ? `Dr. ${appt.provider.first_name || ''} ${appt.provider.last_name || ''}`.trim()
        : 'Your Doctor';

      const html = appointmentUpdateEmail({
        patientFirstName: patient.first_name,
        patientLastName: patient.last_name,
        patientEmail: patient.email,
        doctorName,
        appointmentType: appt.type,
        scheduledAt: appt.scheduled_at,
        updateType,
        reason,
        appointmentId: appt.id,
      });

      const subjectMap: Record<UpdateType, string> = {
        rescheduled: `🔄 Appointment Rescheduled — ${doctorName}`,
        cancelled: `❌ Appointment Cancelled — ${doctorName}`,
        confirmed: `✅ Appointment Confirmed — ${doctorName}`,
      };

      await sendMail({
        to: patient.email,
        subject: subjectMap[updateType],
        html,
      });
      this.log('sendAppointmentUpdate', `✓ ${updateType} email sent to ${patient.email}`);
    } catch (err) {
      this.logError('sendAppointmentUpdate', err);
    }
  }
}

// ─── Singleton Export ─────────────────────────────────────────────────────────

export const notificationService = new NotificationService();
