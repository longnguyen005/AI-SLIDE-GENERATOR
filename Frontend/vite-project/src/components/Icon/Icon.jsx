import React from 'react';

const paths = {
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  plus: <><path d="M12 5v14M5 12h14"/></>,
  list: <><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></>,
  edit: <><path d="M4 20h4l11-11a2.8 2.8 0 0 0-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/></>,
  eye: <><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></>,
  layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.8 1.8 0 0 0 .36 2l.06.06-2.12 2.12-.06-.06a1.8 1.8 0 0 0-2-.36 1.8 1.8 0 0 0-1.1 1.64V21h-3v-.08A1.8 1.8 0 0 0 10.4 19.3a1.8 1.8 0 0 0-2 .36l-.06.06-2.12-2.12.06-.06a1.8 1.8 0 0 0 .36-2A1.8 1.8 0 0 0 5 14.46H4.9v-3H5A1.8 1.8 0 0 0 6.6 10.4a1.8 1.8 0 0 0-.36-2l-.06-.06L8.3 6.22l.06.06a1.8 1.8 0 0 0 2 .36A1.8 1.8 0 0 0 11.46 5V4.9h3V5a1.8 1.8 0 0 0 1.1 1.64 1.8 1.8 0 0 0 2-.36l.06-.06 2.12 2.12-.06.06a1.8 1.8 0 0 0-.36 2A1.8 1.8 0 0 0 21 11.46h.1v3H21A1.8 1.8 0 0 0 19.4 15Z"/></>,
  help: <><circle cx="12" cy="12" r="9"/><path d="M9.8 9a2.3 2.3 0 1 1 3.7 1.8c-.9.7-1.5 1.1-1.5 2.2M12 17h.01"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
  arrowLeft: <><path d="m15 18-6-6 6-6"/></>,
  arrowRight: <><path d="M5 12h14M13 5l7 7-7 7"/></>,
  sparkles: <><path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3Z"/><path d="m5 14 .8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8L5 14ZM19 13l.7 2.3L22 16l-2.3.7L19 19l-.7-2.3L16 16l2.3-.7L19 13Z"/></>,
  download: <><path d="M12 3v12M8 11l4 4 4-4M4 19h16"/></>,
  trash: <><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"/></>,
  globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
  slide: <><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 22h8M12 18v4"/></>,
  check: <><path d="m5 12 4 4L19 6"/></>,
  play: <><circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4V8Z"/></>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
  logout: <><path d="M10 17l5-5-5-5M15 12H3M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"/></>,
  dots: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
  close: <><path d="M6 6l12 12M18 6 6 18"/></>,
  info: <><circle cx="12" cy="12" r="9"/><path d="M12 10v6M12 7h.01"/></>,
  chevronDown: <><path d="m6 9 6 6 6-6"/></>,
  upload: <><path d="M12 15V3M8 7l4-4 4 4M4 21h16"/></>,
  fullscreen: <><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/></>,
  back: <><path d="M19 12H5M11 18l-6-6 6-6"/></>,
  team: <><circle cx="9" cy="8" r="3"/><circle cx="17" cy="10" r="2"/><path d="M3 20a6 6 0 0 1 12 0M14 20a4 4 0 0 1 8 0"/></>,
  template: <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 9v12"/></>,
  wand: <><path d="m15 4 5 5L9 20H4v-5L15 4Z"/><path d="m13 6 5 5M5 4l.7 2.3L8 7l-2.3.7L5 10l-.7-2.3L2 7l2.3-.7L5 4ZM19 15l.7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  file: <><path d="M6 2h8l4 4v16H6z"/><path d="M14 2v5h5"/></>,
  drag: <><circle cx="8" cy="5" r="1"/><circle cx="16" cy="5" r="1"/><circle cx="8" cy="12" r="1"/><circle cx="16" cy="12" r="1"/><circle cx="8" cy="19" r="1"/><circle cx="16" cy="19" r="1"/></>,
  lock: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
  minus: <><path d="M5 12h14"/></>,
  image: <><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 15-5-5L5 20"/></>,
  chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></>,
  save: <><path d="M5 3h12l2 2v16H5z"/><path d="M8 3v6h8V3M8 21v-7h8v7"/></>,
  sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></>,
  moon: <><path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5 7 7 0 1 0 20.5 14.5Z"/></>,
};

export default function Icon({ name, size = 20, strokeWidth = 1.8, className = '' }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.sparkles}
    </svg>
  );
}
