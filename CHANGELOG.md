# Atualizações do ScoreFut

## Beta 0.13 — 07/11/2026

O elenco inicial e os reforços da academia usam jogadores reais do catálogo. As carreiras salvas substituem jogadores fictícios por opções compatíveis e preservam as contratações, a formação, o orçamento e os resultados registrados.

## Beta 0.12 — 07/11/2026

O Elenco da Carreira usa a seleção por clique no campinho. Escolha um titular ou reserva e toque em uma posição destacada para trocar a escalação. Os marcadores mostram o escudo do clube e o OVR de cada titular.

## Beta 0.11 — 07/11/2026

O Mercado da Carreira reúne as versões históricas dos jogadores de clubes e seleções. Os cartões mostram o escudo de origem, o OVR, a temporada, as posições e o preço. Use a busca, os filtros e a ordenação para encontrar um reforço e contratar a versão desejada com o orçamento do clube.

## Beta 0.10 — 07/11/2026

Modo Carreira de Treinador com campeonato de ida e volta, classificação, premiação e temporadas sucessivas. Monte os titulares, contrate reforços, melhore as instalações e personalize o Meu time com um nome e um dos oito escudos. A carreira fica salva no navegador.

## Beta 0.9 — 05/11/2026

Desafio com amigos reformulado como torneio local. Antes do sorteio, escolha 2 ou 4 participantes, informe os nomes e selecione a formação; cada pessoa monta seu time em sequência no mesmo aparelho. Com 2 participantes, a final tem ida e volta (2 partidas). Com 4, há duas semifinais e uma final, todas de ida e volta (6 partidas). O agregado decide quem avança; empate leva à prorrogação e, se necessário, aos pênaltis. A chave revela os resultados conforme cada jogo termina, e o progresso fica salvo no navegador. O resumo da força usa o mesmo padrão das competições solo, com medidor, perfil por setor, média OVR e formação. A escolha de competição saiu da configuração do torneio. Códigos antigos continuam aceitos no fluxo legado; o torneio novo não sincroniza entre aparelhos. [Detalhes técnicos](docs/CHALLENGES.md).

### Correção de 05/11/2026 — resumo de força nos torneios

O resumo dos times no torneio local segue o mesmo visual das campanhas solo: medidor de força geral, perfil por setor, média OVR e formação. O cálculo da força é o mesmo nos dois modos.

### Correção de 02/11/2026 — códigos curtos

Novos desafios geram códigos de apenas seis letras e números, com competição, formação e sorteio reproduzíveis sem servidor. Links e campanhas dos códigos longos anteriores continuam funcionando. O campo de entrada também aceita o link completo.

## Beta 0.8 — 01/11/2026

Desafios por código e link na página inicial, para Copa do Mundo, Champions e Copa do Brasil. O código fixa competição, formação, seed inicial e versão dos elencos/regras. O primeiro sorteio é o mesmo; escolhas e skips diferentes podem alterar os próximos elencos elegíveis. Escolhas e skips iguais reproduzem o draft e a seed da competição, inclusive em outro navegador ou dia. Três skips, saves locais e identificação do desafio no draft, resumo e resultado. Abrir um link apenas mostra os detalhes: a campanha começa depois de clicar em Começar desafio. Sorteios normais continuam usando Web Crypto. Sem contas, classificação online ou mudança de OVRs. [Detalhes técnicos](docs/CHALLENGES.md).

## Beta 0.7 — 01/11/2026

Motor de simulação 6 para campanhas novas: vantagem de força gradual e simétrica, sem os antigos saltos de dominância. Meio-campo, posição principal, formação e entrosamento entram no cálculo efetivo. A partida evolui em blocos de cinco minutos: expulsões, substituições, pressão no fim, mando nos clubes, desgaste na prorrogação e acréscimos afetam as oportunidades de gol. Campanhas existentes conservam o modelo anterior, sem alterar OVRs, elencos ou aparência do jogo.

Calibração reproduzível com 20.000 jogos por linha e 1.000 campanhas por célula. O Normal mantém ajuda mínima por escolha do autor; as metas de título da Copa do Mundo e Champions não foram atingidas. Resultados completos, intervalos de 95% e verificação visual em [SIMULATION-V6-2026-10-31.md](docs/SIMULATION-V6-2026-10-31.md). O histórico das versões anteriores permanece disponível ao clicar no beta.

## Beta 0.6 — 31/10/2026

Novo mata-mata da Champions, da Copa do Mundo e da Copa do Brasil: chave simétrica com cartões compactos, escudos, siglas e placares. Equipes eliminadas aparecem riscadas, o caminho do vencedor fica azul e a final e o campeão ficam no centro. Ao clicar, uma janela compacta mostra ida, volta e pênaltis com as épocas dos times no lugar das datas. No celular, a chave completa tem rolagem horizontal e atalhos por fase. Na Copa do Brasil, as linhas respeitam o sorteio das quartas e as classificações diretas. Resultados futuros permanecem ocultos. Grupos com navegação renovada, classificados destacados e tabela mais legível; no celular, um resumo cabe na tela e permite abrir todas as estatísticas.

## Beta 0.5 — 31/10/2026

