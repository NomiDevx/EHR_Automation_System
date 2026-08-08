'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { Profile } from '@/lib/types/database';
import { HeroSlider } from '@/components/HeroSlider';
import { ProcessStepsWidget } from '@/components/ProcessStepsWidget';
import { DoctorShowcaseWidget } from '@/components/DoctorShowcaseWidget';
import { PublicBookingClient } from '@/components/PublicBookingClient';
import { CustomLoader } from '@/components/ui/CustomLoader';
import {
  Activity, ShieldCheck, Video, Heart, HelpCircle,
  Check, CalendarDays, Clock, Award, ArrowRight,
  Star, Users, Building2, Sparkles, CheckCircle2, Lock,
  ChevronDown, Phone, Mail, Stethoscope, FileText,
  UserCheck, Smartphone, Shield, ArrowUpRight, Zap, Play, RadioReceiver
} from 'lucide-react';

interface HomeClientProps {
  doctors: Profile[];
}

export function HomeClient({ doctors }: HomeClientProps) {
  const [activeTab, setActiveTab] = useState<'patient' | 'doctor' | 'admin'>('patient');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [quickDept, setQuickDept] = useState('General Practice');
  const [quickSlot, setQuickSlot] = useState('09:00 AM Tomorrow');

  const stats = [
    { value: '15,000+', label: 'Patients Served', icon: Users },
    { value: '45+', label: 'Specialist Doctors', icon: Award },
    { value: '99.9%', label: 'Platform Uptime', icon: ShieldCheck },
    { value: '4.9 ★', label: 'Patient Rating', icon: Star },
  ];

  const services = [
    {
      number: '01',
      title: 'Primary Care & Prevention',
      description: 'Comprehensive annual check-ups, routine immunizations, lab screenings, and family health management.',
      icon: Heart,
      badge: 'Preventive Care',
    },
    {
      number: '02',
      title: 'Specialized Cardiology',
      description: 'Advanced EKG diagnostics, heart rhythm monitoring, and personalized cardiovascular care plans.',
      icon: Activity,
      badge: 'Advanced EKG',
    },
    {
      number: '03',
      title: 'Pediatrics & Family Care',
      description: 'Dedicated pediatricians offering wellness assessments, growth tracking, and adolescent consultations.',
      icon: Award,
      badge: 'Family Health',
    },
    {
      number: '04',
      title: 'HD Telehealth Consults',
      description: 'Secure, high-definition virtual visits with our clinicians from the comfort of your home or mobile.',
      icon: Video,
      badge: 'Virtual Visit',
    },
  ];

  const faqs = [
    {
      question: 'Do I need to sign up to book an appointment with MediSynx EHR?',
      answer: 'No. Guest patients can request consultations directly from the public booking widget on this page. Registering for a Patient Portal account allows you to access historical charts, lab results, and message your doctor.',
    },
    {
      question: 'How do I access my MediSynx Patient Portal account?',
      answer: 'After scheduling, or by clicking "Patient Portal" at the top, you can register with your details. If you already have credentials, click "Sign In" in the navigation to enter the secure dashboard.',
    },
    {
      question: 'What is a Medical Record Number (MRN)?',
      answer: 'An MRN is a unique identifier assigned to you in our EHR system. It helps staff check you in quickly on-site. When booking as a guest, your MRN is displayed on the confirmation screen — please keep a note of it.',
    },
    {
      question: 'Are online Telehealth consultations available?',
      answer: 'Yes. MediSynx EHR offers fully integrated virtual video visits. Select "Telehealth Consult" in the appointment form, and your doctor will send a secure link prior to your scheduled time.',
    },
    {
      question: 'Is my health data secure and HIPAA-compliant?',
      answer: 'Yes. MediSynx EHR utilizes 256-bit AES encryption at rest and TLS 1.3 in transit. Our database architecture is HIPAA, ISO 27001, and SOC2 Type II compliant with complete audit logging.',
    },
  ];

  return (
    <div className="relative space-y-0 text-slate-800 font-sans">
      
      {/* Custom Fast Page Loader */}
      <CustomLoader message="Initializing MediSynx EHR…" />

      {/* ── TOP EMERGENCY & PORTAL QUICK ACCESS BANNER ───────────────────── */}
      <div className="bg-[#0B2A55] text-white text-xs font-semibold py-2 px-4 border-b border-blue-900/50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-slate-200">24/7 Virtual Care Available — Urgent Medical Emergency? Call 911 immediately.</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <Link href="/portal" className="text-cyan-300 hover:text-white transition-colors flex items-center gap-1 font-bold">
              <UserCheck className="w-3.5 h-3.5" /> Patient Portal
            </Link>
            <span className="text-slate-600">|</span>
            <Link href="/clinical/patients" className="text-slate-300 hover:text-white transition-colors flex items-center gap-1">
              <Stethoscope className="w-3.5 h-3.5 text-cyan-400" /> Doctor Portal
            </Link>
            <span className="text-slate-600">|</span>
            <Link href="/admin" className="text-slate-300 hover:text-white transition-colors flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-purple-400" /> Admin Access
            </Link>
          </div>
        </div>
      </div>

      {/* Background Cyan & Teal Glow Accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden>
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-[#0891B2]/10 blur-[130px]" />
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] rounded-full bg-[#14B8A6]/10 blur-[120px]" />
        <div className="absolute bottom-10 left-1/4 w-[600px] h-[600px] rounded-full bg-[#4CAF50]/10 blur-[140px]" />
      </div>

      {/* ── SECTION 1: HERO & LIVE QUICK BOOKING CARD (SPLIT DESIGN) ────── */}
      <section className="min-h-[85vh] flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-12 md:py-16 relative">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Headline & Value Proposition */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#0891B2]/30 bg-[#0891B2]/10 text-[#0891B2] text-xs font-bold tracking-wider uppercase shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#0891B2]" />
              MediSynx EHR · #1 Rated Clinical &amp; Telehealth Platform
            </div>

            {/* Main Headline */}
            <h1 className="font-cambria text-4xl sm:text-6xl lg:text-6xl font-extrabold leading-tight tracking-tight text-[#0B2A55]">
              Smart Health Records.{' '}
              <span className="relative inline-block text-[#0891B2]">
                <span className="relative z-10">Extraordinary Care.</span>
                <svg
                  aria-hidden
                  className="absolute -bottom-2 left-0 w-full"
                  viewBox="0 0 300 12"
                  fill="none"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M2 9 Q75 2 150 7 Q225 12 298 5"
                    stroke="#14B8A6"
                    strokeWidth="4"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed font-normal">
              Experience seamless electronic medical records built for patients and clinicians. Schedule instant consultations, connect via HD Telehealth, and access encrypted charts anytime.
            </p>

            {/* Action CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href="#booking-section"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-[#0B2A55] to-[#0891B2] text-white text-xs sm:text-sm font-bold tracking-wide shadow-lg hover:shadow-xl hover:opacity-95 transition-all duration-200"
              >
                <CalendarDays className="w-4 h-4" />
                Book Appointment Now
                <ArrowRight className="w-4 h-4" />
              </a>

              <a
                href="#features-section"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-bold tracking-wide transition-all shadow-sm"
              >
                <Play className="w-3.5 h-3.5 text-[#0891B2]" />
                Explore Platform Capabilities
              </a>
            </div>

            {/* Live Trust Metrics Counter */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-200/80 max-w-2xl">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="space-y-1">
                    <div className="flex items-center gap-2 text-[#0891B2]">
                      <Icon className="w-4 h-4" />
                      <span className="font-cambria text-xl font-bold text-[#0B2A55] leading-none">{stat.value}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Hero Interactive Quick Booking Card */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-5 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#0891B2]/10 border border-[#0891B2]/20 text-[#0891B2] flex items-center justify-center">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Instant Appointment Preview</h3>
                    <p className="text-[11px] text-slate-500">Self-service outpatient reservation</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-bold">
                  No Signup Required
                </span>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Select Department</label>
                  <select
                    value={quickDept}
                    onChange={(e) => setQuickDept(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#0891B2]/30 outline-none"
                  >
                    <option value="General Practice">General Practice &amp; Checkups</option>
                    <option value="Cardiology">Cardiology &amp; EKG</option>
                    <option value="Pediatrics">Pediatrics &amp; Family Care</option>
                    <option value="Telehealth">HD Virtual Telehealth</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Preferred Doctor</label>
                  <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#0891B2] text-white flex items-center justify-center font-bold text-xs">
                        {doctors[0]?.first_name?.[0] || 'D'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">
                          {doctors[0] ? `Dr. ${doctors[0].first_name} ${doctors[0].last_name}` : 'Dr. Sarah Smith'}
                        </p>
                        <p className="text-[10px] text-slate-500">{doctors[0]?.specialty || quickDept}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Available
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Earliest Open Slot</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['09:00 AM Tomorrow', '02:00 PM Tomorrow'].map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setQuickSlot(slot)}
                        className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                          quickSlot === slot
                            ? 'bg-[#0891B2] text-white border-[#0891B2] shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                <a
                  href="#booking-section"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0B2A55] text-white font-bold text-xs hover:bg-[#0891B2] transition-all shadow-md mt-2"
                >
                  Continue to Complete Booking <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Hero Image Slider Below */}
        <div className="max-w-7xl mx-auto w-full pt-8">
          <HeroSlider />
        </div>
      </section>

      {/* ── SECTION 2: INTERACTIVE EHR CAPABILITY TABS ──────────────────── */}
      <section id="features-section" className="py-16 md:py-24 bg-white border-y border-slate-200 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <p className="text-xs font-bold tracking-widest uppercase text-[#0891B2]">Integrated Ecosystem</p>
            <h2 className="font-cambria text-3xl sm:text-5xl font-bold text-[#0B2A55]">
              Built for Patients, Doctors &amp; Administrators
            </h2>
            <p className="text-base text-slate-600">
              MediSynx EHR unifies guest reservations, clinical chart dictation, and hospital management under one high-speed platform.
            </p>
          </div>

          {/* Interactive Role Switcher Tabs */}
          <div className="flex justify-center border-b border-slate-200 max-w-md mx-auto">
            {[
              { key: 'patient', label: 'For Patients', icon: UserCheck },
              { key: 'doctor', label: 'For Physicians', icon: Stethoscope },
              { key: 'admin', label: 'For Administrators', icon: Shield },
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all ${
                    isSelected
                      ? 'border-[#0891B2] text-[#0891B2] bg-[#0891B2]/5'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content Display */}
          <div className="max-w-5xl mx-auto">
            {activeTab === 'patient' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
                <div className="bg-[#F8FAFC] border border-slate-200 p-6 rounded-2xl space-y-3">
                  <CalendarDays className="w-6 h-6 text-[#0891B2]" />
                  <h3 className="font-cambria font-bold text-lg text-slate-900">Instant Guest Booking</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">Reserve consultations in under 60 seconds with instant Medical Record Number (MRN) issuance.</p>
                </div>
                <div className="bg-[#F8FAFC] border border-slate-200 p-6 rounded-2xl space-y-3">
                  <Video className="w-6 h-6 text-[#0891B2]" />
                  <h3 className="font-cambria font-bold text-lg text-slate-900">24/7 Virtual Telehealth</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">Join HD video visits directly from your browser without downloading extra software.</p>
                </div>
                <div className="bg-[#F8FAFC] border border-slate-200 p-6 rounded-2xl space-y-3">
                  <Sparkles className="w-6 h-6 text-[#0891B2]" />
                  <h3 className="font-cambria font-bold text-lg text-slate-900">AI Assistant Sarah</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">Conversational reception assistant to guide booking, check clinic hours, and answer questions.</p>
                </div>
              </div>
            )}

            {activeTab === 'doctor' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
                <div className="bg-[#F8FAFC] border border-slate-200 p-6 rounded-2xl space-y-3">
                  <FileText className="w-6 h-6 text-purple-600" />
                  <h3 className="font-cambria font-bold text-lg text-slate-900">Smart SOAP Notes</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">Fast clinical documentation templates with automated ICD-10 suggestions and sign-off.</p>
                </div>
                <div className="bg-[#F8FAFC] border border-slate-200 p-6 rounded-2xl space-y-3">
                  <Activity className="w-6 h-6 text-purple-600" />
                  <h3 className="font-cambria font-bold text-lg text-slate-900">Live Vitals &amp; Labs</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">Real-time vital signs charting with abnormal result flags and automated lab order tracking.</p>
                </div>
                <div className="bg-[#F8FAFC] border border-slate-200 p-6 rounded-2xl space-y-3">
                  <ShieldCheck className="w-6 h-6 text-purple-600" />
                  <h3 className="font-cambria font-bold text-lg text-slate-900">e-Prescribing System</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">Direct pharmacy medication orders with refill tracking and drug interaction warnings.</p>
                </div>
              </div>
            )}

            {activeTab === 'admin' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
                <div className="bg-[#F8FAFC] border border-slate-200 p-6 rounded-2xl space-y-3">
                  <Building2 className="w-6 h-6 text-emerald-600" />
                  <h3 className="font-cambria font-bold text-lg text-slate-900">Real-Time Bed Occupancy</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">Live hospital capacity tracking, bed availability counters, and patient inflow analytics.</p>
                </div>
                <div className="bg-[#F8FAFC] border border-slate-200 p-6 rounded-2xl space-y-3">
                  <RadioReceiver className="w-6 h-6 text-emerald-600" />
                  <h3 className="font-cambria font-bold text-lg text-slate-900">n8n Automation Webhooks</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">Configure automated webhook notifications for appointment scheduling and clinical alerts.</p>
                </div>
                <div className="bg-[#F8FAFC] border border-slate-200 p-6 rounded-2xl space-y-3">
                  <Shield className="w-6 h-6 text-emerald-600" />
                  <h3 className="font-cambria font-bold text-lg text-slate-900">Full Audit Trail</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">HIPAA-compliant event auditing tracking user access, patient chart edits, and record exports.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: STEP-BY-STEP PROCESS WIDGET ─────────────────────── */}
      <div id="process-section" className="scroll-mt-16">
        <ProcessStepsWidget />
      </div>

      {/* ── SECTION 4: CLINICAL DEPARTMENTS SECTION ────────────────────── */}
      <section className="py-16 md:py-24 bg-[#F8FAFC] border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <p className="text-xs font-bold tracking-widest uppercase text-[#0891B2]">What We Offer</p>
            <h2 className="font-cambria text-3xl sm:text-5xl font-bold text-[#0B2A55] leading-snug">
              Clinical Departments &amp; Care
            </h2>
            <p className="text-base text-slate-600">
              Modern outpatient consultation and diagnostic care across specialized medical fields.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((svc) => {
              const Icon = svc.icon;
              return (
                <div
                  key={svc.number}
                  className="group relative bg-white border border-slate-200 rounded-2xl p-8 space-y-6 hover:border-[#14B8A6] hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-cambria text-4xl font-extrabold text-[#0891B2]/20 group-hover:text-[#0891B2]/40 transition-colors">
                        {svc.number}
                      </span>
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#0891B2]/10 text-[#0891B2]">
                        {svc.badge}
                      </span>
                    </div>

                    <div className="w-12 h-12 rounded-xl bg-[#0891B2]/10 border border-[#0891B2]/20 text-[#0891B2] flex items-center justify-center shadow-sm">
                      <Icon className="w-6 h-6" />
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-cambria text-xl font-bold text-[#0B2A55] leading-snug">
                        {svc.title}
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {svc.description}
                      </p>
                    </div>
                  </div>

                  <a
                    href="#booking-section"
                    className="inline-flex items-center gap-2 text-xs font-bold text-[#0891B2] group-hover:gap-3 transition-all pt-4 border-t border-slate-100"
                  >
                    Book Department <ArrowRight className="w-3.5 h-3.5" />
                  </a>

                  <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-[#0B2A55] via-[#0891B2] to-[#4CAF50] group-hover:w-full transition-all duration-500 rounded-b-2xl" />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SECTION 5: DOCTORS SHOWCASE DIRECTORY ─────────────────────── */}
      <div id="doctors-section" className="scroll-mt-16">
        <DoctorShowcaseWidget doctors={doctors} />
      </div>

      {/* ── SECTION 6: INSTANT PUBLIC BOOKING WIDGET ────────────────────── */}
      <section id="booking-section" className="py-16 md:py-24 bg-[#F8FAFC] border-b border-slate-200 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <p className="text-xs font-bold tracking-widest uppercase text-[#0891B2]">Online Reservation</p>
            <h2 className="font-cambria text-3xl sm:text-4xl font-bold text-[#0B2A55]">
              Book Your Consultation
            </h2>
            <p className="text-sm text-slate-600">
              Select your preferred doctor, date, and consultation type below.
            </p>
          </div>

          <PublicBookingClient doctors={doctors} />
        </div>
      </section>

      {/* ── SECTION 7: INTERACTIVE FAQ ACCORDION ───────────────────────── */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <p className="text-xs font-bold tracking-widest uppercase text-[#0891B2]">Have Questions?</p>
            <h2 className="font-cambria text-3xl sm:text-5xl font-bold text-[#0B2A55] flex items-center justify-center gap-3">
              <HelpCircle className="w-8 h-8 text-[#0891B2] shrink-0" />
              Frequently Asked Questions
            </h2>
            <p className="text-base text-slate-600">
              Quick answers regarding MediSynx EHR booking, MRN check-in, and patient portal access.
            </p>
          </div>

          {/* Interactive Collapsible Accordion */}
          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-[#F8FAFC] border border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-6 text-left flex items-center justify-between gap-4 font-cambria font-bold text-lg text-[#0B2A55]"
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-[#0891B2] text-sm">0{idx + 1}.</span>
                      {faq.question}
                    </span>
                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-6 pt-0 text-sm text-slate-600 leading-relaxed border-t border-slate-100 mt-2 pt-4">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── TRUST & SECURITY COMPLIANCE BADGES BANNER ─────────────────── */}
      <section className="bg-slate-900 text-white py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-1">
            <p className="font-cambria text-xl font-bold text-cyan-400 flex items-center justify-center md:justify-start gap-2">
              <ShieldCheck className="w-6 h-6 text-cyan-400" /> HIPAA &amp; ISO 27001 Certified EHR Platform
            </p>
            <p className="text-xs text-slate-400">Enterprise 256-bit AES encryption at rest and TLS 1.3 in transit.</p>
          </div>

          <div className="flex items-center gap-4 flex-wrap justify-center">
            <span className="px-3.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300">
              🔒 HIPAA Compliant
            </span>
            <span className="px-3.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300">
              🛡️ SOC2 Type II
            </span>
            <span className="px-3.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300">
              ⚡ 99.99% Availability
            </span>
          </div>
        </div>
      </section>

    </div>
  );
}
