# Documentação técnica do ScoreFut

Jogo de draft e simulação de futebol em português do Brasil. Monte uma escalação de **11 jogadores — um goleiro e dez de linha**. Cada sorteio oferece onze destaques de um clube em uma temporada histórica; escolha um atleta por rodada e dispute a competição. O Modo rápido usa os onze titulares de um clube na formação escolhida.

São 43 clubes, com cinco épocas distintas por clube: 215 elencos e 2.365 registros. A Champions oferece 28 clubes europeus; a Copa do Brasil, 15 brasileiros. Todos os escudos são arquivos locais com fontes e hashes em `assets/logos/sources.json`. O projeto usa módulos JavaScript, HTML e CSS, sem dependências de execução. OVRs seguem a [política de edição e prioridades](../data/RATING-SOURCES.md). “Meu time” conserva seu símbolo genérico.

A Copa do Brasil oferece Flamengo, Palmeiras, São Paulo, Corinthians, Santos, Grêmio, Internacional, Vasco, Fluminense, Botafogo, Cruzeiro, Atlético-MG, Athletico-PR, Bahia e Fortaleza. Boca Juniors e River Plate foram removidos da base ativa.

As quatro escalações europeias adicionais e suas referências estão em [VERIFICACAO-CHAMPIONS.md](../data/VERIFICACAO-CHAMPIONS.md).

## Executar localmente

```powershell
npm run dev
```