Consolida a otimização da distribuição e do carregamento, as 16 revisões de OVR, os refinamentos de ícones, escudo e botões, o resumo do time mais compacto e as melhorias de leitura no placar. O relógio continua contando durante os acréscimos, Casa/Fora identifica o mando e (Pen) identifica gols de pênalti. Histórico das versões anteriores preservado.

## Beta 0.4 — 30/10/2026

Cartões amarelos e vermelhos vinculados às faltas, com expulsões raras. Faltas na área originam as cobranças de pênalti da partida. O placar identifica gols de pênalti com (pen) e exibe os jogadores expulsos, que saem do campinho.

## Beta 0.3 — 30/10/2026

A simulação inclui gols de falta, gols olímpicos e cabeçadas após escanteios ou faltas. A cobrança, o cruzamento e a finalização aparecem no campinho; o aviso do gol identifica o tipo de lance. Os resultados seguem o equilíbrio de OVR existente. Faltas e escanteios mantêm movimentos contínuos na velocidade escolhida.

## Beta 0.2 — 30/10/2026

Faltas com barreira e escanteios agora são encenados no campo da simulação, com identificação da equipe e do minuto. Os lances se repetem ao longo da partida e usam o mesmo comportamento nas três competições. As animações preservam placares e resultados já simulados.

## Beta 0.1 — 29/10/2026

Início da numeração pública do jogo. Esta versão reúne a Copa do Mundo, a Copa do Brasil e a Champions League; draft com oito formações e três skips; simulação de partidas; conquistas e progresso salvos no navegador.

O ícone de ferramentas no cabeçalho abre o histórico de versões, com as correções e melhorias e acesso aos formulários do GitHub para dúvidas e bugs. A versão atual aparece nesse painel.

Durante o beta, atualizações importantes incrementam a revisão (`0.2`, `0.3` e assim por diante). Pequenos ajustes não geram uma nova versão. A versão final será anunciada pelo criador do projeto.


## Manutenção — 31/10/2026 — etapa 1

Testes atualizados para três skips, acréscimos à direita e pênaltis em bolinhas; posse sem portador após expulsão aceita. Precedência de revisões manuais documentada, sem alterar nenhum OVR ativo. Escolha conservadora: a auditoria de notas permanece um retrato histórico, e as expectativas antigas são reconciliadas com revisões mais recentes. A home usa LF para sincronização reproduzível no Windows e no CI. CI em Node 22.


## Manutenção — 31/10/2026 — etapa 2

Deploy explícito de `dist/` pelo GitHub Actions. A fonte do Pages deve ser GitHub Actions. A preparação não toca mais `.openai/hosting.json` e copia apenas dependências alcançáveis, escudos e retratos da home; referências dinâmicas são enumeradas explicitamente. A saída é reconstruída para não reter assets antigos.

### Etapa 3a — retratos arquivados

Referências verificadas em js/, data/, css/ e index.html: somente os dois próprios módulos de retratos. A branch archive/portraits preserva data/player-portraits.js, js/player-portraits.js, assets/players/ (com fontes completas) e scripts/collect-commons-portraits.mjs e prepare-player-portraits.mjs. A versão ativa mantém apenas sources.json apontando ao arquivo. Nenhuma remoção definitiva do histórico.


### Etapa 3b — carregamento e distribuição

WebP com dimensões originais e fallback PNG/JPG preservado. Fontes locais sob OFL. Catálogo leve de seleções na home; elencos carregam na escolha da Copa e antes da retomada de saves dela. No Node, carregamento completo preserva auditorias e testes. CSS é unido na ordem original no dist; queries manuais de módulos foram substituídas por hash do conteúdo do grafo e o bundle CSS usa seu próprio hash. Escolha conservadora: !important que protegem temas, expulsões e animações foram preservados para evitar regressões visuais.


## Manutenção — 31/10/2026 — etapa 4

Escape HTML centralizado; ações separadas em navegação, draft, partida e resultado. Anúncios acessíveis limitados a placar, resultado e avisos, sem aria-live em toda a aplicação. Migrações antigas documentadas com critérios de remoção. ESLint e Prettier são ferramentas opcionais de desenvolvimento: jogar, testar e preparar o site não exigem npm install. Sem alteração de regras ou aparência.


## Manutenção — 31/10/2026 — etapa 5

Documentação atualizada para Copa do Mundo, três skips, 43 clubes, 32 seleções, 370 elencos e 4.070 registros. Licença MIT do código confirmada por Indraa; créditos distinguem OFL, CC0, CC-BY-SA e materiais com permissões pendentes. Robots, sitemap datado, imagem social 1200×630 e manifest adicionados. Escolha conservadora: sem service worker por enquanto, para não introduzir cache persistente sem política de atualização; nenhuma promessa de modo offline. Direitos de imagem/marcas e remoção definitiva de retratos do histórico continuam para revisão do autor.


## Revisão de OVR — 31/10/2026

Importadas 16 alterações exatas de scorefut-overs-todos-2026-10-31.json. Revisão 22 das notas; cada ajuste vale somente para a pessoa e época indicadas. As revisões manuais mais recentes têm prioridade sobre as anteriores.
