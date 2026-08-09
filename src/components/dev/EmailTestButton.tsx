'use client';

/**
 * ⚠️ DEV-ONLY — EmailTestButton
 * Floating button to fire all 4 test emails to the logged-in user.
 * Remove this component (and its usage) before going to production.
 */

import { useState } from 'react';
import { Mail, X, CheckCircle, AlertCircle, Loader2, Send } from 'lucide-react';

type Status = 'idle' | 'loading' | 'success' | 'error';

export function EmailTestButton() {
  const [status, setStatus]   = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [open, setOpen]       = useState(false);

  const handleSend = async () => {
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/notifications/test-email', { method: 'POST' });

      // Safely parse — avoid "Unexpected token '<'" when server returns HTML
      const text = await res.text();
      let data: any = {};
      try { data = JSON.parse(text); } catch {
        data = { error: `Server error (${res.status}) — check console` };
      }

      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setStatus('success');
      setMessage(data.message || '4 emails sent!');
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message);
    } finally {
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '10px',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Toast card */}
      {open && (
        <div
          style={{
            background: 'linear-gradient(135deg, #0B2A55 0%, #0891B2 100%)',
            borderRadius: '16px',
            padding: '20px 22px',
            boxShadow: '0 8px 40px rgba(8,145,178,0.35)',
            width: '300px',
            color: '#fff',
            animation: 'slideUp 0.25s ease-out',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.5px', opacity: 0.85 }}>
              ⚡ DEV — EMAIL TESTER
            </span>
            <button
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', padding: '2px' }}
            >
              <X size={14} />
            </button>
          </div>

          <p style={{ fontSize: '12px', opacity: 0.75, marginBottom: '14px', lineHeight: 1.5 }}>
            Fires all 4 email types to:<br/>
            <strong style={{ color: '#22D3EE' }}>nomiash1122@gmail.com</strong>
          </p>

          {/* Status message */}
          {message && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: status === 'success' ? 'rgba(74,222,128,0.15)' : 'rgba(252,165,165,0.15)',
              borderRadius: '8px', padding: '8px 10px', marginBottom: '12px',
              border: `1px solid ${status === 'success' ? 'rgba(74,222,128,0.3)' : 'rgba(252,165,165,0.3)'}`,
            }}>
              {status === 'success'
                ? <CheckCircle size={13} color="#4ade80" />
                : <AlertCircle size={13} color="#fca5a5" />
              }
              <span style={{ fontSize: '11px', lineHeight: 1.4 }}>{message}</span>
            </div>
          )}

          {/* Email type badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '14px' }}>
            {['✅ Signup', '🔐 Login', '📅 Appointment', '❌ Cancellation'].map(badge => (
              <span key={badge} style={{
                fontSize: '10px', fontWeight: 600,
                background: 'rgba(255,255,255,0.15)', borderRadius: '20px',
                padding: '3px 10px', border: '1px solid rgba(255,255,255,0.2)',
              }}>
                {badge}
              </span>
            ))}
          </div>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={status === 'loading'}
            style={{
              width: '100%', padding: '10px 0', borderRadius: '10px',
              background: status === 'loading'
                ? 'rgba(255,255,255,0.1)'
                : 'linear-gradient(135deg, #14B8A6, #4CAF50)',
              border: 'none', color: '#fff', fontWeight: 700, fontSize: '13px',
              cursor: status === 'loading' ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 12px rgba(20,184,166,0.3)',
            }}
          >
            {status === 'loading'
              ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Sending…</>
              : <><Send size={13} /> Send 4 Test Emails</>
            }
          </button>
        </div>
      )}

      {/* FAB toggle button */}
      <button
        onClick={() => setOpen(prev => !prev)}
        title="Test Email Notifications"
        style={{
          width: '52px', height: '52px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #0B2A55, #0891B2)',
          border: '2px solid rgba(255,255,255,0.2)',
          boxShadow: '0 4px 20px rgba(8,145,178,0.45)',
          cursor: 'pointer', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          position: 'relative',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)';
          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 28px rgba(8,145,178,0.6)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 20px rgba(8,145,178,0.45)';
        }}
      >
        {/* DEV badge */}
        <span style={{
          position: 'absolute', top: '-4px', right: '-4px',
          background: '#F59E0B', color: '#0B2A55',
          fontSize: '8px', fontWeight: 800, padding: '1px 5px',
          borderRadius: '6px', letterSpacing: '0.3px',
        }}>
          DEV
        </span>
        <Mail size={20} />
      </button>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
