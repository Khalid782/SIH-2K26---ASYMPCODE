import React from 'react';

interface BeaconLogoProps {
  className?: string;
}

/**
 * CRISISBEACON brand mark — a beacon tower emitting radiating
 * alert signals. Draws in `currentColor` so it inherits the
 * surrounding text color utility (e.g. text-sky-600).
 */
export const BeaconLogo: React.FC<BeaconLogoProps> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.9}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {/* Emitted beacon signal rings */}
    <path d="M9.19 6.42a3 3 0 0 1 5.62 0" />
    <path d="M7.05 5.16a5.5 5.5 0 0 1 9.9 0" />
    <path d="M5.02 3.52a8 8 0 0 1 13.96 0" />

    {/* Beacon mast */}
    <line x1="12" y1="10.4" x2="12" y2="17.5" />

    {/* Lamp */}
    <circle cx="12" cy="7.6" r="1.85" fill="currentColor" stroke="none" />

    {/* Pedestal base */}
    <path d="M9.4 20.5h5.2" />
    <path d="M10.6 20.5 10.95 17.5h2.1l.35 3" />
  </svg>
);
