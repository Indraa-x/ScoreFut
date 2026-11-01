# Motor de simulação 6 — 31/10/2026

Implementação restrita ao motor, migração de configurações salvas, testes e dados de calibração. Nenhum OVR, elenco, CSS, texto, tela, HTML ou arquivo de apresentação existente foi alterado.

**Decisão do autor:** preservar o Normal com ajuda mínima e registrar as metas de título não atingidas, em vez de aumentar a ajuda para forçar essas metas. Essa escolha foi confirmada durante a calibração.

## Reprodução e amostragem

- Node usado: **v22.23.4**. As contagens de vitórias, empates, derrotas e títulos coincidiram exatamente com a execução em Node 26.
- Seed principal: **7312026**; mesma sequência por célula, com mando alternado nos jogos isolados.
- **20.000 jogos por linha**: 40 linhas, 800.000 jogos isolados. Os confrontos isolados são neutros.
- **1.000 campanhas por célula**: 3 modos × 4 modelos/níveis × 2 forças = **24.000 campanhas**. A repetição em outro Node não é contada como amostra adicional.
- 89.600 confrontos adicionais para comparar as oito formações, com prorrogação e pênaltis para desempatar.
- Usuário sintético 4–3–3, OVR uniforme 86 ou 94, clubes/épocas diferentes e sem entrosamento. Atributos relativos a cada posição vêm da base real. OVR sozinho não determina a chance de título de qualquer draft: composição, posições e atributos também importam.
- Adversários e épocas são os mesmos da base atual, com os sorteios normais do jogo. As campanhas são simuladas até o título ou a eliminação do usuário; depois da eliminação o indicador de título já é definitivo.
- Intervalos de título: **Wilson a 95%**. A margem em ± usa a maior distância entre a estimativa e os extremos do intervalo, por ser assimétrico.
- Base anterior: modelo 5 no commit **f91e0fc**, usando os mesmos dados atuais. As taxas de título diferem do diagnóstico de 749661e porque aquela era outra revisão da base. O precipício de dominância foi reproduzido.

```powershell
npx --yes --package=node@22 -c "node --test tests/*.test.mjs"
npx --yes --package=node@22 -c "node tests/calibrate.mjs --campaigns=1000 --matches=20000 --formations=1600 --out=data/calibration/final-v6.json"
npm run check
npm run lint
npm run prepare:site
```

O tempo de execução é apenas metadado; as contagens são determinísticas. Os resultados e parâmetros completos estão em [final-v6.json](../data/calibration/final-v6.json). As amostras intermediárias estão em stage1.json a stage4.json, na mesma pasta.

## Vitórias / empates / derrotas por diferença de OVR

Percentuais na ordem V / E / D, do ponto de vista do time mais forte. Usuário com dificuldade Normal:

| Gap | Modelo 5 V/E/D | Modelo 6 Normal V/E/D | Gols/jogo antes → depois | Jogos com 5+ gols antes → depois |
|---|---|---|---|---|
| +0 | 42,8 / 25,9 / 31,4 | 41,4 / 26,9 / 31,7 | 2,7 → 2,6 | 13,3% → 12,7% |
| +5 | 48,8 / 25,2 / 26,0 | 52,7 / 25,3 / 22,0 | 2,7 → 2,6 | 13,8% → 12,8% |
| +10 | 76,6 / 14,5 / 9,0 | 62,8 / 22,6 / 14,6 | 3,3 → 2,6 | 23,9% → 12,8% |
| +15 | 91,3 / 6,3 / 2,4 | 70,7 / 19,8 / 9,4 | 4,2 → 2,6 | 41,5% → 12,7% |
| +20 | 94,0 / 4,5 / 1,5 | 76,6 / 17,2 / 6,2 | 4,6 → 2,6 | 47,8% → 12,8% |

As metas de favoritismo eram aproximadas. Em +20, a medição foi 76,6%, próxima de 80%, mas não exatamente 80%. Não há limiar em +5/+10/+15, bônus unilateral de dominância ou aumento do total de gols conforme o gap cresce.

