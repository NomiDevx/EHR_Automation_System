import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PortalOnboardingWarning } from '@/components/PortalOnboardingWarning';
import { ClipboardList } from 'lucide-react';
import { Card } from '@/components/ui';

export const metadata: Metadata = { title: 'My Documents' };

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

  // If onboarded, fetch any documents (if any)
  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .eq('patient_id', patient.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Documents</h1>

      {documents && documents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((doc: any) => (
            <Card key={doc.id} className="p-4 flex items-start gap-3">
              <ClipboardList className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-[hsl(var(--foreground))]">{doc.name}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                  Type: {doc.type.replace(/_/g, ' ')} · Uploaded {new Date(doc.created_at).toLocaleDateString()}
                </p>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-[hsl(var(--surface))] border border-[hsl(var(--border))]/40 rounded-2xl p-8 max-w-lg mx-auto">
          <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-4">
            <ClipboardList className="w-7 h-7 text-blue-400" />
          </div>
          <p className="text-sm font-semibold text-[hsl(var(--foreground))]">No documents uploaded yet</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1.5 leading-relaxed max-w-sm mx-auto">
            Your signed consent forms, referral notes, and shared medical records will appear here once uploaded by clinical staff.
          </p>
        </div>
      )}
    </div>
  );
}
