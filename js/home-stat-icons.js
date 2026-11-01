/** Small, distinct emblems for the home progress strip. */
const marks={
  titles:'<path d="M7 3.5h10V8a5 5 0 0 1-10 0Z" fill="currentColor" fill-opacity=".16"/><path d="M7 5H4v2.5A4.5 4.5 0 0 0 8.5 12M17 5h3v2.5a4.5 4.5 0 0 1-4.5 4.5M12 13v4m-3 0h6l1 3H8Z"/><path d="m12 5.5.6 1.2 1.4.2-1 1 .2 1.4-1.2-.6-1.2.6L11 8l-1-1 1.4-.2Z" fill="currentColor" stroke="none"/>',
  best:'<path d="M4 20h5v-5H4Zm5 0h6v-9H9Zm6 0h5v-5h-5Z" fill="currentColor" fill-opacity=".16"/><path d="M12 11V2.5m0 1h7l-1.5 2L19 8h-7"/>',
  streak:'<path d="M13.5 2.5c1 5-5 6.4-3.5 10.5 1.8-.8 2.8-2 3.3-3.8 2.8 2.3 5.2 4.2 5.2 7a6.5 6.5 0 0 1-13 0c0-3.6 2-5.9 3-7.2" fill="currentColor" fill-opacity=".14"/><path d="M12 20a2.8 2.8 0 0 0 2.8-2.8c0-1.2-.8-2-1.8-3.2-.2 1.7-2.8 2.2-2.8 4A2 2 0 0 0 12 20Z" fill="currentColor" stroke="none"/>',
  rate:'<circle cx="12" cy="12" r="9" fill="currentColor" fill-opacity=".1"/><path d="m8.5 15.5 7-7"/><circle cx="8.5" cy="8.5" r="1.5"/><circle cx="15.5" cy="15.5" r="1.5"/>',
};
export function homeStatIcon(kind){return `<svg class="home-stat-emblem" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${marks[kind]}</svg>`;}

/** Old titles still count, but a retired mode is no longer advertised on home. */
export function homeBestLabel(value='—'){
  return value.replace('Eliminado · ','').replace('Eliminado na fase de grupos','Grupos')
    .replace(/\s*·?\s*Modo r[aá]pido\b/gi,'').trim() || '—';
}
