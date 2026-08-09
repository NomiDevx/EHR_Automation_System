/**
 * MediSynx EHR — Branded Email Templates
 *
 * All templates use inline CSS for maximum email-client compatibility.
 * Color palette: Navy #0B2A55 | Cyan #0891B2 | Teal #14B8A6 | Green #4CAF50
 * Font: system-ui → Arial (safe email fallback for Inter)
 */

// ─── Shared Layout Helpers ────────────────────────────────────────────────────

const BRAND_GRADIENT = 'background: linear-gradient(135deg, #0B2A55 0%, #0891B2 60%, #14B8A6 100%);';
const PORTAL_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const LOGO_URL   = `${PORTAL_URL}/images/medisynx-logo-horizontal.png`;
const YEAR = new Date().getFullYear();

/** Base wrapper: white container, brand header, footer */
function baseLayout(
  preheader: string,
  headerIcon: string,
  headerTitle: string,
  headerSubtitle: string,
  body: string,
  accentColor = '#0891B2',
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${headerTitle}</title>
</head>
<body style="margin:0;padding:0;background-color:#F0F4F8;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">

  <!-- Preheader (hidden preview text) -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;color:#F0F4F8;line-height:1px;">
    ${preheader}&#160;&#xFEFF;&#160;&#xFEFF;&#160;&#xFEFF;&#160;&#xFEFF;&#160;&#xFEFF;&#160;&#xFEFF;
  </div>

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
    style="background-color:#F0F4F8;min-height:100vh;">
    <tr>
      <td align="center" style="padding:32px 16px 48px;">

        <!-- Email card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
          style="max-width:600px;background:#ffffff;border-radius:20px;box-shadow:0 4px 40px rgba(11,42,85,0.12);overflow:hidden;">

          <!-- ── HEADER ── -->
          <tr>
            <td style="${BRAND_GRADIENT}padding:0;">
              <!-- Top logo bar -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:24px 32px 0;">
                    <!-- Logo image — uses absolute URL so email clients can fetch it -->
                    <a href="${PORTAL_URL}" style="display:inline-block;text-decoration:none;">
                      <img
                        src="${LOGO_URL}"
                        alt="MediSynx EHR"
                        width="180"
                        height="52"
                        style="display:block;height:52px;width:auto;max-width:180px;border:0;outline:none;object-fit:contain;background:rgba(255,255,255,0.12);border-radius:10px;padding:6px 12px;"
                      />
                    </a>
                  </td>
                </tr>

                <!-- Hero section -->
                <tr>
                  <td style="padding:36px 32px 40px;text-align:center;">
                    <!-- Icon circle -->
                    <div style="display:inline-block;width:72px;height:72px;border-radius:50%;background:rgba(255,255,255,0.2);border:2px solid rgba(255,255,255,0.3);text-align:center;line-height:72px;font-size:32px;margin-bottom:20px;">
                      ${headerIcon}
                    </div>
                    <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;line-height:1.2;">
                      ${headerTitle}
                    </h1>
                    <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.82);line-height:1.5;">
                      ${headerSubtitle}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Colorful accent bar -->
          <tr>
            <td style="height:4px;background:linear-gradient(90deg,#14B8A6,#4CAF50,#0891B2,#14B8A6);background-size:200% auto;"></td>
          </tr>

          <!-- ── BODY ── -->
          <tr>
            <td style="padding:36px 32px 28px;">
              ${body}
            </td>
          </tr>

          <!-- ── FOOTER ── -->
          <tr>
            <td style="background:#F8FAFC;border-top:1px solid #E2E8F0;padding:24px 32px;border-radius:0 0 20px 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="text-align:center;">
                    <img
                      src="${LOGO_URL}"
                      alt="MediSynx EHR"
                      width="120"
                      height="36"
                      style="display:inline-block;height:36px;width:auto;max-width:120px;border:0;margin-bottom:10px;opacity:0.8;"
                    />
                    <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#0B2A55;letter-spacing:0.5px;">
                      Smart Records. Better Care.
                    </p>
                    <p style="margin:0 0 12px;font-size:11px;color:#94A3B8;">
                      This is an automated notification from your healthcare portal.
                    </p>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 12px;">
                      <tr>
                        <td style="padding:0 8px;">
                          <a href="${PORTAL_URL}" style="font-size:11px;color:${accentColor};text-decoration:none;font-weight:600;">Visit Portal</a>
                        </td>
                        <td style="color:#CBD5E1;font-size:11px;">|</td>
                        <td style="padding:0 8px;">
                          <a href="${PORTAL_URL}/contact" style="font-size:11px;color:${accentColor};text-decoration:none;font-weight:600;">Support</a>
                        </td>
                        <td style="color:#CBD5E1;font-size:11px;">|</td>
                        <td style="padding:0 8px;">
                          <a href="${PORTAL_URL}" style="font-size:11px;color:#94A3B8;text-decoration:none;">Unsubscribe</a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:0;font-size:10px;color:#CBD5E1;">
                      © ${YEAR} MediSynx Health Systems. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

