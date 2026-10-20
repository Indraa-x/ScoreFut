import {nationalTeams} from './national-teams.js?v=worldcup-20261020';
/** All club crests are shipped with the site, without external image dependencies. */
const localClubLogos = Object.fromEntries([
  'real-madrid', 'barcelona', 'bayern', 'milan', 'manchester-united',
  'liverpool', 'manchester-city', 'arsenal', 'chelsea', 'inter',
  'juventus', 'ajax', 'napoli', 'tottenham', 'atletico-madrid',
  'borussia-dortmund', 'psg', 'porto', 'benfica', 'valencia', 'monaco',
  'flamengo', 'palmeiras', 'sao-paulo', 'corinthians', 'santos',
  'gremio', 'internacional', 'vasco', 'fluminense', 'botafogo', 'cruzeiro',
  'atletico-mineiro', 'athletico-paranaense', 'bahia', 'fortaleza',
  'celtic', 'marseille', 'psv', 'roma',
].map(id => [id, `assets/logos/${id}.png`]));

export const CLUB_LOGOS = Object.freeze({
  ...localClubLogos,
  ...Object.fromEntries(nationalTeams.map(team=>[team.id,`assets/logos/${team.id}.png`])),
});
