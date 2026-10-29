import {GAME_RELEASE} from '../data/release.js';

/** Shared by the static HTML generator; the notice also works without JavaScript. */
export function renderReleaseNotice() {
  const {stage, version, feedbackUrl} = GAME_RELEASE;
  return `<a class="release-notice" data-release-notice href="${feedbackUrl}" target="_blank" rel="noopener noreferrer" aria-label="ScoreFut ${stage} ${version}, em desenvolvimento. Envie dúvidas ou bugs no GitHub (abre em nova aba)."><span class="release-badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.7 6.3a5 5 0 0 0-6.5 6.5L3.5 17.5a2.1 2.1 0 0 0 3 3l4.7-4.7a5 5 0 0 0 6.5-6.5l-3.2 3.2-3-3 3.2-3.2Z"/></svg><strong>${stage} ${version}</strong></span><span class="release-copy"><span class="release-development">Em desenvolvimento<span aria-hidden="true"> · </span></span>Dúvidas ou bugs? <span class="release-github">GitHub <span aria-hidden="true">↗</span></span></span></a>`;
}
