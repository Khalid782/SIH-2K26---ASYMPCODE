import React from 'react';

interface BeaconLogoProps {
  className?: string;
}

/**
 * CRISISBEACON brand mark — the emergency beacon lamp throwing alert
 * rays, mounted on a stepped command pedestal.
 *
 * Drawn in full brand colour so it reads identically on light and dark
 * surfaces, and as vectors so it stays crisp at every size. Sits inline
 * to the left of the "CRISISBEACON" wordmark in the header, the landing
 * nav and the landing footer.
 *
 * The viewBox is cropped tight to the artwork (a 100×100 box holding a
 * mark that is ~98 wide × ~70 tall) so it fills a square badge instead of
 * floating in empty space.
 */
export const BeaconLogo: React.FC<BeaconLogoProps> = ({ className }) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    role="img"
    aria-label="CrisisBeacon"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      {/* Lamp body — flat red, lit from the left */}
      <linearGradient id="cbLamp" x1="38" y1="0" x2="82" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#F4433A" />
        <stop offset="0.55" stopColor="#E5231B" />
        <stop offset="1" stopColor="#C81A13" />
      </linearGradient>

      {/* Pedestal — dark command slate */}
      <linearGradient id="cbBase" x1="27" y1="0" x2="93" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#3E4655" />
        <stop offset="0.6" stopColor="#2B313D" />
        <stop offset="1" stopColor="#1A1F28" />
      </linearGradient>

      {/* One alert ray: a tapered blade, split gold over orange */}
      <g id="cbRay">
        <polygon points="3,-3.6 27,-8.2 27,0.4 3,1.6" fill="#F9B32B" />
        <polygon points="3,1.6 27,0.4 27,8.2 3,3.6" fill="#EE7C1F" />
      </g>
    </defs>

    <g transform="translate(-10 -3)">
      {/* Alert rays radiating from both shoulders of the lamp */}
      <use href="#cbRay" transform="translate(82 46) rotate(-34)" />
      <use href="#cbRay" transform="translate(82 46)" />
      <use href="#cbRay" transform="translate(82 46) rotate(34)" />
      <use href="#cbRay" transform="translate(38 46) scale(-1 1) rotate(-34)" />
      <use href="#cbRay" transform="translate(38 46) scale(-1 1)" />
      <use href="#cbRay" transform="translate(38 46) scale(-1 1) rotate(34)" />

      {/* Stepped pedestal: two tiers, right third in shadow */}
      <rect x="33" y="68" width="54" height="10" fill="url(#cbBase)" />
      <rect x="72" y="68" width="15" height="10" fill="#1A1F28" opacity="0.55" />
      <rect x="27" y="78" width="66" height="10" fill="url(#cbBase)" />
      <rect x="72" y="78" width="21" height="10" fill="#10141B" opacity="0.6" />

      {/* Lamp: domed beacon head seated on the pedestal */}
      <path d="M38 70V40a22 22 0 0 1 44 0v30z" fill="url(#cbLamp)" />
      <rect x="44.5" y="31" width="10" height="33" rx="5" fill="#F9817A" opacity="0.75" />
    </g>
  </svg>
);
