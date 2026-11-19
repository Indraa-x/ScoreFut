import {trainCareerPlayer} from './career-development.js';
import {developmentView, DEVELOPMENT_FILTERS} from './career-development-view.js';
import {
  listCareerPlayer, cancelCareerListing, updateCareerTransferOffers, acceptCareerOffer, rejectCareerOffer,
  CAREER_KEY, advanceCareerSeason, careerDestinations, changeCareerFormation, changeCareerStarter, changeCareerStyle, createCareer,
  careerReserveReplacements, careerSale, commitCareerRound, migrateCareerChampions, migrateCareerCurrency, migrateCareerRoster, prepareCareerRound, renameCareerClub,
  careerChampionsFixture, careerNextCompetition, commitCareerChampionsMatch, prepareCareerChampionsMatch, signCareerPlayer,
} from './career.js';
import {CAREER_LEAGUES, careerLeague, careerSeasonTeam} from '../data/career-leagues.js';
import {CAREER_TABS, renderCareer, renderCareerChampionsTie, renderCareerIntro, renderCareerMarketResults, renderCareerSale, renderCareerOfferNotice, renderCareerDevelopment} from './career-view.js';
import {renderCareerSetup} from './career-setup-view.js';
import {initMatchPlayback} from './match-playback.js';
import {MATCH_SPEEDS, normalizeMatchSpeed} from './match-motion.js';
import {currentMatch} from './match-session.js';
import {beginPenaltyReplay, matchHasEnded} from './match-penalties.js';

const marketDefaults = {search: '', position: '', leagueId: '', order: 'overall', affordable: false, page: 1};
const activeCareerKey = 'coach-career-active';
const careerSlot = clubId => clubId ? `${CAREER_KEY}:${clubId}` : CAREER_KEY;

