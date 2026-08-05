'use client';

import React, { useState, useMemo } from 'react';
import type { Profile } from '@/lib/types/database';
import {
  Stethoscope, Star, Calendar, Clock, MapPin, Search,
  Award, Video, CheckCircle2, ChevronRight, Sparkles, X,
  ShieldCheck, Phone, Mail, UserCheck, ArrowRight
} from 'lucide-react';
import Image from 'next/image';

interface DoctorShowcaseWidgetProps {
  doctors: Profile[];
  onSelectDoctor?: (doctorId: string) => void;
}

export function DoctorShowcaseWidget({ doctors, onSelectDoctor }: DoctorShowcaseWidgetProps) {
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [previewDoctor, setPreviewDoctor] = useState<Profile | null>(null);

  const specialties = useMemo(() => {
    const set = new Set<string>();
    doctors.forEach((d) => {
      if (d.specialty) set.add(d.specialty);
    });
    return Array.from(set);
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      const matchesSpecialty =
        selectedSpecialty === 'all' ||
        (doc.specialty && doc.specialty.toLowerCase().includes(selectedSpecialty.toLowerCase()));

      const fullName = `${doc.first_name} ${doc.last_name}`.toLowerCase();
      const spec = (doc.specialty || '').toLowerCase();
      const dept = (doc.department || '').toLowerCase();
      const query = searchQuery.toLowerCase();

      const matchesSearch =
        !searchQuery ||
        fullName.includes(query) ||
        spec.includes(query) ||
        dept.includes(query);

      return matchesSpecialty && matchesSearch;
    });
  }, [doctors, selectedSpecialty, searchQuery]);

  const handleBookDoctor = (doctorId: string) => {
    if (onSelectDoctor) {
      onSelectDoctor(doctorId);
    }
    const bookingSection = document.getElementById('booking-section');
    if (bookingSection) {
      bookingSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="min-h-screen flex flex-col justify-center py-16 md:py-24 bg-white border-b border-[#E2E8F0] relative overflow-hidden" id="doctors-section">
      {/* Background Subtle Accent Lights */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-[#0891B2]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -left-20 w-96 h-96 bg-[#14B8A6]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 w-full">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0891B2]/10 border border-[#0891B2]/20 text-[#0891B2] text-xs font-bold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5 text-[#0891B2]" />
            Board-Certified Physicians
          </div>
          <h2 className="font-cambria text-3xl sm:text-5xl font-bold text-[#0B2A55] leading-tight">
            Meet Our Clinical Specialists
          </h2>
          <p className="text-base text-[#475569] leading-relaxed">
            Our medical team combines years of hospital excellence with outpatient digital care. Book a consultation directly with your preferred specialist.
          </p>
        </div>

        {/* Filter Bar & Search */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 shadow-sm">
          {/* Specialty Tabs */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setSelectedSpecialty('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedSpecialty === 'all'
                  ? 'bg-[#0891B2] text-white shadow-md'
                  : 'bg-white text-[#475569] border border-[#E2E8F0] hover:border-[#0891B2]'
              }`}
            >
              All Specialists ({doctors.length})
            </button>
            {specialties.map((spec) => (
              <button
                key={spec}
                onClick={() => setSelectedSpecialty(spec)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedSpecialty === spec
                    ? 'bg-[#0891B2] text-white shadow-md'
                    : 'bg-white text-[#475569] border border-[#E2E8F0] hover:border-[#0891B2]'
                }`}
              >
                {spec}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search doctor or specialty…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#E2E8F0] bg-white text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0891B2] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Doctor Grid */}
        {filteredDoctors.length === 0 ? (
          <div className="text-center py-16 bg-[#F8FAFC] border border-dashed border-[#E2E8F0] rounded-3xl space-y-3">
            <Stethoscope className="w-12 h-12 text-[#94A3B8] mx-auto opacity-50" />
            <h3 className="font-cambria text-lg font-bold text-[#0B2A55]">No Doctors Found</h3>
            <p className="text-xs text-[#475569]">Try clearing your search query or selecting another specialty filter.</p>
            <button
              onClick={() => { setSelectedSpecialty('all'); setSearchQuery(''); }}
              className="px-4 py-2 rounded-xl bg-[#0891B2] text-white text-xs font-bold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredDoctors.map((doc) => (
              <div
                key={doc.id}
                className="group bg-white border border-[#E2E8F0] rounded-3xl p-7 flex flex-col justify-between hover:border-[#14B8A6] hover:shadow-xl transition-all duration-300 relative overflow-hidden"
              >
                {/* Top Badge & Online Status */}
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#0891B2]/10 text-[#0891B2]">
                    <UserCheck className="w-3 h-3" />
                    {doc.specialty || 'General Practitioner'}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-[#16A34A] font-semibold bg-[#16A34A]/10 px-2.5 py-1 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
                    Available Today
                  </div>
                </div>

                {/* Doctor Avatar & Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-[#0891B2]/10 border border-[#0891B2]/20 flex items-center justify-center shrink-0 shadow-sm">
                      {doc.avatar_url ? (
                        <Image
                          src={doc.avatar_url}
                          alt={`${doc.first_name} ${doc.last_name}`}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <span className="font-cambria text-xl font-bold text-[#0891B2]">
                          {doc.first_name[0]}{doc.last_name[0]}
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="font-cambria text-xl font-bold text-[#0B2A55] leading-snug">
                        Dr. {doc.first_name} {doc.last_name}
                      </h3>
                      <p className="text-xs text-[#475569] font-medium mt-0.5">
                        {doc.department || 'Outpatient Clinical Department'}
                      </p>
                      {doc.npi_number && (
                        <p className="text-[10px] text-[#94A3B8] font-mono mt-0.5">
                          NPI: {doc.npi_number}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Highlights Grid */}
                  <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#F1F5F9] flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
                      <div>
                        <p className="font-bold text-[#0F172A] leading-none">4.9 ★</p>
                        <p className="text-[10px] text-[#94A3B8]">Patient Score</p>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#F1F5F9] flex items-center gap-2">
                      <Award className="w-4 h-4 text-[#0891B2] shrink-0" />
                      <div>
                        <p className="font-bold text-[#0F172A] leading-none">12+ Yrs</p>
                        <p className="text-[10px] text-[#94A3B8]">Experience</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Consultation Types Supported */}
                <div className="pt-4 border-t border-[#F1F5F9] space-y-3 mt-5">
                  <div className="flex items-center gap-3 text-xs text-[#475569]">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#0891B2]" /> In-Person
                    </span>
                    <span className="flex items-center gap-1">
                      <Video className="w-3.5 h-3.5 text-[#16A34A]" /> Telehealth
                    </span>
                  </div>

                  {/* CTA Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setPreviewDoctor(doc)}
                      className="w-full py-2.5 rounded-xl border border-[#E2E8F0] text-[#475569] text-xs font-semibold hover:bg-[#F8FAFC] transition-all"
                    >
                      Quick Bio
                    </button>
                    <button
                      onClick={() => handleBookDoctor(doc.id)}
                      className="w-full py-2.5 rounded-xl bg-[#0891B2] text-white text-xs font-bold hover:bg-[#0F766E] transition-all shadow-md flex items-center justify-center gap-1"
                    >
                      Book Consult <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Bottom Gradient Accent Line */}
                <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-[#0B2A55] via-[#0891B2] to-[#4CAF50] group-hover:w-full transition-all duration-500 rounded-b-3xl" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QUICK BIO MODAL */}
      {previewDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative space-y-6">
            <button
              onClick={() => setPreviewDoctor(null)}
              className="absolute top-5 right-5 p-2 rounded-full border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#0891B2]/10 border border-[#0891B2]/30 flex items-center justify-center text-[#0891B2] font-bold text-xl shrink-0">
                {previewDoctor.first_name[0]}{previewDoctor.last_name[0]}
              </div>
              <div>
                <span className="text-xs font-bold text-[#0891B2] uppercase tracking-wider">
                  {previewDoctor.specialty || 'General Practitioner'}
                </span>
                <h3 className="font-cambria text-2xl font-bold text-[#0B2A55]">
                  Dr. {previewDoctor.first_name} {previewDoctor.last_name}
                </h3>
                <p className="text-xs text-[#475569]">{previewDoctor.department || 'Outpatient Clinic'}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-[#475569] leading-relaxed border-y border-[#E2E8F0] py-4">
              <p className="font-semibold text-[#0F172A]">About Dr. {previewDoctor.last_name}:</p>
              <p>
                Board-certified clinical specialist with extensive expertise in outpatient consultations, preventive care plans, diagnostic charts review, and telehealth follow-ups.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="flex items-center gap-2 text-[#0F172A]">
                  <ShieldCheck className="w-4 h-4 text-[#16A34A]" /> Board Certified
                </div>
                <div className="flex items-center gap-2 text-[#0F172A]">
                  <CheckCircle2 className="w-4 h-4 text-[#0891B2]" /> Verified NPI Credentials
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setPreviewDoctor(null)}
                className="px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-xs font-semibold text-[#475569] hover:bg-[#F8FAFC]"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const docId = previewDoctor.id;
                  setPreviewDoctor(null);
                  handleBookDoctor(docId);
                }}
                className="px-6 py-2.5 rounded-xl bg-[#0891B2] text-white text-xs font-bold hover:bg-[#0F766E] shadow-md flex items-center gap-2"
              >
                Book Appointment <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
