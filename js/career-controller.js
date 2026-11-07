import {
  CAREER_KEY, advanceCareerSeason, changeCareerFormation, changeCareerStarter, createCareer,
  commitCareerRound, prepareCareerRound, releaseCareerPlayer, renameCareerClub, signCareerPlayer, upgradeCareerFacility,
} from './career.js';
import {CAREER_TABS, careerCrest, renderCareer} from './career-view.js';
import {initMatchPlayback} from './match-playback.js';
import {MATCH_SPEEDS, normalizeMatchSpeed} from './match-motion.js';
import {currentMatch} from './match-session.js';
import {matchHasEnded} from './match-penalties.js';

export function initCareer({app, navigate, render, storage, toast, ui}) {
  let tab = 'overview';
  let initial;
  const read = () => storage.read(CAREER_KEY) ?? (initial ??= createCareer(crypto.getRandomValues(new Uint32Array(1))[0]));
  const live = {screen: null, mode: 'career', userMatchIndex: 0, tournament: null, matchMinute: 0, matchSpeed: 4};
  const playback = initMatchPlayback({
    app, state: live,
    onSave: () => saveReplay(),
    onFinish: () => { saveReplay(true); render(); },
  });
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
  function leaveMatch() {
    if (live.screen !== 'match') return;
    playback.stop();
    live.matchPlaying = false;
    saveReplay();
  }
  function attachMatch(active) {
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
      navigate('career-match');
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
  function open() {
    const career = read();
    if (career === initial) storage.write(CAREER_KEY, career);
    return renderCareer(career, tab, ui);
  }
  app.addEventListener('change', event => {
    if (app.dataset.screen !== 'career') return;
    const field = event.target;
    if (field.id === 'career-formation') change(career => changeCareerFormation(career, field.value));
    if (field.dataset.careerSlot) change(career => changeCareerStarter(career, field.dataset.careerSlot, field.value));
  });
  app.addEventListener('submit', event => {
    if (event.target.id !== 'career-club-form') return;
    event.preventDefault();
    const fields = new FormData(event.target);
    change(career => renameCareerClub(career, fields.get('name'), fields.get('crest')), 'Clube atualizado.');
  });

  return {
    setTab, open, loadMatch, leaveMatch, attachMatch, get tab() { return tab; },
    matchView: () => ui.renderMatch(live, {
      career: true, badge: team => team.id === live.tournament.userTeamId
        ? `<span class="club-badge career-match-crest">${careerCrest(team.crest)}</span>`
        : ui.badge(team),
    }),
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
      'career-match-return': () => {
        const match = currentMatch(live);
        if (live.screen !== 'match' || !match || !matchHasEnded(live, match) || !saveReplay(true)) return;
        setTab('overview');
        navigate('career');
      },
      'career-next-season': value => change(career => career.season === Number(value) ? advanceCareerSeason(career) : career, 'Nova temporada iniciada.'),
      'career-sign': value => change(career => signCareerPlayer(career, value), 'Jogador contratado. Confira a reserva em Elenco.'),
      'career-upgrade': value => change(career => upgradeCareerFacility(career, value), 'Instalação melhorada.'),
      'career-release': value => change(career => releaseCareerPlayer(career, value), 'Jogador liberado.'),
    },
  };
}
