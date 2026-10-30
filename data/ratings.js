import { ARCHIVED_RATINGS_BY_SQUAD } from './fifa-archive-ratings.js?v=world-cup-20261026';
import { MODERN_RATINGS_BY_SQUAD } from './modern-ratings.js?v=world-cup-20261026';
import { RELEASE_RATINGS_BY_SQUAD } from './release-ratings.js?v=leverkusen-20261029';
export {RELEASE_RATINGS_BY_SQUAD};
import { CREATOR_RATINGS_BY_SQUAD } from './creator-ratings.js?v=world-cup-20261026';
import {IMPORTED_OVR_BY_SQUAD} from './imported-ovr-review.js?v=ovr-import-20261029';
import { SEASON_RATINGS_BY_SQUAD } from './season-ratings.js?v=world-cup-20261026';
export { SEASON_RATINGS_BY_SQUAD };

/**
 * Historical FIFA/EA SPORTS FC OVRs, with explicit reviews for exceptional
 * seasons and a conservative fallback where no archived rating is available.
 */
export const RATINGS_VERSION = 21;
export const MAX_OVR = 99;

// Legacy same-year records are retained only as provenance. Active ratings
// use RELEASE_RATINGS_BY_SQUAD and the following edition (2015 -> FIFA 16).
export const FIFA_RATING_SOURCES = Object.freeze({
  'arsenal-2006': 'https://fifaindex.com/teams/1-arsenal/fifa06',
  'barcelona-2009': 'https://fifaindex.com/teams/241-f-c-barcelona/fifa09',
  'barcelona-2011': 'https://fifaindex.com/teams/241-fc-barcelona/fifa11',
  'barcelona-2015': 'https://fifaindex.com/teams/241-fc-barcelona/fifa15',
  'bayern-2010': 'https://fifaindex.com/teams/21-bayern-munchen/fifa10',
  'bayern-2013': 'https://fifaindex.com/teams/21-bayern-munchen/fifa13',
  'bayern-2020': 'https://fifaindex.com/teams/21-bayern-munchen/fifa20',
  'chelsea-2005': 'https://fifaindex.com/teams/5-chelsea/fifa05',
  'chelsea-2010': 'https://fifaindex.com/teams/5-chelsea/fifa10',
  'chelsea-2012': 'https://fifaindex.com/teams/5-chelsea/fifa12',
  'chelsea-2021': 'https://fifaindex.com/teams/5-chelsea/fifa21',
  'juventus-2015': 'https://fifaindex.com/teams/45-juventus/fifa15',
  'juventus-2017': 'https://fifaindex.com/teams/45-juventus/fifa17',
  'liverpool-2005': 'https://fifaindex.com/teams/9-liverpool/fifa05',
  'liverpool-2019': 'https://fifaindex.com/teams/9-liverpool/fifa19',
  'liverpool-2020': 'https://fifaindex.com/teams/9-liverpool/fifa20',
  'liverpool-2025': 'https://fifaindex.com/teams/9-liverpool/fc25',
  'manchester-city-2018': 'https://fifaindex.com/teams/10-manchester-city/fifa18',
  'manchester-city-2021': 'https://fifaindex.com/teams/10-manchester-city/fifa21',
  'manchester-city-2023': 'https://fifaindex.com/teams/10-manchester-city/fifa23',
  'manchester-city-2024': 'https://fifaindex.com/teams/10-manchester-city/fc24',
  'manchester-united-2008': 'https://fifaindex.com/teams/11-manchester-united/fifa08',
  'milan-2007': 'https://fifaindex.com/teams/47-ac-milan/fifa07',
  'psg-2016': 'https://fifaindex.com/teams/73-paris-saint-germain/fifa16',
  'real-madrid-2014': 'https://fifaindex.com/teams/243-real-madrid/fifa14',
  'real-madrid-2017': 'https://fifaindex.com/teams/243-real-madrid/fifa17',
  'real-madrid-2024': 'https://fifaindex.com/teams/243-real-madrid/fc24',
  'tottenham-2017': 'https://fifaindex.com/teams/18-tottenham-hotspur/fifa17',
});

