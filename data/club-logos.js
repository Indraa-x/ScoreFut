/** All club crests are shipped with the site, without external image dependencies. */
const localClubLogos = Object.fromEntries([
  'real-madrid', 'barcelona', 'bayern', 'milan', 'manchester-united',
  'liverpool', 'manchester-city', 'arsenal', 'chelsea', 'inter',
  'juventus', 'ajax', 'napoli', 'tottenham', 'atletico-madrid',
  'borussia-dortmund', 'psg', 'porto', 'benfica', 'valencia', 'monaco',
  'flamengo', 'palmeiras', 'sao-paulo', 'corinthians', 'santos',
  'gremio', 'internacional', 'vasco', 'fluminense', 'botafogo', 'cruzeiro',
  'atletico-mineiro', 'athletico-paranaense', 'bahia', 'fortaleza',
  'celtic', 'marseille', 'psv', 'roma', 'galatasaray', 'fenerbahce', 'rb-leipzig',
].map(id => [id, `assets/logos/${id}.png`]));

const nationIds=['spain','germany','france','italy','england','portugal','netherlands','denmark','belgium','croatia','czechia','switzerland','turkey','hungary','romania','poland','austria','scotland','ukraine','slovakia','slovenia','albania','serbia','georgia'];
export const CLUB_LOGOS = Object.freeze({...localClubLogos,...Object.fromEntries(nationIds.map(id=>['nation-'+id,`assets/logos/nation-${id}.png`]))});
