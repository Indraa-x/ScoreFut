import {GAME_RELEASE,RELEASE_HISTORY} from '../data/release.js?v=version-history-20261030';

const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

/** Shared by the static HTML generator. */
export function renderReleaseNotice() {
  const label = `${GAME_RELEASE.stage} ${GAME_RELEASE.version}`;
  return `<button class="release-notice" data-release-notice data-action="release-notes" type="button" aria-haspopup="dialog" aria-controls="modal" aria-label="${escapeHtml(label)}: ver correções e melhorias"><svg class="release-maintenance-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m2.5 7 5-5 3 3-5 5Z"/><path d="m8 8 12 12"/><path d="m21 6.5-3.5 3.5L14 6.5 17.5 3a6 6 0 0 0-7.5 7.5l-6.2 6.2a2.5 2.5 0 0 0 3.5 3.5l6.2-6.2A6 6 0 0 0 21 6.5Z"/></svg><span>${escapeHtml(label)}</span></button>`;
}

const releaseIcons = {
  field: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 4v16M3 9h4v6H3m18-6h-4v6h4"/><circle cx="12" cy="12" r="3"/>',
  ball: '<circle cx="12" cy="12" r="9"/><path d="m12 8 4 3-1.5 4h-5L8 11l4-3Zm0-5v5m9 2-5 1m1.5 8-3-4m-8 4 3-4M3 10l5 1"/>',
  shield: '<path d="m12 3 8 3v5c0 5-4 9-8 11-4-2-8-6-8-11V6l8-3Z"/><path d="m8 12 3 3 5-6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  players: '<circle cx="9" cy="7" r="3"/><path d="M3 20v-3a6 6 0 0 1 12 0v3m1-16a3 3 0 0 1 0 6m2 10v-3a6 6 0 0 0-3-5"/>',
};

export function renderReleaseDetails() {
  const {stage,version,feedbackUrl}=GAME_RELEASE;
  return `<section class="release-details"><header class="modal-head"><div><span class="release-eyebrow">SCOREFUT · ATUALIZAÇÕES</span><h2 id="modal-title">O que mudou</h2></div><button class="icon-button" data-action="close-modal" type="button" aria-label="Fechar atualizações"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6"/></svg></button></header><p class="release-description">Cada versão, suas novidades e correções.</p><div class="release-history" aria-label="Histórico de versões">${RELEASE_HISTORY.map((release,index)=>`<details class="release-entry"${index===0?' open':''}><summary><span class="release-version">${escapeHtml(stage)} ${escapeHtml(release.version)}</span>${index===0?'<span class="release-current">Atual</span>':''}<time>${escapeHtml(release.date)}</time><svg class="release-chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m6 8 4 4 4-4"/></svg><span class="release-entry-title">${escapeHtml(release.title)}</span></summary><ul class="release-changes">${release.changes.map(change=>`<li><span class="release-change-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${releaseIcons[change.icon]||releaseIcons.shield}</svg></span><div><strong>${escapeHtml(change.title)}</strong><p>${escapeHtml(change.detail)}</p></div></li>`).join('')}</ul></details>`).join('')}</div><footer class="release-feedback"><span>Uma dúvida ou um bug?</span><a href="${escapeHtml(feedbackUrl)}" target="_blank" rel="noopener noreferrer">Enviar no GitHub ↗</a></footer></section>`;
}
