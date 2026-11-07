import {
  CAREER_KEY, advanceCareerSeason, changeCareerFormation, changeCareerStarter, createCareer,
  playCareerRound, releaseCareerPlayer, renameCareerClub, signCareerPlayer, upgradeCareerFacility,
} from './career.js';
import {CAREER_TABS, renderCareer} from './career-view.js';

export function initCareer({app, navigate, render, storage, toast, ui}) {
  let tab = 'overview';
  let initial;
  const read = () => storage.read(CAREER_KEY) ?? (initial ??= createCareer(crypto.getRandomValues(new Uint32Array(1))[0]));
  function change(update, message) {
    try {
      const previous = read();
      const next = update(previous);
      if (next === previous) return;
      if (!storage.write(CAREER_KEY, next)) throw Error('O navegador não conseguiu salvar a carreira.');
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
    setTab, open, get tab() { return tab; },
    actions: {
      career: () => { setTab('overview'); navigate('career'); },
      'career-tab': value => { setTab(value); navigate('career'); },
      'career-play': value => change(career => `${career.season}:${career.round}` === value ? playCareerRound(career) : career),
      'career-next-season': value => change(career => career.season === Number(value) ? advanceCareerSeason(career) : career, 'Nova temporada iniciada.'),
      'career-sign': value => change(career => signCareerPlayer(career, value), 'Jogador contratado. Confira a reserva em Elenco.'),
      'career-upgrade': value => change(career => upgradeCareerFacility(career, value), 'Instalação melhorada.'),
      'career-release': value => change(career => releaseCareerPlayer(career, value), 'Jogador liberado.'),
    },
  };
}
