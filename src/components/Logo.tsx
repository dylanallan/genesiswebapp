import React from 'react';

/** The Genesis Heritage tree mark (same as in the ads). */
export const Logo: React.FC<{ size?: number; className?: string }> = ({ size = 64, className }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} role="img" aria-label="Genesis Heritage">
    <circle cx="32" cy="32" r="30" fill="#2E5A44" />
    <path d="M32 50V27M32 36l-9-8M32 32l9-8M32 42l-11-5M32 40l11-6" stroke="#F5EEDF" strokeWidth="3.2" strokeLinecap="round" fill="none" />
    <circle cx="32" cy="19" r="5" fill="#B5843A" />
  </svg>
);

export default Logo;