### Todos os níveis

| Nível | Gap 0: V/E/D | +5 | +10 | +15 | +20 |
|---|---|---|---|---|---|
| Casual | 46,1 / 26,4 / 27,5 | 56,9 / 24,4 / 18,7 | 66,3 / 21,6 / 12,2 | 73,5 / 18,7 / 7,8 | 78,8 / 15,9 / 5,4 |
| Normal | 41,4 / 26,9 / 31,7 | 52,7 / 25,3 / 22,0 | 62,8 / 22,6 / 14,6 | 70,7 / 19,8 / 9,4 | 76,6 / 17,2 / 6,2 |
| Realista | 36,2 / 27,3 / 36,5 | 47,8 / 26,3 / 25,9 | 58,4 / 24,1 / 17,5 | 67,2 / 21,2 / 11,5 | 74,1 / 18,5 / 7,4 |

### IA contra IA

Nenhum nível aplica assistência quando os dois lados são IAs. A fórmula da vantagem é simétrica e usa a força de quem estiver na frente.

| Gap | Modelo 5 V/E/D | Modelo 6 V/E/D |
|---|---|---|
| +0 | 37,1 / 26,5 / 36,4 | 36,2 / 27,3 / 36,5 |
| +5 | 42,9 / 26,4 / 30,7 | 47,8 / 26,3 / 25,9 |
| +10 | 48,9 / 25,4 / 25,7 | 58,4 / 24,1 / 17,5 |
| +15 | 55,1 / 23,9 / 21,0 | 67,2 / 21,2 / 11,5 |
| +20 | 61,2 / 21,9 / 16,9 | 74,1 / 18,5 / 7,4 |

Times iguais, IA × IA: 2,6 gols/jogo, 27,3% de empates e 7,8% de 0–0. No Normal com usuário igual: 2,6 gols/jogo, 26,9% de empates e 7,7% de 0–0. Todos os gaps ficaram abaixo de 25% de partidas com 5+ gols.

## Títulos por competição e dificuldade

### Draft sintético de OVR 86

| Competição | Antes: modelo 5 | Casual | Normal | Realista |
|---|---|---|---|---|
| Copa do Mundo | 16,4% ± 2,4 pp | 10,4% ± 2,0 pp | 7,6% ± 1,8 pp | 4,7% ± 1,5 pp |
| Champions | 13,2% ± 2,2 pp | 17,1% ± 2,5 pp | 10,6% ± 2,1 pp | 6,9% ± 1,7 pp |
| Copa do Brasil | 51,0% ± 3,1 pp | 44,6% ± 3,1 pp | 35,0% ± 3,0 pp | 28,3% ± 2,9 pp |

**Metas não atingidas no Normal:** Copa do Mundo (25–30%) e Champions (25–30%). A Copa do Brasil ficou na borda superior da meta pontual de 30–35%, com incerteza de amostragem que ultrapassa essa faixa. Não foi aplicado um bônus oculto por competição para maquiar esse resultado.

### Draft sintético de OVR 94

| Competição | Antes: modelo 5 | Casual | Normal | Realista |
|---|---|---|---|---|
| Copa do Mundo | 52,4% ± 3,1 pp | 35,0% ± 3,0 pp | 26,4% ± 2,8 pp | 21,9% ± 2,7 pp |
| Champions | 68,8% ± 2,9 pp | 50,8% ± 3,1 pp | 40,7% ± 3,1 pp | 30,5% ± 2,9 pp |
| Copa do Brasil | 91,9% ± 1,9 pp | 71,8% ± 2,9 pp | 68,1% ± 3,0 pp | 61,7% ± 3,1 pp |

O maior resultado novo foi 71,8%. O limite de 80% foi respeitado nos três modos e nos três níveis, inclusive pelo limite superior dos intervalos de 95% medidos.

### Intervalos completos

