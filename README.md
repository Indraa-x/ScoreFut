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

ScoreFut é um jogo de futebol para navegador com **40 clubes, 148 elencos históricos e equipes de 11 jogadores**. Escolha sua formação, monte ou selecione um time e acompanhe a campanha até o resultado.

## Modos de jogo

| Modo | Como funciona |
| --- | --- |
| **Modo rápido** | Formação → clube → elenco → simulação completa. Mata-mata com 16 times e até 4 jogos. |
| **Copa do Brasil** | Draft de craques brasileiros. Ida e volta até a semifinal e final em jogo único. |
| **Champions League** | Draft entre 25 clubes europeus. Fase de grupos e mata-mata no formato clássico. |
| **Modo Lendas** | Escolha os jogadores pela temporada, com os OVRs ocultos durante o draft. |

## No campo

- Oito formações e troca de posições entre jogadores compatíveis.
- **3 skips por draft**, compartilhados entre outro clube e outra temporada.
- Partidas com placar, relógio, bolinhas numeradas e autores dos gols.
- Simulação baseada em OVR e atributos, com uma pequena ajuda de dificuldade e sem vitória garantida.
- Histórico com busca, filtros por competição e títulos, estatísticas e escalações.
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
npm test
npm run check
```

Os testes cobrem os elencos, as formações, os sorteios, o motor de partidas, as competições, o histórico e a retomada de campanhas.

Para preparar os arquivos estáticos:

```bash
npm run prepare:site
```

A saída fica em `dist/`.

## Organização

```text
assets/    Logos, retratos, troféus e áudio
data/      Clubes, temporadas, jogadores e referências
css/       Estilos e identidade dos modos
js/        Interface, draft, simulação e histórico
scripts/   Servidor local, validação e preparação
tests/     Testes e calibração
docs/      Documentação técnica
```

Consulte a [documentação técnica](docs/TECHNICAL.md) para as regras do motor, compatibilidade das posições e estrutura dos dados.

## Créditos

Projeto independente de fãs, sem vínculo com clubes, ligas ou jogadores. As notas dos atletas são avaliações editoriais para o jogo.

As imagens e os escudos mantêm seus créditos e fontes em [retratos](assets/players/sources.json), [clubes](assets/logos/sources.json) e [competições](assets/competitions/sources.json). O áudio de torcida é **Crowd Cheer**, de FoolBoyMedia, com licença CC0; os detalhes estão em [fontes do áudio](assets/audio/sources.json).
