import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { formatDate, calculateAge, ALLERGY_SEVERITY_COLORS, PRESCRIPTION_STATUS_COLORS, LAB_FLAG_COLORS } from '@/lib/utils';
import { PatientChartTabs } from './tabs';
import { Avatar, Badge } from '@/components/ui';
import { AlertTriangle, Phone, MapPin, Heart, Calendar, FileText, Plus, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: p } = await supabase.from('patients').select('first_name, last_name').eq('id', id).single();
  return { title: p ? `${p.first_name} ${p.last_name} | Chart` : 'Patient Chart' };
}

export default async function PatientChartPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: patient },
    { data: vitals },
    { data: notes },
    { data: allergies },
    { data: prescriptions },
    { data: labOrders },
    { data: immunizations },
    { data: appointments },
  ] = await Promise.all([
    supabase.from('patients').select('*, primary_provider:profiles!patients_primary_provider_id_fkey(*)').eq('id', id).single(),
    supabase.from('vitals').select('*, recorder:profiles(first_name, last_name)').eq('patient_id', id).order('recorded_at', { ascending: false }).limit(20),
    supabase.from('clinical_notes').select('*, provider:profiles(first_name, last_name, specialty)').eq('patient_id', id).order('created_at', { ascending: false }),
    supabase.from('allergies').select('*').eq('patient_id', id).eq('is_active', true),
    supabase.from('prescriptions').select('*, prescriber:profiles(first_name, last_name)').eq('patient_id', id).order('created_at', { ascending: false }),
    supabase.from('lab_orders').select('*, results:lab_results(*), ordering_provider:profiles(first_name, last_name)').eq('patient_id', id).order('ordered_at', { ascending: false }),
    supabase.from('immunizations').select('*').eq('patient_id', id).order('administered_at', { ascending: false }),
    supabase.from('appointments').select('*, provider:profiles(first_name, last_name)').eq('patient_id', id).order('scheduled_at', { ascending: false }).limit(10),
  ]);

  if (!patient) notFound();

  const hasCriticalAllergies = allergies?.some((a: any) => a.severity === 'life_threatening');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Patient header */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <Avatar firstName={patient.first_name} lastName={patient.last_name} size="xl" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">
                  {patient.first_name} {patient.last_name}
                </h1>
                <div className="flex flex-wrap gap-2 mt-1">
                  <span className="badge bg-blue-500/20 text-blue-300 border-blue-500/30">{patient.mrn}</span>
                  <span className="badge bg-slate-500/20 text-slate-300 border-slate-500/30">
                    {calculateAge(patient.date_of_birth)} years · {patient.gender}
                  </span>
                  {hasCriticalAllergies && (
                    <span className="badge bg-red-500/20 text-red-300 border-red-500/30">
                      <AlertTriangle className="w-3 h-3" />
                      Critical Allergy
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Link
                  href={`/clinical/patients/${id}/notes/new`}
                  id="new-note-btn"
                  className="btn-primary btn text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  SOAP Note
                </Link>
                <Link
                  href={`/clinical/patients/${id}/vitals`}
                  id="add-vitals-btn"
                  className="btn-secondary btn text-xs"
                >
                  + Vitals
                </Link>
                <Link
                  href={`/clinical/patients/${id}/prescriptions`}
                  id="prescribe-btn"
                  className="btn-secondary btn text-xs"
                >
                  + Rx
                </Link>
                <Link
                  href={`/clinical/messages?to=${id}`}
                  id="message-patient-btn"
                  className="btn-secondary btn text-xs flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Message
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
              <div>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Date of Birth</p>
                <p className="text-sm text-[hsl(var(--foreground))]">{formatDate(patient.date_of_birth)}</p>
              </div>
              <div>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Primary Provider</p>
                <p className="text-sm text-[hsl(var(--foreground))]">
                  {patient.primary_provider
                    ? `Dr. ${(patient.primary_provider as any).last_name}`
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Phone</p>
                <p className="text-sm text-[hsl(var(--foreground))]">{patient.phone ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Insurance</p>
                <p className="text-sm text-[hsl(var(--foreground))]">{patient.insurance_provider ?? '—'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Allergy alert bar */}
      {(allergies?.length ?? 0) > 0 && (
        <div className={cn(
          'alert',
          hasCriticalAllergies ? 'alert-error' : 'alert-warning'
        )}>
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Known Allergies</p>
            <p className="text-xs mt-0.5">
              {allergies?.map((a: any) => `${a.allergen} (${a.severity})`).join(' · ')}
            </p>
          </div>
        </div>
      )}

      {/* Tabbed chart sections */}
      <PatientChartTabs
        patientId={id}
        vitals={vitals ?? []}
        notes={notes ?? []}
        allergies={allergies ?? []}
        prescriptions={prescriptions ?? []}
        labOrders={labOrders ?? []}
        immunizations={immunizations ?? []}
        appointments={appointments ?? []}
        patient={patient}
      />
    </div>
  );
}