| Competição | Modelo/nível | OVR | Títulos/campanhas | Taxa | IC95% |
|---|---|---|---|---|---|
| Copa do Mundo | v5 | 86 | 164/1000 | 16,4% | 14,2% – 18,8% |
| Copa do Mundo | v5 | 94 | 524/1000 | 52,4% | 49,3% – 55,5% |
| Copa do Mundo | Casual | 86 | 104/1000 | 10,4% | 8,7% – 12,4% |
| Copa do Mundo | Casual | 94 | 350/1000 | 35,0% | 32,1% – 38,0% |
| Copa do Mundo | Normal | 86 | 76/1000 | 7,6% | 6,1% – 9,4% |
| Copa do Mundo | Normal | 94 | 264/1000 | 26,4% | 23,8% – 29,2% |
| Copa do Mundo | Realista | 86 | 47/1000 | 4,7% | 3,6% – 6,2% |
| Copa do Mundo | Realista | 94 | 219/1000 | 21,9% | 19,4% – 24,6% |
| Champions | v5 | 86 | 132/1000 | 13,2% | 11,2% – 15,4% |
| Champions | v5 | 94 | 688/1000 | 68,8% | 65,9% – 71,6% |
| Champions | Casual | 86 | 171/1000 | 17,1% | 14,9% – 19,6% |
| Champions | Casual | 94 | 508/1000 | 50,8% | 47,7% – 53,9% |
| Champions | Normal | 86 | 106/1000 | 10,6% | 8,8% – 12,7% |
| Champions | Normal | 94 | 407/1000 | 40,7% | 37,7% – 43,8% |
| Champions | Realista | 86 | 69/1000 | 6,9% | 5,5% – 8,6% |
| Champions | Realista | 94 | 305/1000 | 30,5% | 27,7% – 33,4% |
| Copa do Brasil | v5 | 86 | 510/1000 | 51,0% | 47,9% – 54,1% |
| Copa do Brasil | v5 | 94 | 919/1000 | 91,9% | 90,0% – 93,4% |
| Copa do Brasil | Casual | 86 | 446/1000 | 44,6% | 41,5% – 47,7% |
| Copa do Brasil | Casual | 94 | 718/1000 | 71,8% | 68,9% – 74,5% |
| Copa do Brasil | Normal | 86 | 350/1000 | 35,0% | 32,1% – 38,0% |
| Copa do Brasil | Normal | 94 | 681/1000 | 68,1% | 65,1% – 70,9% |
| Copa do Brasil | Realista | 86 | 283/1000 | 28,3% | 25,6% – 31,2% |
| Copa do Brasil | Realista | 94 | 617/1000 | 61,7% | 58,6% – 64,7% |

## Mecânicas e limites

