'use client';

import React from 'react';
import {
  UserCheck,
  CalendarCheck,
  FileSpreadsheet,
  ShieldCheck,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useHomeState, PROCESS_STEPS } from '@/lib/store/homeStore';
import Link from 'next/link';

export function ProcessStepsWidget() {
  const { activeStep, setStep, nextStep, prevStep } = useHomeState();
  const currentStepData = PROCESS_STEPS.find((s) => s.id === activeStep) || PROCESS_STEPS[0];

  const getStepIcon = (iconName: string) => {
    switch (iconName) {
      case 'UserCheck':
        return <UserCheck className="w-6 h-6 text-[#0891B2]" />;
      case 'CalendarCheck':
        return <CalendarCheck className="w-6 h-6 text-[#0891B2]" />;
      case 'FileSpreadsheet':
        return <FileSpreadsheet className="w-6 h-6 text-[#0891B2]" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-6 h-6 text-[#0891B2]" />;
      default:
        return <Sparkles className="w-6 h-6 text-[#0891B2]" />;
    }
  };

  return (
    <section className="w-full py-16 md:py-24 bg-white border-y border-[#E2E8F0] relative overflow-hidden">
      {/* Background Decorative Accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#0891B2]/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#14B8A6]/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0891B2]/10 text-[#0891B2] text-xs font-bold tracking-wider uppercase border border-[#0891B2]/20">
            <Sparkles className="w-3.5 h-3.5 text-[#0891B2]" />
            Simple & Transparent Process
          </div>
          <h2 className="font-cambria text-3xl sm:text-4xl md:text-5xl font-bold text-[#0B2A55] leading-tight">
            How <span className="text-[#0891B2]">MediSynx EHR</span> Works
          </h2>
          <p className="text-base sm:text-lg text-[#475569] leading-relaxed">
            Experience a streamlined 4-step healthcare journey from choosing your doctor to instant record access.
          </p>
        </div>

        {/* Step Progress Tracker Bar */}
        <div className="relative">
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-[#E2E8F0] -translate-y-1/2 -z-10" />
          <div
            className="hidden md:block absolute top-1/2 left-0 h-1 bg-gradient-to-r from-[#0B2A55] via-[#0891B2] to-[#14B8A6] -translate-y-1/2 transition-all duration-500 -z-10"
            style={{ width: `${((activeStep - 1) / (PROCESS_STEPS.length - 1)) * 100}%` }}
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {PROCESS_STEPS.map((step) => {
              const isActive = step.id === activeStep;
              const isCompleted = step.id < activeStep;

              return (
                <button
                  key={step.id}
                  onClick={() => setStep(step.id)}
                  className={`flex flex-col items-center p-4 rounded-2xl transition-all duration-300 text-left md:text-center group border ${
                    isActive
                      ? 'bg-[#F8FAFC] border-[#0891B2] shadow-md ring-2 ring-[#0891B2]/20 scale-[1.02]'
                      : isCompleted
                      ? 'bg-white border-[#E2E8F0] hover:border-[#14B8A6]'
                      : 'bg-white border-[#E2E8F0] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm mb-3 transition-all duration-300 ${
                      isActive
                        ? 'bg-[#0891B2] text-white shadow-lg shadow-[#0891B2]/30'
                        : isCompleted
                        ? 'bg-[#16A34A] text-white'
                        : 'bg-[#0891B2]/10 text-[#0891B2] group-hover:bg-[#0891B2] group-hover:text-white'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : `0${step.id}`}
                  </div>
                  <span className="font-cambria font-bold text-sm text-[#0B2A55] line-clamp-1">
                    {step.shortTitle}
                  </span>
                  <span className="text-xs text-[#94A3B8] mt-1 font-medium hidden sm:inline">
                    {step.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step Details Active Showcase Card */}
        <div className="bg-gradient-to-br from-white to-[#F8FAFC] border border-[#E2E8F0] rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Step Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#0891B2]/10 text-[#0891B2] text-xs font-bold uppercase tracking-wider">
                {currentStepData.badge}
              </div>

              <h3 className="font-cambria text-2xl sm:text-3xl font-bold text-[#0B2A55] leading-snug">
                {currentStepData.title}
              </h3>

              <p className="text-base text-[#475569] leading-relaxed">
                {currentStepData.description}
              </p>

              {/* Detail Points */}
              <ul className="space-y-3 pt-2">
                {currentStepData.details.map((detail, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-[#0F172A]">
                    <div className="w-5 h-5 rounded-full bg-[#16A34A]/10 text-[#16A34A] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                      ✓
                    </div>
                    <span className="font-medium text-[#475569]">{detail}</span>
                  </li>
                ))}
              </ul>

              {/* Step Navigation Controls & CTA */}
              <div className="flex flex-wrap items-center gap-4 pt-4">
                <a
                  href={currentStepData.actionHref}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0891B2] text-white font-semibold text-sm hover:bg-[#0F766E] transition-all shadow-md hover:shadow-lg"
                >
                  {currentStepData.actionText}
                  <ArrowRight className="w-4 h-4" />
                </a>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={prevStep}
                    className="p-2.5 rounded-xl border border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-all"
                    title="Previous Step"
                    aria-label="Previous Step"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-xs font-bold text-[#94A3B8] px-2">
                    {activeStep} / {PROCESS_STEPS.length}
                  </span>
                  <button
                    onClick={nextStep}
                    className="p-2.5 rounded-xl border border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-all"
                    title="Next Step"
                    aria-label="Next Step"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Visual Feature Box */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-md bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-md space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[#0891B2]/10 border border-[#0891B2]/20 flex items-center justify-center mb-4">
                  {getStepIcon(currentStepData.iconName)}
                </div>

                <h4 className="font-cambria text-lg font-bold text-[#0B2A55]">
                  MediSynx Digital Standard
                </h4>

                <p className="text-xs text-[#475569] leading-relaxed">
                  Every step is backed by HIPAA-grade security, encrypted health records, and real-time clinician availability synchronization.
                </p>

                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#F1F5F9] space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-[#0B2A55]">
                    <span>Process Speed</span>
                    <span className="text-[#16A34A]">Instant (&lt; 2 min)</span>
                  </div>
                  <div className="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#0B2A55] via-[#0891B2] to-[#4CAF50] h-full transition-all duration-500"
                      style={{ width: `${(activeStep / PROCESS_STEPS.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
