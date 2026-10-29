<p align="center">
  <img src="assets/scorefut-logo.svg" alt="ScoreFut" width="340">
</p>

<p align="center">
  Elencos históricos. Novas campanhas.
</p>

<p align="center">
  <strong>HTML · CSS · JavaScript</strong><br>
  Sem framework. Sem instalação de dependências.
</p>

<p align="center">
  <a href="https://indraa-x.github.io/ScoreFut/"><strong>Jogar ScoreFut →</strong></a>
</p>

---

ScoreFut é um jogo de futebol para navegador com **43 clubes, 32 seleções, 370 elencos históricos e equipes de 11 jogadores**. Escolha sua formação, monte um time e acompanhe a campanha até o resultado.

## Modos de jogo

| Modo | Como funciona |
| --- | --- |
| **Copa do Mundo** | Draft entre 32 seleções, com até cinco épocas reais de Copas por seleção. Oito grupos, classificação dos dois primeiros e mata-mata em jogo único a partir das oitavas. |
| **Copa do Brasil** | Draft de craques brasileiros. Ida e volta até a semifinal e final em jogo único. |
| **Champions League** | Draft entre 28 clubes europeus. Fase de grupos e mata-mata no formato clássico. |

Conquistas e estatísticas são salvas no navegador, sem cadastro. A Copa do Mundo ocupa o modo de seleções. Os elencos, as fontes das notas e os critérios das épocas estão em [WORLD-CUP-SOURCES.md](data/WORLD-CUP-SOURCES.md).

## No campo

- Oito formações e troca de posições entre jogadores compatíveis.
- **3 skips por draft**, compartilhados entre clube/seleção e temporada/edição.
- Partidas com placar, relógio, bolinhas numeradas e autores dos gols.
- Simulação baseada em OVR e atributos, com uma pequena ajuda de dificuldade e sem vitória garantida.
- A vantagem adicional usa a diferença real de OVR entre seu time e o adversário: até 5 pontos, mantém a fórmula padrão; acima disso, cresce gradualmente, ficando forte acima de 10 e atingindo o limite aos 15 pontos (xG a favor ×1,9 e xG contra ÷1,7). Vale contra adversários de qualquer OVR, em todas as competições e em casa ou fora; empates e derrotas continuam possíveis.
- Conquistas permanentes, estatísticas e taças das três competições.
- Celebração com troféus, confetes e som de torcida em volume baixo.
- Resultado para baixar em PNG e progresso salvo no navegador.

## Rodar localmente

Com Node.js instalado:

```bash
git clone https://github.com/Indraa-x/ScoreFut.git
cd ScoreFut
npm run dev
```

Abra **http://127.0.0.1:4173**. Não é necessário executar `npm install`. Para encerrar o servidor, pressione `Ctrl+C`.

## Verificar

```bash
npm run prepare:site
npm test
npm run check
```

`prepare:site` atualiza a página inicial no HTML com o mesmo conteúdo do jogo e gera `dist/`, incluindo o sitemap. Execute-o após mudar a home para manter a versão inicial e a versão interativa sincronizadas.

Os testes cobrem os elencos, as formações, os sorteios, o motor de partidas, as competições, o histórico e a retomada de campanhas.

Para preparar os arquivos estáticos:

```bash
npm run prepare:site
```

A saída fica em `dist/`.

## Organização

```text
assets/    Escudos, arte da página inicial, troféus e áudio
data/      Clubes, temporadas, jogadores e referências
css/       Estilos e identidade dos modos
js/        Interface, draft, simulação e histórico
scripts/   Servidor local, validação e preparação
tests/     Testes e calibração
docs/      Documentação técnica
```

Consulte a [documentação técnica](docs/TECHNICAL.md) para as regras do motor, compatibilidade das posições e estrutura dos dados.

## Créditos

Projeto independente criado por Indraa, sem vínculo com clubes, ligas ou jogadores. Os OVRs usam a edição FIFA/FC lançada no ano da temporada (2015 → FIFA 16), preservando os ajustes do criador. Casos sem registro verificável são estimativas identificadas. Veja [notas e fontes](data/RATING-SOURCES.md), as [cinco épocas por clube](data/FIVE-ERAS.md) e as [épocas, regras e fontes da Copa do Mundo](data/EURO-SOURCES.md).

O draft usa posições, nomes e OVRs, sem faces ou cartinhas. A arte da página inicial foi preservada. Os escudos mantêm seus créditos em [clubes](assets/logos/sources.json) e [competições](assets/competitions/sources.json); o antigo catálogo de retratos permanece arquivado, sem carregamento no jogo. O áudio de torcida é **Crowd Cheer**, de FoolBoyMedia, com licença CC0; os detalhes estão em [fontes do áudio](assets/audio/sources.json).
