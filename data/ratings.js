/** Editorial OVR calibration. Awards define a ceiling, not each player's exact score. */
export const RATINGS_VERSION = 2;
export const MAX_OVR = 96;
export const NON_WINNER_OVR_CAP = 94;

// Award-winning peaks may reach 96; other elite players stop at 94.
// Maradona's honorary Ballon d'Or is recognized alongside the annual winners.
export const BALLON_DOR_WINNERS = new Set([
  'lionel-messi','cristiano-ronaldo','ronaldo','zinedine-zidane','kaka',
  'marco-van-basten','hristo-stoichkov','matthias-sammer','rivaldo','luis-figo',
  'andriy-shevchenko','luka-modric','karim-benzema','rodri','ousmane-dembele',
  'ronaldinho-gaucho','fabio-cannavaro','pavel-nedved','george-weah','michael-owen',
  'diego-maradona',
]);

// Preserve the editorial seasonal ratings before applying the new elite ceilings.
// IDs identify people: fame never removes seasonal differences already in the data.
export const PROTECTED_PLAYERS = new Set([
  'lionel-messi', 'cristiano-ronaldo', 'ronaldo', 'diego-maradona',
  'zinedine-zidane', 'kaka', 'marco-van-basten', 'hristo-stoichkov',
  'matthias-sammer', 'rivaldo', 'luis-figo', 'andriy-shevchenko',
  'luka-modric', 'karim-benzema', 'rodri', 'ousmane-dembele',
  'vinicius-junior', 'robert-lewandowski', 'romario', 'ronaldinho-gaucho',
  'thierry-henry', 'luis-suarez', 'neymar', 'zlatan-ibrahimovic',
  'raul', 'alessandro-del-piero', 'dennis-bergkamp', 'eric-cantona',
  'arjen-robben', 'franck-ribery', 'didier-drogba', 'samuel-etoo',
  'samuel-eto-o', 'eto-o', 'wayne-rooney',
  'harry-kane', 'erling-haaland', 'kylian-mbappe', 'mbappe',
  'mohamed-salah', 'antoine-griezmann', 'kevin-de-bruyne',
  'xavi', 'andres-iniesta', 'andrea-pirlo', 'clarence-seedorf',
  'toni-kroos', 'steven-gerrard', 'frank-lampard', 'paul-scholes',
  'ryan-giggs', 'patrick-vieira', 'roy-keane', 'ngolo-kante',
  'juan-roman-riquelme', 'enzo-francescoli', 'michael-laudrup',
  'frank-rijkaard', 'wesley-sneijder', 'david-beckham', 'rai',
  'paolo-maldini', 'franco-baresi', 'alessandro-nesta', 'marcel-desailly',
  'cafu', 'roberto-carlos', 'javier-zanetti', 'philipp-lahm',
  'dani-alves', 'marcelo', 'sergio-ramos', 'rio-ferdinand',
  'nemanja-vidic', 'carles-puyol', 'thiago-silva', 'virgil-van-dijk',
  'lucio', 'john-terry',
  'gianluigi-buffon', 'manuel-neuer', 'oliver-kahn', 'iker-casillas',
  'peter-schmeichel', 'edwin-van-der-sar', 'petr-cech',
  'thibaut-courtois', 'alisson', 'dida', 'rogerio-ceni', 'marcos',
]);

