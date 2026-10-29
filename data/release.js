/** Public release metadata and the notes shown inside the game. */
export const GAME_RELEASE = Object.freeze({
  stage: 'Beta',
  version: '0.1',
  feedbackUrl: 'https://github.com/Indraa-x/ScoreFut/issues/new/choose',
  description: 'Melhorias e correções aplicadas nesta versão de testes.',
  changes: Object.freeze([
    {title: 'Campo estável', detail: 'O campo mantém o tamanho após sortear um elenco e quando novos gols aparecem no placar.'},
    {title: 'Gols mais fáceis de acompanhar', detail: 'Autores separados por equipe e mais espaço para os nomes, com rolagem sem a barra visível.'},
    {title: 'Escudos mais visíveis', detail: 'As bolinhas mostram o escudo com mais clareza e o OVR abaixo, inclusive ao arrastar jogadores.'},
    {title: 'Pênaltis e relógio', detail: 'Cobranças automáticas, uma de cada vez, no ritmo normal mesmo com a partida acelerada. Prorrogação até 120 minutos, com os acréscimos ao lado.'},
    {title: 'Página inicial', detail: 'Novas imagens de jogadores com enquadramento ajustado para PC e celular.'},
  ]),
});
