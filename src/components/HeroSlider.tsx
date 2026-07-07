'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';

interface Slide {
  image: string;
  title: string;
  subtitle: string;
  highlights: string[];
}

export function HeroSlider() {
  const [current, setCurrent] = useState(0);

  const slides: Slide[] = [
    {
      image: '/images/slider_1.png',
      title: 'State-of-the-Art Clinical Care',
      subtitle: 'Outpatient centers equipped with the latest diagnostic technology and designed for maximum patient comfort.',
      highlights: ['Modern Diagnostic Tools', 'Comfortable Waiting Areas', 'Friendly Staff Support'],
    },
    {
      image: '/images/slider_2.png',
      title: 'Board-Certified Specialists',
      subtitle: 'Direct access to experienced healthcare providers across Primary Care, Cardiology, and Pediatrics.',
      highlights: ['Experienced Medical Experts', 'Personalized Care Plans', 'Consistent Follow-ups'],
    },
    {
      image: '/images/slider_3.png',
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
    <div className="relative rounded-3xl overflow-hidden aspect-[16/10] md:aspect-[16/7] lg:aspect-[16/6] border border-[hsl(var(--border))] shadow-glow group bg-slate-950">
      {/* Slides */}
      <div className="absolute inset-0">
        {slides.map((slide, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === current ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
          >
            {/* Background Image with Dark Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-transparent z-10" />
            <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />

            {/* Slide Information Overlay */}
            <div className="absolute inset-0 z-20 flex flex-col justify-center px-6 sm:px-12 md:px-16 max-w-xl md:max-w-2xl space-y-3 sm:space-y-4 text-left">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-blue-600/20 border border-blue-500/30 text-blue-400 w-fit">
                Clinical Feature
              </span>
              <h2 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight">
                {slide.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md sm:max-w-lg">
                {slide.subtitle}
              </p>
              
              <div className="hidden sm:flex flex-wrap gap-x-4 gap-y-1.5 pt-1">
                {slide.highlights.map((h, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-slate-200">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
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
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-slate-950/40 hover:bg-slate-950/80 border border-white/10 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
        title="Previous slide"
        type="button"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-slate-950/40 hover:bg-slate-950/80 border border-white/10 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
        title="Next slide"
        type="button"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Indicator Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`w-2 h-2 rounded-full transition-all duration-200 ${idx === current ? 'bg-blue-500 w-6' : 'bg-white/40'}`}
            title={`Go to slide ${idx + 1}`}
            type="button"
          />
        ))}
      </div>
    </div>
  );
}
