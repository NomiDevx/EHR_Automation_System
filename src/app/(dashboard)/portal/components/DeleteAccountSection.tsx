'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, AlertTriangle, X, Loader2 } from 'lucide-react';
import { deleteMyAccount } from '@/app/actions';

const CONFIRM_PHRASE = 'DELETE';

export function DeleteAccountSection() {
  const [modalOpen, setModalOpen] = useState(false);
  const [phrase, setPhrase] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const openModal = () => {
    setPhrase('');
    setError(null);
    setModalOpen(true);
    // Focus the input after the modal animates in
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const closeModal = () => {
    if (isPending) return;
    setModalOpen(false);
    setPhrase('');
    setError(null);
  };

  const handleDelete = () => {
    if (phrase !== CONFIRM_PHRASE) {
      setError(`Type "${CONFIRM_PHRASE}" exactly to confirm.`);
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await deleteMyAccount();
      if ('error' in result) {
        setError(result.error);
        return;
      }
      // Account deleted — redirect to login
      router.push('/login');
    });
  };

  const canConfirm = phrase === CONFIRM_PHRASE && !isPending;

  return (
    <>
      {/* Danger Zone Card */}
      <div className="bg-white border border-red-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex items-center gap-3 border-b border-red-100 pb-4">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <h2 className="font-cambria text-lg font-bold text-red-700">Danger Zone</h2>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-[#0F172A]">Delete My Account</p>
          <p className="text-xs text-[#64748B] leading-relaxed">
            Permanently deletes your portal account, patient record, and all associated data.
            This action is <span className="font-bold text-red-600">irreversible</span> — your
            medical records, appointments, and login access will be removed immediately.
          </p>
        </div>

        <button
          id="delete-account-btn"
          type="button"
          onClick={openModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 text-xs font-bold hover:bg-red-500/20 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete My Account
        </button>
      </div>

      {/* Confirmation Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-fade-in"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8 space-y-5 animate-slide-up">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-cambria text-lg font-bold text-[#0F172A]">Delete Account</h3>
                  <p className="text-xs text-[#64748B]">This cannot be undone</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={isPending}
                className="text-[#94A3B8] hover:text-[#0F172A] transition-colors p-1 rounded-lg hover:bg-[#F1F5F9]"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Warning */}
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 space-y-2">
              <p className="text-xs font-bold text-red-800 uppercase tracking-wider">What will be deleted:</p>
              <ul className="text-xs text-red-700 space-y-1 list-disc list-inside">
                <li>Your patient portal account &amp; login</li>
                <li>All appointments and records</li>
                <li>Medical history and lab results</li>
                <li>Secure messages and documents</li>
              </ul>
            </div>

            {/* Confirmation input */}
            <div className="space-y-2">
              <label htmlFor="delete-confirm-input" className="text-xs font-semibold text-[#0F172A]">
                Type <span className="font-mono font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">{CONFIRM_PHRASE}</span> to confirm:
              </label>
              <input
                ref={inputRef}
                id="delete-confirm-input"
                type="text"
                value={phrase}
                onChange={(e) => { setPhrase(e.target.value); setError(null); }}
                placeholder={CONFIRM_PHRASE}
                disabled={isPending}
                className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2.5 text-sm font-mono text-[#0F172A] placeholder:text-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-red-400/40 focus:border-red-400 transition-all disabled:opacity-50"
                onKeyDown={(e) => { if (e.key === 'Enter' && canConfirm) handleDelete(); }}
              />
              {error && (
                <p className="text-xs text-red-600 font-medium">{error}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={closeModal}
                disabled={isPending}
                id="delete-cancel-btn"
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-[#0F172A] hover:bg-[#F1F5F9] transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={!canConfirm}
                id="delete-confirm-btn"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
