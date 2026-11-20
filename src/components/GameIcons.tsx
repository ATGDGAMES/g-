import React from 'react';
import type { BuildPieceType, MaterialType, WeaponId } from '../game/types';

export const TitleEmblemSvg: React.FC = () => (
  <svg
    viewBox="0 0 380 94"
    className="w-full max-w-[360px] h-auto select-none"
    aria-label="Tilted Pines Chapter 1"
  >
    <defs>
      <filter id="c1-drop" x="-10%" y="-10%" width="120%" height="130%">
        <feDropShadow dx="0" dy="4" stdDeviation="0" floodColor="#091122" floodOpacity="0.95" />
      </filter>
    </defs>
    {/* Subtle tilted shield crest */}
    <g transform="translate(8, 10) skewX(-6)">
      <path
        d="M4 10 L58 4 L52 54 L28 72 L4 54 Z"
        fill="#1e3a8a"
        stroke="#facc15"
        strokeWidth="3.5"
        filter="url(#c1-drop)"
      />
      <path d="M28 16 L40 42 L32 42 L36 56 L18 36 L26 36 Z" fill="#facc15" />
    </g>
    {/* Chapter 1 bold wordmark */}
    <text
      x="78"
      y="54"
      fill="#ffffff"
      stroke="#091122"
      strokeWidth="6"
      paintOrder="stroke fill"
      fontFamily="'Barlow Condensed', sans-serif"
      fontWeight="800"
      fontStyle="italic"
      fontSize="48"
      letterSpacing="1.5"
      filter="url(#c1-drop)"
    >
      TILTED PINES
    </text>
    <text
      x="80"
      y="79"
      fill="#facc15"
      stroke="#091122"
      strokeWidth="4"
      paintOrder="stroke fill"
      fontFamily="'Barlow Condensed', sans-serif"
      fontWeight="800"
      fontSize="19"
      letterSpacing="3.2"
    >
      CHAPTER 1 · SEASON 1
    </text>
  </svg>
);

export const WeaponSvg: React.FC<{ id: WeaponId; className?: string }> = ({
  id,
  className = 'w-7 h-7',
}) => {
  switch (id) {
    case 'pickaxe':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 19L15 9" strokeLinecap="round" strokeWidth="2.5" />
          <path d="M10 4c4.5 1 7.5 4 9 9l-2.5 1c-1.5-3.5-4-6-7.5-7.5L10 4z" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'ar':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M2 10h14l2-2h4v3h-3v2h-3l-1 5h-3l.5-5H8l-2 4H3l1-4H2v-3z" />
        </svg>
      );
    case 'shotgun':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M2 12l4-2h15v2.5H10l-1 2.5h4v2H7l-3 2H2v-3l2-1.5L2 12z" />
        </svg>
      );
    case 'smg':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M4 9h13v2.5h4v2h-4V15h-2l-1 4h-2.5l1-4H9l-1 3H5.5l1-3H4V9z" />
        </svg>
      );
    case 'sniper':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <rect x="7" y="6" width="8" height="2.5" rx="0.5" />
          <path d="M1 11h17v1.5h5v1.5h-5v1.5H10l-2 4H5l1.5-4H1V11z" />
        </svg>
      );
    case 'mini_shield':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <rect x="9.5" y="3" width="5" height="3" rx="0.5" fill="#92400e" />
          <path d="M8 7h8l2 4v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-8l2-4z" fill="#38bdf8" />
          <path d="M9 12h6v5H9z" fill="#bae6fd" opacity="0.65" />
        </svg>
      );
    case 'medkit':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <rect x="3" y="6" width="18" height="14" rx="2" fill="#f8fafc" />
          <path d="M9 6V4h6v2" stroke="#cbd5e1" strokeWidth="2" fill="none" />
          <path d="M11 9h2v3h3v2h-3v3h-2v-3H8v-2h3V9z" fill="#ef4444" />
        </svg>
      );
  }
};

export const MaterialSvg: React.FC<{ type: MaterialType; className?: string }> = ({
  type,
  className = 'w-4 h-4',
}) => {
  if (type === 'wood') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="#d97706">
        <rect x="3" y="4" width="18" height="4.5" rx="1" />
        <rect x="3" y="10" width="18" height="4.5" rx="1" fill="#b45309" />
        <rect x="3" y="16" width="18" height="4.5" rx="1" />
      </svg>
    );
  }
  if (type === 'brick') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="#dc2626">
        <rect x="3" y="4" width="8" height="4.5" rx="0.5" />
        <rect x="13" y="4" width="8" height="4.5" rx="0.5" />
        <rect x="3" y="10" width="18" height="4.5" rx="0.5" fill="#b91c1c" />
        <rect x="3" y="16" width="8" height="4.5" rx="0.5" />
        <rect x="13" y="16" width="8" height="4.5" rx="0.5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={className} fill="#94a3b8">
      <path d="M4 5h16l2 4v10H2V9l2-4z" />
      <circle cx="7" cy="14" r="1.5" fill="#334155" />
      <circle cx="17" cy="14" r="1.5" fill="#334155" />
    </svg>
  );
};

