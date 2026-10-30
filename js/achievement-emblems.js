/** Bespoke milestone emblems. Shared geometry stays legible at 28–32 px. */
const star=(x,y,r=3)=>{
 const points=Array.from({length:10},(_,i)=>{
  const angle=-Math.PI/2+i*Math.PI/5,radius=i%2?r*.46:r;
  return `${(x+Math.cos(angle)*radius).toFixed(2)},${(y+Math.sin(angle)*radius).toFixed(2)}`;
 }).join(' ');
 return `<polygon class="emblem-accent" points="${points}"/>`;
};
const emblems={
 'first-campaign':`<path class="emblem-wash" d="M7 27V5h15l-3 5 3 5H7Z"/><path d="M7 27V5h15l-3 5 3 5H7m-3 12h8"/><path class="emblem-accent" d="M10 5h4v5h-4zm4 5h5v5h-5z"/><circle class="emblem-solid" cx="23" cy="23" r="6"/><path class="emblem-cutout" d="m23 20 2.8 2-1.1 3.3h-3.4l-1.1-3.3 2.8-2Z"/>`,
 'three-campaigns':`<path class="emblem-wash" d="m11 7 4 4 1 5 10 3 2 4v3H10l-4-4 4-4Z"/><path d="m11 7 4 4 1 5 10 3 2 4v3H10l-4-4 4-4Zm-4 16h21M11 26v2m6-2v2m6-2v2"/><path class="emblem-accent" d="m16 16-2 3m6-2-2 3"/><path d="M3 9h4M2 13h5M3 17h3"/>`,
 'ten-campaigns':`<path d="M22 5H8a3 3 0 0 0-3 3v17m19-17H11a3 3 0 0 0-3 3v16"/><rect class="emblem-wash" x="11" y="11" width="17" height="18" rx="3"/><rect x="11" y="11" width="17" height="18" rx="3"/><path class="emblem-accent" d="m14.5 18 2-1.5V24m4-7.5h2.5v7.5h-2.5z"/>`,
 'first-title':`<path class="emblem-wash" d="M10 6h12v9a6 6 0 0 1-12 0Z"/><path d="M10 6h12v9a6 6 0 0 1-12 0V6Zm0 3H5v4a5 5 0 0 0 6 5m11-9h5v4a5 5 0 0 1-6 5M16 21v5m-5 0h10v3H11z"/>${star(16,12,3.2)}<path class="emblem-accent" d="M26 2v4m-2-2h4"/>`,
 'three-titles':`<path class="emblem-wash" d="m16 12 10 4v5c0 4-5 7-10 9-5-2-10-5-10-9v-5Z"/><path d="m16 12 10 4v5c0 4-5 7-10 9-5-2-10-5-10-9v-5Z"/>${star(6,7,3.5)}${star(16,5,4)}${star(26,7,3.5)}<path class="emblem-accent" d="M13.5 18h5l-3 3h1a2.5 2.5 0 1 1-2.5 2.5"/>`,
 'five-titles':`<path class="emblem-wash" d="m8 11 4 3 4-7 4 7 4-3-2 10H10Z"/><path d="m8 11 4 3 4-7 4 7 4-3-2 10H10Zm3 13h10M7 17c-4 0-4 5-1 7m1-2c-3 2-2 5 1 6m17-11c4 0 4 5 1 7m-1-2c3 2 2 5-1 6"/><circle class="emblem-accent" cx="16" cy="5" r="1.5"/><circle class="emblem-accent" cx="7" cy="10" r="1.3"/><circle class="emblem-accent" cx="25" cy="10" r="1.3"/><path class="emblem-accent" d="m16 12 1.8 3-1.8 3-1.8-3Z"/>`,
 'three-win-streak':`<path class="emblem-wash" d="M18 3c1 7-8 8-8 15-1-2-1-4-1-6-4 4-5 9-2 13 3 5 12 6 17 0 5-6 1-12-2-15 0 4-2 6-4 7 2-5 2-9 0-14Z"/><path d="M18 3c1 7-8 8-8 15-1-2-1-4-1-6-4 4-5 9-2 13 3 5 12 6 17 0 5-6 1-12-2-15 0 4-2 6-4 7 2-5 2-9 0-14Z"/><path class="emblem-accent" d="m17 17-5 6h4l-1 5 6-7h-4l1-4Z"/>`,
};

export function achievementEmblem(id){
 const drawing=emblems[id];
 if(!drawing)return '';
 return `<svg class="achievement-symbol" data-emblem="${id}" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${drawing}</svg>`;
}
