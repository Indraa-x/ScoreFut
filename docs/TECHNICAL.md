# Documentação técnica do ScoreFut

## Visão geral

Jogo em HTML, CSS e módulos JavaScript, sem framework e sem dependências de execução. Desenvolvimento e CI: Node 22. O navegador monta onze jogadores, um goleiro e dez de linha, em oito formações. **Três skips compartilhados** por draft; sorteio inicial gratuito. Sorteios dão a mesma chance a cada clube/seleção elegível e depois escolhem uma época elegível.

Catálogo atual validado por `npm run check`: **43 clubes, 32 seleções, 370 elencos, 4.070 registros de jogadores**. Clubes: cinco épocas cada, 215 elencos. Seleções: até cinco épocas reais cada, 155 elencos. Não se deve duplicar pessoas com nomes parecidos ou reutilizar OVR de outra época.

| Competição | Catálogo e formato |
| --- | --- |
| Copa do Mundo | 32 seleções; oito grupos de quatro, três jogos por seleção, dois classificados; oitavas até final em jogo único |
| Copa do Brasil | 15 clubes brasileiros; oitavas, quartas e semifinais com ida/volta, final única |
| Champions League | 28 clubes europeus; grupos e mata-mata de ida/volta até a semifinal, final única |

## Execução e verificação

```sh
npm run dev
npm test
npm run check
npm run prepare:site
```

Não é necessário `npm install` para esses comandos ou para jogar. Para ferramentas opcionais de desenvolvimento: `npm ci`, `npm run lint` e `npm run format`. ESLint e Prettier são somente devDependencies. O servidor local tem MIME para HTML, CSS, JS, JSON, SVG, PNG, JPG, WebP, MP3, WOFF2, XML e webmanifest.

`npm run check` valida IDs, catálogos, onze jogadores compatíveis, um goleiro e atributos; faz verificação de sintaxe recursiva dos módulos. A suíte usa node:test, sem dependências. Em 31/10/2026: base com 237 testes, 226 aprovados e 11 falhas; após a manutenção, 238 aprovados (incluindo o teste de escape HTML compartilhado).

## Organização

- `data/clubs.js`: catálogo de clubes e épocas; `data/game-squads.js`: interface comum dos catálogos.
- `data/world-cup-catalog.js`: metadados leves de 32 seleções. `loadWorldCupSquads()` importa os elencos em `data/world-cup-squads.js` sob demanda no navegador. No Node, carrega o catálogo completo para testes e pré-renderização.
- `js/draft.js`: sorteio, três skips, posições, movimentação e atualização de notas em drafts.
- `js/engine.js`: resultados por semente e força dos times, grupos e chaveamento. A manutenção não alterou fórmulas de vitória, balanceamento ou regras.
- `js/match-motion.js`, `match-set-pieces.js`, `match-discipline.js`: reprodução de movimentação, bola parada e cartões. Resultados e eventos devem reconciliar com o placar.
- `js/main.js`: ciclo de telas e serviços. `js/actions/`: handlers de navegação, draft, partida e resultado; contexto explícito, sem eval.
- `js/html.js`: escape compartilhado para texto/atributos, inclusive nomes de jogadores.
- `js/storage.js`, `campaign-progress.js`, `achievements.js`: persistência no navegador e conquistas. Sem contas ou login.
- `data/release.js`: histórico público de versões; novos lançamentos são adicionados no início sem apagar os anteriores.

## Precedência de notas

Revisões manuais do criador vencem notas verificadas. Para clubes:

1. Revisão manual de 31/10/2026 (`ovr-review-20261031.js`); depois revisões diretas anteriores, como Courtois, Real Madrid 2022, 92.
2. `imported-ovr-review.js`, na ordem cronológica de suas importações, incluindo `ovr-review-20261029.js`.
3. `creator-ratings.js` (edições do criador e revisões diretas desse arquivo).
4. Nota da edição correta em `release-ratings.js` (FIFA/FC lançado no ano da temporada, nomeado pela edição seguinte).
5. Revisão editorial de época em `season-ratings.js`, incluindo a revisão vintage.
6. Estimativa original identificada.

