<p align="center">
  <img src="docs/assets/repository-cover.svg" alt="ScoreFut — Seu time. Outra história. Monte seu elenco e dispute a taça." width="100%">
</p>

<p align="center">
  <a href="https://indraa-x.github.io/ScoreFut/"><strong>Jogar agora ↗</strong></a>
  &nbsp; · &nbsp;
  <a href="#competições">Competições</a>
  &nbsp; · &nbsp;
  <a href="#rodar-no-seu-computador">Rodar localmente</a>
  &nbsp; · &nbsp;
  <a href="https://github.com/Indraa-x/ScoreFut/issues/new/choose">Bugs e sugestões</a>
</p>

# Futebol de outras épocas. Um time seu.

O **ScoreFut** é um jogo de futebol para navegador criado por **[Indraa](https://github.com/Indraa-x)**. Escolha uma formação, combine jogadores de elencos históricos e acompanhe sua campanha até a disputa pela taça.

| Formações | Clubes | Seleções | Elencos históricos |
| :---: | :---: | :---: | :---: |
| **8** | **43** | **32** | **370** |

Funciona no **celular e no PC**, com temas claro e escuro. Você joga sem cadastro; as conquistas e o progresso ficam no navegador utilizado.

## Competições

### <img src="assets/competitions/world-cup-trophy.png" height="28" alt=""> Copa do Mundo

**32 seleções · até 5 épocas por seleção.** Oito grupos de quatro, com os dois primeiros classificados. Mata-mata em jogo único a partir das oitavas.

### <img src="assets/competitions/brazil-cup-trophy.png" height="28" alt=""> Copa do Brasil

**15 clubes brasileiros · 75 elencos.** Oitavas, quartas e semifinal com ida e volta. Final em jogo único.

### <img src="assets/competitions/champions-trophy.png" height="28" alt=""> Champions League

**28 clubes europeus · 140 elencos.** Fase de grupos, ida e volta das oitavas à semifinal e final em jogo único.

## Do sorteio ao apito final

1. **Escolha sua formação.** Veja as posições no campo antes de começar.
2. **Monte os onze.** A cada rodada, sorteie um clube ou seleção e uma época; escolha um jogador para sua escalação. São **3 skips** no total, compartilhados entre equipe e época.
3. **Organize o time.** Arraste os jogadores ou selecione uma vaga compatível para posicioná-los.
4. **Dispute a campanha.** Acompanhe os movimentos no campo, o placar e os autores dos gols. Nos empates decisivos, os pênaltis aparecem cobrança por cobrança.

### O que você encontra no jogo

| Monte do seu jeito | Acompanhe a campanha |
| --- | --- |
| Elencos de diferentes gerações | Campo animado com as duas equipes |
| Oito formações e posições compatíveis | Gols separados por equipe no placar |
| Sorteios com chances iguais por equipe elegível | Ritmos normal e rápido; pênaltis no ritmo normal |
| OVRs com fontes e ajustes identificados | Conquistas, estatísticas e resultado para baixar em PNG |

A força do time influencia a simulação. Diferenças de até 5 pontos de OVR seguem a fórmula padrão; acima disso, a vantagem cresce gradualmente. Favoritismo ajuda, mas empates e derrotas continuam possíveis em todas as competições.

## Rodar no seu computador

Com uma versão atual do **Node.js** instalada:

```bash
git clone https://github.com/Indraa-x/ScoreFut.git
cd ScoreFut
npm run dev
```

Abra [127.0.0.1:4173](http://127.0.0.1:4173). **Não precisa executar `npm install`.** Para encerrar o servidor, use `Ctrl+C`.

<details>
<summary><strong>Comandos de desenvolvimento</strong></summary>

| Comando | Função |
| --- | --- |
| `npm run dev` | Inicia o servidor local. |
| `npm run check` | Confere sintaxe e consistência dos dados. |
| `npm test` | Executa os testes de regras, elencos e simulação. |
| `npm run prepare:site` | Sincroniza o HTML inicial com a home e prepara os arquivos estáticos em `dist/`. |

Execute `prepare:site` após alterar a home para manter o conteúdo inicial sincronizado. A publicação atual no GitHub Pages usa a raiz da branch `main`.

</details>

<details>
<summary><strong>Estrutura do projeto</strong></summary>

```text
assets/    Escudos, imagens, troféus e áudio
data/      Clubes, seleções, épocas, jogadores e fontes
css/       Estilos e identidade visual
js/        Interface, draft, partidas e armazenamento
scripts/   Servidor local, validações e preparação
tests/     Testes das regras e dos dados
docs/      Documentação e apresentação do repositório
```

O jogo utiliza **HTML, CSS e JavaScript com módulos nativos**, sem framework e sem dependências de execução.

</details>

## Elencos e referências

As notas combinam registros da edição FIFA/FC correspondente, estimativas históricas identificadas e ajustes do criador. Por exemplo, a época **2015** utiliza a edição lançada naquele ano: **FIFA 16**.

- [Critérios e fontes dos OVRs](data/RATING-SOURCES.md)
- [As cinco épocas de cada clube](data/FIVE-ERAS.md)
- [Seleções, épocas e regras da Copa do Mundo](data/WORLD-CUP-SOURCES.md)
- [Elencos e referências do Bayer Leverkusen](data/LEVERKUSEN.md)
- [Créditos dos escudos](assets/logos/sources.json) · [competições](assets/competitions/sources.json) · [troféus](assets/competitions/trophies-sources.json) · [áudio](assets/audio/sources.json)

## Ajude a melhorar o ScoreFut

Encontrou um erro ou teve uma ideia? Use os formulários de **[relato de bug](https://github.com/Indraa-x/ScoreFut/issues/new?template=bug.yml)** ou **[sugestão](https://github.com/Indraa-x/ScoreFut/issues/new?template=feature.yml)**. Para mudanças no código ou correções de elencos, consulte o [guia de contribuição](CONTRIBUTING.md).

---

<p align="center">
  Projeto independente criado por <a href="https://github.com/Indraa-x/ScoreFut"><strong>Indraa</strong></a>, sem vínculo com clubes, ligas ou jogadores.
</p>
