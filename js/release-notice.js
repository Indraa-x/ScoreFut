import {GAME_RELEASE} from '../data/release.js?v=beta-0-1-notes-20261029';

const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

/** Shared by the static HTML generator. */
export function renderReleaseNotice() {
  const label = `${GAME_RELEASE.stage} ${GAME_RELEASE.version}`;
  return `<button class="release-notice" data-release-notice data-action="release-notes" type="button" aria-haspopup="dialog" aria-controls="modal" aria-label="${escapeHtml(label)}: ver correções e melhorias">${escapeHtml(label)}</button>`;
}

export function renderReleaseDetails() {
  const {stage, version, description, changes, feedbackUrl} = GAME_RELEASE;
  return `<section class="release-details"><div class="modal-head"><div><span class="release-eyebrow">ATUALIZAÇÕES DO JOGO</span><h2 id="modal-title">${escapeHtml(stage)} ${escapeHtml(version)}</h2></div><button class="icon-button" data-action="close-modal" type="button" aria-label="Fechar atualizações"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6"/></svg></button></div><p class="release-description">${escapeHtml(description)}</p><ul class="release-changes">${changes.map(change => `<li><strong>${escapeHtml(change.title)}</strong><p>${escapeHtml(change.detail)}</p></li>`).join('')}</ul><div class="release-feedback"><span>Tem uma dúvida ou encontrou um bug?</span><a href="${escapeHtml(feedbackUrl)}" target="_blank" rel="noopener noreferrer">Enviar no GitHub <span aria-hidden="true">↗</span></a></div></section>`;
}
