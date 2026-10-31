# Atualizações do ScoreFut

## Beta 0.4 — 30/10/2026

Cartões amarelos e vermelhos vinculados às faltas, com expulsões raras. Faltas na área originam as cobranças de pênalti da partida. O placar identifica gols de pênalti com (pen) e exibe os jogadores expulsos, que saem do campinho.

## Beta 0.3 — 30/10/2026

A simulação inclui gols de falta, gols olímpicos e cabeçadas após escanteios ou faltas. A cobrança, o cruzamento e a finalização aparecem no campinho; o aviso do gol identifica o tipo de lance. Os resultados seguem o equilíbrio de OVR existente. Faltas e escanteios mantêm movimentos contínuos na velocidade escolhida.

## Beta 0.2 — 30/10/2026

Faltas com barreira e escanteios agora são encenados no campo da simulação, com identificação da equipe e do minuto. Os lances se repetem ao longo da partida e usam o mesmo comportamento nas três competições. As animações preservam placares e resultados já simulados.

## Beta 0.1 — 29/10/2026

Início da numeração pública do jogo. Esta versão reúne a Copa do Mundo, a Copa do Brasil e a Champions League; draft com oito formações e três skips; simulação de partidas; conquistas e progresso salvos no navegador.

O cabeçalho mostra somente Beta 0.1. Ao clicar, uma janela apresenta as correções e melhorias da versão, com acesso aos formulários do GitHub para dúvidas e bugs.

Durante o beta, atualizações importantes incrementam a revisão (`0.2`, `0.3` e assim por diante). Pequenos ajustes não geram uma nova versão. A versão final será anunciada pelo criador do projeto.


## Manutenção — 31/10/2026 — etapa 1

Testes atualizados para três skips, acréscimos à direita e pênaltis em bolinhas; posse sem portador após expulsão aceita. Precedência de revisões manuais documentada, sem alterar nenhum OVR ativo. Escolha conservadora: a auditoria de notas permanece um retrato histórico, e as expectativas antigas são reconciliadas com revisões mais recentes. A home usa LF para sincronização reproduzível no Windows e no CI. CI em Node 22.


## Manutenção — 31/10/2026 — etapa 2

Deploy explícito de `dist/` pelo GitHub Actions. A fonte do Pages deve ser GitHub Actions. A preparação não toca mais `.openai/hosting.json` e copia apenas dependências alcançáveis, escudos e retratos da home; referências dinâmicas são enumeradas explicitamente. A saída é reconstruída para não reter assets antigos.

### Etapa 3a — retratos arquivados

Referências verificadas em js/, data/, css/ e index.html: somente os dois próprios módulos de retratos. A branch archive/portraits preserva data/player-portraits.js, js/player-portraits.js, assets/players/ (com fontes completas) e scripts/collect-commons-portraits.mjs e prepare-player-portraits.mjs. A versão ativa mantém apenas sources.json apontando ao arquivo. Nenhuma remoção definitiva do histórico.


### Etapa 3b — carregamento e distribuição

WebP com dimensões originais e fallback PNG/JPG preservado. Fontes locais sob OFL. Catálogo leve de seleções na home; elencos carregam na escolha da Copa e antes da retomada de saves dela. No Node, carregamento completo preserva auditorias e testes. CSS é unido na ordem original no dist; queries manuais de módulos foram substituídas por hash do conteúdo do grafo e o bundle CSS usa seu próprio hash. Escolha conservadora: !important que protegem temas, expulsões e animações foram preservados para evitar regressões visuais.