1. **Versionamento:** campanhas novas usam modelVersion 6. Campanhas versionadas mantêm integralmente suas configurações, RNG, partidas encerradas e replay pendente. Saves sem versão assumem o modelo 5. A migração não promove campanhas para o motor novo.
2. **Curva e dificuldade:** duas taxas pareadas dividem um orçamento de xG. Logaritmos de ataque/defesa e tanh do gap fornecem uma curva suave e simétrica. xGExponent = 2,5; baseXG = 1,3 por lado. Normal mantém assistência de ataque ×1,12 e defesa ÷1,06; Casual ×1,25/÷1,12; Realista ×1/÷1. O nível fica somente nas configurações salvas, sem seletor ou rótulo visual.
3. **Cálculo efetivo:** calculateTeam(lineup, settings) aplica 3% de desconto nas contribuições de quem ocupa uma posição diferente da tag primária, incluindo tags secundárias. Posição incompatível continua inválida. A chamada de apresentação calculateTeam(lineup) mantém os valores anteriores, sem alterar OVRs mostrados.
4. **Meio-campo e atributos:** o meio participa da razão de criação, elevando o xG próprio e reduzindo o do adversário. Ataque, finalização, defesa, reflexos e posicionamento continuam relevantes. Não foi acrescentado um campo de posse ao retorno.
5. **Entrosamento:** pares do mesmo clube e da mesma época acrescentam força efetiva, com teto de +2. O bônus é igual para usuário e IA e não muda a ficha de nenhum jogador.
6. **Formações:** alterações leves no ritmo dos dois lados: 3–4–3 +4%, 4–2–4 +5%, 5–3–2 −4%, 4–5–1 −2,5%, 3–5–2 +0,5%, 4–2–3–1 −0,5%; 4–3–3 e 4–4–2 são referências neutras. Não há prêmio gratuito de vitória por formação.
7. **Estado de jogo:** blocos de cinco minutos, subdivididos no instante dos incidentes. O placar evolui nesses segmentos. Expulsão multiplica a criação restante por 0,65 e aumenta a exposição defensiva em 8%; amarelos acrescentam uma cautela pequena. Quem perde após o minuto 70 pressiona 12% mais e abre 6% mais contra-ataques. Os dois lados usam o placar do início do segmento.
8. **Mando:** +6% de criação para o mandante nos jogos de clubes não neutros. A Copa do Mundo e as finais neutras não recebem esse bônus.
9. **Prorrogação e acréscimos:** os acréscimos acrescentam tempo real de exposição. A prorrogação usa 88% de frescor. Campos de relógio, minutos-base e formato de duration foram preservados.
10. **Dispersão:** fator compartilhado uniforme entre 0,82 e 1,18, de média 1. O resultado continua estocástico, sem garantia de vitória.
11. **Pênaltis:** faltas podem gerar uma oportunidade separada de pênalti; finalização e goleiro determinam a conversão. Gols recebem o mesmo origin/restartId esperado pelo placar. Expulsos são excluídos dos cobradores e de futuras atribuições de gols. A disputa final mantém a estrutura e o término garantido do código anterior.
12. **Substituições:** o evento recupera 2% de frescor para o restante do jogo. A base só contém 11 jogadores por elenco; não foram inventados reservas nem trocadas identidades.

### Formações em igualdade

| Formação | Confrontos contra as outras | Vitórias, com desempate |
|---|---|---|
| 4-3-3 | 11200 | 50,4% |
| 4-4-2 | 11200 | 50,4% |
| 4-2-3-1 | 11200 | 50,4% |
| 4-2-4 | 11200 | 51,1% |
| 3-5-2 | 11200 | 50,5% |
| 5-3-2 | 11200 | 50,0% |
| 4-5-1 | 11200 | 50,3% |
| 3-4-3 | 11200 | 50,9% |

Máximo observado: 51,1%; nenhuma passou de 52%. O ensaio usa times de qualidade e posições naturais iguais, assistência desligada e mando alternado.

## Testes e compatibilidade

- **252 testes passaram em Node 22.23.4.** check e lint também foram executados.
- Novos testes em tests/simulation-v6.test.mjs cobrem hashes exatos do modelo 5, preservação de saves e RNG, curva suave/simétrica, distribuição de gols, níveis, meio-campo, posição, química, formações, cartões, substituições, mando, acréscimos, esquema do retorno, serialização e cobradores expulsos.
- Nenhum campo foi acrescentado ou removido de simulateMatch: homeGoals, awayGoals, winnerId, extraTime, penalties, regulationGoals, regulationStoppageTime, extraTimeStoppageTime, extraTimeStart, extraTimeEnd, duration, events, scorers e xG mantêm nomes e tipos. No modelo 6, xG acumula as oportunidades no tempo efetivamente simulado, inclusive a prorrogação; o modelo 5 conserva a semântica anterior.
- tests/match-view.test.mjs, tests/match-motion.test.mjs, tests/match-goals.test.mjs e tests/match-discipline.test.mjs **não foram alterados**.

Testes antigos ajustados, sem enfraquecer asserções:

