# Notas dos jogadores

As notas são uma avaliação editorial para o ScoreFut, não notas oficiais da FIFA, da UEFA ou de outro jogo. A escala foi revista em 10/10/2026 para separar jogadores de apoio, bons titulares, elite e lendas. Nenhum jogador foi removido.

| Faixa | Uso no jogo |
|---|---|
| 70–79 | Apoio e titulares com menor impacto naquela edição |
| 80–84 | Bons titulares |
| 85–89 | Destaques e jogadores de alto nível |
| 90–94 | Elite excepcional e grandes nomes históricos |
| 95–99 | Temporadas extraordinárias das lendas preservadas |

Os vencedores dos prêmios mundiais presentes na base e as lendas reconhecidas mantêm suas notas anteriores, conforme solicitado. A fama não iguala as temporadas de uma pessoa: Messi 2009 continua com 98 e Messi 2011 com 99; Henry conserva a diferença entre Monaco e Arsenal. Há uma curadoria própria de grandes nomes que nunca ganharam esses prêmios, incluindo goleiros, defensores e ídolos sul-americanos.

Para os demais, `ratings.js` abre a escala das notas de referência: os antigos 83–92 passam a 73–82; 93–94 passam a 85–86; 95–96 passam a 88–89; 97–99 passam a 91–93. Os jogadores de elite listados em `ELITE_ADJUSTMENTS` recebem ajustes individuais que preservam a diferença entre suas temporadas. Esses critérios são decisões do jogo, não classificações deduzidas das premiações.

OVR e atributos da simulação mudam juntos, preservando o perfil da posição e os limites de cada lote. Usar uma posição semelhante permitida continua sem penalidade de nota. A mesma calibração vale para as opções do draft e para os adversários.

| Edição | Jogador | Antes | Agora |
|---|---|---:|---:|
| Barcelona 2011 | Lionel Messi | 99 | 99 |
| Real Madrid 2017 | Cristiano Ronaldo | 98 | 98 |
| PSG 2025 | Ousmane Dembélé | 96 | 96 |
| Chelsea 2012 | Frank Lampard | 93 | 93 |
| Chelsea 2012 | Juan Mata | 94 | 86 |
| Chelsea 2012 | Ramires | 91 | 81 |
| Chelsea 2012 | Gary Cahill | 91 | 81 |
| Inter 2024 | Lautaro Martínez | 96 | 91 |
| Napoli 2025 | Scott McTominay | 94 | 86 |
| Dortmund 2024 | Julian Brandt | 87 | 84 |

Na auditoria anterior à ampliação brasileira, a média caiu de 90,84 para 83,41. Dos 1.320 registros daquela versão, 430 estavam abaixo de 80, 637 entre 80 e 89 e 253 entre 90 e 99. Foram alteradas 1.131 edições de jogadores; as 189 edições dos nomes preservados ficaram iguais. A base atual tem 144 elencos de onze opções. O lote C usa notas editoriais já calibradas na escala final, sem aplicar uma segunda redução.

Um draft salvo ainda sem competição atualiza as notas dos atletas escolhidos pela mesma edição, preservando posições, sorteios, saldo e semente. Partidas e campanhas já iniciadas conservam seus valores; resultados concluídos não são reescritos.

Referências consultadas para conferir premiações e reconhecimento, sem atribuir a elas os OVRs:

- [FIFA: histórico dos vencedores dos prêmios de jogador do mundo](https://www.fifa.com/en/the-best-fifa-football-awards/2025/articles/all-award-winners-history).
- [UEFA: todos os vencedores da Bola de Ouro](https://www.uefa.com/ballondor/news/0287-195e642735da-0594342b9554-1000--history-of-the-ballon-d-or-all-the-winners/).
- [UEFA: seleção do ano de 2012](https://www.uefa.com/news-media/news/0205-0e82e5de00d7-2a587889375f-1000--uefa-com-team-of-the-year-2012-announced/).
- [FIFA: Maradona e o gol do século](https://inside.fifa.com/tournaments/mens/worldcup/1986mexico/news/maradona-s-immortal-11-second-dash-2802747).

As fontes dos vínculos e das temporadas continuam em `VERIFICACAO-A.md` e `fontes-b.md`.