export function initCareer({app, modal, navigate, render, storage, toast, ui}) {
  let tab = 'intro';
  let initial;
  let filters = {...marketDefaults};
  let championsView = {};
  const squad = {selectedId: null};
  const development = {selectedId: null, plan: 'technique', search: '', filter: 'all'};
  let squadPress = null;
  let squadDrag = null;
  let ignoreSquadClick = false;
  const selection = {leagueId: null, clubId: null};
  const activeSlot = () => careerSlot(careerSeasonTeam(storage.read(activeCareerKey))?.id);
  const savedCareer = () => storage.read(activeSlot());
  function read() {
    const saved = savedCareer();
    if (!saved) return initial ??= createCareer(crypto.getRandomValues(new Uint32Array(1))[0]);
    const career = migrateCareerChampions(migrateCareerCurrency(migrateCareerRoster(saved)));
    if (career !== saved) storage.write(activeSlot(), career);
    return career;
  }
  const live = {screen: null, mode: 'career', userMatchIndex: 0, tournament: null, matchMinute: 0, matchSpeed: 4};
  const playback = initMatchPlayback({
    app, state: live,
    onSave: () => saveReplay(),
    onFinish: finishMatch,
  });
  function finishMatch() {
    saveReplay(true);
    render();
  }
  function save(next) {
    const previousOffers = new Set((savedCareer()?.transferOffers ?? []).map(offer => offer.id));
    next = updateCareerTransferOffers(next);
    if (!storage.write(activeSlot(), next)) throw Error('O navegador não conseguiu salvar a carreira.');
    const received = (next.transferOffers ?? []).filter(offer => !previousOffers.has(offer.id));
    if (received.length) queueMicrotask(() => toast('Nova proposta de transferência', {
      html: renderCareerOfferNotice(next, received, ui), duration: 10000,
    }));
  }
  function loadMatch(career = read(), competition = careerNextCompetition(career)) {
    const champions = competition === 'champions';
    const replay = champions ? career.champions?.replay : career.replay;
    if (!replay) return false;
    setTab('overview');
    live.tournament = champions ? {
      ...career.champions.tournament, teams: replay.pending.teams, userMatches: [replay.match],
    } : replay.tournament;
    live.matchMinute = replay.minute;
    live.matchSpeed = normalizeMatchSpeed(career.matchSpeed);
    live.penaltyReplay = replay.penaltyReplay ? {...replay.penaltyReplay} : null;
    if (champions) beginPenaltyReplay(live, replay.match);
    return true;
  }
  function saveChampionsReplay(career, match) {
    const {champions} = career;
    const replay = champions?.replay;
    if (replay?.id !== match.id || replay.pending.seed !== live.tournament.seed) return;
    const minute = Math.max(live.matchMinute, replay.minute);
    const penaltyReplay = live.penaltyReplay;
    if (career.matchSpeed === live.matchSpeed && replay.minute === minute &&
        replay.penaltyReplay?.revealed === penaltyReplay?.revealed && !matchHasEnded(live, match)) return;
    save(commitCareerChampionsMatch({
      ...career, matchSpeed: live.matchSpeed,
      champions: {...champions, replay: {...replay, minute, penaltyReplay}},
    }));
  }
  function saveReplay(showError = false) {
    const match = currentMatch(live);
    const career = read();
    if (!match) return true;
    try {
      if (live.tournament.mode === 'champions') {
        saveChampionsReplay(career, match);
        return true;
      }
      if (career.replay?.id !== match.id) return true;
      const minute = Math.max(live.matchMinute, career.replay.minute);
      const update = {...career, matchSpeed: live.matchSpeed, replay: {...career.replay, minute}};
      const next = commitCareerRound(update);
      if (next !== update || career.matchSpeed !== live.matchSpeed || career.replay.minute !== minute) save(next);
      return true;
    } catch (error) {
      if (showError) toast(error.message);
      return false;
    }
  }
  function pauseMatch() {
    if (live.screen !== 'match') return;
    playback.stop();
    live.matchPlaying = false;
    saveReplay();
  }
  function leaveMatch() {
    pauseMatch();
    live.screen = null;
    live.tournament = null;
    live.penaltyReplay = null;
  }
  function attachMatch(active) {
    active = active && tab === 'overview' && Boolean(live.tournament);
    live.screen = active ? 'match' : null;
    playback.attach();
    if (active && live.matchPlaying) playback.start();
  }
  function startMatch(value) {
    try {
      let career = read();
      if (tab !== 'overview' || careerNextCompetition(career) !== 'league' || `${career.season}:${career.round}` !== value) return;
      if (career.replay?.id !== value) {
        career = {...career, replay: prepareCareerRound(career)};
        save(career);
      }
      loadMatch(career, 'league');
      render();
    } catch (error) {
      toast(error.message);
    }
  }
  function startChampionsMatch(value) {
    if (tab !== 'overview') return;
    try {
      let career = read();
      const fixture = careerChampionsFixture(career);
      if (careerNextCompetition(career) !== 'champions' || !fixture || `${career.season}:${fixture.id}` !== value) return;
      if (career.champions.replay?.id !== fixture.id) {
        career = {...career, champions: {...career.champions, replay: prepareCareerChampionsMatch(career)}};
        save(career);
      }
      loadMatch(career, 'champions');
      render();
    } catch (error) {
      toast(error.message);
    }
  }
  function updateChampionsView(key, value) {
    if (tab !== 'standings' || live.tournament) return;
    championsView = {...championsView, [key]: value, championsDetailsOpen: true};
    render();
  }
  function openChampionsTie(id) {
    if (tab !== 'standings' || !modal || modal.open) return;
    const career = read();
    if (!career.champions) return;
    const html = renderCareerChampionsTie(career, id, ui);
    if (!html) return;
    modal.querySelector('#modal-content').innerHTML = html;
    modal.showModal();
  }
  function change(update, message) {
    try {
      const previous = read();
      const next = update(previous);
      if (next === previous) return;
      save(next);
      if (message) toast(message);
    } catch (error) {
      toast(error.message);
    }
    render();
  }
  function setTab(value) {
    clearSquadDrag();
    tab = value === 'champions' ? 'overview' : value === 'setup' || Object.hasOwn(CAREER_TABS, value) ? value : 'intro';
    squad.selectedId = null;
  }
  function refreshSquad(update = render) {
    const scroll = app.querySelector('.career-roster-list')?.scrollTop ?? 0;
    update();
    const list = app.querySelector('.career-roster-list');
    if (list) list.scrollTop = scroll;
  }
  function openSale(id) {
    if (tab !== 'squad' || !modal || modal.open) return;
    try {
      save(listCareerPlayer(read(), id));
      setTab('transfers');
      render();
      toast('Jogador à venda. As propostas chegam após as próximas partidas.');
    } catch (error) {
      toast(error.message);
    }
  }
  function confirmSale(id) {
    if (tab !== 'transfers' || !modal?.open || modal.querySelector('[data-action="career-transfer-confirm"]')?.dataset.value !== id) return;
    try {
      save(acceptCareerOffer(read(), id));
      squad.selectedId = null;
      modal.close();
      refreshSquad();
      app.querySelector('.career-transfers h2')?.focus({preventScroll: true});
      toast('Jogador vendido. O valor entrou no orçamento.');
    } catch (error) {
      modal.close();
      toast(error.message);
    }
  }
  function openTransferOffer(id) {
    if (tab !== 'transfers' || !modal || modal.open) return;
    try {
      const career = read(), offer = career.transferOffers?.find(offer => offer.id === id);
      if (!offer) throw Error('Proposta indisponível.');
      const sale = careerSale(career, offer.playerId);
      modal.querySelector('#modal-content').innerHTML = renderCareerSale({...sale, price: offer.price,
        proposalId: id, buyer: careerSeasonTeam(offer.clubId).nome}, ui);
      modal.showModal();
    } catch (error) { toast(error.message); }
  }
  function cancelPick() {
    squad.selectedId = null;
    refreshSquad();
  }
  function selectSquadPlayer(id, fromRoster) {
    if (squad.selectedId === id) {
      cancelPick();
      return;
    }
    if (fromRoster && !careerDestinations(read(), id).length) {
      toast('Este jogador não tem outra posição compatível nesta formação.');
      return;
    }
    squad.selectedId = id;
    refreshSquad();
    if (fromRoster) {
      const field = app.querySelector('.career-edit-pitch');
      if (matchMedia('(max-width: 760px)').matches) field?.scrollIntoView({block: 'nearest'});
      field?.querySelector('.career-squad-slot.is-target')?.focus({preventScroll: true});
    }
  }
  function pickSlot(slotId) {
    const career = read();
    const occupant = career.lineup[slotId];
    if (!occupant) return;
    const id = squad.selectedId;
    if (!id || id === occupant) {
      selectSquadPlayer(occupant);
      return;
    }
    squad.selectedId = null;
    refreshSquad(() => change(current => changeCareerStarter(current, slotId, id), 'Escalação atualizada.'));
  }
  function clearSquadDrag() {
    const pointerId = squadPress?.pointerId;
    squadPress = null;
    if (pointerId != null && app.hasPointerCapture(pointerId)) app.releasePointerCapture(pointerId);
    if (!squadDrag) return;
    const {layout, source, targets, disabledSlots, bench, preview} = squadDrag;
    squadDrag = null;
    preview.remove();
    layout.classList.remove('is-dragging-player');
    source.classList.remove('is-drag-origin');
    bench.classList.remove('is-drop-hover');
    for (const target of targets) target.classList.remove('is-drop-ready', 'is-drop-hover');
    for (const slot of disabledSlots) slot.disabled = true;
  }
  function pressSquadPlayer(event) {
    if (!event.isPrimary || event.button !== 0 || squadPress) return;
    ignoreSquadClick = false;
    if (event.pointerType === 'touch' || app.dataset.screen !== 'career' || tab !== 'squad') return;
    const source = event.target.closest('[data-career-drag-player]');
    if (!source || source.disabled) return;
    squadPress = {source, pointerId: event.pointerId, x: event.clientX, y: event.clientY};
  }
  function startSquadDrag(event) {
    const {source} = squadPress;
    const layout = source.closest('.career-squad-layout');
    const avatar = source.querySelector('.career-roster-avatar, .career-squad-token');
    if (!layout || !avatar || !app.contains(source)) return;
    const career = read();
    const id = source.dataset.careerDragPlayer;
    const origin = source.dataset.action === 'career-pick-slot' ? source.dataset.value : null;
    const destinations = new Set(careerDestinations(career, id).map(slot => slot.id));
    const replacements = new Set(careerReserveReplacements(career, origin).map(player => player.id));
    const bench = layout.querySelector('.career-roster');
    const targets = [...layout.querySelectorAll('[data-career-drag-player]')].filter(player =>
      player.dataset.action === 'career-pick-slot' ? destinations.has(player.dataset.value)
        : replacements.has(player.dataset.careerDragPlayer));
    const disabledSlots = targets.filter(target => target.disabled);
    for (const slot of disabledSlots) slot.disabled = false;
    const size = Math.max(68, Math.ceil(avatar.getBoundingClientRect().width * 1.3));
    const preview = avatar.cloneNode(true);
    preview.classList.add('career-drag-avatar');
    preview.setAttribute('aria-hidden', 'true');
    preview.style.width = preview.style.height = `${size}px`;
    document.body.append(preview);
    squadDrag = {layout, source, id, origin, bench, targets, disabledSlots, replacements, preview};
    source.classList.add('is-drag-origin');
    layout.classList.add('is-dragging-player');
    for (const target of targets) target.classList.add('is-drop-ready');
    ignoreSquadClick = true;
    app.setPointerCapture(event.pointerId);
  }
  function squadDropTarget(element) {
    if (!squadDrag?.layout.contains(element)) return null;
    const slot = element.closest('.career-squad-slot');
    if (slot && squadDrag.targets.includes(slot)) return {element: slot, slotId: slot.dataset.value};
    const {bench, origin, replacements} = squadDrag;
    if (!origin || !replacements.size || !bench.contains(element)) return null;
    const reserve = element.closest('.career-roster-row')?.querySelector('[data-career-drag-player]');
    if (reserve && !replacements.has(reserve.dataset.careerDragPlayer)) return null;
    return {element: reserve ?? bench, slotId: origin, toBench: true, replacementId: reserve?.dataset.careerDragPlayer};
  }
  function moveSquadPlayer(event) {
    if (squadPress?.pointerId !== event.pointerId) return;
    if (event.buttons === 0) {
      clearSquadDrag();
      return;
    }
    const {clientX, clientY} = event;
    if (!squadDrag && Math.hypot(clientX - squadPress.x, clientY - squadPress.y) >= 5) startSquadDrag(event);
    if (!squadDrag) return;
    squadDrag.preview.style.left = `${clientX}px`;
    squadDrag.preview.style.top = `${clientY}px`;
    const target = squadDropTarget(document.elementFromPoint(clientX, clientY));
    for (const item of [...squadDrag.targets, squadDrag.bench]) {
      item.classList.toggle('is-drop-hover', item === target?.element);
    }
  }
  function dropSquadPlayer(event) {
    if (squadPress?.pointerId !== event.pointerId) return;
    const drag = squadDrag;
    const target = drag && squadDropTarget(document.elementFromPoint(event.clientX, event.clientY));
    clearSquadDrag();
    if (!target) return;
    const {id, origin} = drag;
    squad.selectedId = null;
    refreshSquad(() => change(career => {
      if (!target.toBench) return changeCareerStarter(career, target.slotId, id);
      if (career.lineup[origin] !== id) return career;
      const reserves = careerReserveReplacements(career, origin);
      const replacement = target.replacementId ? reserves.find(player => player.id === target.replacementId) : reserves[0];
      if (!replacement) throw Error('Escolha um reserva compatível para a troca.');
      return changeCareerStarter(career, origin, replacement.id);
    }, 'Escalação atualizada.'));
  }
  function updateDevelopment({resetList = false, reveal = false} = {}) {
    const panel = app.querySelector('.career-development');
    if (!panel) { render(); return; }
    const oldPlayer = panel.querySelector('[data-development-player]')?.dataset.developmentPlayer;
    const listScroll = resetList ? 0 : panel.querySelector('[data-development-list]')?.scrollTop ?? 0;
    const field = panel.querySelector('#career-development-search');
    const editing = field === document.activeElement;
    const active = panel.contains(document.activeElement) ? document.activeElement.closest('[data-action]')?.dataset : null;
    const activeAction = active ? {action: active.action, value: active.value} : null;
    const caret = editing ? [field.selectionStart, field.selectionEnd] : null;
    const career = read();
    development.animate = oldPlayer !== developmentView(career, development).selected?.player.id;
    panel.outerHTML = renderCareerDevelopment(career, ui, development);
    development.animate = false;
    const next = app.querySelector('.career-development');
    const list = next.querySelector('[data-development-list]');
    if (list) list.scrollTop = listScroll;
    next.querySelectorAll('[data-career-portrait]').forEach(img => {
      if (img.complete && img.naturalWidth) img.classList.add('is-loaded');
    });
    if (editing) {
      const input = next.querySelector('#career-development-search');
      input.focus({preventScroll: true});
      input.setSelectionRange(...caret);
    }
    if (!editing && !reveal && activeAction) {
      [...next.querySelectorAll('[data-action]')].find(button => button.dataset.action === activeAction.action && button.dataset.value === activeAction.value)?.focus({preventScroll: true});
    }
    if (reveal) {
      const focus = next.querySelector('.career-dev-focus');
      focus.querySelector('h3')?.focus({preventScroll: true});
      if (next.clientWidth < 680) focus.scrollIntoView({block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
    }
  }
  function updateMarketResults() {
    const results = app.querySelector('[data-career-market-results]');
    if (results) results.innerHTML = renderCareerMarketResults(read(), ui, filters);
  }
  function updateMarketFilters(form) {
    const fields = new FormData(form);
    filters = {
      search: fields.get('search'), position: fields.get('position'), leagueId: fields.get('leagueId'),
      order: fields.get('order'), affordable: fields.has('affordable'), page: 1,
    };
    updateMarketResults();
  }
  function open() {
    if (tab === 'intro') {
      const saved = savedCareer();
      return renderCareerIntro(saved ? migrateCareerCurrency(saved) : initial, ui);
    }
    if (tab === 'setup') {
      const ids = [null, ...CAREER_LEAGUES.flatMap(league => league.teams.map(team => team.id))];
      const saves = ids.map(id => storage.read(careerSlot(id))).filter(Boolean);
      return renderCareerSetup(selection.leagueId, selection.clubId, saves, ui);
    }
    const career = read();
    if (career === initial) storage.write(activeSlot(), career);
    const previousTab = app.querySelector('.career-content')?.dataset.careerTab;
    return renderCareer(career, tab, ui, live.tournament ? live : null, filters, squad, previousTab, championsView, development);
  }
  async function startCampaign(button) {
    if (tab !== 'intro' || button?.disabled) return;
    if (button && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      button.disabled = true;
      button.setAttribute('aria-busy', 'true');
      button.classList.add('is-career-launching');
      const animations = button.getAnimations?.({subtree: true}) ?? [];
      await Promise.all(animations.filter(animation =>
        ['career-tactic-press', 'career-tactic-replay'].includes(animation.animationName)
      ).map(animation => animation.finished.catch(() => {})));
    }
    if (tab !== 'intro' || (button && !app.contains(button))) return;
    setTab(savedCareer() || initial ? 'overview' : 'setup');
    navigate('career');
  }
  function openCampaign(clubId, create = false) {
    if (tab !== 'setup' || (clubId && !careerSeasonTeam(clubId))) return;
    try {
      const slot = careerSlot(clubId);
      if (!storage.read(slot)) {
        if (!create || !clubId) return;
        const campaign = createCareer(crypto.getRandomValues(new Uint32Array(1))[0], clubId);
        if (!storage.write(slot, campaign)) throw Error('O navegador não conseguiu salvar a carreira.');
      }
      if (!storage.write(activeCareerKey, clubId || null)) throw Error('O navegador não conseguiu abrir a carreira.');
      championsView = {};
      Object.assign(development, {selectedId: null, plan: 'technique', search: '', filter: 'all'});
      setTab('overview');
      navigate('career');
    } catch (error) {
      toast(error.message);
    }
  }
  app.addEventListener('pointerdown', pressSquadPlayer);
  app.addEventListener('pointermove', moveSquadPlayer);
  app.addEventListener('pointerup', dropSquadPlayer);
  app.addEventListener('pointerleave', () => {
    if (!squadDrag) clearSquadDrag();
  });
  for (const type of ['pointercancel', 'lostpointercapture']) {
    app.addEventListener(type, event => {
      if (squadPress?.pointerId === event.pointerId) clearSquadDrag();
    });
  }
  app.addEventListener('click', event => {
    if (!ignoreSquadClick || event.detail === 0) return;
    ignoreSquadClick = false;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);
  app.addEventListener('load', event => {
    if (event.target.hasAttribute?.('data-career-portrait')) {
      event.target.classList.add('is-loaded');
    }
  }, true);
  app.addEventListener('change', event => {
    if (app.dataset.screen !== 'career') return;
    const field = event.target;
    if (field.form?.id === 'career-market-filters' && field.name !== 'search') updateMarketFilters(field.form);
    if (field.id === 'career-formation') {
      squad.selectedId = null;
      refreshSquad(() => change(career => changeCareerFormation(career, field.value)));
    }
    if (field.id === 'career-play-style') {
      refreshSquad(() => change(career => changeCareerStyle(career, field.value)));
      app.querySelector('#career-play-style')?.focus({preventScroll: true});
    }
  });
  app.addEventListener('keydown', event => {
    if (event.key === 'Escape' && squadDrag) {
      event.preventDefault();
      clearSquadDrag();
      return;
    }
    if (event.key === 'Escape' && app.dataset.screen === 'career' && tab === 'squad' && squad.selectedId) {
      event.preventDefault();
      cancelPick();
    }
  });
  app.addEventListener('input', event => {
    if (event.target.id === 'career-market-search') updateMarketFilters(event.target.form);
    if (tab === 'club' && event.target.id === 'career-development-search') {
      development.search = event.target.value;
      updateDevelopment({resetList: true});
    }
  });
  app.addEventListener('reset', event => {
    if (event.target.id !== 'career-market-filters') return;
    event.preventDefault();
    filters = {...marketDefaults};
    render();
  });
  app.addEventListener('submit', event => {
    if (event.target.id === 'career-market-filters') {
      event.preventDefault();
      return;
    }
    if (event.target.id !== 'career-club-form') return;
    event.preventDefault();
    const fields = new FormData(event.target);
    change(career => renameCareerClub(career, fields.get('name'), fields.get('crest')), 'Clube atualizado.');
  });

  return {
    setTab, open, loadMatch, pauseMatch, leaveMatch, attachMatch, get tab() { return tab; },
    actions: {
      career: () => { setTab('intro'); navigate('career'); },
      'career-start': (_value, button) => startCampaign(button),
      'career-new': () => { setTab('setup'); navigate('career'); },
      'career-select-league': id => {
        if (tab !== 'setup' || !careerLeague(id)) return;
        selection.leagueId = id;
        selection.clubId = null;
        render();
      },
      'career-select-club': id => {
        if (tab !== 'setup' || careerSeasonTeam(id)?.leagueId !== selection.leagueId) return;
        selection.clubId = id;
        render();
      },
      'career-create': () => openCampaign(selection.clubId, true),
      'career-load': id => openCampaign(id),
      'career-tab': value => { setTab(value); navigate('career'); },
      'career-select-player': id => selectSquadPlayer(id, true),
      'career-pick-slot': pickSlot,
      'career-play': startMatch,
      'career-champions-play': startChampionsMatch,
      'career-champions-view': value => updateChampionsView('championsView', value),
      'career-standings-competition': value => updateChampionsView('standingsCompetition', value === 'champions' ? 'champions' : 'league'),
      'career-champions-group': value => updateChampionsView('championsGroupId', value),
      'career-champions-round': value => updateChampionsView('championsRound', value),
      'career-champions-table-detail': () => updateChampionsView('championsTableDetailed', !championsView.championsTableDetailed),
      'career-champions-tie': openChampionsTie,
      'career-match-speed': value => {
        const speed = Number(value);
        if (live.screen !== 'match' || !MATCH_SPEEDS.includes(speed)) return;
        live.matchSpeed = speed;
        saveReplay(true);
        render();
      },
      'career-match-finish': () => {
        const match = currentMatch(live);
        if (live.screen !== 'match' || !match || matchHasEnded(live, match)) return;
        playback.stop();
        live.matchPlaying = false;
        live.matchMinute = match.result.duration;
        live.penaltyReplay = null;
        finishMatch();
        app.querySelector('[data-action="career-match-return"]')?.focus({preventScroll: true});
      },
      'career-match-return': () => {
        const match = currentMatch(live);
        if (live.screen !== 'match' || !match || !matchHasEnded(live, match) || !saveReplay(true)) return;
        leaveMatch();
        render();
      },
      'career-next-season': value => change(career => {
        if (career.season !== Number(value)) return career;
        const next = advanceCareerSeason(career);
        championsView = {};
        return next;
      }, 'Nova temporada iniciada.'),
      'career-market-page': value => {
        filters.page = Number(value);
        updateMarketResults();
        app.querySelector('#career-market-count')?.focus();
      },
      'career-sign': value => {
        change(career => signCareerPlayer(career, value), 'Jogador contratado. Confira a reserva em Elenco.');
        const card = document.getElementById(`career-offer-${value}`);
        (card || app.querySelector('#career-market-count'))?.focus({preventScroll: true});
      },
      'career-development-player': id => {
        if (tab !== 'club' || !read().roster.some(player => player.id === id)) return;
        development.selectedId = id;
        development.plan = 'technique';
        updateDevelopment({reveal: true});
      },
      'career-development-filter': value => {
        if (tab !== 'club' || !Object.hasOwn(DEVELOPMENT_FILTERS, value)) return;
        development.filter = value;
        updateDevelopment({resetList: true});
      },
      'career-development-plan': value => {
        if (tab !== 'club' || !['technique', 'potential', 'recovery'].includes(value)) return;
        development.plan = value;
        updateDevelopment();
      },
      'career-development-reset': () => {
        Object.assign(development, {search: '', filter: 'all'});
        updateDevelopment({resetList: true});
      },
      'career-train': value => {
        const [plan,id] = value.split(':');
        const scroll = app.querySelector('[data-development-list]')?.scrollTop ?? 0;
        development.selectedId = id;
        development.animate = true;
        change(career => trainCareerPlayer(career,id,plan), 'Sessão concluída.');
        development.animate = false;
        const list = app.querySelector('[data-development-list]');
        if (list) list.scrollTop = scroll;
        app.querySelector('.career-dev-feedback')?.focus({preventScroll: true});
      },
      'career-sell': openSale,
      'career-transfer-open': openTransferOffer,
      'career-transfer-confirm': confirmSale,
      'career-transfer-cancel': value => change(career => cancelCareerListing(career, value), 'Jogador retirado da lista de venda.'),
      'career-transfer-reject': value => change(career => rejectCareerOffer(career, value), 'Proposta recusada. Outros clubes podem fazer ofertas.'),
    },
  };
}
