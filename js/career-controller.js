import {
  CAREER_KEY, advanceCareerSeason, careerDestinations, changeCareerFormation, changeCareerStarter, createCareer,
  commitCareerRound, migrateCareerRoster, prepareCareerRound, releaseCareerPlayer, renameCareerClub, signCareerPlayer, upgradeCareerFacility,
} from './career.js';
import {loadWorldCupSquads, worldCupSquads} from '../data/game-squads.js';
import {CAREER_LEAGUES, careerLeague, careerSeasonTeam} from '../data/career-leagues.js';
import {CAREER_TABS, renderCareer, renderCareerIntro, renderCareerMarketResults} from './career-view.js';
import {renderCareerSetup} from './career-setup-view.js';
import {initMatchPlayback} from './match-playback.js';
import {MATCH_SPEEDS, normalizeMatchSpeed} from './match-motion.js';
import {currentMatch} from './match-session.js';
import {matchHasEnded} from './match-penalties.js';

const marketDefaults = {search: '', position: '', decade: '', order: 'overall', affordable: false, page: 1};
const activeCareerKey = 'coach-career-active';
const careerSlot = clubId => clubId ? `${CAREER_KEY}:${clubId}` : CAREER_KEY;

export function initCareer({app, navigate, render, storage, toast, ui}) {
  let tab = 'intro';
  let initial;
  let marketStatus = 'idle';
  let filters = {...marketDefaults};
  const squad = {group: 'reserves', selectedId: null};
  const selection = {leagueId: null, clubId: null};
  const activeSlot = () => careerSlot(careerSeasonTeam(storage.read(activeCareerKey))?.id);
  const savedCareer = () => storage.read(activeSlot());
  function read() {
    const saved = savedCareer();
    if (!saved) return initial ??= createCareer(crypto.getRandomValues(new Uint32Array(1))[0]);
    const career = migrateCareerRoster(saved);
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
    if (!storage.write(activeSlot(), next)) throw Error('O navegador não conseguiu salvar a carreira.');
  }
  function loadMatch(career = read()) {
    const replay = career.replay;
    if (!replay) return false;
    setTab('overview');
    live.tournament = replay.tournament;
    live.matchMinute = replay.minute;
    live.matchSpeed = normalizeMatchSpeed(career.matchSpeed);
    return true;
  }
  function saveReplay(showError = false) {
    const match = currentMatch(live);
    const career = read();
    if (!match || career.replay?.id !== match.id) return true;
    const minute = Math.max(live.matchMinute, career.replay.minute);
    const update = {...career, matchSpeed: live.matchSpeed, replay: {...career.replay, minute}};
    const next = commitCareerRound(update);
    if (next === update && career.matchSpeed === live.matchSpeed && career.replay.minute === minute) return true;
    try {
      save(next);
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
      if (`${career.season}:${career.round}` !== value) return;
      if (career.replay?.id !== value) {
        career = {...career, replay: prepareCareerRound(career)};
        save(career);
      }
      loadMatch(career);
      render();
    } catch (error) {
      toast(error.message);
    }
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
    tab = value === 'setup' || Object.hasOwn(CAREER_TABS, value) ? value : 'intro';
    squad.selectedId = null;
  }
  function refreshSquad(update = render) {
    const scroll = app.querySelector('.career-roster-list')?.scrollTop ?? 0;
    update();
    const list = app.querySelector('.career-roster-list');
    if (list) list.scrollTop = scroll;
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
    if (!careerDestinations(read(), id).length) {
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
  function loadMarket() {
    if (worldCupSquads.length) marketStatus = 'ready';
    if (marketStatus !== 'idle') return;
    marketStatus = 'loading';
    loadWorldCupSquads().then(
      () => { marketStatus = 'ready'; },
      () => { marketStatus = 'error'; },
    ).then(() => {
      if (tab === 'market' && app.dataset.screen === 'career') render();
    });
  }
  function updateMarketResults() {
    const results = app.querySelector('[data-career-market-results]');
    if (results) results.innerHTML = renderCareerMarketResults(read(), ui, filters);
  }
  function updateMarketFilters(form) {
    const fields = new FormData(form);
    filters = {
      search: fields.get('search'), position: fields.get('position'), decade: fields.get('decade'),
      order: fields.get('order'), affordable: fields.has('affordable'), page: 1,
    };
    updateMarketResults();
  }
  function open() {
    if (tab === 'intro') return renderCareerIntro(savedCareer() ?? initial, ui);
    if (tab === 'setup') {
      const ids = [null, ...CAREER_LEAGUES.flatMap(league => league.teams.map(team => team.id))];
      const saves = ids.map(id => storage.read(careerSlot(id))).filter(Boolean);
      return renderCareerSetup(selection.leagueId, selection.clubId, saves, ui);
    }
    const career = read();
    if (career === initial) storage.write(activeSlot(), career);
    if (tab === 'market') loadMarket();
    return renderCareer(career, tab, ui, live.tournament ? live : null, {status: marketStatus, filters}, squad);
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
      setTab('overview');
      navigate('career');
    } catch (error) {
      toast(error.message);
    }
  }
  app.addEventListener('change', event => {
    if (app.dataset.screen !== 'career') return;
    const field = event.target;
    if (field.form?.id === 'career-market-filters' && field.name !== 'search') updateMarketFilters(field.form);
    if (field.id === 'career-formation') {
      squad.selectedId = null;
      refreshSquad(() => change(career => changeCareerFormation(career, field.value)));
    }
  });
  app.addEventListener('keydown', event => {
    if (event.key === 'Escape' && app.dataset.screen === 'career' && tab === 'squad' && squad.selectedId) {
      event.preventDefault();
      cancelPick();
    }
  });
  app.addEventListener('input', event => {
    if (event.target.id === 'career-market-search') updateMarketFilters(event.target.form);
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
      'career-squad-group': value => {
        if (!['reserves', 'starters'].includes(value) || squad.group === value) return;
        squad.group = value;
        squad.selectedId = null;
        render();
      },
      'career-select-player': id => selectSquadPlayer(id, true),
      'career-cancel-pick': cancelPick,
      'career-pick-slot': pickSlot,
      'career-play': startMatch,
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
        finishMatch();
        app.querySelector('[data-action="career-match-return"]')?.focus({preventScroll: true});
      },
      'career-match-return': () => {
        const match = currentMatch(live);
        if (live.screen !== 'match' || !match || !matchHasEnded(live, match) || !saveReplay(true)) return;
        leaveMatch();
        render();
      },
      'career-next-season': value => change(career => career.season === Number(value) ? advanceCareerSeason(career) : career, 'Nova temporada iniciada.'),
      'career-market-page': value => {
        filters.page = Number(value);
        updateMarketResults();
        app.querySelector('#career-market-count')?.focus();
      },
      'career-market-retry': () => {
        marketStatus = 'idle';
        render();
      },
      'career-sign': value => {
        change(career => signCareerPlayer(career, value), 'Jogador contratado. Confira a reserva em Elenco.');
        const card = document.getElementById(`career-offer-${value}`);
        (card || app.querySelector('#career-market-count'))?.focus({preventScroll: true});
      },
      'career-upgrade': value => change(career => upgradeCareerFacility(career, value), 'Instalação melhorada.'),
      'career-release': value => {
        if (squad.selectedId === value) squad.selectedId = null;
        refreshSquad(() => change(career => releaseCareerPlayer(career, value), 'Jogador liberado.'));
      },
    },
  };
}
