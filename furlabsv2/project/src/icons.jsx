/* global React */
const { useState, useEffect, useRef } = React;

// ===== Icon set (filled, rounded, 24px viewBox) =====
const Icon = ({ name, size = 20, color = 'currentColor', style }) => {
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill: color, style };
  switch (name) {
    case 'flask': return (
      <svg {...props} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 3h6M10 3v6L5 18a2 2 0 0 0 1.7 3h10.6A2 2 0 0 0 19 18l-5-9V3"/>
        <path d="M7.5 14h9" opacity="0.7"/>
      </svg>);
    case 'beaker': return (
      <svg {...props} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 3h14M7 3v6l-3 9a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3l-3-9V3"/>
      </svg>);
    case 'dna': return (
      <svg {...props} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
        <path d="M4 4c8 4 8 12 16 16M20 4c-8 4-8 12-16 16"/>
        <path d="M7 6h10M6 9h12M6 15h12M7 18h10" opacity="0.5"/>
      </svg>);
    case 'plus': return <svg {...props} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>;
    case 'enter': return <svg {...props} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg>;
    case 'gallery': return <svg {...props} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="1.5" fill={color}/><path d="m21 15-5-5L5 21"/></svg>;
    case 'arrow-left': return <svg {...props} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>;
    case 'arrow-right': return <svg {...props} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>;
    case 'copy': return <svg {...props} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
    case 'check': return <svg {...props} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7"/></svg>;
    case 'x': return <svg {...props} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>;
    case 'crown': return <svg {...props} fill={color}><path d="M3 7l4 4 5-7 5 7 4-4-2 12H5L3 7z"/></svg>;
    case 'user': return <svg {...props} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>;
    case 'clock': return <svg {...props} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>;
    case 'brush': return <svg {...props} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 4l6 6-9 9-4 1 1-4 6-6 0 0z"/><path d="M3 21l4-1"/></svg>;
    case 'eraser': return <svg {...props} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m20 11-7 7-7-7 7-7 7 7z"/><path d="M6 18h13"/></svg>;
    case 'bucket': return <svg {...props} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8c0-2 4-4 8-4s8 2 8 4-4 4-8 4-8-2-8-4z"/><path d="M4 8v6c0 2 4 4 8 4s8-2 8-4V8"/></svg>;
    case 'pipette': return <svg {...props} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 12-7 7v3h3l7-7M14 6l4 4M11 9l4 4M16 4l4 4-3 3-4-4 3-3z"/></svg>;
    case 'undo': return <svg {...props} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10h11a5 5 0 0 1 0 10h-3M3 10l4-4M3 10l4 4"/></svg>;
    case 'trash': return <svg {...props} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>;
    case 'download': return <svg {...props} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>;
    case 'sparkle': return <svg {...props} fill={color}><path d="M12 2l1.7 5.3L19 9l-5.3 1.7L12 16l-1.7-5.3L5 9l5.3-1.7L12 2z" opacity="0.95"/><circle cx="19" cy="19" r="1.5"/><circle cx="5" cy="18" r="1"/></svg>;
    case 'palette': return <svg {...props} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a9 9 0 1 0 0 18c1 0 2-1 2-2 0-1-1-2 0-3 1-1 5 0 5-4a9 9 0 0 0-7-9z"/><circle cx="7.5" cy="11" r="1" fill={color}/><circle cx="11" cy="7.5" r="1" fill={color}/><circle cx="15.5" cy="9" r="1" fill={color}/></svg>;
    case 'info': return <svg {...props} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8h0M11 12h1v5h1"/></svg>;
    case 'warn': return <svg {...props} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.3 3.7L2 19a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h0"/></svg>;
    case 'lock': return <svg {...props} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>;
    case 'play': return <svg {...props} fill={color}><path d="M6 4l14 8-14 8V4z"/></svg>;
    case 'menu': return <svg {...props} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>;
    case 'mobile': return <svg {...props} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/></svg>;
    case 'desktop': return <svg {...props} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>;
    default: return null;
  }
};

window.Icon = Icon;
