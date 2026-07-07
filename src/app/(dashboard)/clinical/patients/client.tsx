'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDate, calculateAge, patientFullName } from '@/lib/utils';
import type { Patient } from '@/lib/types/database';
import { Search, ChevronRight, User } from 'lucide-react';
import { Avatar } from '@/components/ui';

export function PatientListClient({ patients }: { patients: (Patient & { primary_provider: any })[] }) {
  const [search, setSearch] = useState('');

  const filtered = patients.filter((p) =>
    `${p.first_name} ${p.last_name} ${p.mrn} ${p.email ?? ''} ${p.phone ?? ''}`
      .toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
        <input
          id="patient-search"
          type="search"
          placeholder="Search by name, MRN, email, or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-9"
        />
      </div>

      {/* Patient grid cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((patient) => (
          <Link
            key={patient.id}
            href={`/clinical/patients/${patient.id}`}
            id={`patient-card-${patient.id}`}
            className="card-hover group flex items-center gap-4"
          >
            <Avatar
              firstName={patient.first_name}
              lastName={patient.last_name}
              size="lg"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[hsl(var(--foreground))] truncate">
                  {patientFullName(patient)}
                </p>
                <ChevronRight className="w-4 h-4 text-[hsl(var(--muted-foreground))] shrink-0 group-hover:text-blue-400 transition-colors" />
              </div>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                {patient.mrn} · {calculateAge(patient.date_of_birth)}y · {patient.gender}
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5 truncate">
                DOB: {formatDate(patient.date_of_birth)}
              </p>
              {patient.primary_provider && (
                <p className="text-xs text-blue-400 mt-1 truncate">
                  Dr. {patient.primary_provider.last_name} · {patient.primary_provider.specialty}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <User className="w-10 h-10 text-[hsl(var(--muted-foreground))] mx-auto mb-3 opacity-40" />
          <p className="text-sm text-[hsl(var(--muted-foreground))]">No patients found</p>
        </div>
      )}
    </div>
  );
}