/** A two-column detail row pill used inside info cards */
function detailRow(label: string, value: string): string {
  return `
  <tr>
    <td style="padding:10px 0;border-bottom:1px solid #F1F5F9;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="font-size:11px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:0.8px;width:40%;vertical-align:top;padding-right:12px;">
            ${label}
          </td>
          <td style="font-size:13px;font-weight:600;color:#0F172A;text-align:right;">
            ${value}
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

/** Colored info card with icon + title + detail rows */
function infoCard(
  icon: string,
  title: string,
  rows: Array<[string, string]>,
  borderColor: string,
  bgColor: string,
): string {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
    style="background:${bgColor};border-radius:14px;border-left:4px solid ${borderColor};margin-bottom:20px;overflow:hidden;">
    <tr>
      <td style="padding:16px 20px 4px;">
        <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:${borderColor};">
          ${icon} ${title}
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          ${rows.map(([l, v]) => detailRow(l, v)).join('')}
        </table>
      </td>
    </tr>
    <tr><td style="height:12px;"></td></tr>
  </table>`;
}

/** Big CTA button */
function ctaButton(text: string, url: string, color = '#0891B2'): string {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px auto 0;">
    <tr>
      <td style="border-radius:12px;background:linear-gradient(135deg,#0B2A55,${color});box-shadow:0 4px 16px rgba(8,145,178,0.3);">
        <a href="${url}" style="display:inline-block;padding:14px 36px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.3px;border-radius:12px;">
          ${text} →
        </a>
      </td>
    </tr>
  </table>`;
}

// ─── Template 1: Signup Confirmation ─────────────────────────────────────────

export interface SignupEmailData {
  firstName: string;
  lastName: string;
  email: string;
}

export function signupConfirmationEmail(data: SignupEmailData): string {
  const fullName = `${data.firstName} ${data.lastName}`.trim();

  const body = `
    <!-- Greeting -->
    <h2 style="margin:0 0 6px;font-size:20px;font-weight:800;color:#0B2A55;">
      Welcome, ${data.firstName}! 🎉
    </h2>
    <p style="margin:0 0 24px;font-size:14px;color:#475569;line-height:1.6;">
      Your MediSynx Patient Portal account has been successfully created. You can now access your health records, book appointments, and communicate securely with your care team.
    </p>

    ${infoCard('👤', 'Your Account Details', [
      ['Full Name', fullName],
      ['Email', data.email],
      ['Account Type', 'Patient Portal'],
      ['Account Status', '<span style="color:#16A34A;font-weight:700;">✓ Active</span>'],
    ], '#4CAF50', '#F0FDF4')}

    <!-- What you can do -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
      style="background:linear-gradient(135deg,#EFF6FF,#F0FDFA);border-radius:14px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 14px;font-size:13px;font-weight:700;color:#0891B2;">✨ What you can do with your account</p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            ${[
              ['📅', 'Book & manage appointments online'],
              ['📋', 'View your medical records & lab results'],
              ['💊', 'Track prescriptions & medications'],
              ['💬', 'Message your care team securely'],
              ['📊', 'Log vitals & track your health trends'],
            ].map(([icon, text]) => `
              <tr>
                <td style="padding:5px 0;font-size:13px;color:#334155;">
                  <span style="margin-right:8px;">${icon}</span>${text}
                </td>
              </tr>
            `).join('')}
          </table>
        </td>
      </tr>
    </table>

    ${ctaButton('Go to Your Dashboard', `${PORTAL_URL}/portal`, '#0891B2')}

    <p style="margin:28px 0 0;font-size:12px;color:#94A3B8;text-align:center;line-height:1.5;">
      If you didn't create this account, please contact us immediately at<br/>
      <a href="mailto:support@medisynx.health" style="color:#0891B2;text-decoration:none;font-weight:600;">support@medisynx.health</a>
    </p>
  `;

  return baseLayout(
    `Welcome to MediSynx, ${data.firstName}! Your patient portal account is ready.`,
    '🏥',
    'Account Created Successfully',
    'Your MediSynx Patient Portal is ready to use',
    body,
    '#4CAF50',
  );
}

// ─── Template 2: Login Welcome ────────────────────────────────────────────────

export interface LoginEmailData {
  firstName: string;
  lastName: string;
  email: string;
  loginTime: string;  // ISO string
  ipAddress?: string;
}

export function loginWelcomeEmail(data: LoginEmailData): string {
  const loginDate = new Date(data.loginTime).toLocaleString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long',
    day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  });

  const body = `
    <h2 style="margin:0 0 6px;font-size:20px;font-weight:800;color:#0B2A55;">
      Welcome back, ${data.firstName}! 👋
    </h2>
    <p style="margin:0 0 24px;font-size:14px;color:#475569;line-height:1.6;">
      A successful sign-in to your MediSynx Patient Portal was detected. If this was you, no action is needed.
    </p>

    ${infoCard('🔐', 'Sign-In Activity', [
      ['Name', `${data.firstName} ${data.lastName}`],
      ['Email', data.email],
      ['Date & Time', loginDate],
      ...(data.ipAddress ? [['IP Address', data.ipAddress] as [string, string]] : []),
      ['Status', '<span style="color:#16A34A;font-weight:700;">✓ Successful</span>'],
    ], '#0891B2', '#EFF6FF')}

    <!-- Security tip -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
      style="background:#FFFBEB;border-radius:14px;border-left:4px solid #F59E0B;margin-bottom:24px;">
      <tr>
        <td style="padding:16px 20px;">
          <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#B45309;">🛡️ Security Reminder</p>
          <p style="margin:0;font-size:12px;color:#78350F;line-height:1.6;">
            MediSynx will <strong>never</strong> ask for your password via email or phone. 
            If you didn't sign in just now, please 
            <a href="${PORTAL_URL}/contact" style="color:#B45309;font-weight:700;">contact support</a> immediately 
            and change your password.
          </p>
        </td>
      </tr>
    </table>

    ${ctaButton('Open Your Portal', `${PORTAL_URL}/portal`, '#0891B2')}

    <p style="margin:28px 0 0;font-size:12px;color:#94A3B8;text-align:center;">
      Didn't sign in? <a href="${PORTAL_URL}/contact" style="color:#DC2626;font-weight:600;">Report suspicious activity</a>
    </p>
  `;

  return baseLayout(
    `New sign-in to MediSynx on ${loginDate}.`,
    '🔐',
    'New Sign-In Detected',
    'We noticed a successful login to your account',
    body,
    '#0891B2',
  );
}

// ─── Template 3: Appointment Booking Confirmation ─────────────────────────────

export interface AppointmentEmailData {
  patientFirstName: string;
  patientLastName: string;
  patientEmail: string;
  doctorName: string;
  doctorSpecialty: string;
  appointmentType: string;
  scheduledAt: string;   // ISO string
  durationMins: number;
  chiefComplaint?: string;
  appointmentId: string;
  mrn?: string;
  /** 'patient' or 'doctor' — controls which version of the email is rendered */
  recipientType?: 'patient' | 'doctor';
}

export function appointmentConfirmationEmail(data: AppointmentEmailData): string {
  const isDoctor = data.recipientType === 'doctor';
  const apptDate = new Date(data.scheduledAt).toLocaleString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long',
    day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  });
  const apptTypeLabel = data.appointmentType.replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
  const patientName = `${data.patientFirstName} ${data.patientLastName}`.trim();

  const greeting = isDoctor
    ? `You have a new patient appointment scheduled.`
    : `Your appointment has been successfully booked. We look forward to seeing you!`;

  const recipientName = isDoctor ? data.doctorName : data.patientFirstName;

  const body = `
    <h2 style="margin:0 0 6px;font-size:20px;font-weight:800;color:#0B2A55;">
      ${isDoctor ? `New Appointment Scheduled` : `Appointment Confirmed! 📅`}
    </h2>
    <p style="margin:0 0 24px;font-size:14px;color:#475569;line-height:1.6;">
      Hi ${recipientName}, ${greeting}
    </p>

    <!-- Appointment highlight card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
      style="background:linear-gradient(135deg,#0B2A55,#0891B2);border-radius:16px;margin-bottom:20px;overflow:hidden;">
      <tr>
        <td style="padding:24px 28px;text-align:center;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:1px;">
            Appointment Date &amp; Time
          </p>
          <p style="margin:0 0 8px;font-size:22px;font-weight:800;color:#ffffff;line-height:1.2;">
            ${apptDate}
          </p>
          <span style="display:inline-block;background:rgba(255,255,255,0.2);border-radius:20px;padding:4px 16px;font-size:12px;font-weight:700;color:#ffffff;border:1px solid rgba(255,255,255,0.3);">
            ${apptTypeLabel} · ${data.durationMins} min
          </span>
        </td>
      </tr>
    </table>

    ${infoCard('🏥', 'Appointment Details', [
      ['Patient', patientName],
      ...(data.mrn ? [['MRN', `<code style="background:#F1F5F9;padding:2px 8px;border-radius:6px;font-size:12px;">${data.mrn}</code>`] as [string, string]] : []),
      ['Doctor', data.doctorName],
      ['Specialty', data.doctorSpecialty],
      ['Type', apptTypeLabel],
      ['Duration', `${data.durationMins} minutes`],
      ...(data.chiefComplaint ? [['Chief Complaint', data.chiefComplaint] as [string, string]] : []),
      ['Ref. ID', `<code style="background:#F1F5F9;padding:2px 8px;border-radius:6px;font-size:11px;">${data.appointmentId.slice(0, 8).toUpperCase()}</code>`],
    ], '#14B8A6', '#F0FDFA')}

    ${!isDoctor ? `
    <!-- Preparation tips -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
      style="background:linear-gradient(135deg,#EFF6FF,#F0FDFA);border-radius:14px;margin-bottom:24px;">
      <tr>
        <td style="padding:18px 22px;">
          <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#0891B2;">📋 Before Your Appointment</p>
          ${[
            'Arrive 10–15 minutes early to complete any paperwork.',
            'Bring a valid photo ID and your insurance card.',
            'List any current medications and allergies.',
            'Prepare questions you want to ask your doctor.',
          ].map(tip => `<p style="margin:0 0 8px;font-size:12px;color:#334155;">✓ ${tip}</p>`).join('')}
        </td>
      </tr>
    </table>

    ${ctaButton('View in My Portal', `${PORTAL_URL}/portal`, '#0891B2')}
    ` : `
    ${ctaButton('Open Patient Record', `${PORTAL_URL}/clinical/patients`, '#14B8A6')}
    `}

    <p style="margin:28px 0 0;font-size:12px;color:#94A3B8;text-align:center;line-height:1.5;">
      Need to reschedule or cancel?<br/>
      <a href="${PORTAL_URL}/portal" style="color:#0891B2;font-weight:600;">Manage appointments in your portal</a>
    </p>
  `;

  return baseLayout(
    isDoctor
      ? `New appointment: ${patientName} on ${apptDate}.`
      : `Your appointment with ${data.doctorName} on ${apptDate} is confirmed!`,
    '📅',
    isDoctor ? 'New Patient Appointment' : 'Appointment Confirmed',
    isDoctor
      ? `Patient: ${patientName} · ${apptDate}`
      : `You are booked with ${data.doctorName}`,
    body,
    '#14B8A6',
  );
}

// ─── Template 4: Appointment Update (reschedule / cancel) ────────────────────

export type UpdateType = 'rescheduled' | 'cancelled' | 'confirmed';

export interface AppointmentUpdateEmailData {
  patientFirstName: string;
  patientLastName: string;
  patientEmail: string;
  doctorName: string;
  appointmentType: string;
  scheduledAt: string;
  updateType: UpdateType;
  reason?: string;
  appointmentId: string;
}

export function appointmentUpdateEmail(data: AppointmentUpdateEmailData): string {
  const apptDate = new Date(data.scheduledAt).toLocaleString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long',
    day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  });
  const apptTypeLabel = data.appointmentType.replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
  const patientName = `${data.patientFirstName} ${data.patientLastName}`.trim();

  const updateMeta: Record<UpdateType, {
    icon: string; headerTitle: string; headerSubtitle: string;
    badgeColor: string; badgeBg: string; badgeText: string;
    cardBorder: string; cardBg: string; cardTitle: string;
    preheader: string;
  }> = {
    rescheduled: {
      icon: '🔄',
      headerTitle: 'Appointment Rescheduled',
      headerSubtitle: `Your appointment has been moved to a new time`,
      badgeColor: '#B45309', badgeBg: '#FFFBEB', badgeText: 'Rescheduled',
      cardBorder: '#F59E0B', cardBg: '#FFFBEB', cardTitle: '🔄 Updated Appointment',
      preheader: `Your appointment with ${data.doctorName} has been rescheduled to ${apptDate}.`,
    },
    cancelled: {
      icon: '❌',
      headerTitle: 'Appointment Cancelled',
      headerSubtitle: `Your appointment has been cancelled`,
      badgeColor: '#DC2626', badgeBg: '#FEF2F2', badgeText: 'Cancelled',
      cardBorder: '#DC2626', cardBg: '#FEF2F2', cardTitle: '❌ Cancelled Appointment',
      preheader: `Your appointment with ${data.doctorName} has been cancelled.`,
    },
    confirmed: {
      icon: '✅',
      headerTitle: 'Appointment Confirmed',
      headerSubtitle: `Your appointment has been confirmed`,
      badgeColor: '#16A34A', badgeBg: '#F0FDF4', badgeText: 'Confirmed',
      cardBorder: '#16A34A', cardBg: '#F0FDF4', cardTitle: '✅ Confirmed Appointment',
      preheader: `Your appointment with ${data.doctorName} on ${apptDate} is confirmed.`,
    },
  };

  const meta = updateMeta[data.updateType];

  const body = `
    <h2 style="margin:0 0 6px;font-size:20px;font-weight:800;color:#0B2A55;">
      Hi ${data.patientFirstName}, your appointment status has changed.
    </h2>
    <p style="margin:0 0 20px;font-size:14px;color:#475569;line-height:1.6;">
      We're writing to inform you of an update to your upcoming appointment at MediSynx.
    </p>

    <!-- Status badge -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
      <tr>
        <td style="background:${meta.badgeBg};border:1.5px solid ${meta.badgeColor};border-radius:10px;padding:6px 16px;">
          <span style="font-size:13px;font-weight:700;color:${meta.badgeColor};">
            ${meta.icon} Status: ${meta.badgeText}
          </span>
        </td>
      </tr>
    </table>

    ${infoCard(meta.icon, meta.cardTitle, [
      ['Patient', patientName],
      ['Doctor', data.doctorName],
      ['Type', apptTypeLabel],
      [data.updateType === 'cancelled' ? 'Was Scheduled' : 'New Date & Time', apptDate],
      ...(data.reason ? [['Reason', data.reason] as [string, string]] : []),
      ['Ref. ID', `<code style="background:#F1F5F9;padding:2px 8px;border-radius:6px;font-size:11px;">${data.appointmentId.slice(0, 8).toUpperCase()}</code>`],
    ], meta.cardBorder, meta.cardBg)}

    ${data.updateType === 'cancelled' ? `
    <!-- Rebook nudge -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
      style="background:linear-gradient(135deg,#EFF6FF,#F0FDFA);border-radius:14px;margin-bottom:24px;">
      <tr>
        <td style="padding:18px 22px;text-align:center;">
          <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#0B2A55;">Need to reschedule?</p>
          <p style="margin:0;font-size:12px;color:#475569;">
            You can book a new appointment with ${data.doctorName} or another specialist through your patient portal.
          </p>
        </td>
      </tr>
    </table>
    ${ctaButton('Book a New Appointment', `${PORTAL_URL}/portal`, '#0891B2')}
    ` : `
    ${ctaButton('View My Appointments', `${PORTAL_URL}/portal`, '#0891B2')}
    `}

    <p style="margin:28px 0 0;font-size:12px;color:#94A3B8;text-align:center;line-height:1.5;">
      Questions about your appointment?<br/>
      <a href="${PORTAL_URL}/contact" style="color:#0891B2;font-weight:600;">Contact our support team</a>
    </p>
  `;

  return baseLayout(
    meta.preheader,
    meta.icon,
    meta.headerTitle,
    meta.headerSubtitle,
    body,
    meta.cardBorder,
  );
}
