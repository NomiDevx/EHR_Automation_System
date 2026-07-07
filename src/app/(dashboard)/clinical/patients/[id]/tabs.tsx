'use client';

import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import { formatDate, formatDateTime, ALLERGY_SEVERITY_COLORS, PRESCRIPTION_STATUS_COLORS, LAB_FLAG_COLORS } from '@/lib/utils';
import type { Vitals, ClinicalNote, Allergy, Prescription, LabOrder, Immunization, Appointment, Patient } from '@/lib/types/database';
import { cn, humanizeLabel } from '@/lib/utils';
import { FileText, Activity, Pill, FlaskConical, Syringe, Calendar, AlertTriangle, CheckCircle2, Clock, Lock } from 'lucide-react';
import Link from 'next/link';

type Tab = 'notes' | 'vitals' | 'medications' | 'labs' | 'allergies' | 'immunizations' | 'appointments';

interface Props {
  patientId: string;
  vitals: (Vitals & { recorder: any })[];
  notes: (ClinicalNote & { provider: any })[];
  allergies: Allergy[];
  prescriptions: (Prescription & { prescriber: any })[];
  labOrders: (LabOrder & { results: any[]; ordering_provider: any })[];
  immunizations: Immunization[];
  appointments: (Appointment & { provider: any })[];
  patient: Patient;
}

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'notes', label: 'SOAP Notes', icon: FileText },
  { id: 'vitals', label: 'Vitals', icon: Activity },
  { id: 'medications', label: 'Medications', icon: Pill },
  { id: 'labs', label: 'Labs', icon: FlaskConical },
  { id: 'allergies', label: 'Allergies', icon: AlertTriangle },
  { id: 'immunizations', label: 'Immunizations', icon: Syringe },
  { id: 'appointments', label: 'Appointments', icon: Calendar },
];

