import React from 'react';

/**
 * UniClear Logo Component
 * Renders the SVG logo mark + wordmark.
 * Clean, geometric, fintech-grade design.
 */
export default function Logo({ variant = 'full', size = 'md', className = '', light = false }) {
  const sizes = {
    sm:  { mark: 22, text: 'text-base' },
    md:  { mark: 28, text: 'text-lg' },
    lg:  { mark: 36, text: 'text-xl' },
    xl:  { mark: 48, text: 'text-2xl' },
  };
  const s = sizes[size] || sizes.md;

  const LogoMark = ({ size: sz }) => (
    <svg
      width={sz}
      height={sz}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="flex-shrink-0"
    >
      <path
        d="M16 3L27 7.5V16C27 22.5 22.2 27.5 16 29C9.8 27.5 5 22.5 5 16V7.5L16 3Z"
        fill={light ? "rgba(255, 255, 255, 0.12)" : "#0A2540"}
        stroke={light ? "rgba(255, 255, 255, 0.2)" : "none"}
        strokeWidth={light ? "1" : "0"}
      />
      <path
        d="M11.5 15.5L14.5 18.5L21.5 11.5"
        stroke="#FF9B00"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const Wordmark = () => (
    <span className={`font-bold tracking-tight leading-none select-none ${s.text}`}>
      <span className={light ? "text-white" : "text-slate-900 dark:text-white"}>U</span>
      <span className="text-brand-orange">clear</span>
    </span>
  );

  if (variant === 'mark') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        <LogoMark size={s.mark} />
      </div>
    );
  }

  if (variant === 'stacked') {
    return (
      <div className={`inline-flex flex-col items-center gap-2 ${className}`}>
        <LogoMark size={s.mark} />
        <Wordmark />
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={s.mark} />
      <Wordmark />
    </div>
  );
}
