import {
  CAREER_KEY, advanceCareerSeason, changeCareerFormation, changeCareerStarter, createCareer,
  commitCareerRound, prepareCareerRound, releaseCareerPlayer, renameCareerClub, signCareerPlayer, upgradeCareerFacility,
} from './career.js';
import {loadWorldCupSquads, worldCupSquads} from '../data/game-squads.js';
import {CAREER_TABS, renderCareer, renderCareerMarketResults} from './career-view.js';
import {initMatchPlayback} from './match-playback.js';
import {MATCH_SPEEDS, normalizeMatchSpeed} from './match-motion.js';
import {currentMatch} from './match-session.js';
import {matchHasEnded} from './match-penalties.js';

const marketDefaults = {search: '', position: '', decade: '', order: 'overall', affordable: false, page: 1};

export function initCareer({app, navigate, render, storage, toast, ui}) {
  let tab = 'overview';
  let initial;
  let marketStatus = 'idle';
  let filters = {...marketDefaults};
  const read = () => storage.read(CAREER_KEY) ?? (initial ??= createCareer(crypto.getRandomValues(new Uint32Array(1))[0]));
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
    if (!storage.write(CAREER_KEY, next)) throw Error('O navegador não conseguiu salvar a carreira.');
  }
  function loadMatch(career = read()) {
    const replay = career.replay;
    if (!replay) return false;
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
    tab = Object.hasOwn(CAREER_TABS, value) ? value : 'overview';
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
    const career = read();
    if (career === initial) storage.write(CAREER_KEY, career);
    if (tab === 'market') loadMarket();
    return renderCareer(career, tab, ui, live.tournament ? live : null, {status: marketStatus, filters});
  }
  app.addEventListener('change', event => {
    if (app.dataset.screen !== 'career') return;
    const field = event.target;
    if (field.form?.id === 'career-market-filters' && field.name !== 'search') updateMarketFilters(field.form);
    if (field.id === 'career-formation') change(career => changeCareerFormation(career, field.value));
    if (field.dataset.careerSlot) change(career => changeCareerStarter(career, field.dataset.careerSlot, field.value));
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
      career: () => { setTab('overview'); navigate('career'); },
      'career-tab': value => { setTab(value); navigate('career'); },
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
      'career-release': value => change(career => releaseCareerPlayer(career, value), 'Jogador liberado.'),
    },
  };
}
