import {escapeHtml as esc} from './html.js';
import {DEVELOPMENT_PLANS, playerDevelopment, developmentThreshold, developmentLocked} from './career-development.js';

export const DEVELOPMENT_FILTERS = {all: 'Todos', youth: 'Sub-23', injured: 'Lesionados'};
const planDesign = {
  technique: {label: 'Técnica', icon: 'ball', hint: 'Aumentar o OVR', detail: 'Acumule experiência para chegar ao próximo OVR.'},
  potential: {label: 'Potencial', icon: 'chart', hint: 'Ampliar o teto', detail: 'Quatro sessões aumentam o potencial em 1 ponto.'},
  form: {label: 'Recuperar forma', icon: 'shield', hint: 'Retomar o OVR', detail: 'Duas sessões recuperam 1 OVR perdido por má fase. A sessão interrompe a sequência ruim.'},
  intense: {label: 'Treino intenso', icon: 'bolt', hint: '70 XP + forma', detail: 'Ganha 70 XP e conta uma etapa de recuperação. Duas etapas recuperam 1 OVR perdido.'},
  recovery: {label: 'Recuperação', icon: 'shield', hint: 'Voltar ao campo', detail: 'Reduza o afastamento em até duas partidas.'},
};
const normalize = value => value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();

export function developmentView(career, input = {}) {
  const filter = Object.hasOwn(DEVELOPMENT_FILTERS, input.filter) ? input.filter : 'all';
  const search = input.search ?? '';
  const all = career.roster.map(player => ({player, state: playerDevelopment(career, player)}))
    .sort((a, b) => b.state.injury - a.state.injury || (a.state.age ?? 50) - (b.state.age ?? 50) || b.player.ovr - a.player.ovr);
  const rows = all.filter(({player, state}) => (filter !== 'youth' || state.age !== null && state.age <= 23)
    && (filter !== 'injured' || state.injury > 0) && normalize(player.nome).includes(normalize(search)));
  const selected = rows.find(row => row.player.id === input.selectedId) ?? rows[0] ?? null;
  const plan = selected?.state.injury ? 'recovery' : ['potential','form','intense'].includes(input.plan) ? input.plan : selected?.state.formLoss ? 'form' : 'technique';
  const preset = DEVELOPMENT_PLANS[plan];
  const trained = selected?.state.lastTraining === (career.development?.tick ?? 0);
  let blocked = '';
  if (developmentLocked(career)) blocked = 'Conclua a partida para liberar a sessão.';
  else if (trained) blocked = 'Nova sessão após a próxima partida.';
  else if (selected && plan === 'technique' && selected.player.ovr >= selected.state.potential) blocked = 'Escolha Potencial para ampliar o teto de evolução.';
  else if (selected && plan === 'potential' && selected.state.potential >= 99) blocked = 'O potencial já está no máximo.';
  else if (selected && plan === 'form' && !selected.state.formLoss && !selected.state.badStreak) blocked = 'Este jogador já está em boa forma.';
  else if (career.budget < preset.cost) blocked = 'Orçamento insuficiente para esta sessão.';
  return {all, rows, selected, plan, preset, trained, blocked, filter, search};
}

export function renderDevelopmentPanel(career, ui, input, {portrait, crest, money}) {
  const view = developmentView(career, input);
  const {all, rows, selected, plan, preset, trained, blocked, filter, search} = view;
  const injured = all.filter(row => row.state.injury > 0).length;
  const filterCount = key => key === 'all' ? all.length : all.filter(({state}) => key === 'youth' ? state.age !== null && state.age <= 23 : state.injury > 0).length;
  return `<section class="career-card panel career-development" aria-labelledby="career-development-title">
    <header class="career-dev-heading"><div><span class="eyebrow accent">Treinos e recuperação</span><h2 id="career-development-title">Desenvolvimento do elenco</h2></div>
      ${injured ? `<span class="career-dev-injury-count">${ui.icon('shield')}${injured} ${injured === 1 ? 'lesionado' : 'lesionados'}</span>` : `<span class="career-dev-squad-count">${ui.icon('users')}${all.length} jogadores</span>`}
    </header>
    <div class="career-dev-workspace">
      <aside class="career-dev-roster" aria-label="Jogadores para desenvolver">
        <label class="career-dev-search">${ui.icon('search')}<input type="search" id="career-development-search" aria-label="Buscar jogador para desenvolver" placeholder="Buscar jogador" value="${esc(search)}" autocomplete="off"></label>
        <div class="career-dev-filters" role="group" aria-label="Filtrar jogadores">
          ${Object.entries(DEVELOPMENT_FILTERS).map(([key, label]) => `<button type="button" data-action="career-development-filter" data-value="${key}" aria-pressed="${filter === key}">${label}<span>${filterCount(key)}</span></button>`).join('')}
        </div>
        <div class="career-dev-columns" aria-hidden="true"><span>Jogador</span><span>OVR</span><span>Pot.</span></div>
        <div class="career-dev-list" data-development-list>
          ${rows.map(({player, state}) => `<button type="button" class="career-dev-player${state.injury ? ' is-injured' : ''}" data-action="career-development-player" data-value="${esc(player.id)}" aria-pressed="${selected?.player.id === player.id}" aria-controls="career-development-focus">
            ${portrait(player)}<span class="career-dev-player-name"><strong>${esc(player.nome)}</strong><small>${state.injury ? `Recuperação · ${state.injury} ${state.injury === 1 ? 'jogo' : 'jogos'}` : `${esc(player.tags[0])}${state.age === null ? '' : ` · ${state.age} anos`}`}</small></span>
            <b class="career-dev-player-ovr">${player.ovr}</b><span class="career-dev-player-pot">${state.potential}</span>
          </button>`).join('') || `<div class="career-dev-no-results">${ui.icon('search')}<strong>Nenhum jogador encontrado</strong><button type="button" data-action="career-development-reset">Limpar filtros</button></div>`}
        </div>
      </aside>
      <div class="career-dev-focus${input?.animate ? ' is-changing' : ''}" id="career-development-focus" data-development-player="${esc(selected?.player.id ?? '')}">
        ${selected ? renderPlayerFocus(career, ui, view, {portrait, crest, money}) : `<div class="career-dev-empty-focus">${ui.icon('users')}<h3>Escolha um jogador</h3><p>Ajuste os filtros para ver seu elenco.</p></div>`}
      </div>
    </div>
  </section>`;
}

