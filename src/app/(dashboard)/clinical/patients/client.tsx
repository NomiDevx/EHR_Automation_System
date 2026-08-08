'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDate, calculateAge, patientFullName } from '@/lib/utils';
import type { Patient } from '@/lib/types/database';
import { Search, ChevronRight, User, MessageSquare, Calendar, Stethoscope, FileText } from 'lucide-react';
import { Avatar } from '@/components/ui';

export function PatientListClient({ patients }: { patients: (Patient & { primary_provider: any })[] }) {
  const [search, setSearch] = useState('');

  const filtered = patients.filter((p) =>
    `${p.first_name} ${p.last_name} ${p.mrn} ${p.email ?? ''} ${p.phone ?? ''}`
      .toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search & Statistics Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
          <input
            id="patient-search"
            type="search"
            placeholder="Search active patients by name, MRN, email, or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0891B2]"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0 text-xs font-semibold text-[#475569]">
          <span className="px-3 py-1.5 rounded-xl bg-[#0891B2]/10 text-[#0891B2] border border-[#0891B2]/20 font-bold">
            {filtered.length} {filtered.length === 1 ? 'Patient' : 'Patients'} Found
          </span>
        </div>
      </div>

      {/* Patient Grid Cards (Responsive 1col mobile, 2col tablet, 3col desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map((patient) => (
          <div
            key={patient.id}
            id={`patient-card-${patient.id}`}
            className="bg-white border border-[#E2E8F0] hover:border-[#0891B2] rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4 group relative"
          >
            <div className="flex items-start gap-3.5">
              <Avatar
                firstName={patient.first_name}
                lastName={patient.last_name}
                size="lg"
                className="shrink-0 border-2 border-[#0891B2]/20 shadow-sm"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <Link
                    href={`/clinical/patients/${patient.id}`}
                    className="font-cambria font-bold text-base text-[#0B2A55] group-hover:text-[#0891B2] transition-colors truncate"
                  >
                    {patientFullName(patient)}
                  </Link>

                  <span className="text-[10px] font-mono font-bold bg-[#0B2A55]/10 text-[#0B2A55] px-2 py-0.5 rounded-md shrink-0">
                    {patient.mrn}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-[#475569] mt-1 flex-wrap">
                  <span className="font-semibold">{calculateAge(patient.date_of_birth)}y</span>
                  <span>·</span>
                  <span className="capitalize">{patient.gender}</span>
                  <span>·</span>
                  <span className="text-[11px] text-[#64748B]">DOB: {formatDate(patient.date_of_birth)}</span>
                </div>

                {patient.primary_provider && (
                  <p className="text-xs text-[#0891B2] font-semibold mt-2 truncate flex items-center gap-1">
                    <Stethoscope className="w-3.5 h-3.5 shrink-0" />
                    <span>Dr. {patient.primary_provider.last_name} · {patient.primary_provider.specialty || 'Cardiology'}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Quick Action Footer */}
            <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-xs">
              {patient.profile_id ? (
                <Link
                  href={`/clinical/messages?to=${patient.profile_id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0891B2] hover:text-[#0B2A55] bg-[#0891B2]/10 hover:bg-[#0891B2]/20 px-3 py-1.5 rounded-xl transition-all"
                  title="Send secure message"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Message</span>
                </Link>
              ) : (
                <span className="text-[11px] text-[#94A3B8] italic">No portal user</span>
              )}

              <Link
                href={`/clinical/patients/${patient.id}`}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#0B2A55] hover:text-[#0891B2] transition-colors"
              >
                <span>View Chart</span>
                <ChevronRight className="w-4 h-4 text-[#0891B2] group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl text-center py-16 px-4 shadow-sm">
          <User className="w-12 h-12 text-[#94A3B8] mx-auto mb-3 opacity-40" />
          <h3 className="font-cambria text-base font-bold text-[#0B2A55]">No Patients Found</h3>
          <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
            No matching patient records were found for &quot;{search}&quot;. Try modifying your search criteria.
          </p>
        </div>
      )}
    </div>
  );
}
