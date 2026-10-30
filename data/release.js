/** Public release metadata and the notes shown inside the game. */
export const GAME_RELEASE = Object.freeze({
  stage: 'Beta',
  version: '0.3',
  feedbackUrl: 'https://github.com/Indraa-x/ScoreFut/issues/new/choose',
  description: 'Veja o que melhorou nesta versão do ScoreFut.',
  changes: Object.freeze([
    {icon:'ball',title:'Novas maneiras de marcar',detail:'Gols de falta, olímpicos e de cabeça após escanteios ou faltas, com a jogada no campinho.'},
    {icon:'clock',title:'Cobranças sem pausa',detail:'Bola e jogadores continuam em movimento nas faltas e escanteios, na velocidade escolhida.'},
    {icon:'field',title:'Faltas e escanteios no campo',detail:'Os jogadores se posicionam para cobranças que podem acontecer várias vezes na partida.'},
    {icon:'ball',title:'Cada cobrança identifica a equipe',detail:'O aviso no campinho mostra o tipo de lance, o minuto e o time que vai cobrar.'},
    {icon: 'field', title: 'Campo sem mudar de tamanho', detail: 'O campo fica estável ao sortear o elenco e quando sai um gol.'},
    {icon: 'ball', title: 'Gols organizados por time', detail: 'Mais espaço no placar para ver quem marcou em cada equipe.'},
    {icon: 'shield', title: 'Escudos mais nítidos', detail: 'O escudo aparece com clareza, com a nota abaixo da imagem.'},
    {icon: 'clock', title: 'Pênaltis no ritmo certo', detail: 'Uma cobrança por vez, mesmo no modo rápido. Prorrogação até 120 minutos.'},
    {icon: 'players', title: 'Novo visual na página inicial', detail: 'Fotos atualizadas e alinhadas no computador e no celular.'},
  ]),
});
