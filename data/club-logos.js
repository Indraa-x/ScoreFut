/** Local 256px crests from football-logos.cc. See assets/logos/sources.json. */
export const CLUB_LOGOS = Object.freeze(Object.fromEntries([
  'real-madrid', 'barcelona', 'bayern', 'milan', 'manchester-united',
  'liverpool', 'manchester-city', 'arsenal', 'chelsea', 'inter',
  'juventus', 'ajax', 'napoli', 'tottenham', 'atletico-madrid',
  'borussia-dortmund', 'psg', 'porto', 'benfica', 'valencia', 'monaco',
  'flamengo', 'palmeiras', 'sao-paulo', 'corinthians', 'santos',
  'gremio', 'internacional', 'vasco', 'fluminense', 'botafogo', 'cruzeiro',
  'atletico-mineiro', 'athletico-paranaense', 'bahia', 'fortaleza',
].map(id => [id, `assets/logos/${id}.png`])));