// Older curated player/season values checked against the matching FIFA Index edition.
// Where the expanded player archive has a verified value, that record takes precedence.
// Missing players keep the game's editorial fallback; no rating is guessed.
export const FIFA_OVR_BY_SQUAD = Object.freeze({
  'arsenal-2006': {
    'thierry-henry': 92, 'jens-lehmann': 84, 'cesc-fabregas': 79,
    'kolo-toure': 87, 'fredrik-ljungberg': 84, 'robert-pires': 87,
    'ashley-cole': 85, 'gilberto-silva': 80, 'jose-antonio-reyes': 86,
    'sol-campbell': 90,
  },
  'barcelona-2009': {
    'lionel-messi': 90, 'carles-puyol': 88,
    'xavi': 87, 'andres-iniesta': 86, 'dani-alves': 85,
    'thierry-henry': 85, 'victor-valdes': 83, 'eric-abidal': 84,
    'gerard-pique': 77, 'sergio-busquets': 60,
    'samuel-etoo': 86,
  },
  'barcelona-2011': {
    'lionel-messi': 90, 'andres-iniesta': 87, 'xavi': 87,
    'gerard-pique': 85, 'david-villa': 88,
    'carles-puyol': 87, 'dani-alves': 84, 'victor-valdes': 85,
    'sergio-busquets': 81, 'pedro-rodriguez': 82, 'eric-abidal': 82,
  },
  'barcelona-2015': {
    'lionel-messi': 93, 'luis-suarez': 89, 'neymar': 86,
    'andres-iniesta': 89, 'sergio-busquets': 85, 'gerard-pique': 84,
    'ivan-rakitic': 83, 'dani-alves': 83, 'jordi-alba': 81,
    'javier-mascherano': 83, 'marc-andre-ter-stegen': 82,
  },
  'bayern-2010': {
    'arjen-robben': 85, 'philipp-lahm': 86, 'franck-ribery': 88,
    'bastian-schweinsteiger': 81, 'thomas-muller': 69,
    'ivica-olic': 81, 'mark-van-bommel': 80, 'holger-badstuber': 69,
    'daniel-van-buyten': 79, 'martin-demichelis': 81, 'hans-jorg-butt': 78,
  },
  'bayern-2013': {
    'franck-ribery': 90, 'arjen-robben': 87,
    'bastian-schweinsteiger': 87, 'philipp-lahm': 87,
    'manuel-neuer': 86, 'thomas-muller': 84,
    'mario-mandzukic': 83, 'javi-martinez': 83,
    'david-alaba': 79, 'jerome-boateng': 79, 'dante': 84,
  },
  'bayern-2020': {
    'robert-lewandowski': 91, 'manuel-neuer': 89,
    'joshua-kimmich': 87, 'thomas-muller': 85,
    'leon-goretzka': 84, 'serge-gnabry': 85, 'kingsley-coman': 84,
    'thiago-alcantara': 86, 'alphonso-davies': 77,
    'david-alaba': 83, 'jerome-boateng': 81,
  },
  'chelsea-2005': {
    'petr-cech': 86, 'arjen-robben': 85,
    'john-terry': 89, 'claude-makelele': 91,
    'ricardo-carvalho': 88, 'william-gallas': 87,
    'frank-lampard': 90, 'damien-duff': 86, 'didier-drogba': 88,
    'paulo-ferreira': 84, 'tiago-mendes': 78,
  },
  'chelsea-2010': {
    'didier-drogba': 85, 'frank-lampard': 87, 'john-terry': 87,
    'nicolas-anelka': 85, 'michael-essien': 86, 'florent-malouda': 82,
    'petr-cech': 85, 'ashley-cole': 83,
    'branislav-ivanovic': 79, 'michael-ballack': 84,
    'ricardo-carvalho': 84,
  },
  'chelsea-2012': {
    'juan-mata': 86, 'ashley-cole': 85,
    'petr-cech': 84, 'john-terry': 85, 'branislav-ivanovic': 83,
    'fernando-torres': 84, 'frank-lampard': 84, 'ramires': 79,
    'gary-cahill': 79, 'john-obi-mikel': 80, 'didier-drogba': 86,
  },
  'chelsea-2021': {
    'ngolo-kante': 88, 'thiago-silva': 85, 'antonio-rudiger': 82,
    'edouard-mendy': 80, 'jorginho-frello': 83, 'kai-havertz': 83,
    'cesar-azpilicueta': 83, 'timo-werner': 84, 'mason-mount': 82,
    'reece-james': 80, 'ben-chilwell': 82,
  },
  'juventus-2015': {
    'carlos-tevez': 85, 'arturo-vidal': 85,
    'giorgio-chiellini': 84, 'paul-pogba': 84,
    'gianluigi-buffon': 83, 'claudio-marchisio': 83,
    'andrea-pirlo': 83, 'leonardo-bonucci': 80,
    'stephan-lichtsteiner': 77, 'patrice-evra': 79,
    'alvaro-morata': 78,
  },
  'juventus-2017': {
    'gianluigi-buffon': 88, 'giorgio-chiellini': 88,
    'paulo-dybala': 86, 'gonzalo-higuain': 89,
    'leonardo-bonucci': 87, 'dani-alves': 84,
    'andrea-barzagli': 86, 'alex-sandro': 84,
    'mario-mandzukic': 83, 'miralem-pjanic': 85,
    'sami-khedira': 84,
  },
  'liverpool-2005': {
    'steven-gerrard': 93, 'djibril-cisse': 90, 'jerzy-dudek': 83,
    'xabi-alonso': 85, 'luis-garcia': 80, 'jamie-carragher': 84,
    'john-arne-riise': 82, 'sami-hyypia': 86, 'dietmar-hamann': 85,
    'steve-finnan': 77, 'milan-baros': 87,
  },
  'liverpool-2019': {
    'virgil-van-dijk': 89, 'sadio-mane': 87, 'mohamed-salah': 89,
    'alisson': 87, 'roberto-firmino': 86, 'fabinho': 85,
    'andrew-robertson': 83, 'georginio-wijnaldum': 83,
    'jordan-henderson': 82, 'trent-alexander-arnold': 80,
    'joel-matip': 81,
  },
  'liverpool-2020': {
    'virgil-van-dijk': 91, 'mohamed-salah': 90,
    'alisson': 90, 'sadio-mane': 90, 'fabinho': 86,
    'andrew-robertson': 86, 'jordan-henderson': 85,
    'trent-alexander-arnold': 85, 'roberto-firmino': 88,
    'georginio-wijnaldum': 85, 'joe-gomez': 82,
  },
  'liverpool-2025': {
    'mohamed-salah': 91, 'virgil-van-dijk': 90, 'alisson': 89,
    'ryan-gravenberch': 84, 'alexis-mac-allister': 86,
    'ibrahima-konate': 85, 'cody-gakpo': 84, 'luis-diaz': 85,
    'trent-alexander-arnold': 86, 'andrew-robertson': 82,
    'dominik-szoboszlai': 82,
  },
  'manchester-city-2018': {
    'kevin-de-bruyne': 91, 'david-silva': 90, 'sergio-aguero': 89,
    'fernandinho': 85, 'raheem-sterling': 85, 'ederson': 85,
    'leroy-sane': 85, 'kyle-walker': 84, 'vincent-kompany': 85,
    'nicolas-otamendi': 85,
  },
  'manchester-city-2021': {
    'kevin-de-bruyne': 91, 'ederson': 88, 'ruben-dias': 85,
    'rodri': 86, 'riyad-mahrez': 85,
    'ilkay-gundogan': 84, 'kyle-walker': 84, 'phil-foden': 83,
    'gabriel-jesus': 83, 'john-stones': 82, 'oleksandr-zinchenko': 80,
  },
  'manchester-city-2023': {
    'kevin-de-bruyne': 91, 'erling-haaland': 90, 'rodri': 87,
    'ruben-dias': 88, 'ederson': 88, 'bernardo-silva': 88,
    'ilkay-gundogan': 85, 'jack-grealish': 84, 'kyle-walker': 84,
    'john-stones': 83, 'nathan-ake': 80,
  },
  'manchester-city-2024': {
    'kevin-de-bruyne': 91, 'erling-haaland': 91, 'rodri': 90,
    'ruben-dias': 89, 'ederson': 88, 'phil-foden': 87,
    'bernardo-silva': 88, 'julian-alvarez': 83,
    'josko-gvardiol': 82, 'kyle-walker': 84,
    'manuel-akanji': 83,
  },
  'manchester-united-2008': {
    'cristiano-ronaldo': 91, 'rio-ferdinand': 87, 'wayne-rooney': 90,
    'nemanja-vidic': 85, 'paul-scholes': 84,
    'edwin-van-der-sar': 84, 'carlos-tevez': 87, 'patrice-evra': 78,
    'michael-carrick': 83, 'owen-hargreaves': 80, 'wes-brown': 79,
  },
  'milan-2007': {
    'kaka': 87, 'andrea-pirlo': 86, 'clarence-seedorf': 79,
    'alessandro-nesta': 91, 'filippo-inzaghi': 81,
    'dida': 88, 'gennaro-gattuso': 81, 'paolo-maldini': 82,
    'massimo-ambrosini': 79,
  },
  'psg-2016': {
    'thiago-silva': 88, 'edinson-cavani': 85, 'angel-di-maria': 86,
    'marco-verratti': 84, 'blaise-matuidi': 84,
    'david-luiz': 83, 'zlatan-ibrahimovic': 89,
    'maxwell': 79, 'thiago-motta': 82,
  },
  'real-madrid-2014': {
    'cristiano-ronaldo': 92, 'sergio-ramos': 86,
    'gareth-bale': 87, 'luka-modric': 86, 'karim-benzema': 85,
    'iker-casillas': 86, 'pepe': 83, 'marcelo': 83,
    'dani-carvajal': 77, 'angel-di-maria': 86, 'xabi-alonso': 85,
  },
  'real-madrid-2017': {
    'cristiano-ronaldo': 94, 'sergio-ramos': 89, 'toni-kroos': 88,
    'luka-modric': 89, 'marcelo': 86,
    'isco': 85, 'casemiro': 84, 'karim-benzema': 86,
    'keylor-navas': 85, 'raphael-varane': 84, 'dani-carvajal': 84,
  },
  'real-madrid-2024': {
    'vinicius-junior': 89, 'jude-bellingham': 88,
    'antonio-rudiger': 86, 'federico-valverde': 88,
    'dani-carvajal': 84, 'toni-kroos': 88, 'rodrygo': 85,
    'aurelien-tchouameni': 84, 'eduardo-camavinga': 83,
    'ferland-mendy': 82, 'andriy-lunin': 80,
  },
  'tottenham-2017': {
    'hugo-lloris': 88, 'christian-eriksen': 86, 'harry-kane': 85,
    'jan-vertonghen': 83, 'toby-alderweireld': 85,
    'mousa-dembele': 82, 'son-heung-min': 80,
    'dele-alli': 82, 'kyle-walker': 82,
    'victor-wanyama': 80,
  },
});

