'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

interface CustomLoaderProps {
  fullScreen?: boolean;
  message?: string;
  onFinish?: () => void;
}

export function CustomLoader({
  fullScreen = true,
  message = "Loading MediSynx EHR...",
  onFinish,
}: CustomLoaderProps) {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Auto fadeout after 600ms for high performance
    const timer = setTimeout(() => {
      setFading(true);
      const hideTimer = setTimeout(() => {
        setVisible(false);
        if (onFinish) onFinish();
      }, 300);
      return () => clearTimeout(hideTimer);
    }, 600);

    return () => clearTimeout(timer);
  }, [onFinish]);

  if (!visible) return null;

  const content = (
    <div
      className={`flex flex-col items-center justify-center space-y-5 transition-opacity duration-300 ${
        fading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      }`}
    >
      <div className="relative w-48 h-24 flex items-center justify-center">
        {/* Pulsing Outer Cyan-Teal Gradient Ring */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#0891B2] via-[#14B8A6] to-[#4CAF50] animate-spin opacity-80 blur-sm" />
        <div className="absolute inset-1 rounded-xl bg-white flex items-center justify-center p-3 shadow-md">
          <Image
            src="/images/image.png"
            alt="MediSynx EHR Logo"
            width={200}
            height={70}
            className="object-contain w-full h-full"
            priority
          />
        </div>
      </div>
      
      <div className="text-center space-y-1">
        <p className="font-cambria text-xl font-bold text-[#0B2A55] tracking-wide">
          MediSynx <span className="text-[#0891B2]">EHR</span>
        </p>
        <p className="text-xs text-[#475569] font-semibold tracking-wider uppercase">
          {message}
        </p>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#F8FAFC]/95 backdrop-blur-md">
        {content}
      </div>
    );
  }

  return <div className="py-12 flex justify-center">{content}</div>;
}
