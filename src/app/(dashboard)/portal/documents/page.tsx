import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PortalOnboardingWarning } from '@/components/PortalOnboardingWarning';
import { ClipboardList, Sparkles } from 'lucide-react';

export const metadata: Metadata = { title: 'My Documents | MediSynx EHR' };

export default async function PortalDocumentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: patient } = await supabase.from('patients').select('id').eq('profile_id', user.id).single();
  
  if (!patient) {
    return (
      <PortalOnboardingWarning 
        title="Document Access Restricted" 
        description="To view your signed consent forms, medical IDs, and shared documents, you must first complete your onboarding consultation."
      />
    );
  }

  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .eq('patient_id', patient.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fade-in">
      {/* Header Banner */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#0891B2]/10 text-[#0891B2] border border-[#0891B2]/20">
            <Sparkles className="w-3.5 h-3.5" /> Medical Records Vault
          </span>
          <h1 className="font-cambria text-2xl sm:text-3xl font-bold text-[#0B2A55]">Clinical Documents</h1>
          <p className="text-xs sm:text-sm text-[#475569]">
            {documents?.length ?? 0} signed documents on file
          </p>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-[#0891B2]/10 border border-[#0891B2]/20 flex items-center justify-center text-[#0891B2] shrink-0">
          <ClipboardList className="w-6 h-6" />
        </div>
      </div>

      {documents && documents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {documents.map((doc: any) => (
            <div key={doc.id} className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm flex items-start gap-4 hover:border-[#0891B2] transition-all">
              <div className="w-10 h-10 rounded-xl bg-[#0891B2]/10 border border-[#0891B2]/20 flex items-center justify-center text-[#0891B2] shrink-0">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <p className="font-cambria font-bold text-base text-[#0B2A55]">{doc.name}</p>
                <p className="text-xs text-[#475569] mt-1">
                  Type: {doc.type.replace(/_/g, ' ')} · Uploaded {new Date(doc.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white border border-dashed border-[#E2E8F0] rounded-3xl p-8 max-w-lg mx-auto space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#0891B2]/10 border border-[#0891B2]/20 flex items-center justify-center text-[#0891B2] mx-auto">
            <ClipboardList className="w-7 h-7" />
          </div>
          <h3 className="font-cambria text-lg font-bold text-[#0B2A55]">No Documents Uploaded Yet</h3>
          <p className="text-xs text-[#475569] leading-relaxed max-w-sm mx-auto">
            Your signed consent forms, referral notes, and shared medical records will appear here once uploaded by clinical staff.
          </p>
        </div>
      )}
    </div>
  );
}
