/** Editorial player/season reviews for 1970–1989. These are not EA ratings.
 * Ordinary starters are separated from international standouts and world greats.
 * Values are explicit per season: no blanket age/decade penalty or ICON rating.
 * Research, rationale and complete before/after audit: VINTAGE-RATINGS.md.
 */
const rows = {
  'bayern-1974': {
    'franz-beckenbauer':94, 'gerd-muller':94, 'sepp-maier':91, 'paul-breitner':88,
    'uli-hoene':85, 'hans-georg-schwarzenbeck':82, 'franz-roth':78,
    'jupp-kapellmann':77, 'johnny-hansen':76, 'rainer-zobel':75, 'conny-torstensson':76,
  },
  'milan-1989': {
    'franco-baresi':93, 'marco-van-basten':93, 'ruud-gullit':92, 'frank-rijkaard':90,
    'paolo-maldini':88, 'roberto-donadoni':85, 'mauro-tassotti':82,
    'alessandro-costacurta':82, 'carlo-ancelotti':80, 'giovanni-galli':78, 'angelo-colombo':74,
  },
  'liverpool-1984': {
    'kenny-dalglish':91, 'ian-rush':90, 'alan-hansen':87, 'graeme-souness':87,
    'phil-neal':82, 'mark-lawrenson':82, 'bruce-grobbelaar':80,
    'ronnie-whelan':80, 'alan-kennedy':78, 'sammy-lee':76, 'craig-johnston':76,
  },
  'arsenal-1971': {
    'frank-mclintock':84, 'charlie-george':82, 'george-armstrong':80, 'john-radford':81,
    'ray-kennedy':80, 'peter-simpson':78, 'peter-storey':79,
    'george-graham':78, 'bob-wilson':79, 'pat-rice':78, 'bob-mcnab':77,
  },
  'juventus-1985': {
    'michel-platini':94, 'gaetano-scirea':91, 'antonio-cabrini':87, 'zbigniew-boniek':87,
    'marco-tardelli':86, 'paolo-rossi':84, 'stefano-tacconi':80,
    'sergio-brio':78, 'massimo-bonini':77, 'massimo-briaschi':76, 'luciano-favero':75,
  },
  'ajax-1972': {
    'johan-cruyff':95, 'ruud-krol':90, 'johan-neeskens':89, 'piet-keizer':86,
    'sjaak-swart':84, 'wim-suurbier':83, 'arie-haan':83,
    'barry-hulshoff':80, 'gerrie-muhren':80, 'horst-blankenburg':77, 'heinz-stuy':77,
  },
  'napoli-1987': {
    'diego-maradona':95, 'salvatore-bagni':83, 'bruno-giordano':83, 'ciro-ferrara':82,
    'fernando-de-napoli':80, 'alessandro-renica':78, 'giuseppe-bruscolotti':78,
    'moreno-ferrario':77, 'francesco-romano':77, 'andrea-carnevale':78, 'claudio-garella':78,
  },
  'porto-1987': {
    'paulo-futre':88, 'rabah-madjer':86, 'fernando-gomes':84, 'joao-pinto-defensor':82,
    'jozef-mlynarczyk':80, 'celso-dias-dos-santos':77, 'jaime-magalhaes':79,
    'antonio-frasco':78, 'andre-alves-da-silva':77, 'eduardo-luis':75, 'augusto-inacio':77,
  },
  'valencia-1980': {
    'mario-kempes':90, 'rainer-bonhof':83, 'miguel-tendillo':80, 'daniel-solsona':81,
    'salvador-arias':77, 'enrique-saura':78, 'javier-subirats':77,
    'carlos-pereira-goleiro':77, 'jose-carrete':76, 'manuel-botubot':75, 'pablo-rodriguez-escobar':75,
  },
  'monaco-1988': {
    'manuel-amoros':85, 'glenn-hoddle':85, 'patrick-battiston':82, 'mark-hateley':82,
    'youssouf-falikou-fofana':81, 'jean-luc-ettori':81, 'luc-sonor':77,
    'claude-puel':77, 'remy-vogel':76, 'marcel-dib':76, 'jean-marc-ferratge':75,
  },
  'flamengo-1981': {
    'zico':94, 'leovegildo-lins-da-gama-junior':89, 'jose-leandro-de-souza-ferreira':88,
    'adilio':83, 'milton-queiroz-da-paixao':82, 'carlos-mozer':80,
    'jorge-luis-andrade-da-silva':81, 'joao-batista-nunes-de-oliveira':82,
    'raul-plassmann':81, 'marinho-mario-custodio-nazare':77, 'antonio-nunes-lico':76,
  },
  'gremio-1983': {
    'renato-gaucho':87, 'hugo-de-leon':85, 'mario-sergio':83, 'tarciso':81,
    'geraldo-pereira-de-matos-filho':80, 'luiz-carlos-tavares-franco':77,
    'paulo-roberto-cury':78, 'jorge-baidek':77, 'henrique-valmir-da-conceicao':77,
    'osvaldo-dario-alves':77, 'paulo-cesar-magalhaes':76,
  },
  'internacional-1979': {
    'paulo-roberto-falcao':91, 'joao-batista-da-silva':84, 'mario-sergio':83,
    'mauro-galvao':81, 'valdomiro-vaz-franco':82, 'jose-de-la-cruz-benitez':81,
    'ubirajara-silva':77, 'joao-carlos-marinho':76, 'mauro-pastor':75,
    'claudio-antunes-mineiro':75, 'jair-jose-guimaraes':75,
  },
  'internacional-1976': {
    'elias-figueroa':91, 'paulo-roberto-falcao':89, 'haiel-de-souza':84,
    'paulo-cesar-carpegiani':85, 'dario-jose-dos-santos':85, 'valdomiro-vaz-franco':82,
    'marinho-peres':81, 'luis-carlos-ferreira':80, 'luiz-ribeiro-pinto-neto':80,
    'claudio-duarte':79, 'luiz-carlos-machado':79,
  },
  'vasco-1989': {
    'bebeto':87, 'mazinho':82, 'bismarck':81, 'luis-carlos-winck':80,
    'luis-carlos-quinonez':78, 'jorge-luis-andrade-da-silva':80, 'acacio':79,
    'jose-do-carmo-silva':77, 'william-cesar-de-oliveira':76,
    'aginaldo-liz-sorato':78, 'marco-aurelio-martins':76,
  },
  'fluminense-1984': {
    'ricardo-gomes':83, 'branco':83, 'julio-cesar-romero':83,
    'benedito-de-assis-da-silva':81, 'washington-cesar-santos':81,
    'paulo-vitor-barbosa-de-carvalho':80, 'wanderley-alves-de-oliveira':78,
    'duilio-dias-junior':77, 'aldo-goncalves':76, 'carlos-alberto-fonseca':76, 'jandir-morais':75,
  },
  'cruzeiro-1976': {
    'wilson-da-silva-piazza':86, 'nelinho':86, 'jairzinho':85,
    'vanderlei-eustaquio-de-oliveira':84, 'joao-soares-de-almeida-filho':83,
    'raul-plassmann':81, 'darci-menezes':78, 'eduardo-amorim':78,
    'josue-camilo-de-morais':76, 'jose-carlos-de-andrade':76, 'vanderlei-lazaro':75,
  },
  'atletico-mineiro-1971': {
    'dario-jose-dos-santos':85, 'vantuir-galdino-ramos':80, 'jose-borges-do-couto':79,
    'oldair-barchi':79, 'romeu-cambalhota':79, 'humberto-monteiro':78,
    'vanderlei-paiva':78, 'ronaldo-drummond':78, 'renato-da-cunha-valle':79,
    'humberto-ramos':76, 'sebastiao-silva':76,
  },
  'bahia-1988': {
    'raimundo-nonato-tavares-da-silva':84, 'charles-fabian':81, 'ronaldo-passos':80,
    'joao-marcelo':79, 'gil-sergipano':77, 'jose-carlos-da-silva-bahia':78,
    'sandro-bahia-1988':77, 'claudir-fernandes':76, 'paulo-rodrigues':76,
    'jose-carlos-da-silva-tarantini':75, 'paulo-robson':75,
  },
  'celtic-1970': {
    'jimmy-johnstone':85, 'tommy-gemmell':83, 'bobby-lennox':83, 'billy-mcneill':83,
    'bobby-murdoch':82, 'bertie-auld':81, 'willie-wallace':81,
    'david-hay':80, 'john-hughes':79, 'jim-brogan':77, 'evan-williams':76,
  },
  'marseille-1989': {
    'jean-pierre-papin':88, 'karlheinz-forster':84, 'klaus-allofs':84,
    'franck-sauzee':81, 'yvon-le-roux':79, 'philippe-vercruysse':80,
    'eric-di-meco':78, 'bruno-germain':77, 'gaetan-huard':77,
    'frederic-meyrieu':76, 'philippe-thys':75,
  },
  // This roster was already modestly rated; review retains its existing values.
  'psv-1988': {
    'ronald-koeman':82, 'hans-van-breukelen':80, 'eric-gerets':79,
    'gerald-vanenburg':79, 's-ren-lerby':77, 'wim-kieft':77, 'ivan-nielsen':74,
    'berry-van-aerle':73, 'jan-heintze':72, 'edward-linskens':70, 'hans-gillhaus':70,
  },
  'psv-1978': {
    'willy-van-der-kuijlen':87, 'willy-van-de-kerkhof':84, 'jan-van-beveren':85,
    'rene-van-de-kerkhof':84, 'adrie-van-kraay':81, 'huub-stevens':80,
    'ernie-brandts':80, 'gerrie-deijkers':80, 'harry-lubse':78,
    'jan-poortvliet':78, 'kees-krijgh':75,
  },
  'roma-1983': {
    'paulo-roberto-falcao':92, 'bruno-conti':88, 'pietro-vierchowod':85,
    'agostino-di-bartolomei':83, 'roberto-pruzzo':83, 'aldo-maldera':80,
    'carlo-ancelotti':80, 'franco-tancredi':80, 'sebastiano-nela':79,
    'maurizio-iorio':78, 'ubaldo-righetti':77,
  },
  'galatasaray-1989': {
    'tanju-colak':85, 'cuneyt-tanman':80, 'dzevad-prekazi':80, 'zoran-simovic':80,
    'ugur-tutuneker':79, 'erhan-onal':78, 'tugay-kerimoglu':76,
    'ismail-demiriz':76, 'semih-yuvakuran':76, 'savas-koc':75, 'muhammet-altintas':75,
  },
};

export const VINTAGE_RATINGS_BY_SQUAD = Object.freeze(Object.fromEntries(
  Object.entries(rows).map(([squadId, ratings]) => [squadId, Object.freeze(Object.fromEntries(
    Object.entries(ratings).map(([playerId, ovr]) => [playerId, Object.freeze({
      ovr, source:'data/VINTAGE-RATINGS.md',
      reason:'Revisão editorial individual de 1970–1989: diferenciar titulares, destaques e craques mundiais na temporada; sem OVR oficial da EA para essa época.',
    })])
  ))])
));
