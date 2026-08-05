'use client';

import { useState, useCallback } from 'react';

export interface ProcessStep {
  id: number;
  title: string;
  shortTitle: string;
  description: string;
  details: string[];
  iconName: string;
  actionText: string;
  actionHref: string;
  badge: string;
}

export const PROCESS_STEPS: ProcessStep[] = [
  {
    id: 1,
    title: 'Choose Specialty & Specialist Doctor',
    shortTitle: '1. Select Doctor',
    description: 'Browse our board-certified clinical specialists across Primary Care, Cardiology, Pediatrics, and Telehealth.',
    details: [
      'Filter doctors by medical specialty & availability',
      'View doctor qualifications & clinical experience',
      'Select between In-Person or Telehealth Consults',
    ],
    iconName: 'UserCheck',
    actionText: 'Browse Specialists',
    actionHref: '#booking-section',
    badge: 'Step 1 of 4',
  },
  {
    id: 2,
    title: 'Select Convenient Date & Time Slot',
    shortTitle: '2. Pick Time Slot',
    description: 'Pick an open appointment time that fits your busy lifestyle with real-time schedule synchronization.',
    details: [
      'Live morning, afternoon, & evening slots',
      'Instant calendar booking confirmation',
      'Flexible rescheduling options',
    ],
    iconName: 'CalendarCheck',
    actionText: 'View Schedule Slots',
    actionHref: '#booking-section',
    badge: 'Step 2 of 4',
  },
  {
    id: 3,
    title: 'Instant Guest Registration & Check-in',
    shortTitle: '3. Fast Check-in',
    description: 'Enter basic contact information to request your appointment without forced prior registration.',
    details: [
      'No password creation required for guest booking',
      'Automated Medical Record Number (MRN) generation',
      'Instant SMS & Email appointment receipts',
    ],
    iconName: 'FileSpreadsheet',
    actionText: 'Book Appointment',
    actionHref: '#booking-section',
    badge: 'Step 3 of 4',
  },
  {
    id: 4,
    title: 'Access MediSynx Portal & Digital Records',
    shortTitle: '4. Portal Records',
    description: 'Log into your secure MediSynx EHR portal to view diagnostic lab results, prescriptions, and message your doctor.',
    details: [
      '24/7 Access to electronic health records & lab charts',
      'Direct secure messaging with your care team',
      'Digital prescription renewals and telehealth links',
    ],
    iconName: 'ShieldCheck',
    actionText: 'Access Patient Portal',
    actionHref: '/signup',
    badge: 'Step 4 of 4',
  },
];

export function useHomeState() {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [activeSlide, setActiveSlide] = useState<number>(0);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

  const setStep = useCallback((stepId: number) => {
    if (stepId >= 1 && stepId <= PROCESS_STEPS.length) {
      setActiveStep(stepId);
    }
  }, []);

  const nextStep = useCallback(() => {
    setActiveStep((prev) => (prev < PROCESS_STEPS.length ? prev + 1 : 1));
  }, []);

  const prevStep = useCallback(() => {
    setActiveStep((prev) => (prev > 1 ? prev - 1 : PROCESS_STEPS.length));
  }, []);

  return {
    activeStep,
    setStep,
    nextStep,
    prevStep,
    activeSlide,
    setActiveSlide,
    selectedDepartment,
    setSelectedDepartment,
    steps: PROCESS_STEPS,
  };
}