export const BuildPieceSvg: React.FC<{ kind: BuildPieceType; className?: string }> = ({
  kind,
  className = 'w-5 h-5',
}) => {
  if (kind === 'wall') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2">
        <rect x="4" y="4" width="16" height="16" rx="1" />
        <line x1="4" y1="12" x2="20" y2="12" />
        <line x1="12" y1="4" x2="12" y2="12" />
      </svg>
    );
  }
  if (kind === 'floor') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2">
        <polygon points="3,15 12,10 21,15 12,20" />
      </svg>
    );
  }
  if (kind === 'ramp') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2">
        <polyline points="4,19 19,5 19,19 4,19" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2">
      <polygon points="12,4 21,18 3,18" />
    </svg>
  );
};

export const SkinBadgeSvg: React.FC<{ id: string; className?: string }> = ({
  id,
  className = 'w-9 h-9',
}) => {
  switch (id) {
    case 'skull_trooper':
      return (
        <svg viewBox="0 0 36 36" className={className}>
          <rect width="36" height="36" rx="4" fill="#111827" />
          <circle cx="18" cy="15" r="8.5" fill="#f8fafc" />
          <circle cx="14.5" cy="14" r="2.3" fill="#0f172a" />
          <circle cx="21.5" cy="14" r="2.3" fill="#0f172a" />
          <circle cx="14.5" cy="14" r="1" fill="#38bdf8" />
          <circle cx="21.5" cy="14" r="1" fill="#38bdf8" />
          <path d="M15 20h6v3h-6z" fill="#f8fafc" />
          <path d="M10 27h16v6H10z" fill="#1e293b" />
          <path d="M13 28h10M14 31h8" stroke="#f8fafc" strokeWidth="1.6" />
        </svg>
      );
    case 'brite_bomber':
      return (
        <svg viewBox="0 0 36 36" className={className}>
          <rect width="36" height="36" rx="4" fill="#831843" />
          <circle cx="18" cy="16" r="8" fill="#e6b596" />
          <path d="M9 14c1-6 17-7 18 0l-3-2H12z" fill="#22d3ee" />
          <rect x="11.5" y="13.5" width="13" height="3.5" rx="1" fill="#db2777" />
          <path d="M10 26h16l2 8H8z" fill="#db2777" />
          <polygon points="18,26 19.5,29 22.5,29 20,31 21,34 18,32 15,34 16,31 13.5,29 16.5,29" fill="#facc15" />
        </svg>
      );
    case 'black_knight':
      return (
        <svg viewBox="0 0 36 36" className={className}>
          <rect width="36" height="36" rx="4" fill="#09090b" />
          <path d="M10 8l-3-4 6 2zM26 8l3-4-6 2z" fill="#52525b" />
          <rect x="10" y="7" width="16" height="17" rx="5" fill="#18181b" stroke="#3f3f46" strokeWidth="1.5" />
          <rect x="12" y="13" width="12" height="3" rx="1" fill="#ef4444" />
          <path d="M8 26h20l2 8H6z" fill="#18181b" stroke="#991b1b" strokeWidth="1.5" />
        </svg>
      );
    case 'cuddle_team':
      return (
        <svg viewBox="0 0 36 36" className={className}>
          <rect width="36" height="36" rx="4" fill="#9d174d" />
          <circle cx="10.5" cy="10" r="4" fill="#f43f8e" />
          <circle cx="25.5" cy="10" r="4" fill="#f43f8e" />
          <circle cx="18" cy="16.5" r="8.5" fill="#f43f8e" />
          <ellipse cx="18" cy="19" rx="4.5" ry="3.2" fill="#fbcfe8" />
          <circle cx="18" cy="17.8" r="1.4" fill="#0f172a" />
          <circle cx="14.2" cy="14.5" r="1.3" fill="#0f172a" />
          <circle cx="21.8" cy="14.5" r="1.3" fill="#0f172a" />
          <path d="M10 26h16l2 8H8z" fill="#f43f8e" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 36 36" className={className}>
          <rect width="36" height="36" rx="4" fill="#0c4a6e" />
          <circle cx="18" cy="16" r="8" fill="#e6b596" />
          <path d="M9 14c1-6 17-7 18 0l-3-2H12z" fill="#d4a34f" />
          <rect x="11.5" y="13.5" width="13" height="3.2" rx="1" fill="#38bdf8" />
          <path d="M10 26h16l2 8H8z" fill="#0284c7" />
        </svg>
      );
  }
};