| Arquivo | Justificativa |
|---|---|
| tests/dominant-matchups.test.mjs | A fórmula e as taxas de dominância descritas são do modelo 5; agora o teste o escolhe explicitamente. Migração da versão 4 passa a exigir preservação, conforme a nova restrição. |
| tests/neutral-simulation.test.mjs | Preserva o ensaio da assistência antiga e troca expectativas de promoção das versões 1/2 pela preservação integral do save. |
| tests/engine.test.mjs | Somente os casos da equação antiga e da posição alternativa sem desconto usam explicitamente o modelo 5; os contratos gerais continuam exercitando o modelo novo. |
| tests/next-fixture-preview.test.mjs | As seeds fixas eram campanhas vencedoras do modelo 5. Fixar a versão conserva os replays sem exigir que o modelo novo dê o mesmo campeão. Asserções de navegação e privacidade não mudaram. |
| tests/match-set-pieces.test.mjs | Apenas o cenário de corrida contínua da seed 39 conserva explicitamente a sequência do modelo 5. No modelo novo a seed produz outras jogadas, incluindo contato de cabeçada; os outros testes do arquivo continuam no modelo novo e nenhuma asserção de movimento foi removida. |

## Verificação no navegador

Chromium real, viewports **390 × 1000** e **1100 × 1000**:

- Conteúdo de draft, grupos e partida comparado com o motor de f91e0fc, usando o mesmo save e o mesmo minuto, com a reprodução pausada somente pelo harness de QA. As **seis capturas do conteúdo ficaram idênticas pixel a pixel**.
- SHA-256 dos 55 arquivos de HTML/CSS/apresentação monitorados permaneceu igual.
- Fluxo novo: draft da Copa do Mundo com dez escolhas preparadas; escolha do goleiro pelo botão e posição; resumo; Entrar em campo; partida completa no modelo 6; retorno à classificação. Resultado da verificação: primeira rodada concluída, partida com 22 eventos e 94 minutos, oito grupos, quatro linhas no grupo, sem erro JavaScript.
- A aparência dos jogos novos continua usando os mesmos componentes e estilos; placares e eventos podem mudar porque a simulação mudou.

Evidências locais de QA: qa/engine-fixed-comparison.json, qa/world-cup-v6-journey-result.json e capturas qa/engine-fixed-before-* / qa/engine-fixed-after-*. Essas prévias não entram no site publicado.

O [registro de verificação](../data/calibration/ui-verification-v6.json) preserva as seis comparações, o resultado do percurso no navegador e os hashes anteriores e posteriores dos arquivos monitorados.

## Commits por etapa

1. a67fd21 — curva suave, níveis internos, compatibilidade e calibração inicial.
2. 0c8cc68 — xG pareado e distribuição de placares.
3. a2357dd — meio-campo, posições, química e formações.
4. aba4c99 — estado causal por blocos, mando, fadiga e eventos.
5. Este commit — calibração por modo/nível, intervalos de 95%, relatório e dados finais.

## Decisões em aberto

- As metas de títulos de Copa do Mundo e Champions não foram alcançadas no Normal. O autor escolheu preservar a ajuda mínima; elevar essas taxas exige outra decisão de balanceamento, não um resultado omitido da calibração.
- Um elenco com reservas permitiria substituições de identidade e gestão de fadiga mais fiel. Isso exige ampliar os dados de elencos, fora do escopo autorizado.
- Suspensões entre partidas, lesões e escolhas táticas durante o jogo permanecem fora deste modelo.
- A Etapa 6 e os itens visuais das Etapas 1 e 3 foram deliberadamente excluídos. Nenhum rótulo de dificuldade, penalidade de posição ou indicador de favoritismo foi colocado na interface.

## Proveniência

- SHA-256 do motor auditado: 82c369c818ff831ec1fe1add1efa37facf08ed8100c5fdd4e5458c6c4c6da63b
- SHA-256 da base resolvida: a38fe06076ca502f14390b3e5dfe2aaaf66c5353bbc1d79faf63c9834107e01e
- O relatório registra resultados medidos, não promessa de taxas exatas para qualquer composição de time.
