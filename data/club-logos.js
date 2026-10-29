/** All club crests are shipped with the site, without external image dependencies. */
const localClubLogos = Object.fromEntries([
  'real-madrid', 'barcelona', 'bayern', 'milan', 'manchester-united',
  'liverpool', 'manchester-city', 'arsenal', 'chelsea', 'inter',
  'juventus', 'ajax', 'napoli', 'tottenham', 'atletico-madrid',
  'borussia-dortmund', 'psg', 'porto', 'benfica', 'valencia', 'monaco',
  'flamengo', 'palmeiras', 'sao-paulo', 'corinthians', 'santos',
  'gremio', 'internacional', 'vasco', 'fluminense', 'botafogo', 'cruzeiro',
  'atletico-mineiro', 'athletico-paranaense', 'bahia', 'fortaleza',
  'leverkusen', 'marseille', 'psv', 'roma', 'galatasaray', 'fenerbahce', 'rb-leipzig',
].map(id => [id, `assets/logos/${id}.png`]));

const nationIds=["brazil", "argentina", "germany", "italy", "france", "uruguay", "england", "spain", "netherlands", "portugal", "croatia", "belgium", "sweden", "hungary", "poland", "denmark", "switzerland", "chile", "colombia", "mexico", "united-states", "japan", "south-korea", "australia", "morocco", "senegal", "cameroon", "ghana", "nigeria", "algeria", "costa-rica", "ecuador"];
export const CLUB_LOGOS = Object.freeze({...localClubLogos,celtic:'assets/logos/celtic.png',...Object.fromEntries(nationIds.map(id=>['nation-'+id,`assets/logos/nation-${id}.png`]))});