`fifa-archive-ratings.js` e `modern-ratings.js` preservam a nota da edição anterior como procedência, sem vencer uma revisão manual ou a edição correta. Para seleções, a prioridade atual é: revisão direta mais recente do criador, revisão importada mais recente, revisão direta dos goleiros, revisão histórica manual, importações anteriores e revisões originais da Copa. As datas e fontes ficam no registro; metadados originais não devem ser inventados.

Na manutenção que produziu essa auditoria, nenhum OVR ativo mudou. Revisões posteriores são registradas nos arquivos de rating e em `RATING-SOURCES.md`; `release-rating-audit.json` permanece um retrato histórico e não deve ser reescrito para simular que ajustes recentes já existiam.

## Build e publicação

A home contém conteúdo público antes de JavaScript, gerado por `scripts/prerender-home.mjs`. `index.html` usa LF, inclusive no Windows. `prepare:site` sincroniza a home e reconstrói `dist/`, copiando o grafo de dependências, os assets usados e os avisos de licença/atribuição necessários. Não altera `.openai/hosting.json`.

Os CSS são concatenados **na ordem dos links**, em um bundle cujo nome contém o hash do conteúdo. Imports de módulos recebem hash do conteúdo do grafo para invalidar pais quando filhos mudam, sem manter queries manuais. Imagens da home usam WebP de menos de 200 KB, com dimensões originais e fallback PNG. URLs de assets geradas no build usam hash; fontes Inter e Barlow Condensed são WOFF2 locais sob OFL. Originais não foram removidos sem auditoria. !important essenciais para temas, animações e expulsões foram conservados.

- `.github/workflows/ci.yml`: Node 22, npm test, npm run check, prepare:site e `git diff --exit-code index.html`.
- `.github/workflows/deploy.yml`: prepara `dist/` e publica com upload-pages-artifact/deploy-pages.
- **GitHub → Settings → Pages → Source: GitHub Actions.** Não publicar a raiz da branch no lugar do pacote preparado.

O pacote não inclui qa/, testes, ferramentas, node_modules, documentos internos nem os retratos arquivados. O build falha quando encontra uma referência de runtime sem arquivo correspondente.

## Saves, acessibilidade e compatibilidade

A Copa é carregada antes de retomar um save dela. A migração de contas antigas adota uma carreira e mescla conquistas de forma transacional; perfis e dados deslocados ficam arquivados. Saves da antiga Euro são preservados com seus bytes originais antes de liberar o slot ativo. Migrações de formação, regras, skips e torneios permanecem em draft/match-session. Critérios de remoção estão no comentário inicial de storage.js: somente após encerrar suporte às versões antigas e oferecer recuperação/exportação. Não apagar saves ou arquivos legados automaticamente.

O elemento #app não é uma região aria-live. Anúncios se limitam a placar, gols, resultado e toasts, mantendo foco, navegação e as preferências de tema e movimento reduzido.

## Arquivo, fontes e licença

A branch **archive/portraits** preserva data/player-portraits.js, js/player-portraits.js, assets/players/ e os scripts collect-commons-portraits.mjs e prepare-player-portraits.mjs. A busca em js/, data/, css/ e index.html confirmou que somente os próprios módulos sem uso referenciavam esses retratos. Um sources.json mínimo permanece na versão ativa. A retirada do histórico Git não foi feita e depende do autor.

[LICENSE](../LICENSE): MIT para o código, © 2026 Indraa. [CREDITS.md](../CREDITS.md) consolida áudio, escudos, fontes, fotos e dados. Os dados derivados da base Fjelstul mantêm CC-BY-SA 4.0. Imagens de jogadores, competições e campo de banco de imagens exigem revisão de permissões e direito de imagem pelo autor.

## Decisões conservadoras da manutenção

- Preservar OVRs, regras, aparência e textos visíveis do jogo.
- Preservar o arquivo histórico de notas e os originais das imagens como fallback.
- Manter !important que protegem estados visuais e todas as migrações suportadas.
- Oferecer manifest, sem service worker nesta etapa: evitar cache persistente de saves e versões antigas antes de definir uma política de atualização offline. O manifest não promete funcionamento offline.
