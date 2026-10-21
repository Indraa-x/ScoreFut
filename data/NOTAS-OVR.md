# Notas dos jogadores

O OVR da edição FIFA/EA FC correspondente à temporada é a base quando há correspondência verificável de identidade, temporada e clube. A base inclui correspondências do arquivo FIFA 05–20 ([dataset FIFA Index](https://github.com/lbenz730/fifa_model)), além de dados FIFA 21–23 e FC 25 do SoFIFA, páginas históricas individuais do FIFA Index e ratings FC 26 do site oficial da EA. Os arquivos e a fonte individual de cada rating estão em `fifa-archive-ratings.js` e `modern-ratings.js`.

Uma edição lançada antes de uma campanha excepcional pode subestimar o jogador daquele ano. Por isso, `season-ratings.js` contém 38 revisões explícitas por jogador e temporada, com justificativa e referência histórica. Essas notas são avaliações editoriais ScoreFut, não OVRs oficiais da EA. A referência comprova a fase esportiva; não determina um número de OVR. A ordem de aplicação é: revisão da temporada, arquivo FIFA/FC e, por último, estimativa conservadora.

Na revisão de 21/10/2026, Kaká no Milan 2007 passa de 87 para 92; Neymar no Santos 2010, de 73 para 86; Neymar 2011 recebe 88 e no Barcelona 2015 recebe 92. Messi recebe 94 em 2009, 96 em 2011 e 95 em 2015. Cristiano Ronaldo recebe 94 no United 2008 e 2009, 95 no Real 2014 e mantém 94 em 2017. Outros ajustes incluem Sneijder e Milito em 2010, Xavi e Iniesta, Seedorf e Pirlo em 2007, Ribéry e Robben em 2013, Lewandowski e Neuer em 2020, além de temporadas de afirmação subestimadas de Busquets, Piqué, Pedro, Müller e Davies. As exceções não criam um bônus geral por nome nem modificam outras temporadas do mesmo jogador.

Nas revisões, `ratingKind` identifica `season-review`, `ratingSource` e `ratingReason` guardam a referência e a justificativa. O OVR original da EA, a edição e sua fonte ficam separados em `archivedRating`; o OVR editorial não recebe o rótulo de uma edição FIFA. Os demais OVRs sem fonte continuam como estimativas conservadoras, evitando concentrar todos os bons jogadores em 94–96.

As edições públicas de FIFA 21–23 foram cruzadas por jogador, clube/seleção e temporada; as notas FC 25 vieram de páginas SoFIFA para as correspondências encontradas e FC 26 usa páginas oficiais da EA. Onde o dataset não contém o clube ou não permite distinguir um homônimo com segurança, o jogador não recebe uma nota marcada como verificada.

O fallback de clubes, quando não existe edição confirmada, reduz as notas editoriais antigas: até 92, menos 10 pontos; 93–94, menos 8; 95–96, menos 7; 97–99, menos 6. O intervalo preserva notas FIFA baixas como o OVR 48 arquivado para Jefferson Farfán no FIFA 05. Os atributos usados pela simulação são recalculados ao redor do OVR e não reproduzem atributos individuais originais do jogo.

Exemplos do arquivo original: Thierry Henry, 92 no FIFA 06; Messi, 90 no FIFA 11; Franck Ribéry, 90 no FIFA 13; Kylian Mbappé, 84 no FIFA 18; Mohamed Salah, 91 no FC 25; Rodri, 90 no FC 26. Messi 2011 e Ribéry 2013 usam, no jogo, as revisões de temporada descritas acima. Fontes de elencos usadas para revisão adicional:

- [Arsenal · FIFA 06](https://fifaindex.com/teams/1-arsenal/fifa06)
- [Barcelona · FIFA 11](https://fifaindex.com/teams/241-fc-barcelona/fifa11)
- [Bayern · FIFA 13](https://fifaindex.com/teams/21-bayern-munchen/fifa13)
- [Liverpool · FC 25](https://sofifa.com/teams/9/liverpool/250038)
- [Manchester City · FIFA 21](https://fifaindex.com/teams/10-manchester-city/fifa21)
- [EA SPORTS FC 26 · ratings oficiais](https://www.ea.com/games/ea-sports-fc/ratings/player-ratings)

Referências para as revisões editoriais:

- [UEFA: Kaká, Maldini e Seedorf premiados em 2007](https://www.uefa.com/uefasupercup/news/0250-0c50f2622044-e9cb8111e628-1000--kaka-the-cream-of-europe-s-finest/)
- [Santos: Neymar e a Copa do Brasil de 2010](https://www.santosfc.com.br/outra-vez-os-meninos-da-vila/)
- [FIFA: histórico dos melhores jogadores do mundo](https://inside.fifa.com/en/news/a-brief-history-of-the-best)
- [UEFA: Sneijder na tríplice coroa de 2010](https://www.uefa.com/uefasupercup/news/0250-0c50f5307734-701c76c44348-1000--reborn-sneijder-spurring-inter-on/)
- [UEFA: Ribéry, melhor jogador de 2012/13](https://www.uefa.com/news-media/news/0250-0c51006a3843-8a3ed883f859-1000--ribery-nomeado-melhor-jogador-da-uefa-na-europa/)
- [UEFA: Lewandowski e Neuer na premiação de 2019/20](https://www.uefa.com/news/0262-1081df1ad49c-10605b589d53-1000--lewandowski-named-player-of-the-year/)

Ao abrir um draft salvo sem competição em andamento, as notas escolhidas são atualizadas com a base atual, preservando posições, sorteios, saldo e semente. Campanhas iniciadas e resultados concluídos não são reescritos.