export function PatientChartTabs({ patientId, vitals, notes, allergies, prescriptions, labOrders, immunizations, appointments }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('notes');

  return (
    <div className="card p-0 overflow-hidden">
      {/* Tab bar */}
      <div className="flex overflow-x-auto border-b border-[hsl(var(--border))] bg-[hsl(var(--surface))]">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            id={`chart-tab-${id}`}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-xs font-medium whitespace-nowrap transition-all',
              activeTab === id
                ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/5'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div className="p-5">
        {/* ── SOAP Notes ── */}
        {activeTab === 'notes' && (
          <div className="space-y-3">
            {notes.map((note) => (
              <div key={note.id} className="card-hover border border-[hsl(var(--border))]">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      {note.status === 'signed' ? (
                        <span className="badge bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                          <Lock className="w-3 h-3" /> Signed
                        </span>
                      ) : (
                        <span className="badge bg-amber-500/20 text-amber-300 border-amber-500/30">
                          <Clock className="w-3 h-3" /> Draft
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                      {formatDateTime(note.created_at)} · Dr. {note.provider?.last_name}
                    </p>
                  </div>
                  {note.status === 'draft' && (
                    <Link href={`/clinical/patients/${patientId}/notes/${note.id}`} className="btn-secondary btn text-xs">
                      Edit
                    </Link>
                  )}
                </div>
                {note.subjective && (
                  <div className="space-y-2">
                    {[
                      { label: 'S', title: 'Subjective', value: note.subjective },
                      { label: 'O', title: 'Objective', value: note.objective },
                      { label: 'A', title: 'Assessment', value: note.assessment },
                      { label: 'P', title: 'Plan', value: note.plan },
                    ].map(({ label, title, value }) => value && (
                      <div key={label} className="flex gap-3">
                        <span className="w-6 h-6 rounded-md bg-blue-500/20 text-blue-300 text-xs font-bold flex items-center justify-center shrink-0">
                          {label}
                        </span>
                        <div>
                          <p className="text-xs font-medium text-[hsl(var(--muted-foreground))]">{title}</p>
                          <p className="text-sm text-[hsl(var(--foreground))] mt-0.5 whitespace-pre-wrap">{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {notes.length === 0 && <p className="text-center py-8 text-sm text-[hsl(var(--muted-foreground))]">No clinical notes</p>}
          </div>
        )}

        {/* ── Vitals ── */}
        {activeTab === 'vitals' && (
          <div className="space-y-6">
            {/* Trend chart — BP */}
            {vitals.length > 1 && (
              <div>
                <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-3">Blood Pressure Trend</p>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[...vitals].reverse()} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="recorded_at" tickFormatter={(v) => formatDate(v, 'MMM d')} tick={{ fontSize: 10, fill: 'hsl(215 20% 55%)' }} />
                      <YAxis tick={{ fontSize: 10, fill: 'hsl(215 20% 55%)' }} domain={[60, 200]} />
                      <Tooltip
                        contentStyle={{ background: 'hsl(222 47% 11%)', border: '1px solid hsl(222 25% 20%)', borderRadius: 8 }}
                        labelStyle={{ color: 'hsl(213 31% 91%)', fontSize: 11 }}
                        formatter={(v: any, name: any) => [v, name === 'systolic_bp' ? 'Systolic' : 'Diastolic'] as any}
                      />
                      <ReferenceLine y={140} stroke="rgba(239,68,68,0.4)" strokeDasharray="3 3" />
                      <ReferenceLine y={90} stroke="rgba(239,68,68,0.2)" strokeDasharray="3 3" />
                      <Line type="monotone" dataKey="systolic_bp" stroke="#3b82f6" dot={{ r: 3, fill: '#3b82f6' }} strokeWidth={2} />
                      <Line type="monotone" dataKey="diastolic_bp" stroke="#818cf8" dot={{ r: 3, fill: '#818cf8' }} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Latest vitals table */}
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th><th>BP</th><th>HR</th><th>Temp</th><th>Weight</th><th>SpO₂</th><th>Pain</th><th>By</th>
                  </tr>
                </thead>
                <tbody>
                  {vitals.map((v) => (
                    <tr key={v.id}>
                      <td className="text-xs whitespace-nowrap">{formatDate(v.recorded_at, 'MMM d, yyyy h:mm a')}</td>
                      <td className={cn('font-mono text-sm', (v.systolic_bp ?? 0) >= 140 ? 'text-red-400' : 'text-[hsl(var(--foreground))]')}>
                        {v.systolic_bp}/{v.diastolic_bp}
                      </td>
                      <td className="font-mono text-sm">{v.heart_rate ?? '—'}</td>
                      <td className="font-mono text-sm">{v.temperature_f ? `${v.temperature_f}°F` : '—'}</td>
                      <td className="font-mono text-sm">{v.weight_lbs ? `${v.weight_lbs} lbs` : '—'}</td>
                      <td className={cn('font-mono text-sm', (v.spo2_pct ?? 100) < 94 ? 'text-red-400' : 'text-[hsl(var(--foreground))]')}>
                        {v.spo2_pct ? `${v.spo2_pct}%` : '—'}
                      </td>
                      <td>{v.pain_scale ?? '—'}/10</td>
                      <td className="text-xs text-[hsl(var(--muted-foreground))]">
                        {v.recorder?.first_name} {v.recorder?.last_name}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {vitals.length === 0 && <p className="text-center py-8 text-sm text-[hsl(var(--muted-foreground))]">No vitals recorded</p>}
            </div>
          </div>
        )}

        {/* ── Medications ── */}
        {activeTab === 'medications' && (
          <div className="space-y-2">
            {prescriptions.map((rx) => (
              <div key={rx.id} className="flex items-center justify-between py-3 border-b border-[hsl(var(--border-muted))] last:border-0">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                      {rx.drug_name}
                      {rx.drug_generic_name && <span className="text-[hsl(var(--muted-foreground))] font-normal"> ({rx.drug_generic_name})</span>}
                    </p>
                    <span className={cn('badge text-xs', PRESCRIPTION_STATUS_COLORS[rx.status])}>{rx.status}</span>
                    {rx.interaction_flagged && (
                      <span className="badge bg-orange-500/20 text-orange-300 border-orange-500/30 text-xs">
                        <AlertTriangle className="w-2.5 h-2.5" /> Interaction
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                    {rx.dosage} · {rx.frequency} · {rx.route ?? 'oral'}
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    Prescribed by Dr. {rx.prescriber?.last_name} · Started {formatDate(rx.start_date)}
                    {rx.refills_remaining > 0 && ` · ${rx.refills_remaining} refills`}
                  </p>
                </div>
              </div>
            ))}
            {prescriptions.length === 0 && <p className="text-center py-8 text-sm text-[hsl(var(--muted-foreground))]">No prescriptions</p>}
          </div>
        )}

        {/* ── Labs ── */}
        {activeTab === 'labs' && (
          <div className="space-y-4">
            {labOrders.map((order) => (
              <div key={order.id} className="card border border-[hsl(var(--border))]">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-[hsl(var(--foreground))]">{order.test_name}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      Ordered {formatDate(order.ordered_at)} · {order.priority.toUpperCase()} · Dr. {order.ordering_provider?.last_name}
                    </p>
                  </div>
                  <span className={cn('badge text-xs', {
                    ordered: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
                    resulted: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                    in_progress: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
                    collected: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
                    cancelled: 'bg-red-500/20 text-red-300 border-red-500/30',
                  }[order.status])}>
                    {order.status}
                  </span>
                </div>
                {order.results?.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="data-table">
                      <thead>
                        <tr><th>Component</th><th>Value</th><th>Unit</th><th>Reference</th><th>Flag</th></tr>
                      </thead>
                      <tbody>
                        {order.results.map((r: any) => (
                          <tr key={r.id}>
                            <td className="text-sm">{r.component_name}</td>
                            <td className={cn('font-mono font-semibold text-sm', LAB_FLAG_COLORS[r.flag as keyof typeof LAB_FLAG_COLORS])}>{r.value}</td>
                            <td className="text-xs text-[hsl(var(--muted-foreground))]">{r.unit ?? '—'}</td>
                            <td className="text-xs text-[hsl(var(--muted-foreground))]">{r.reference_low}–{r.reference_high}</td>
                            <td>
                              {r.flag !== 'normal' && (
                                <span className={cn('badge text-xs', r.flag.includes('critical') ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30')}>
                                  {r.flag.replace(/_/g, ' ')}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
            {labOrders.length === 0 && <p className="text-center py-8 text-sm text-[hsl(var(--muted-foreground))]">No lab orders</p>}
          </div>
        )}

        {/* ── Allergies ── */}
        {activeTab === 'allergies' && (
          <div className="space-y-2">
            {allergies.map((a) => (
              <div key={a.id} className="flex items-center gap-4 py-3 border-b border-[hsl(var(--border-muted))] last:border-0">
                <AlertTriangle className={cn('w-4 h-4 shrink-0', a.severity === 'life_threatening' ? 'text-red-400' : 'text-amber-400')} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[hsl(var(--foreground))]">{a.allergen}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">{a.reaction ?? '—'}</p>
                </div>
                <span className={cn('badge text-xs', ALLERGY_SEVERITY_COLORS[a.severity])}>{a.severity.replace(/_/g, ' ')}</span>
              </div>
            ))}
            {allergies.length === 0 && <p className="text-center py-8 text-sm text-[hsl(var(--muted-foreground))]">NKDA — No known drug allergies</p>}
          </div>
        )}

        {/* ── Immunizations ── */}
        {activeTab === 'immunizations' && (
          <table className="data-table">
            <thead><tr><th>Vaccine</th><th>Date</th><th>Lot</th><th>Site</th><th>Next Due</th></tr></thead>
            <tbody>
              {immunizations.map((imm) => (
                <tr key={imm.id}>
                  <td className="text-sm font-medium">{imm.vaccine_name}</td>
                  <td className="text-xs">{formatDate(imm.administered_at)}</td>
                  <td className="text-xs font-mono text-[hsl(var(--muted-foreground))]">{imm.lot_number ?? '—'}</td>
                  <td className="text-xs">{imm.site ?? '—'}</td>
                  <td className="text-xs">{imm.next_due_date ? formatDate(imm.next_due_date) : '—'}</td>
                </tr>
              ))}
              {immunizations.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-sm text-[hsl(var(--muted-foreground))]">No immunization records</td></tr>
              )}
            </tbody>
          </table>
        )}

        {/* ── Appointments ── */}
        {activeTab === 'appointments' && (
          <div className="space-y-2">
            {appointments.map((appt) => (
              <div key={appt.id} className="flex items-center gap-4 py-3 border-b border-[hsl(var(--border-muted))] last:border-0">
                <div className="text-center min-w-[56px]">
                  <p className="text-sm font-bold text-[hsl(var(--foreground))]">{formatDate(appt.scheduled_at, 'd')}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">{formatDate(appt.scheduled_at, 'MMM yyyy')}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[hsl(var(--foreground))]">{appt.chief_complaint ?? humanizeLabel(appt.type)}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    Dr. {appt.provider?.last_name} · {appt.duration_mins} min
                  </p>
                </div>
                <span className={cn('badge text-xs', {
                  scheduled: 'bg-blue-500/20 text-blue-300',
                  confirmed: 'bg-emerald-500/20 text-emerald-300',
                  completed: 'bg-slate-500/20 text-slate-300',
                  cancelled: 'bg-red-500/20 text-red-300',
                  in_progress: 'bg-amber-500/20 text-amber-300',
                  no_show: 'bg-orange-500/20 text-orange-300',
                }[appt.status])}>{appt.status}</span>
              </div>
            ))}
            {appointments.length === 0 && <p className="text-center py-8 text-sm text-[hsl(var(--muted-foreground))]">No appointments</p>}
          </div>
        )}
      </div>
    </div>
  );
}
