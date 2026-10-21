/**
 * ScoreFut season reviews, not official EA ratings. The references establish
 * each player's form during the represented season; the OVR is editorial.
 * Keep these exceptions keyed by squad AND player, never by career reputation.
 */
const review = (source, reason, ratings) => Object.freeze(Object.fromEntries(
  Object.entries(ratings).map(([id, ovr]) => [id, Object.freeze({ovr, source, reason})])
));
const worldAwards = 'https://inside.fifa.com/en/news/a-brief-history-of-the-best';
const psgBallonDor = 'https://www.psg.fr/en/content/ballon-d-or-2025-a-historic-ceremony-for-paris-saint-germain-ousmane-dembele-named-the-world-s-best-player';
const psgUnfp = 'https://en.news.psg.fr/press-releases/club/paris-saint-germain-shines-at-the-unfp-2025-awards-with-14-awards';

export const SEASON_RATINGS_BY_SQUAD = Object.freeze({
  'milan-2007': review(
    'https://www.uefa.com/uefasupercup/news/0250-0c50f2622044-e9cb8111e628-1000--kaka-the-cream-of-europe-s-finest/',
    'Campanha campeã europeia de 2006/07: Kaká, Bola de Ouro; Maldini e Seedorf também premiados pela UEFA.',
    {'kaka':92, 'andrea-pirlo':89, 'clarence-seedorf':88, 'paolo-maldini':87, 'filippo-inzaghi':87}
  ),
  'barcelona-2009': review(
    'https://www.uefa.com/uefachampionsleague/news/01f1-0ea26ecb3381-d257890cc832-1000--barcelona-and-united-seek-fresh-wembley-glory/',
    'Avaliação da temporada da tríplice coroa de 2008/09, incluindo a afirmação de Busquets e Piqué.',
    {'lionel-messi':94, 'xavi':91, 'andres-iniesta':90, 'sergio-busquets':82, 'gerard-pique':84, 'dani-alves':88}
  ),
  'barcelona-2011': review(
    'https://www.uefa.com/news-media/news/023f-0f8e5908c589-7c7033f2921d-1000--team-of-the-year-2011/',
    'Auge do Barcelona campeão europeu de 2010/11, com Messi, Xavi e Iniesta entre os destaques mundiais.',
    {'lionel-messi':96, 'xavi':92, 'andres-iniesta':91, 'sergio-busquets':87, 'gerard-pique':88, 'dani-alves':90, 'pedro-rodriguez':85}
  ),
  'barcelona-2015': review(
    'https://www.uefa.com/uefachampionsleague/news/024e-0e99612f5f48-479aef8e2056-1000--neymar-at-29-how-brilliant-is-he/',
    'Temporada da tríplice coroa de 2014/15: protagonismo do trio Messi, Neymar e Suárez.',
    {'lionel-messi':95, 'neymar':92, 'luis-suarez':91}
  ),
  'manchester-united-2008': review(worldAwards,
    'Primeira Bola de Ouro e prêmio de melhor do mundo de Cristiano Ronaldo, na temporada campeã europeia.',
    {'cristiano-ronaldo':94}
  ),
  'manchester-united-2009': review(worldAwards,
    'Cristiano Ronaldo ainda no auge pelo United, entre o prêmio de 2008 e o vice mundial de 2009.',
    {'cristiano-ronaldo':94}
  ),
  'real-madrid-2014': review(worldAwards,
    'Cristiano Ronaldo na fase das premiações de melhor do mundo de 2013 e 2014.',
    {'cristiano-ronaldo':95}
  ),
  'santos-2010': review(
    'https://www.santosfc.com.br/outra-vez-os-meninos-da-vila/',
    'Neymar na temporada campeã paulista e da Copa do Brasil, da qual foi artilheiro com 11 gols.',
    {'neymar':86}
  ),
  'santos-2011': review(
    'https://www.uefa.com/uefachampionsleague/news/024e-0e99612f5f48-479aef8e2056-1000--neymar-at-29-how-brilliant-is-he/',
    'Evolução de Neymar na temporada campeã da Libertadores de 2011, antes de seu auge no Barcelona.',
    {'neymar':88}
  ),
  'bayern-2010': review(
    'https://www.uefa.com/uefachampionsleague/news/01e5-0e748d3584fc-6bf2a9e1605a-1000--route-to-the-final-bayern/',
    'Robben decisivo e Müller consolidado no time que chegou à final europeia de 2009/10.',
    {'arjen-robben':90, 'thomas-muller':84}
  ),
  'bayern-2013': review(
    'https://www.uefa.com/news-media/news/0250-0c51006a3843-8a3ed883f859-1000--ribery-nomeado-melhor-jogador-da-uefa-na-europa/',
    'Tríplice coroa de 2012/13, com Ribéry eleito o melhor jogador da UEFA na Europa.',
    {'franck-ribery':92, 'arjen-robben':90, 'manuel-neuer':90, 'thomas-muller':87}
  ),
  'bayern-2020': review(
    'https://www.uefa.com/news/0262-1081df1ad49c-10605b589d53-1000--lewandowski-named-player-of-the-year/',
    'Tríplice coroa de 2019/20: Lewandowski eleito o melhor da UEFA e Neuer terceiro na premiação.',
    {'robert-lewandowski':93, 'manuel-neuer':91, 'thomas-muller':88, 'alphonso-davies':85}
  ),
  'inter-2010': review(
    'https://www.uefa.com/uefasupercup/news/0250-0c50f5307734-701c76c44348-1000--reborn-sneijder-spurring-inter-on/',
    'Tríplice coroa de 2009/10, com Sneijder no auge e Milito decisivo na final europeia.',
    {'wesley-sneijder':91, 'diego-milito':90}
  ),
  'psg-2025': Object.freeze({
    ...review(
      psgBallonDor,
      'Temporada 2024/25: Dembélé ganhou a Bola de Ouro; Vitinha ficou em 3º, Hakimi em 6º, Donnarumma em 9º e Nuno Mendes em 10º. Doué e João Neves também foram finalistas do Troféu Kopa.',
      {
        'ousmane-dembele':90,
        'vitinha':89,
        'achraf-hakimi':89,
        'gianluigi-donnarumma':89,
        'nuno-mendes':88,
        'desire-doue':88,
        'khvicha-kvaratskhelia':87,
        'joao-neves':87,
        'fabian-ruiz':85,
      }
    ),
    ...review(
      psgUnfp,
      'Marquinhos e Willian Pacho foram selecionados para a equipe ideal da Ligue 1 em 2024/25.',
      {'marquinhos':88, 'willian-pacho':86}
    ),
  }),
});
