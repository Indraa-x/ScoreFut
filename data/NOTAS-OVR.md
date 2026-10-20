# Notas dos jogadores

Quando a temporada do ScoreFut tem uma correspondência confirmada, o OVR vem da edição FIFA/EA SPORTS FC do mesmo ano em que a temporada terminou. Assim, Liverpool 2019 usa FIFA 19, Liverpool 2020 usa FIFA 20 e Real Madrid 2024 usa FC 24. A relação de fontes e os valores por jogador ficam em `ratings.js`.

O arquivo consultado, FIFA Index, tem elencos arquivados desde FIFA 05. Não há uma série completa e consistente confirmada para FIFA 2000–04. Também faltam páginas ou correspondências individuais para parte das temporadas e dos atletas do ScoreFut; esses casos continuam com estimativa editorial e não devem ser apresentados como OVR oficial. Os atributos da simulação são derivados e não reproduzem os atributos históricos do jogo.

A base atual contém 1.716 entradas de jogadores em 156 elencos. Há 301 OVRs confirmados em 28 temporadas de clube (17,5% dos registros); os outros 1.415 seguem a estimativa editorial. A média é 79,57; 812 entradas estão abaixo de 80, 858 entre 80 e 89, 46 em 90 ou mais e 1 em 94 ou mais.

Para registros sem fonte, `ratings.js` reduz o OVR editorial anterior pela mesma curva: até 92, menos 10 pontos; de 93 a 94, menos 8; de 95 a 96, menos 7; de 97 a 99, menos 6. O resultado fica entre 50 e 99. Quando há OVR arquivado para o atleta naquela temporada, o valor exato substitui a estimativa. Os atributos do ScoreFut são deslocados pelo mesmo delta, dentro dos limites, para manter a simulação coerente com a nota.

Alguns exemplos confirmados: Thierry Henry tinha 92 no Arsenal da FIFA 06; Messi tinha 90 no Barcelona da FIFA 11; Ribéry tinha 90 no Bayern da FIFA 13; Van Dijk tinha 89 no Liverpool da FIFA 19; Kanté tinha 88 no Chelsea da FIFA 21; De Bruyne tinha 91 no Manchester City da FIFA 21. As páginas históricas usadas nesses exemplos:

- [Arsenal · FIFA 06](https://fifaindex.com/teams/1-arsenal/fifa06)
- [Barcelona · FIFA 11](https://fifaindex.com/teams/241-fc-barcelona/fifa11)
- [Bayern · FIFA 13](https://fifaindex.com/teams/21-bayern-munchen/fifa13)
- [Liverpool · FIFA 19](https://fifaindex.com/teams/9-liverpool/fifa19)
- [Chelsea · FIFA 21](https://fifaindex.com/teams/5-chelsea/fifa21)
- [Manchester City · FIFA 21](https://fifaindex.com/teams/10-manchester-city/fifa21)
- [Real Madrid · FC 24](https://fifaindex.com/teams/243-real-madrid/fc24)

Ao abrir um draft salvo sem competição em andamento, o jogo atualiza as notas escolhidas com esses dados e preserva posições, sorteios, saldo e semente. Campanhas iniciadas e resultados concluídos não são reescritos.
