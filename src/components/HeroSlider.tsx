'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, Sparkles } from 'lucide-react';
import Image from 'next/image';

interface Slide {
  image: string;
  badge: string;
  title: string;
  subtitle: string;
  highlights: string[];
}

export function HeroSlider() {
  const [current, setCurrent] = useState(0);

  const slides: Slide[] = [
    {
      image: '/images/slider_1.png',
      badge: 'Advanced Diagnostics',
      title: 'State-of-the-Art Clinical Care',
      subtitle: 'Outpatient centers equipped with modern diagnostic technology and designed for maximum patient comfort.',
      highlights: ['Modern Diagnostic Tools', 'Comfortable Waiting Areas', 'Friendly Staff Support'],
    },
    {
      image: '/images/slider_2.png',
      badge: 'Board-Certified Team',
      title: 'Expert Medical Specialists',
      subtitle: 'Direct access to experienced healthcare providers across Primary Care, Cardiology, and Pediatrics.',
      highlights: ['Experienced Medical Experts', 'Personalized Care Plans', 'Consistent Follow-ups'],
    },
    {
      image: '/images/slider_3.png',
      badge: 'Virtual Care Anywhere',
      title: 'Integrated Telehealth Visits',
      subtitle: 'Consult with your physician securely from home. View charts and retrieve prescriptions instantly.',
      highlights: ['HD Secure Video Consults', 'Instant Prescriptions', 'No Travel Time Required'],
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const next = () => setCurrent((current + 1) % slides.length);
  const prev = () => setCurrent((current - 1 + slides.length) % slides.length);

  return (
    <div className="relative rounded-3xl overflow-hidden aspect-[16/10] md:aspect-[16/7] lg:aspect-[16/6] border border-[#E2E8F0] shadow-xl group bg-[#0B2A55]">
      {/* Slides Container */}
      <div className="absolute inset-0">
        {slides.map((slide, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              idx === current ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            {/* Deep Navy to Cyan Soft Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B2A55]/95 via-[#0B2A55]/75 to-transparent z-10" />

            {/* Slide Background Image */}
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              className="object-cover object-center"
              priority={idx === 0}
            />

            {/* Content Overlay */}
            <div className="absolute inset-0 z-20 flex flex-col justify-center px-6 sm:px-12 md:px-16 max-w-xl md:max-w-2xl space-y-4 text-left">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 border border-white/20 text-[#22D3EE] backdrop-blur-sm w-fit">
                <Sparkles className="w-3.5 h-3.5 text-[#22D3EE]" />
                {slide.badge}
              </span>

              <h2 className="font-cambria text-2xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
                {slide.title}
              </h2>

              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-md sm:max-w-lg font-medium">
                {slide.subtitle}
              </p>

              {/* Highlights */}
              <div className="hidden sm:flex flex-wrap gap-x-5 gap-y-2 pt-2">
                {slide.highlights.map((h, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-white/90 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-[#4CAF50] shrink-0" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md border border-white/30 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
        title="Previous slide"
        type="button"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md border border-white/30 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
        title="Next slide"
        type="button"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Indicator Dots */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex gap-2.5">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              idx === current ? 'bg-[#0891B2] w-8 ring-2 ring-white/50' : 'bg-white/50 w-2.5 hover:bg-white'
            }`}
            title={`Go to slide ${idx + 1}`}
            type="button"
          />
        ))}
      </div>
    </div>
  );
}
