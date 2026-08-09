/**
 * MediSynx EHR — Gmail Mailer
 *
 * Supports two auth strategies (auto-detected from .env):
 *  1. Gmail App Password  — set GMAIL_USER + GMAIL_APP_PASSWORD
 *  2. Gmail OAuth2        — set GMAIL_USER + GOOGLE_CLIENT_ID +
 *                           GOOGLE_CLIENT_SECRET + GMAIL_REFRESH_TOKEN
 *
 * Emails are sent from GMAIL_USER (e.g. noreply@yourpractice.com or
 * any Gmail address with an app password generated at
 * https://myaccount.google.com/apppasswords).
 */

import nodemailer, { type Transporter } from 'nodemailer';

// ─── Env Validation ──────────────────────────────────────────────────────────

const GMAIL_USER         = process.env.GMAIL_USER         || '';
const GMAIL_APP_PASSWORD = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s/g, ''); // strip spaces
const GMAIL_REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN || '';
const GOOGLE_CLIENT_ID   = process.env.GOOGLE_CLIENT_ID   || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

// ─── Transporter Factory ─────────────────────────────────────────────────────

function createTransporter(): Transporter {
  // Strategy 1: Gmail App Password (preferred — never expires, zero setup)
  if (GMAIL_USER && GMAIL_APP_PASSWORD) {
    console.log(`[Mailer] Using Gmail App Password for ${GMAIL_USER}`);
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD,
      },
    });
  }

  // Strategy 2: OAuth2 (uses GOOGLE_CLIENT_ID/SECRET + refresh token)
  if (GMAIL_USER && GMAIL_REFRESH_TOKEN && GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
    console.log(`[Mailer] Using Gmail OAuth2 for ${GMAIL_USER}`);
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: GMAIL_USER,
        clientId: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        refreshToken: GMAIL_REFRESH_TOKEN,
      },
    } as any);
  }

  // Fallback: log to console only (no credentials configured)
  console.warn(
    '[Mailer] No Gmail credentials configured — emails will be logged to console only.\n' +
    '  Set GMAIL_USER + GMAIL_APP_PASSWORD in .env to send real emails.',
  );
  return nodemailer.createTransport({ jsonTransport: true });
}

// ─── Singleton ───────────────────────────────────────────────────────────────

let _transporter: Transporter | null = null;

export function getTransporter(): Transporter {
  if (!_transporter) {
    _transporter = createTransporter();
  }
  return _transporter;
}

/** Call this if credentials change at runtime (e.g. env reload) */
export function resetTransporter(): void {
  _transporter = null;
}

// ─── Send Helper ─────────────────────────────────────────────────────────────

export interface MailOptions {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendMail(options: MailOptions): Promise<void> {
  if (!GMAIL_USER && !GMAIL_APP_PASSWORD && !GMAIL_REFRESH_TOKEN) {
    // Dev fallback — just log the email to console
    console.log('\n══════════════════════════════════════════════');
    console.log('[Mailer DEV] Email not sent — no credentials.');
    console.log('To:', options.to);
    console.log('Subject:', options.subject);
    console.log('══════════════════════════════════════════════\n');
    return;
  }

  const transporter = getTransporter();

  const info = await transporter.sendMail({
    from: `"MediSynx EHR" <${GMAIL_USER || 'noreply@medisynx.health'}>`,
    to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
    subject: options.subject,
    html: options.html,
    replyTo: options.replyTo,
    headers: {
      'X-Mailer': 'MediSynx EHR Notification Service',
    },
  });

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Mailer] Email sent — id: ${info.messageId} → ${options.to}`);
  }
}
