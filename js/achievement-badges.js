// Original ScoreFut medal artwork. Shapes share a frame, each achievement has its own emblem.
const artwork={
  'first-campaign':`<path class="medal-secondary" d="M6 24V13l8-5h20l8 5v11M12 14v8m24-8v8M7 39h34"/><circle class="medal-metal" cx="24" cy="27" r="13"/><path class="medal-cut" d="m24 20 6 4-2 7h-8l-2-7 6-4Zm0-6v6m12-1-6 5m5 12-7-5m-15 5 7-5m-8-12 6 5"/>`,
  'three-campaigns':`<path class="medal-secondary" d="m34 5 4-4m3 13h6M26 3V0"/><path class="medal-metal" d="M6 20h15l7-10h12v13L28 36H15A11 11 0 0 1 6 20Z"/><circle class="medal-cut" cx="15" cy="27" r="4"/><path class="medal-cut" d="M28 10v10h12M10 38l-4 5m10-3-1 6"/>`,
  'ten-campaigns':`<path class="medal-secondary" d="m5 13 20-5 9 31-20 5Z"/><path class="medal-metal" d="M14 7h24v33H14Z"/><path class="medal-cut" d="M20 14h12m-12 5h12m-12 7 12 9m0-9-12 9"/><path class="medal-secondary" d="m40 12 5 3v29H23"/>`,
  'first-title':`<path class="medal-secondary" d="M13 10H5v7c0 8 5 12 12 12m18-19h8v7c0 8-5 12-12 12"/><path class="medal-metal" d="M13 5h22v13c0 9-5 14-11 14s-11-5-11-14V5Z"/><path class="medal-cut" d="M18 10h12m-6 22v8m-9 3h18"/><path class="medal-metal" d="M15 40h18v6H15Z"/><path class="medal-highlight" d="M18 14v5c0 5 2 7 4 8"/>`,
  'three-titles':`<path class="medal-metal" d="m8 4 2 4 5 1-4 3 1 5-4-2-4 2 1-5-4-3 5-1Zm16-5 2 4 5 1-4 3 1 5-4-2-4 2 1-5-4-3 5-1Zm16 5 2 4 5 1-4 3 1 5-4-2-4 2 1-5-4-3 5-1Z"/><path class="medal-secondary" d="M10 26c0 10 5 17 14 20 9-3 14-10 14-20M7 23l5 2m-5 5 7 2m-4 5 8 1m23-15-5 2m5 5-7 2m4 5-8 1"/><path class="medal-metal" d="M17 20h4v19h-4Zm8 0h4v19h-4Zm8 0h4v19h-4Z" transform="translate(-3 0)"/>`,
  'five-titles':`<path class="medal-metal" d="m5 9 9 8 10-12 10 12 9-8-4 22H9Z"/><path class="medal-highlight" d="M12 26h24"/><path class="medal-secondary" d="M12 36h24m-20 4 8 9 8-9"/><circle class="medal-secondary" cx="24" cy="22" r="2"/>`,
  'three-win-streak':`<path class="medal-metal" d="M27 0c3 14-15 16-11 28 3-2 5-6 6-9 9 5 15 11 14 18a15 15 0 0 1-30-1C5 23 20 17 27 0Z"/><path class="medal-cut" d="m25 25-10 13h8l-2 10 12-15h-9l1-8Z"/>`,
  'euro-title':`<path class="medal-secondary" d="M15 9H8C-1 9 2 28 15 29m18-20h7c9 0 6 19-7 20"/><path class="medal-metal" d="M15 3h18v9c0 4 4 9 3 16-1 8-8 11-8 14h-8c0-3-7-6-8-14-1-7 3-12 3-16V3Zm4 39h10l4 5H15Z"/><path class="medal-highlight" d="M19 8h10m-11 9c-4 9-1 14 3 17"/><path class="medal-cut" d="M12 1h24M17 48h14"/>`,
  'champions-title':`<path class="medal-secondary" d="M14 13C-2-5-2 23 10 30l7 4m17-21C50-5 50 23 38 30l-7 4"/><path class="medal-metal" d="M13 8h22l-2 18c-1 7-5 11-9 12-4-1-8-5-9-12L13 8Zm8 30h6v5l7 4H14l7-4Z"/><path class="medal-highlight" d="M18 13h12m-11 5 1 9"/><path class="medal-cut" d="M16 48h16"/>`,
  'brazil-title':`<path class="medal-secondary" d="m14 10-9-4 4 19 10 5m15-20 9-4-4 19-10 5"/><path class="medal-metal" d="M12 5h24l-3 16-9 11-9-11-3-16Zm10 27h4l4 11H18l4-11Zm-8 11h20v5H14Z"/><path class="medal-highlight" d="M18 10h12m-12 6 6 8 6-8"/><path class="medal-cut" d="M10 3h28"/>`
};

export function achievementBadge(id,unlocked=false){
  const kind=Object.hasOwn(artwork,id)?id:'first-campaign';
  const status=unlocked
    ?'<path d="m72 80 4 4 7-8" fill="none" stroke="currentColor" stroke-width="2.4"/>'
    :'<path d="M73 79v-3a4 4 0 0 1 8 0v3m-9 0h10v8H72Z" fill="none" stroke="currentColor" stroke-width="1.5"/>';
  return `<svg class="achievement-badge medal-${kind} ${unlocked?'earned':'pending'}" viewBox="0 0 96 108" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path class="medal-ribbon" d="m23 70-9 33 19-8 11 9 6-25m23-9 9 33-19-8-11 9-6-25"/><path class="medal-rim" d="m48 4 34 14v30c0 24-14 38-34 49C28 86 14 72 14 48V18L48 4Z"/><path class="medal-face" d="m48 10 28 12v26c0 20-11 33-28 43-17-10-28-23-28-43V22L48 10Z"/><path class="medal-engraving" d="m27 26 21-9 21 9M30 69c4 6 10 11 18 16 8-5 14-10 18-16"/><g class="medal-art" transform="translate(24 25)" stroke-width="1.8">${artwork[kind]}</g><circle class="medal-status" cx="77" cy="80" r="11"/><g class="medal-status-mark">${status}</g></svg>`;
}
