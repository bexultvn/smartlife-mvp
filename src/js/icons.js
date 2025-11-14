const svg = (content, className = "h-5 w-5") => `
  <svg xmlns="http://www.w3.org/2000/svg"
       viewBox="0 0 24 24"
       fill="none"
       stroke="currentColor"
       stroke-width="1.7"
       stroke-linecap="round"
       stroke-linejoin="round"
       class="${className}"
       aria-hidden="true">
    ${content}
  </svg>`;

const ICONS = {
  dashboard: svg(`
    <rect x="4" y="4" width="7" height="7" rx="1.6" fill="none" />
    <rect x="13" y="4" width="7" height="5" rx="1.6" fill="none" />
    <rect x="13" y="10" width="7" height="10" rx="1.6" fill="none" />
    <rect x="4" y="13" width="7" height="7" rx="1.6" fill="none" />
  `),
  tasks: svg(`
    <rect x="4.5" y="4.5" width="15" height="15" rx="2.2" fill="none" />
    <path d="m8.5 12 2.5 2.7 4.5-5.2" />
  `),
  pomodoro: svg(`
    <circle cx="12" cy="13" r="6" fill="none" />
    <path d="M12 10v3.5l2 2" />
    <path d="M10 4V2h4v2" />
    <path d="M9 6h6" />
  `),
  conspectus: svg(`
    <rect x="6" y="4.5" width="12" height="15" rx="2" fill="none" />
    <path d="M9 9h6" />
    <path d="M9 13h6" />
    <path d="M9 17h4" />
  `),
  settings: svg(`
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 4v2" />
    <path d="M12 18v2" />
    <path d="M4 12h2" />
    <path d="M18 12h2" />
    <path d="M6.5 6.5l1.4 1.4" />
    <path d="M16.1 16.1l1.4 1.4" />
    <path d="M6.5 17.5l1.4-1.4" />
    <path d="M16.1 7.9l1.4-1.4" />
  `),
  logout: svg(`
    <path d="M14 7V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5a2 2 0 0 0 2-2v-2" />
    <path d="M9 12h11" />
    <path d="m18 9 3 3-3 3" />
  `),
  calendar: svg(`
    <rect x="4" y="6" width="16" height="14" rx="2" fill="none" />
    <path d="M8 3v4" />
    <path d="M16 3v4" />
    <path d="M4 11h16" />
  `),
  folder: svg(`
    <path d="M3.5 7a2 2 0 0 1 2-2h4l2.2 2.5H20a1.5 1.5 0 0 1 1.5 1.5v8a2 2 0 0 1-2 2h-14a2 2 0 0 1-2-2Z" />
  `),
  clock: svg(`
    <circle cx="12" cy="12" r="7" />
    <path d="M12 9v4l2.5 2.5" />
  `),
  cog: svg(`
    <circle cx="12" cy="12" r="2.8" />
    <path d="M12 5v2" />
    <path d="M12 17v2" />
    <path d="M5 12h2" />
    <path d="M17 12h2" />
    <path d="M7.1 7.1 8.5 8.5" />
    <path d="M15.5 15.5l1.4 1.4" />
    <path d="M7.1 16.9 8.5 15.5" />
    <path d="M15.5 8.5l1.4-1.4" />
  `),
  checkCircle: svg(`
    <circle cx="12" cy="12" r="7" />
    <path d="m9.5 12.5 2 2 3.5-4.5" />
  `),
  pencil: svg(`
    <path d="M4.5 15.5 15 5a2 2 0 0 1 3 3L7.5 18.5 3 19.5Z" />
    <path d="M13.5 6.5l3 3" />
  `),
  mail: svg(`
    <rect x="3.5" y="6" width="17" height="12" rx="2" fill="none" />
    <path d="m4.5 7.5 7.5 6 7.5-6" />
  `),
  search: svg(`
    <circle cx="10.5" cy="10.5" r="5.5" />
    <path d="M15 15l4 4" />
  `),
  plusCircle: svg(`
    <circle cx="12" cy="12" r="7" />
    <path d="M12 9v6" />
    <path d="M9 12h6" />
  `),
  alert: svg(`
    <path d="M12 4.5 20 19H4l8-14.5Z" />
    <path d="M12 10.5v4" />
    <path d="M12 17.5h.01" stroke-linecap="round" />
  `),
  leaf: svg(`
    <path d="M5 15c0 3.5 2.5 5.5 5.5 5.5 4.5 0 8.5-4.2 8.5-11 0-1.4-.2-2.6-.6-3.6C14.5 7 9 10 5 15Z" />
    <path d="M10.5 20.2c0-4.5 4.5-8.8 8.4-9.8" />
  `),
  trash: svg(`
    <path d="M6 7v11a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7" />
    <path d="M9 4h6l1 2H8Z" />
    <path d="M5 7h14" />
    <path d="M11 11v6" />
    <path d="M13 11v6" />
  `),
  sun: svg(`
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="M4.9 4.9 6.3 6.3" />
    <path d="M17.7 17.7 19.1 19.1" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m4.9 19.1 1.4-1.4" />
    <path d="m17.7 6.3 1.4-1.4" />
  `),
  moon: svg(`
    <path d="M20 15.2A7.5 7.5 0 1 1 11.3 4a6 6 0 0 0 8.7 11.2Z" />
  `)
};

export { ICONS };