const clamp = (value, min = 50) => Math.max(min, Math.min(99, Math.round(value)));
// Fallback for seasons without a verifiable archived OVR. The curve removes
// the old inflated 94–99 editorial values while keeping the ordering intact.
const editorialFallback = ovr => ovr <= 92 ? ovr - 10 : ovr <= 94 ? ovr - 8 : ovr <= 96 ? ovr - 7 : ovr - 6;

export function recalibratePlayer(player, attributeFloor = 1) {
  const calibratedOvr = clamp(editorialFallback(player.ovr));
  const delta = calibratedOvr - player.ovr;
  return {
    ...player,
    ovr: calibratedOvr,
    atributos: Object.fromEntries(Object.entries(player.atributos).map(
      ([key, value]) => [key, clamp(value + delta, attributeFloor)]
    )),
  };
}

/** Creator JSON/direct edits > verified following edition > editorial season review. */
export function applyHistoricalFifaRating(player, squadId) {
  const editionRating = MODERN_RATINGS_BY_SQUAD[squadId]?.[player.id]
    ?? ARCHIVED_RATINGS_BY_SQUAD[squadId]?.[player.id];
  const archivedOvr = editionRating?.ovr ?? FIFA_OVR_BY_SQUAD[squadId]?.[player.id];
  const seasonReview = SEASON_RATINGS_BY_SQUAD[squadId]?.[player.id];
  const directReview = squadId==='real-madrid-2022'&&player.id==='thibaut-courtois' ? {squadId,playerId:player.id,previousOvr:90,ovr:92,reviewedAt:'2026-10-30',source:'data/ratings.js',reason:'Ajuste solicitado pelo criador: Courtois do Real Madrid 2022 com OVR 92.'} : undefined;
  const creatorReview = directReview ?? IMPORTED_OVR_BY_SQUAD[squadId]?.[player.id] ?? CREATOR_RATINGS_BY_SQUAD[squadId]?.[player.id];
  const releaseRating = RELEASE_RATINGS_BY_SQUAD[squadId]?.[player.id];
  const review = creatorReview ?? (releaseRating ? undefined : seasonReview);
  const rating = review?.ovr ?? releaseRating?.ovr ?? player.ovr;
  const year = Number(squadId.match(/-(\d{4})$/)?.[1]);
  const editionName = year => `${year <= 2023 ? 'FIFA' : 'FC'} ${String(year).slice(-2)}`;
  const delta = rating - player.ovr;
  const updated = {
    ...player,
    ovr: rating,
    atributos: Object.fromEntries(Object.entries(player.atributos).map(
      ([key, value]) => [key, clamp(value + delta, 1)]
    )),
  };
  for (const key of ['ratingKind','ratingSource','ratingEdition','ratingReason','ratingExpectedEdition',
    'creatorReview','priorSeasonReview','archivedRating','releaseRating']) delete updated[key];
  if (Number.isFinite(year)) updated.ratingExpectedEdition = editionName(year + 1);
  if (archivedOvr !== undefined) updated.archivedRating = {
    ovr:archivedOvr, source:editionRating?.source ?? FIFA_RATING_SOURCES[squadId], edition:editionName(year),
  };
  if (releaseRating) updated.releaseRating = releaseRating;
  if (seasonReview && (creatorReview || releaseRating)) updated.priorSeasonReview = seasonReview;
  if (review) {
    updated.ratingKind = creatorReview ? 'creator-review' : 'season-review';
    updated.ratingSource = review.source;
    updated.ratingReason = review.reason;
    if (creatorReview) updated.creatorReview = creatorReview;
  } else if (releaseRating) {
    updated.ratingKind = 'release-rating';
    updated.ratingSource = releaseRating.source;
    updated.ratingEdition = releaseRating.edition;
  } else {
    updated.ratingKind = 'editorial-estimate';
    updated.ratingReason = `Estimativa histórica: sem OVR verificável na edição ${editionName(year + 1)}.`;
  }
  return updated;
}
