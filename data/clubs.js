/**
 * Fonte central de dados do ScoreFut. Edite os elencos nos lotes importados
 * abaixo, ou inclua novos objetos diretamente em clubs. Notas com fonte histórica
 * no ratings.js reproduzem o OVR da edição FIFA/FC; as demais são avaliações do jogo.
 * Cada temporada oferece onze candidatos, incluindo um goleiro.
 */
import { clubsA } from './clubs-a.js?v=worldcup-20261020';
import { clubsB } from './clubs-b.js?v=worldcup-20261020';
import { clubsC } from './clubs-c.js?v=worldcup-20261020';
import { championsAdditions } from './champions-additions.js?v=worldcup-20261020';
import { applyHistoricalFifaRating, MAX_OVR } from './ratings.js?v=worldcup-20261020';
export const ELENCO_TAMANHO = 11;
export const clubs = [...clubsA, ...clubsB, ...clubsC, ...championsAdditions];
const validTags = new Set(['GOL','ZAG','LD','LE','VOL','MC','MEI','MD','ME','PE','PD','SA','CA']);
// Uma pessoa conserva o mesmo ID mesmo quando o nome de exibição muda.
const aliases = {'mancini':'amantino-mancini','di-maria':'angel-di-maria','jorginho':'jorginho-frello','falcao':'radamel-falcao','mbappe':'kylian-mbappe','gundogan':'ilkay-gundogan','thiago':'thiago-alcantara','eto-o':'samuel-etoo','samuel-eto-o':'samuel-etoo','luis-suarez':'luis-suarez','luis-figo':'luis-figo'};
for(const club of clubs) for(const season of club.temporadas) for(const player of season.jogadores) player.id = aliases[player.id] || player.id;
for(const club of clubs) for(const season of club.temporadas) {
  const squadId = `${club.id}-${season.ano}`;
  season.jogadores = season.jogadores.map(player => applyHistoricalFifaRating(player, squadId));
}
function roster(season) {
  const pool = season.candidatos || season.jogadores;
  const ranked = [...pool].sort((a,b)=>b.ovr-a.ovr || (b.titulos || 0)-(a.titulos || 0));
  const goalkeeper = ranked.find(p=>p.tags.includes('GOL'));
  return goalkeeper ? [...ranked.filter(p=>!p.tags.includes('GOL')).slice(0,ELENCO_TAMANHO-1),goalkeeper].sort((a,b)=>b.ovr-a.ovr) : ranked.slice(0,ELENCO_TAMANHO);
}
export const allSquads = clubs.flatMap(club => club.temporadas.map(season => ({id:`${club.id}-${season.ano}`,clubId:club.id,nome:club.nome,monograma:club.monograma,cores:club.cores,ano:season.ano,conquistas:season.conquistas,jogadores:roster(season)})));
export function validateData() {
  const errors = [];
  if(clubs.length !== 40) errors.push(`Esperados 40 clubes, encontrados ${clubs.length}.`);
  if(new Set(clubs.map(c=>c.id)).size !== clubs.length) errors.push('IDs de clube repetidos.');
  for(const club of clubs) {
    if(club.temporadas.length < 3 || new Set(club.temporadas.map(s=>s.ano)).size !== club.temporadas.length) errors.push(`${club.nome}: são necessárias ao menos três temporadas únicas.`);
  }
  for(const squad of allSquads) {
    const players = squad.jogadores;
    if(players.length !== ELENCO_TAMANHO) errors.push(`${squad.id}: são necessários exatamente ${ELENCO_TAMANHO} jogadores.`);
    if(players.filter(p=>p.tags.includes('GOL')).length !== 1) errors.push(`${squad.id}: é necessário um goleiro.`);
    if(new Set(players.map(p=>p.id)).size !== players.length) errors.push(`${squad.id}: jogador repetido.`);
    for(const player of players) {
      if(!player.id || !player.nome) errors.push(`${squad.id}: jogador sem nome ou ID.`);
      if(!Number.isFinite(player.ovr) || player.ovr < 50 || player.ovr > MAX_OVR) errors.push(`${squad.id}/${player.nome}: OVR inválido para a escala revisada.`);
      if(!player.tags?.length || player.tags.some(t=>!validTags.has(t))) errors.push(`${squad.id}/${player.nome}: posição inválida.`);
      for(const name of ['ataque','meio','defesa','finalizacao','reflexo','posicionamento']) if(!Number.isFinite(player.atributos?.[name])) errors.push(`${squad.id}/${player.nome}: atributo ${name} ausente.`);
    }
  }
  return {valid:errors.length===0,errors,clubs:clubs.length,squads:allSquads.length,players:allSquads.reduce((n,s)=>n+s.jogadores.length,0)};
}