function renderPlayerFocus(career, ui, {selected: {player, state}, plan, preset, trained, blocked}, {portrait, crest, money}) {
  const percent = player.ovr >= state.potential ? 100 : Math.max(0, Math.min(100, Math.floor(state.xp / developmentThreshold(player.ovr) * 100))) || 0;
  const gain = player.ovr - state.baseOvr;
  const status = state.injury ? 'Em recuperação' : trained ? 'Treino concluído' : state.formLoss ? 'Em má fase' : state.badStreak ? 'Forma em alerta' : 'Pronto para treinar';
  return `<div class="career-dev-profile${state.injury ? ' is-injured' : ''}${trained ? ' is-trained' : ''}">
    <span class="career-dev-watermark" aria-hidden="true">${crest}</span>
    <div class="career-dev-profile-top"><span class="career-dev-status">${ui.icon(state.injury ? 'shield' : trained ? 'check' : 'bolt')}${status}</span>${gain > 0 && !state.formLoss ? `<span class="career-dev-gain">${ui.icon('chart')}+${gain} OVR</span>` : ''}</div>
    <div class="career-dev-identity">
      <div class="career-dev-portrait">${portrait(player)}</div><div class="career-dev-identity-copy"><h3 tabindex="-1">${esc(player.nome)}</h3><p><span>${esc(player.tags[0])}</span>${state.age === null ? 'Idade não cadastrada' : `${state.age} anos`}</p></div>
    </div>
    <div class="career-dev-trajectory"><div><span>OVR atual</span><strong>${player.ovr}</strong></div><span class="career-dev-trajectory-arrow">${ui.icon('arrow')}</span><div class="career-dev-ceiling"><span>Potencial <span title="Projeção do ScoreFut. Pode aumentar com os treinos." class="career-dev-info">${ui.icon('info')}</span></span><strong>${state.potential}</strong></div>
      ${state.appearances ? `<span class="career-dev-performance">${state.appearances} jogos <span>·</span> ${state.goals} gols</span>` : ''}
    </div>
    ${state.formLoss || state.badStreak ? `<div class="career-dev-form" role="status" title="Três atuações seguidas abaixo de 6 causam queda. Duas atuações com nota 7 ou mais recuperam 1 OVR. Nota estimada pelos lances, posição e resultado."><strong>${state.formLoss ? `−${state.formLoss} OVR por má fase` : `${state.badStreak}/3 atuações ruins`}</strong><span>${state.formLoss ? `${state.formRecovery}/2 etapas para recuperar 1 OVR` : 'Recupere a forma para evitar a queda.'}</span></div>` : ''}
    <div class="career-dev-progress"><div><span>${state.formLoss ? 'Evolução pausada pela má fase' : player.ovr >= state.potential ? 'Teto atual atingido' : `A caminho do OVR ${Math.min(player.ovr + 1, 99)}`}</span><b>${percent}%</b></div><progress max="100" value="${percent}" aria-label="Experiência para o próximo OVR" title="${state.xp} de ${developmentThreshold(player.ovr)} XP"></progress></div>
  </div>
  <div class="career-dev-session">
    <div class="career-dev-session-heading"><h4>Plano de treino</h4></div>
    <div class="career-dev-plans" role="group" aria-label="Escolher plano de treino">
      ${Object.entries(planDesign).filter(([key]) => !['form','intense'].includes(key) || state.formLoss || state.badStreak).map(([key, item]) => `<button type="button" data-action="career-development-plan" data-value="${key}" aria-pressed="${plan === key}"${state.injury ? key !== 'recovery' ? ' disabled' : '' : key === 'recovery' ? ' disabled' : ''}><span class="career-dev-plan-icon">${ui.icon(item.icon)}</span><strong>${item.label}</strong><small>${item.hint}</small><span class="career-dev-plan-check">${ui.icon('check')}</span></button>`).join('')}
    </div>
    <div class="career-dev-session-footer"><div><small>Custo da sessão</small><strong>${money(preset.cost)}</strong></div>
      <button type="button" class="btn btn-primary career-dev-start" data-action="career-train" data-value="${plan}:${esc(player.id)}"${blocked ? ' disabled' : ''}>${ui.icon(trained ? 'check' : 'bolt')}${trained ? 'Sessão concluída' : plan === 'recovery' ? 'Iniciar recuperação' : 'Iniciar treino'}</button>
    </div>
    ${blocked ? `<p class="career-dev-feedback${trained ? ' is-complete' : ''}" role="status" tabindex="-1">${ui.icon(trained ? 'check' : 'info')}${blocked}</p>` : ''}
  </div>`;
}
