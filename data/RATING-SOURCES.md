# OVR por jogador e época

Política revista em 22/10/2026. A edição usada é a lançada no ano da época:
**2015 → FIFA 16**, **2022 → FIFA 23**, **2023 → FC 24**, **2025 → FC 26**.
Não se usa o ano da capa como se fosse o ano de lançamento.

## Prioridade

1. Os **67 ajustes do criador**, importados dos JSONs de 21 e 22/10, sempre prevalecem. Continuam identificados como `creator-review`, sem apresentar a nota personalizada como oficial.
2. OVR verificável da edição seguinte ao ano da época, por pessoa e elenco, em `release-ratings.js` (`release-rating`). Uma transferência não muda a identidade: por exemplo, Donnarumma do PSG 2025 pode ter a nota do Manchester City no FC 26.
3. Na ausência de registro verificável nessa edição, revisão editorial explícita (`season-review`) ou estimativa histórica (`editorial-estimate`). Não se copia uma nota de outra edição, de um homônimo ou de um jogador genérico sem licença.

As antigas notas da edição de mesmo ano foram mantidas somente como histórico em `archivedRating`. Não substituem a regra atual. `releaseRating` conserva a fonte da edição usada mesmo quando há um ajuste pessoal por cima. Os atributos de simulação recebem a diferença assinada do OVR, sem acumular aumento ao carregar novamente o jogo.

## Cobertura conferida

Há **1.069 registros jogador/época verificados**, dos quais 28 também têm ajuste pessoal. Na base ativa de 2.365 registros: 1.041 usam a nota verificada, 67 usam os ajustes pessoais e 1.257 continuam editoriais, incluindo uma revisão explícita anterior. A auditoria completa está em [release-rating-audit.json](release-rating-audit.json), com uma linha para cada jogador/época.

Isso não significa que todas as estimativas sejam impossíveis de pesquisar no futuro. Há épocas anteriores à cobertura consultada, aposentados ausentes da edição pedida, clubes sem licença e registros ainda sem confirmação segura. Esses casos permanecem claramente identificados, em vez de inventar um OVR da EA. No draft, o título da nota informa se é da edição, do criador ou estimada.

## Fontes

- [FIFA Index, Barcelona no FIFA 16](https://fifaindex.com/teams/241-fc-barcelona/fifa16): exemplo de 2015 → edição 16.
- [FIFA Index, arquivos de jogadores](https://fifaindex.com/players/): históricos por pessoa/edição, incluindo transferidos.
- [FIFA Index, São Paulo no FIFA 09](https://fifaindex.com/pt-br/times/598-sao-paulo/fifa09) e [Botafogo no FIFA 08](https://fifaindex.com/teams/517-botafogo/fifa08): exemplos brasileiros, com nomes reais de cada edição.
- [Conjuntos SoFIFA de FIFA 16–19](https://github.com/giabb/sports-analytics/tree/main/raw): OVR, identificação EA e nome completo por edição. Os registros das bases FIFA 15 e FIFA 20 também conservam o endereço individual do SoFIFA na fonte de cada nota.
- [Conjunto SoFIFA de FIFA 22](https://github.com/abineshta/FIFA-22-complete-player-dataset-EDA/blob/main/players_22.csv).
- [Conjunto SoFIFA de FC 25](https://github.com/Radzim/football_data/blob/main/sofifa.csv): a descrição do registro identifica a edição.

As fontes podem ter a última atualização arquivada de uma edição ou uma fotografia anterior da base. Não são todas notas do dia de lançamento. Não foram usadas cartas promocionais, notas de potencial, ICONs ou médias de outras temporadas como OVR base. Fotografias antigas não servem como confirmação suficiente da identidade: Pedro Rodríguez, Bruno Henrique, Luiz Adriano e Marcelo Moreno tiveram os IDs conferidos pelo nome completo nos dados da edição.

## Manutenção

Cada registro verificado contém `ovr`, `edition`, `releaseYear`, `source` e, quando conhecido, `eaId`. `releaseYear` é o ano da temporada; `edition` é o jogo lançado nesse ano. Atualize também a auditoria ao modificar a cobertura. Os testes conferem a edição, a pessoa no elenco, a prioridade dos 67 ajustes, os atributos, a persistência e todas as 2.365 linhas.

O jogo é estático: nenhuma consulta ao FIFA Index ou SoFIFA ocorre durante a partida. A pesquisa de notas e o antigo catálogo de imagens não são dependências para adicionar jogadores.
