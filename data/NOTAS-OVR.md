# Notas dos jogadores

Cada jogador recebe o OVR da edição FIFA/EA FC correspondente à temporada sempre que há correspondência verificável de identidade, temporada e clube ou seleção. A aplicação guarda a página individual que sustenta cada valor. A base inclui 767 correspondências do arquivo FIFA 05–20 ([dataset FIFA Index](https://github.com/lbenz730/fifa_model)), além de dados FIFA 21–23 e FC 25 do SoFIFA, páginas históricas individuais do FIFA Index e ratings FC 26 do site oficial da EA. Os arquivos e a fonte individual de cada rating estão em `fifa-archive-ratings.js` e `modern-ratings.js`.

Na versão atual, 743 de 1.716 jogadores de clube têm OVR apoiado por uma página da edição correspondente. Há ratings FIFA/FC completos apenas para parte dos clubes e temporadas; os demais OVRs continuam como estimativas editoriais `ScoreFut`, recalibradas para evitar o agrupamento irrealista de jogadores bons em 94–96. Elas não são apresentadas como notas oficiais.

As edições públicas de FIFA 21–23 foram cruzadas por jogador, clube/seleção e temporada; as notas FC 25 vieram de páginas SoFIFA para as correspondências encontradas e FC 26 usa páginas oficiais da EA. Onde o dataset não contém o clube ou não permite distinguir um homônimo com segurança, o jogador não recebe uma nota marcada como verificada.

O fallback de clubes, quando não existe edição confirmada, reduz as notas editoriais antigas: até 92, menos 10 pontos; 93–94, menos 8; 95–96, menos 7; 97–99, menos 6. O intervalo preserva notas FIFA baixas como o OVR 48 arquivado para Jefferson Farfán no FIFA 05. Os atributos usados pela simulação são recalculados ao redor do OVR e não reproduzem atributos individuais originais do jogo.

Exemplos confirmados: Thierry Henry, 92 no FIFA 06; Messi, 90 no FIFA 11; Franck Ribéry, 90 no FIFA 13; Kylian Mbappé, 84 no FIFA 18; Mohamed Salah, 91 no FC 25; Rodri, 90 no FC 26. Fontes de elencos usadas para revisão adicional:

- [Arsenal · FIFA 06](https://fifaindex.com/teams/1-arsenal/fifa06)
- [Barcelona · FIFA 11](https://fifaindex.com/teams/241-fc-barcelona/fifa11)
- [Bayern · FIFA 13](https://fifaindex.com/teams/21-bayern-munchen/fifa13)
- [Liverpool · FC 25](https://sofifa.com/teams/9/liverpool/250038)
- [Manchester City · FIFA 21](https://fifaindex.com/teams/10-manchester-city/fifa21)
- [EA SPORTS FC 26 · ratings oficiais](https://www.ea.com/games/ea-sports-fc/ratings/player-ratings)

Ao abrir um draft salvo sem competição em andamento, as notas escolhidas são atualizadas com a base atual, preservando posições, sorteios, saldo e semente. Campanhas iniciadas e resultados concluídos não são reescritos.