// These players sit above the general scale without receiving a legend rating.
// A fixed change per person keeps the original gap between their seasons.
export const ELITE_ADJUSTMENTS = Object.freeze({
  'jude-bellingham': -4, 'lautaro-martinez': -5, 'phil-foden': -6,
  'sadio-mane': -4, 'victor-osimhen': -6, 'jan-oblak': -3,
  'son-heung-min': -3, 'bernardo-silva': -4, 'david-silva': -2,
  'david-villa': -4, 'deco': -4, 'diego-godin': -5,
  'diego-milito': -5, 'carlos-tevez': -5, 'radamel-falcao': -4,
  'thiago-alcantara': -5, 'sergio-aguero': -3,
  'sergio-busquets': -2, 'casemiro': -3, 'xabi-alonso': -1,
  'claude-makelele': -3, 'maicon': -3, 'julio-cesar': -3,
  'ashley-cole': -3, 'robert-pires': -4, 'gareth-bale': -2,
  'thomas-muller': -2, 'giorgio-chiellini': -3,
  'bastian-schweinsteiger': -3, 'edgar-davids': -4,
  'ruben-dias': -4, 'antonio-rudiger': -4, 'gianluigi-donnarumma': -3,
  'joshua-kimmich': -5, 'ilkay-gundogan': -5,
  'federico-valverde': -4, 'achraf-hakimi': -3,
  'khvicha-kvaratskhelia': -5, 'marco-reus': -4,
  'gonzalo-higuain': -6, 'hakan-calhanoglu': -5,
  'alessandro-bastoni': -4, 'nicolo-barella': -4,
  'paulo-dybala': -5, 'vitinha': -4,
  'gregor-kobel': -2, 'mats-hummels': -2, 'julian-brandt': -3,
  'marcel-sabitzer': -4, 'shinji-kagawa': -6, 'mario-gotze': -5,
  'lukasz-piszczek': -5, 'sven-bender': -5, 'neven-subotic': -6,
  'jan-vertonghen': -5, 'toby-alderweireld': -5,
  'hugo-lloris': -3, 'mousa-dembele': -6,
  'ederson': -3, 'yann-sommer': -3, 'keylor-navas': -2,
  'alex-meret': -5, 'gianluca-pagliuca': -3, 'angelo-peruzzi': -4,
  'david-seaman': -3, 'santiago-canizares': -4, 'vitor-baia': -5,
  'victor-valdes': -4, 'jens-lehmann': -4, 'roman-weidenfeller': -3,
  'fabien-barthez': -3, 'edouard-mendy': -4,
  'fabinho': -5, 'rodrygo': -5, 'angel-di-maria': -4, 'di-maria': -4,
  'jordi-alba': -3, 'andrew-robertson': -5, 'trent-alexander-arnold': -4,
  'david-alaba': -4, 'gerard-pique': -2, 'leonardo-bonucci': -5,
  'andrea-barzagli': -5, 'pepe': -1, 'ricardo-carvalho': -5,
  'arturo-vidal': -5, 'paul-pogba': -5, 'cesc-fabregas': -3,
  'michael-ballack': -3, 'michael-essien': -4, 'fernandinho': -5,
  'thiago-motta': -5, 'claudio-marchisio': -6, 'jordan-henderson': -6,
  'georginio-wijnaldum': -7, 'leon-goretzka': -7,
  'frenkie-de-jong': -6, 'matthijs-de-ligt': -6, 'alphonso-davies': -6,
  'roberto-firmino': -5, 'edinson-cavani': -4,
  'dries-mertens': -5, 'diego-costa': -5, 'dusan-tadic': -6,
  'patrick-kluivert': -5, 'hernan-crespo': -4, 'filippo-inzaghi': -4,
  'gianluca-vialli': -5, 'jardel': -5, 'careca': -5,
  'dejan-savicevic': -4, 'kalidou-koulibaly': -4,
  'weverton': -4, 'marcelo-grohe': -6, 'franco-armani': -6,
  'oscar-cordoba': -4, 'roberto-abbondanzieri': -5, 'zetti': -4,
  'giorgian-de-arrascaeta': -5, 'hulk': -5, 'adriano': -4,
  'alex-de-souza': -5, 'martin-palermo': -4, 'ariel-ortega': -3,
  'pablo-aimar': -5, 'andres-d-alessandro': -6,
  'damien-duff': -7, 'florent-malouda': -5,
});

const clamp = (value, min = 50) => Math.max(min, Math.min(99, Math.round(value)));
const standardOVR = ovr => ovr <= 92 ? ovr - 10 : ovr <= 94 ? ovr - 8 : ovr <= 96 ? ovr - 7 : ovr - 6;

/** Apply the elite ceiling to already calibrated seasonal ratings. */
export function capPlayerOvr(player, attributeFloor = 1) {
  const cap = BALLON_DOR_WINNERS.has(player.id) ? MAX_OVR : NON_WINNER_OVR_CAP;
  if (player.ovr <= cap) return player;
  const delta = cap - player.ovr;
  return { ...player, ovr: cap, atributos: Object.fromEntries(
    Object.entries(player.atributos).map(([key, value]) => [key, clamp(value + delta, attributeFloor)])
  ) };
}

/** Rebalance OVR and the simulation attributes together, before roster sorting. */
export function recalibratePlayer(player, attributeFloor = 1) {
  const adjustment = ELITE_ADJUSTMENTS[player.id];
  const calibratedOvr = PROTECTED_PLAYERS.has(player.id)
    ? player.ovr
    : clamp(adjustment === undefined ? standardOVR(player.ovr) : player.ovr + adjustment);
  const calibrated = calibratedOvr === player.ovr ? player : { ...player, ovr: calibratedOvr };
  const ratingDelta = calibratedOvr - player.ovr;
  const withCalibratedAttributes = ratingDelta ? { ...calibrated, atributos: Object.fromEntries(
    Object.entries(player.atributos).map(([key, value]) => [key, clamp(value + ratingDelta, attributeFloor)])
  ) } : calibrated;
  return capPlayerOvr(withCalibratedAttributes, attributeFloor);
}
