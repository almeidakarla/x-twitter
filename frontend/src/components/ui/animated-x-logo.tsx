'use client';

import { useEffect, useState } from 'react';

interface AnimatedXLogoProps {
  className?: string;
}

export function AnimatedXLogo({ className = '' }: AnimatedXLogoProps) {
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(false);
      setTimeout(() => setIsAnimating(true), 100);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Main X logo with glow effect */}
      <svg
        viewBox="0 0 24 24"
        className={`w-full h-full transition-all duration-300 ${
          isAnimating ? 'drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]' : ''
        }`}
      >
        <defs>
          {/* Gradient for the stroke */}
          <linearGradient id="xGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#a8a8a8" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.9" />
          </linearGradient>

          {/* Animated gradient for lightning effect */}
          <linearGradient id="lightningGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff">
              <animate
                attributeName="stop-color"
                values="#ffffff;#3b82f6;#ffffff"
                dur="2s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="50%" stopColor="#60a5fa">
              <animate
                attributeName="stop-color"
                values="#60a5fa;#ffffff;#60a5fa"
                dur="2s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%" stopColor="#ffffff">
              <animate
                attributeName="stop-color"
                values="#ffffff;#3b82f6;#ffffff"
                dur="2s"
                repeatCount="indefinite"
              />
            </stop>
          </linearGradient>

          {/* Filter for glow effect */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="0.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background X outline */}
        <path
          d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
          fill="none"
          stroke="url(#xGradient)"
          strokeWidth="0.3"
          className="opacity-30"
        />

        {/* Main X with animation */}
        <path
          d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
          fill="none"
          stroke="url(#lightningGradient)"
          strokeWidth="0.15"
          filter="url(#glow)"
          className={`transition-opacity duration-500 ${isAnimating ? 'opacity-100' : 'opacity-50'}`}
        >
          {/* Dash animation for lightning effect */}
          <animate
            attributeName="stroke-dasharray"
            values="0,100;100,0;0,100"
            dur="3s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="stroke-dashoffset"
            values="100;0;-100"
            dur="3s"
            repeatCount="indefinite"
          />
        </path>

        {/* Inner filled X */}
        <path
          d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="0.5"
        />
      </svg>

      {/* Pulsing glow behind the logo */}
      <div
        className={`absolute inset-0 rounded-full bg-blue-500/10 blur-3xl transition-opacity duration-1000 ${
          isAnimating ? 'opacity-50' : 'opacity-0'
        }`}
      />
    </div>
  );
}
