# Auditoria de manutenção — 31/10/2026

| Medida | Antes | Depois |
| --- | ---: | ---: |
| Testes aprovados | 226 / 237 | 238 / 238 |
| Conteúdo rastreado da revisão ativa | 119.41 MB | 25.24 MB |
| Pacote dist | 119.09 MB (1464 arquivos) | 18.93 MB (209 arquivos) |

Medidas de arquivos sem compressão, antes do pequeno relatório final. Não incluem node_modules, qa ou o banco de objetos Git. O histórico Git continua contendo os retratos preservados; não se declara redução do histórico ou do clone completo.

## Verificações

- npm test e npm run check executados antes e após cada etapa, incluindo o commit separado do arquivo de retratos.
- Node 22.23.4: 238 testes aprovados, check e prepare:site concluídos.
- npm run lint sem erros. Home pré-renderizada sincronizada após preparar dist.
- Navegador: home e Champions não requisitam world-cup-squads.js; Copa carrega sob demanda e retoma o mesmo sorteio após recarregar. Pacote dist sem erros de página/requisição.
- 27 imagens WebP geradas, todas abaixo de 200 KB (máximo 185578 bytes), dimensões e originais preservados.
- Um bundle CSS na ordem da cascata; fontes locais WOFF2; hashes de conteúdo gerados no build.
- Nenhum jogador teve OVR alterado nesta manutenção.

## Decisões conservadoras

1. Revisões mais recentes vencem testes de importações anteriores; auditorias históricas ficam intactas.
2. PNG/JPG originais mantidos como fallback; somente os retratos verificados sem uso foram retirados da revisão ativa.
3. !important que protegem estados visuais foram mantidos.
4. Catálogo completo no Node para compatibilidade dos testes; carregamento assíncrono no navegador com retomada de saves.
5. Sem service worker por enquanto, para evitar cache persistente sem política de atualização offline. Manifest não promete modo offline.
6. Arquivos de atribuição/licença acompanham o runtime no dist.

## Confirmado e pendente

MIT confirmada por Indraa para o código. Pages deve usar GitHub Actions, com publicação de dist. A branch archive/portraits conserva os dois módulos, assets/players e os dois scripts de coleta/preparo; sources.json mínimo permanece na main. Cabe ao autor revisar direitos de fotos, imagens de jogadores, escudos e campo Depositphotos, e decidir se algum dia quer remover definitivamente os retratos do histórico. Fontes e licenças conhecidas estão em CREDITS.md.