Abra [http://127.0.0.1:4173](http://127.0.0.1:4173). Não é necessário executar `npm install`. O servidor está em `scripts/serve.mjs`; encerre com `Ctrl+C`.

## Como jogar

1. Escolha o modo e clique em uma das oito formações. O botão selecionado fica destacado e a prévia do campo muda imediatamente.
2. Sorteie um clube e uma temporada. Arraste o jogador com o mouse para uma vaga livre destacada no campo. Também é possível clicar no jogador e depois na vaga.
3. Ao soltar o jogador ou clicar na vaga, a escolha entra diretamente no time, sem botão de confirmação. São **onze rodadas**, em qualquer ordem. O mesmo jogador não pode entrar duas vezes, mesmo em temporadas diferentes.
4. Os quatro re-sorteios valem para o draft inteiro. “Outro clube” e “Outra temporada” usam o mesmo saldo. Elencos sorteados ou descartados não voltam.
5. Complete as onze vagas e entre na competição. Acompanhe a partida automática, avance pelo botão no topo ao fim de cada jogo e baixe o resultado como PNG.

Nos modos de draft, o nome do time é “Meu time”, sem campo de edição. No Modo rápido, ele corresponde ao clube e à temporada escolhidos. Um draft salvo da versão anterior é adaptado para as novas formações, preservando o máximo de escolhas compatíveis. Histórico concluído anteriormente permanece disponível.

Os sorteios de clubes são livres e uniformes: cada clube com jogadores compatíveis tem a mesma chance, independentemente do OVR, de quantas épocas ainda tem disponíveis ou de quantas vezes já apareceu. Depois de escolher o clube, cada época elegível dele também tem a mesma chance. Um clube pode voltar em outra época por acaso; o mesmo elenco já visto não volta. “Outro clube” exclui o atual, e “Outra temporada” mantém o clube. Não há o antigo peso de dificuldade na Champions. Cada clique usa novos valores de Web Crypto, com rejeição do excedente para evitar viés na conversão para índices. Os geradores por semente continuam no motor de partidas e nos drafts diários antigos; escolhas salvas permanecem preservadas.

## Seleção leve de jogadores

A lista mostra posição, nome e OVR. Ao arrastar, aparece uma prévia compacta com esses dados, o clube e a temporada. Não há fotos, cartinhas ou pré-carregamento de retratos; um novo atleta exige somente dados de elenco. As posições e o escudo do clube continuam no campo. O catálogo antigo em `assets/players/` é um arquivo de pesquisa e não é importado pelo jogo. As doze imagens da página inicial permanecem.

## Partidas

A central de partidas mostra o placar e as duas escalações de onze jogadores em um campo com movimentação contínua. As bolinhas numeradas usam as cores das equipes, acompanham as formações e avançam e recuam com a posse; a bola percorre passes e finalizações, com os gols sincronizados ao placar. Os autores dos gols aparecem no painel lateral “Gols da partida”, separados por equipe, com o nome completo e os minutos. Esse painel tem altura fixa e rolagem, sem ocupar o espaço do campo. A lista só revela gols que já aconteceram no relógio; os outros eventos e as cobranças da disputa de pênaltis não entram nela. O OVR das duas equipes aparece no placar. A disputa de pênaltis aparece separada do placar do jogo. Estatísticas, listas de lances, escanteios e cartões não aparecem nessa tela.

A partida começa e continua automaticamente, inclusive ao retomar um save. Não há botões de assistir, pausar ou pular para o fim; a barra de tempo apenas mostra o progresso. O botão no topo libera a próxima partida, etapa ou resultado quando o jogo termina. O relógio avança continuamente em minutos e segundos, sem saltos por intervalos fixos. Em **1×**, um segundo de reprodução representa um minuto de futebol: o tempo regulamentar dura cerca de 90 segundos. Em **4×** e **8×**, dura cerca de 22,5 e 11,25 segundos. Alterar a velocidade preserva o minuto e a posição dos jogadores. Ao ocultar a aba, o jogo salva o progresso e suspende a animação; ela continua automaticamente ao voltar à aba.

A coluna lateral mostra os gols da partida e o próximo adversário. Os demais jogos do calendário e os resultados anteriores ficam em seções expansíveis. Cada campanha usa um novo sorteio, respeitando os clubes de seu modo. O calendário de grupos é conhecido após o sorteio; na Copa do Brasil, a volta é marcada junto da ida. Adversários de fases seguintes aparecem conforme a classificação e os sorteios. O site prepara somente a rodada atual e confirma seus resultados no apito final, sem calcular a Copa inteira antes de começar. Tabela e chaveamento mostram apenas rodadas encerradas. Saves antigos de Copa são reconstruídos até a partida que estava sendo acompanhada, preservando o draft e o minuto.

A tela da simulação prioriza placar e relógio grandes, campo central e um único botão de avanço no topo. Seu time é verde e o adversário azul, inclusive fora de casa; a legenda abaixo do campo identifica as equipes e o sentido do ataque. O resultado mostra Vitória, Empate ou Derrota; no jogo de volta da Copa do Brasil, o agregado decide Classificado ou Eliminado. Os controles de ritmo usam Normal (1×), Rápido (4×) e Muito rápido (8×). No computador, placar, campo e controles usam a altura disponível da tela; a coluna lateral tem rolagem própria quando necessário. Em telas menores, os próximos jogos ficam abaixo do campo. A movimentação é uma representação visual do resultado gerado pelo motor, sem física individual dos atletas.

## Formações e posições

| Formação | Defesa | Meio | Ataque |
|---|---|---|---|
| 4–3–3 | LD, ZAG, ZAG, LE | VOL, MC, MC | PE, CA, PD |
| 4–4–2 | LD, ZAG, ZAG, LE | MD, MC, MC, ME | CA, CA |
| 4–2–3–1 | LD, ZAG, ZAG, LE | VOL, VOL; ME, MEI, MD | CA |
| 4–2–4 | LD, ZAG, ZAG, LE | MC, MC | PE, CA, CA, PD |
| 3–5–2 | ZAG, ZAG, ZAG | MD, VOL, MC, MC, ME | CA, CA |
| 5–3–2 | LD, ZAG, ZAG, ZAG, LE | VOL, MC, MC | CA, CA |
| 4–5–1 | LD, ZAG, ZAG, LE | ME, MC, VOL, MC, MD | CA |
| 3–4–3 | ZAG, ZAG, ZAG | ME, MC, MC, MD | PE, CA, PD |

Todas incluem um GOL. As coordenadas e vagas estão em `FORMATIONS`, em `js/engine.js`.

A compatibilidade considera a **posição específica da vaga**, além das tags secundárias do atleta. Posições naturais e semelhantes mantêm a nota e todos os atributos do jogador, sem redução. Ao arrastar ou selecionar um jogador, as vagas compatíveis ficam destacadas; posições ocupadas ou incompatíveis não recebem o jogador. Sem vaga compatível, a opção fica desabilitada. Exemplos: ZAG puro ocupa ZAG; CA puro ocupa CA; LD pode ocupar LE ou MD; VOL pode ocupar MC ou ZAG. As regras completas estão em `ROLE_COMPATIBILITY`; o valor 0 significa posição natural e 1 significa semelhante, usado somente para priorizar vagas no motor.

As famílias GOL/DEF/MEI/ATA servem para calcular atributos e colorir os indicadores. Elas não liberam qualquer posição de uma mesma família.

A força geral é a média do OVR dos jogadores escalados. Clube e temporada não acrescentam bônus de entrosamento ou alteram o OVR. A dificuldade aplica uma ajuda leve ao time do usuário na probabilidade de gols, sem mudar notas ou atributos.

## Modos

| Modo | Formato |
|---|---|
| Modo rápido | Escolha a formação e o clube, confira o elenco e clique em Pular para simulação; mata-mata com 16 times e até quatro partidas |
| Copa do Brasil | Até 16 equipes, uma temporada por clube brasileiro e Meu time; oitavas, quartas e semifinais em ida e volta; final em jogo único |
| Champions League | 28 clubes europeus históricos da base; 32 elencos no formato clássico de grupos e mata-mata |
| Modo Lendas | Copa com as notas ocultas durante o draft |

Modo rápido: substitui a Copa ScoreFut na página inicial e na seleção de modos, com gradiente amarelo, âmbar e laranja. A mesma identidade aparece nos botões, etapas, filtros, atributos, resultado e PNG da campanha rápida. Primeiro escolha uma das oito formações e clique em Escolher time. Depois escolha um dos 43 clubes; a temporada mais recente compatível com a formação escolhida aparece pronta no campinho. A formação não é substituída automaticamente. Clubes sem uma temporada compatível ficam identificados e desabilitados; use Alterar formação para escolher outro esquema. Essa escolha não inicia a simulação. Na prévia, é possível trocar entre temporadas compatíveis do clube ou voltar para escolher outro time mantendo a formação. Somente **Pular para simulação** calcula a campanha inteira, usando o motor por OVR e atributos com a ajuda leve de dificuldade. Escudo, nome do clube e jogadores são preservados no resultado e no histórico.

A biblioteca do Modo rápido tem busca sem distinção de acentos ou maiúsculas, filtros Brasil/Europa e cards com temporada e OVR do mesmo elenco que será escolhido. A prévia mostra os titulares no campo, os quatro atributos do time, as conquistas da temporada e uma única ação principal para simular. O estado da busca é mantido ao voltar para escolher outro clube. As telas inicial, de revisão, de partida e de resultado compartilham superfícies claras, títulos fortes e divisores discretos em `css/design-system.css`; o fluxo rápido fica em `css/quick-game.css`.

Referências de organização da interface: [hierarquia visual, Nielsen Norman Group](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/) e [fluxo de jogo, 7a0](https://7a0.com.br/como-jogar). O projeto mantém seu próprio visual e regras de simulação.

Campanhas antigas da Copa ScoreFut e Champions: os dois primeiros de cada grupo avançam, sem repetição de clube dentro do grupo. Empates eliminatórios passam por prorrogação e pênaltis. Elencos usados no draft são excluídos dos adversários em todas as categorias.

Copa do Brasil: edição histórica adaptada aos 15 clubes da base, todos confirmados entre os participantes de 2026. Meu time completa até 16 equipes; não há estrangeiros, grupos ou pontos corridos. Cada clube entra com uma temporada disponível. Oitavas e quartas têm confrontos e mandos sorteados; semifinais seguem a chave das quartas, com sorteio do mando. A ida não elimina ninguém. Após a volta, a soma dos gols decide; empate leva diretamente aos pênaltis, sem gol fora ou prorrogação. A final é uma única partida em campo neutro, também com pênaltis se empatada. São até sete jogos por campanha. Se o draft consumir todas as temporadas de um clube, esse clube fica fora e vagas vazias dão acesso à próxima fase, sem duplicar clubes ou inventar jogos.

Referências: [regulamento CBF 2026, artigos 12 e 18–24](https://stcbfsiteprdimgbrs.blob.core.windows.net/img-site/cdn/REC_Copa_do_Brasil_2026_66989a5426.pdf) e [clubes da quinta fase](https://www.cbf.com.br/futebol-brasileiro/noticias/undefined/sao-paulo-x-esporte-clube-bahia/sorteio-da-copa-do-brasil-define-confrontos-da-5-fase). A competição oficial completa tem 126 participantes; este modo começa nas oitavas com os elencos históricos disponíveis, sem representar a edição completa.

Filtros e logos estão em `data/competitions.js`. As logos da Copa do Brasil e Champions foram baixadas do Football Logos para `assets/competitions/`, com origem em `sources.json`. O Brasileirão saiu das escolhas. Drafts antigos desse modo preservam a escalação para iniciar a Copa do Brasil; históricos concluídos mantêm os resultados originais. Drafts antigos do modo diário continuam como Copa ScoreFut; o identificador rápido agora corresponde ao Modo rápido. Campanhas antigas da Copa ScoreFut continuam disponíveis no histórico e podem ser retomadas.

## Dados históricos

`data/clubs.js` exporta `clubs`, `allSquads`, `ELENCO_TAMANHO = 11` e `validateData()`. Os registros estão em `clubs-a.js`, `clubs-b.js` e `clubs-c.js`. Cada temporada oferece um goleiro e dez jogadores de linha, ordenados por OVR.

O helper de cada lote gera atributos por perfil. Um jogador exportado contém:

```js
{
  id: 'identificador-da-pessoa',
  nome: 'Nome do atleta',
  camisa: '',
  tags: ['MC', 'MEI'],
  ovr: 88,
  atributos: {
    ataque: 81, meio: 89, defesa: 73,
    finalizacao: 74, reflexo: 22, posicionamento: 85,
  },
  destaque: '',
}
```

Mantenha o mesmo ID para a mesma pessoa em todos os clubes e anos; use IDs distintos para homônimos. Deixe a camisa vazia quando desconhecida. Notas de 90–99 representam elite excepcional; 80–89, bons titulares e grandes jogadores; 70–79, jogadores de apoio. A seleção dos onze é uma curadoria com cobertura de posições, não um ranking oficial nem necessariamente os titulares de uma única partida.

`data/season-expansion.js` amplia e revisa o catálogo para cinco épocas por clube. `data/ratings.js` aplica, nessa ordem, os ajustes do criador, o OVR verificado da edição lançada naquele ano e a estimativa editorial. `data/release-ratings.js` registra edição e fonte por jogador/época. Notas legadas da edição de mesmo ano ficam apenas como histórico em `archivedRating`, sem substituir a regra atual. OVRs alteram os seis atributos pela diferença assinada da nota, com limites de 1–99; reaplicar a correção não acumula bônus.

Ao retomar um draft, as notas são atualizadas pela mesma temporada. O limite passa para quatro skips, conservando quantos já foram usados e sem conceder saldo repetidamente. Competições iniciadas e resultados concluídos mantêm suas escalações e notas salvas.

Na Europa, o ano indica o encerramento da temporada: 2024 significa 2023/24. Na América do Sul, segue a edição da competição; a edição 2020 da Libertadores terminou em 2021.

As referências de vínculo, posição e conquistas estão em [VERIFICACAO-A.md](../data/VERIFICACAO-A.md) , [fontes-b.md](../data/fontes-b.md) e [fontes-c.md](../data/fontes-c.md).

A validação confere 43 clubes, cinco temporadas únicas por clube, 215 elencos, **2.365 registros**, onze jogadores únicos por elenco, exatamente um goleiro, tags válidas, OVR e atributos obrigatórios. No console:

```js
const { validateData } = await import('./data/clubs.js');
console.log(validateData());
```

## Motor e verificação

`js/engine.js` calcula ataque, meio, defesa, goleiro e força geral. O motor recebe explicitamente o estado e o gerador aleatório e retorna novos resultados sem alterar os times e torneios recebidos.

`squadTeam()` escala **onze atletas únicos**, com um goleiro, em uma das oito formações. Um algoritmo de atribuição por máscara de bits prioriza posições naturais e considera os atributos completos. Elencos sem uma formação válida geram um erro; não são preenchidos com atletas repetidos ou inventados.

A equação é `xG = 1.3 × (ataque / defesa adversária)^1.6`, limitada a 0,2–4,5. Os gols são sorteados por Poisson. `hashSeed()` e `mulberry32()` permitem repetir sorteios e partidas por semente. Eventos carregam minuto, tipo, jogador e coordenadas para placar, campo e linha do tempo.

O modelo 3 mantém a base por OVR e atributos e acrescenta uma ajuda leve de dificuldade: o xG do usuário é multiplicado por 1,12 e o xG do adversário contra ele é dividido por 1,06. As notas e atributos continuam iguais, as partidas entre adversários não recebem essa ajuda e os pênaltis mantêm a mesma regra. Não há o multiplicador antigo de 1,38 nem bônus de clube. OVR maior aumenta a chance de vitória; empates e derrotas continuam possíveis. Os testes com milhares de sementes verificam o aumento moderado das vitórias, a influência do OVR e a preservação dos registros. Campanhas em versões antigas mantêm as partidas já encerradas; somente rodadas pendentes são recalculadas ao migrar.

Saves do modelo anterior preservam as rodadas encerradas; somente uma partida ainda não confirmada é recalculada e reiniciada a partir do minuto zero.

```powershell
npm test
npm run check
node tests/calibrate.mjs 1000
```

Os testes cobrem onze escolhas, quatro re-sorteios compartilhados, impedimento de duplicatas, posições exatas, migração de saves antigos, as 215 escalações adversárias, simulação por semente, xG, eventos, pênaltis, grupos e chaveamento. Também verificam o avanço por rodada, a ausência de resultados futuros, continuidade das 22 bolinhas e da bola, relógio, velocidades e pausa da animação.

## Arquivos e persistência

| Pasta/arquivo | Função |
|---|---|
| `index.html` | Entrada semântica |
| `css/` | Temas, componentes, layout e tipografia |
| `js/main.js`, `state.js`, `draft.js` | Fluxo, estado e regras do draft |
| `js/ui.js` | Telas e campos |
| `js/engine.js` | Força, partidas e torneios |
| `js/storage.js`, `share.js` | Persistência, texto e PNG |
| `data/` | Clubes, jogadores e fontes históricas |
| `tests/` | Testes e calibração |
| `scripts/` | Servidor, verificação e preparação estática |

Progresso, histórico e estatísticas ficam no `localStorage` do navegador. O armazenamento usa `try/catch` para permitir jogar quando estiver bloqueado; não há sincronização entre dispositivos. O histórico guarda as últimas 50 campanhas.

O desafio diário usa o fuso **America/Sao_Paulo** e uma semente baseada na data. A versão de onze jogadores tem chaves próprias de progresso e resultado diário, preservando os registros antigos. A restrição diária é local; apagar os dados do navegador remove esse registro.

A interface usa branco e cinza claro, com vermelho suave nos jogadores sem vaga compatível disponível. Permite navegação por teclado, foco visível e movimento reduzido. Projeto independente de fãs, sem vínculo com clubes, ligas ou jogadores.

As doze imagens da página inicial em `assets/home/` foram fornecidas pelo usuário e preservadas sem alterações. O alinhamento dos jogadores considera as margens transparentes e as dimensões de cada PNG. Três grupos de quatro jogadores alternam a cada 3,5 segundos: 2,5 segundos de exibição e um segundo de fade. A animação pausa ao passar o mouse sobre o painel e respeita a preferência por movimento reduzido.

Os três grupos usam a mesma altura de retrato. Todos recebem um filtro SVG apenas no canal alfa para recuperar a opacidade dos uniformes já esmaecidos nos PNGs, seguido de uma máscara CSS que aplica o mesmo degradê suave nos últimos 32% da altura visível. A máscara acompanha o enquadramento individual sem cortar os braços nas bordas das colunas. Cores, proporções, enquadramento e arquivos originais são preservados.

O grupo com Messi é a referência de altura visível e de grade. O enquadramento do terceiro grupo considera o alfa após o filtro, evitando que margens transparentes reduzam os jogadores. Todos compartilham as mesmas quatro colunas e as mesmas linhas superior e inferior.

O degradê usa uma única curva compartilhada pelos três grupos, com início aos 68% e término aos 100% da altura visível. Não há corte antecipado ou curva específica para o terceiro grupo.

Jogadores já escalados podem mudar de posição no draft ou na escalação pronta, antes de iniciar a competição. Arraste a bolinha ou selecione o jogador e depois uma posição destacada. Vagas ocupadas permitem troca somente se os dois jogadores forem compatíveis com as novas posições. As mudanças preservam OVR, identidade, clube, temporada, sorteios e progresso.

Nas telas de campeão da Champions e Copa do Brasil, o troféu genérico é substituído pelas imagens fornecidas pelo usuário. A comemoração usa 132 confetes de sete cores e 12 segundos de uma gravação real de torcida, com volume moderado e fade no final. O áudio local é “Crowd Cheer”, de FoolBoyMedia, gravado com Tascam DR-05 e disponibilizado sob CC0: https://freesound.org/people/FoolBoyMedia/sounds/397434/. Fonte, licença e hash constam em `assets/audio/sources.json`. O botão Som permite desligar ou repetir a comemoração; o áudio para ao sair da tela ou ocultar a página. A preferência de movimento reduzido desativa os confetes.

## Marca visual

A marca principal usa lettering vetorial original com inclinação esportiva e um símbolo de futebol em verde. `assets/scorefut-logo.svg` é aplicado ao cabeçalho e ao rodapé; `assets/scorefut-mark.svg` é o ícone da aba. Os contornos das letras estão no SVG e não dependem do carregamento de fontes. A marca se adapta às telas de jogo e a dispositivos menores em `css/brand.css`.

## Histórico de campanhas

O histórico mostra escudo do time, cores da competição, resultado, formação, data, OVR, gols a favor e sofridos e jogos disputados. A busca ignora maiúsculas e acentos; os filtros por competição e por títulos podem ser combinados. As campanhas aparecem da mais recente para a mais antiga, sem alterar os registros salvos. Competições antigas continuam disponíveis no filtro, e as estatísticas do topo representam todo o histórico, independentemente dos filtros. `js/history.js` concentra busca e datas; `css/history.css` organiza a apresentação responsiva.

O Modo Lendas usa gradiente discreto de cinza claro para amarelo suave no card, na seleção, no histórico e no resultado. Os textos permanecem escuros para manter a legibilidade; a identidade está em `css/legends.css`.

No draft, os botões Outro clube e Outra temporada compartilham 4 skips por campanha. O contador acompanha o saldo real (4, 3, 2, 1, 0). Ao esgotar, uma tentativa provoca feedback vermelho e uma breve tremida, sem sortear de novo. Cada troca consome um skip; o sorteio inicial não consome.

## Site publicado

O jogo é servido pelo GitHub Pages em https://indraa-x.github.io/ScoreFut/. A origem é a raiz da branch `main`; `.nojekyll` mantém os arquivos HTML, CSS, JavaScript e assets como arquivos estáticos. Novos commits em `main` atualizam a publicação.
