/** New releases go first; published entries stay in the history. */
export const RELEASE_HISTORY=Object.freeze([
 {version:'0.6',date:'31/10/2026',title:'O caminho até o campeão',changes:[
  {icon:'bracket',title:'Novo chaveamento do mata-mata',detail:'Cartões compactos com escudos e placares, eliminados riscados, caminho do vencedor em azul e campeão no centro. Janela de cada confronto com ida, volta e épocas dos times.'},
  {icon:'field',title:'A chave inteira no celular',detail:'Deslize pelos confrontos ou toque na fase para acompanhar o mata-mata da Champions e da Copa do Mundo até a final.'},
  {icon:'calendar',title:'Grupos mais legíveis',detail:'Seleção de grupos renovada, classificados destacados e tabela com escudos e pontos maiores. No celular, resumo sem rolagem lateral e botão para todas as estatísticas.'},
 ]},
 {version:'0.5',date:'31/10/2026',title:'Mais leve e mais organizado',changes:[
  {icon:'clock',title:'Relógio contando os acréscimos',detail:'O tempo segue após 90 e 120 minutos, mantendo a indicação de acréscimos ao lado.'},
  {icon:'field',title:'Placar mais claro',detail:'Equipes identificadas como Casa e Fora e gols de pênalti marcados com (Pen). Avisos de falta e escanteio removidos do campinho.'},
  {icon:'players',title:'Elencos revisados',detail:'16 ajustes de OVR enviados pelo criador, aplicados às épocas indicadas.'},
  {icon:'shield',title:'Pequenos detalhes, melhor leitura',detail:'Novos ícones de conquistas, escudo MT refinado, botões com apito e animação e resumo do time mais compacto.'},
  {icon:'ball',title:'Carregamento mais leve',detail:'Imagens otimizadas, fontes locais e elencos da Copa carregados ao escolher o modo. Melhorias na organização e publicação do jogo.'},
 ]},
 {version:'0.4',date:'30/10/2026',title:'Cartões entram em jogo',changes:[
  {icon:'shield',title:'Amarelos e vermelhos',detail:'Cartões ligados às faltas. Expulsões são raras, aparecem no placar e retiram o jogador do campinho.'},
  {icon:'ball',title:'Pênaltis identificados',detail:'Faltas na área originam cobranças de pênalti. Os gols recebem a indicação (pen) junto ao minuto.'},
 ]},
 {version:'0.3',date:'30/10/2026',title:'Novas formas de marcar',changes:[
  {icon:'ball',title:'Bola parada vale gol',detail:'Gols de falta, gols olímpicos e cabeçadas após faltas ou escanteios, com a jogada no campo.'},
  {icon:'clock',title:'Ritmo contínuo',detail:'Bola e jogadores seguem em movimento durante as cobranças, na velocidade escolhida.'},
 ]},
 {version:'0.2',date:'30/10/2026',title:'Bola parada no campinho',changes:[
  {icon:'field',title:'Faltas e escanteios',detail:'Cobranças com barreira, cruzamentos e posicionamento dos jogadores, várias vezes por partida.'},
  {icon:'players',title:'Cada lance tem seu time',detail:'O aviso no campo identifica a cobrança, a equipe e o minuto.'},
 ]},
 {version:'0.1',date:'29/10/2026',title:'O início do beta',changes:[
  {icon:'field',title:'Três competições',detail:'Copa do Mundo, Copa do Brasil e Champions League, com elencos históricos e oito formações.'},
  {icon:'players',title:'Monte e acompanhe seu time',detail:'Draft com três skips, simulação de partidas e conquistas salvas no navegador.'},
  {icon:'ball',title:'Gols e campo organizados',detail:'Autores dos gols separados por equipe e campo estável durante a partida e o sorteio.'},
  {icon:'shield',title:'Escudos e página inicial',detail:'Escudos mais claros e fotos dos jogadores com enquadramento ajustado para PC e celular.'},
  {icon:'clock',title:'Pênaltis e prorrogação',detail:'Cobranças automáticas, uma por vez, e relógio até 120 minutos com acréscimos ao lado.'},
 ]},
].map(release=>Object.freeze({...release,changes:Object.freeze(release.changes.map(Object.freeze))})));

export const GAME_RELEASE=Object.freeze({
 stage:'Beta',version:RELEASE_HISTORY[0].version,
 feedbackUrl:'https://github.com/Indraa-x/ScoreFut/issues/new/choose',
 description:'Acompanhe a evolução do ScoreFut.',changes:RELEASE_HISTORY[0].changes,
});
