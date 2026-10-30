import {competitionName,competitionLogo} from '../data/competitions.js?v=leverkusen-20261029';
import {WORLD_CUP_PENDING_PAIRS} from './world-cup.js?v=world-cup-20261026';
import {hashSeed} from './engine.js?v=set-piece-goals-20261030';
const STAGES=[['round16','Oitavas de final',8],['quarter','Quartas de final',4],['semi','Semifinal',2],['final','Final',1]];
const shortName=team=>team?.ano && team.name.endsWith(` ${team.ano}`)?team.name.slice(0,-String(team.ano).length-1):team?.name || 'A definir';
const signed=value=>value>0?`+${value}`:String(value);
const teamFor=(t,id)=>t.teams.find(team=>team.id===id);

/** This view deliberately reads the committed tournament, never pendingRound. */
export function championsGroup(t,id) {
  const groups=t.groups || [];
  const group=groups.find(group=>group.id===id) || groups.find(group=>group.teamIds.includes(t.userTeamId)) || groups[0];
  if(!group)return null;
  const fixtures=t.matches.filter(match=>match.groupId===group.id && match.stage==='group');
  const complete=fixtures.length>0 && fixtures.every(match=>match.result);
  return {...group,complete,rounds:new Set(fixtures.map(match=>match.round)).size,
    standings:group.standings.map(row=>({...row,form:fixtures.filter(match=>match.result && [match.homeId,match.awayId].includes(row.teamId))
      .sort((a,b)=>a.round-b.round).slice(-5).map(match=>{
        const home=match.homeId===row.teamId,goals=home?match.result.homeGoals:match.result.awayGoals,against=home?match.result.awayGoals:match.result.homeGoals;
        return {outcome:goals>against?'V':goals===against?'E':'D',goals,against,opponent:shortName(teamFor(t,home?match.awayId:match.homeId))};
      })}))};
}

export function championsBracket(t) {
  const nodes=[];
  for(const [stage,label,size] of STAGES) {
    const stored=t.bracket.find(item=>item.stage===stage);
    const ties=stored?.ties || stored?.matches?.map(match=>({id:match.id,teamIds:[match.homeId,match.awayId],matchIds:[match.id],winnerId:match.result?.winnerId})) || [];
    const previous=nodes.at(-1);
    const round=Array.from({length:size},(_,index)=>{
      const tie=ties[index],games=(tie?.matchIds || []).map(id=>t.matches.find(match=>match.id===id)).filter(Boolean);
      let entries;
      if(tie)entries=tie.teamIds.map(id=>({id}));
      else if(previous)entries=[index*2,index*2+1].map(i=>previous[i]?.winnerId?{id:previous[i].winnerId}:{label:`Vencedor ${previous[i]?.code || 'a definir'}`});
      else if(t.mode==='world-cup')entries=WORLD_CUP_PENDING_PAIRS[index].map(label=>({label}));
      else {
        const pair=index%4*2,half=index<4?0:1,a=t.groups?.[pair]?.id || String.fromCharCode(65+pair),b=t.groups?.[pair+1]?.id || String.fromCharCode(66+pair);
        entries=[{label:`2º Grupo ${half?a:b}`},{label:`1º Grupo ${half?b:a}`}];
      }
      const played=games.filter(game=>game.result),last=games.at(-1),penalties=last?.result?.penalties;
      return {id:tie?.id || `${stage}-pending-${index+1}`,stage,label,index,code:`${stage==='round16'?'O':stage==='quarter'?'Q':stage==='semi'?'S':'F'}${index+1}`,
        entries,games,known:!!tie,winnerId:tie?.winnerId || null,
        scores:entries.map(entry=>played.length?played.reduce((total,game)=>total+(entry.id===game.homeId?game.result.homeGoals:game.result.awayGoals),0):null),
        penalties:penalties && (last.homeId===entries[0]?.id?penalties:[...penalties].reverse())};
    });
    nodes.push(round);
  }
  return nodes;
}

function groupTable(t,group,{esc,badge},compact=false) {
  const columns=compact?'<th scope="col"><abbr title="Jogos">J</abbr></th><th scope="col"><abbr title="Saldo de gols">SG</abbr></th><th scope="col"><abbr title="Pontos">PTS</abbr></th>':'<th scope="col"><abbr title="Jogos">J</abbr></th><th scope="col"><abbr title="Vitórias">V</abbr></th><th scope="col"><abbr title="Empates">E</abbr></th><th scope="col"><abbr title="Derrotas">D</abbr></th><th scope="col"><abbr title="Gols marcados e sofridos">+/−</abbr></th><th scope="col"><abbr title="Saldo de gols">SG</abbr></th><th scope="col"><abbr title="Pontos">P</abbr></th><th scope="col">Forma</th>';
  return `<table class="champions-table${compact?' compact':''}"><caption class="sr-only">Classificação do ${esc(group.name)}${group.complete?' · final':''}</caption><thead><tr><th scope="col">#</th><th scope="col">Time</th>${columns}</tr></thead><tbody>${group.standings.map((row,index)=>{
    const team=teamFor(t,row.teamId),user=row.teamId===t.userTeamId;
    const form=row.form.length?row.form.map((game,i)=>`<span class="champions-form ${game.outcome==='V'?'win':game.outcome==='E'?'draw':'loss'}${i===row.form.length-1?' latest':''}" title="${esc(`${game.outcome==='V'?'Vitória':game.outcome==='E'?'Empate':'Derrota'}: ${game.goals}–${game.against} contra ${game.opponent}`)}">${game.outcome}</span>`).join(''):'<span class="champions-form-empty" aria-label="Ainda sem jogos">—</span>';
    return `<tr class="${user?'is-user ':''}${(row.qualified||!group.complete&&index<2)?'qualification-zone':''}" data-team-id="${esc(row.teamId)}"><td class="position">${compact?`<span class="champions-rank">${index+1}</span>`:index+1}</td><th scope="row"><span class="champions-team-name">${badge(team)}<span><b>${esc(shortName(team))}</b><small>${user?'Seu time':compact&&team?.ano?'Temporada '+esc(team.ano):esc(team?.ano || '')}</small></span></span></th><td>${row.played}</td>${compact?'':`<td>${row.wins}</td><td>${row.draws}</td><td>${row.losses}</td><td class="goals-total">${row.goalsFor}–${row.goalsAgainst}</td>`}<td>${signed(row.goalDifference)}</td><td class="points">${row.points}</td>${compact?'':`<td><span class="champions-form-list" aria-label="Últimos resultados">${form}</span></td>`}</tr>`;
  }).join('')}</tbody></table>`;
}

function renderTie(t,node,{esc,badge},mobile=false) {
  const entryName=entry=>entry.id?shortName(teamFor(t,entry.id)):entry.label;
  const names=node.entries.map(entryName),hasUser=node.entries.some(entry=>entry.id===t.userTeamId);
  return `<button class="champions-tie${hasUser?' user-tie':''}${node.winnerId?' resolved':''}${!node.known?' pending':''}" ${node.known?`data-action="champions-tie" data-value="${esc(node.id)}"`:'disabled'} aria-label="${esc(`${node.label}: ${names.join(' contra ')}${node.scores[0]!==null?`, placar ${node.scores.join(' a ')}`:', a definir'}`)}"><span class="champions-tie-code">${node.code}</span><span class="champions-tie-teams">${node.entries.map((entry,index)=>{
    const team=entry.id?teamFor(t,entry.id):null,name=entryName(entry),abbr=team?.monograma || name;
    return `<span class="champions-tie-team${node.winnerId===entry.id?' winner':node.winnerId?' eliminated':''}">${team?badge(team):'<span class="champions-unknown">?</span>'}<span class="tree-team-label"><b class="tree-abbr" title="${esc(name)}">${esc(abbr)}</b><b class="tree-full-name">${esc(name)}</b><small>${team?team.id===t.userTeamId?'Seu time':esc(team.ano || ''):''}</small></span><strong>${node.scores[index]??'—'}</strong></span>`;
  }).join('')}</span><span class="champions-tie-note">${node.penalties?`Pên. ${node.penalties.join('–')}`:(t.mode==='world-cup'||node.stage==='final')?'Jogo único':node.known&&node.games.some(game=>game.result)?'Placar agregado':node.known?'Ida e volta':'A definir'}</span></button>`;
}

export function renderChampionsSidebar(t,helpers) {
  if(!['champions','world-cup'].includes(t.mode))return '';
  const {esc,icon}=helpers,group=championsGroup(t);
  if(!group||group.complete)return '';
  return `<section class="champions-sidebar panel champions-sidebar-group" aria-label="Seu grupo na ${esc(competitionName(t.mode))}"><div class="calendar-heading"><div>${icon('trophy')}<h2>Seu grupo</h2></div><span>${esc(group.name)}</span></div>${groupTable(t,group,helpers,true)}</section>`;
}


function renderGroups(s,helpers) {
  const t=s.tournament,{esc}=helpers,group=championsGroup(t,s.championsGroupId),userGroup=t.groups.find(group=>group.teamIds.includes(t.userTeamId));
  if(!group)return '<p class="champions-note">Esta edição não tem fase de grupos.</p>';
  const own=group.standings.find(row=>row.teamId===t.userTeamId),round=Math.min(t.progressRound,group.rounds);
  return `<div class="champions-group-picker" role="group" aria-label="Escolher grupo">${t.groups.map(item=>`<button data-action="champions-group" data-value="${esc(item.id)}" aria-pressed="${item.id===group.id}">Grupo ${esc(item.id)}${item.id===userGroup?.id?'<i title="Seu grupo"></i>':''}</button>`).join('')}</div><section class="champions-group-panel panel"><div class="champions-group-heading"><div><span class="eyebrow accent">FASE DE GRUPOS</span><h2>${esc(group.name)}${own?'<span>Seu grupo</span>':''}</h2></div><p>${group.complete?'Classificação final':`Rodada ${round} de ${group.rounds}`}<small>${own?`${group.standings.indexOf(own)+1}º lugar · ${own.points} pontos`:'Os dois primeiros avançam'}</small></p></div><div class="champions-table-scroll" tabindex="0" role="region" aria-label="Tabela completa do ${esc(group.name)}">${groupTable(t,group,helpers)}</div><div class="champions-group-legend"><span><i></i>${group.complete?'Classificados para as oitavas':'Zona de classificação'}</span><span class="form-legend"><b class="champions-form win">V</b> Vitória <b class="champions-form draw">E</b> Empate <b class="champions-form loss">D</b> Derrota</span></div></section><p class="champions-note">${t.mode==='world-cup'?'Os dois primeiros de cada grupo avançam. Desempate por pontos, saldo de gols, gols marcados, confronto direto e disciplina; um empate completo usa sorteio reproduzível.':'Classificação atualizada ao fim de cada rodada. Desempate por pontos, saldo de gols e gols marcados.'}</p>`;
}

function renderKnockout(s,helpers) {
  const t=s.tournament,{esc,icon,badge}=helpers,rounds=championsBracket(t);
  const currentStage=t.campaign?.eliminated?t.campaign.stage:t.bracket.at(-1)?.stage || t.campaign?.stage;
  const requested=STAGES.findIndex(([id])=>id===s.championsRound),active=requested>=0?requested:Math.max(0,STAGES.findIndex(([id])=>id===currentStage));
  const champion=t.championId?teamFor(t,t.championId):null;
  const paths=[];
  for(const side of ['left','right']) {
    const xs=side==='left'?[100,300,500,700]:[1300,1100,900,700];
    const ys=[[70,210,350,490],[140,420],[280],[280]];
    for(let col=0;col<3;col++)for(let i=0;i<ys[col].length;i++)paths.push(`<path d="M${xs[col]} ${ys[col][i]} H${(xs[col]+xs[col+1])/2} V${ys[col+1][Math.floor(i/2)]} H${xs[col+1]}"/>`);
  }
  const column=(round,side)=>{
    const nodes=side==='left'?round.slice(0,round.length/2):round.slice(round.length/2);
    return `<div class="champions-tree-column stage-${round[0].stage} ${side}">${nodes.map(node=>renderTie(t,node,helpers)).join('')}</div>`;
  };
  return `<section class="champions-knockout-panel panel"><div class="champions-knockout-heading"><div><span class="eyebrow accent">CAMINHO ATÉ A TAÇA</span><h2>O mata-mata</h2></div><span>${icon('bracket')} ${t.mode==='world-cup'?'Jogo único · Prorrogação e pênaltis':'Ida e volta · Final única'}</span></div>${!t.bracket.length?'<p class="champions-bracket-pending">Os confrontos serão definidos ao fim da fase de grupos.</p>':''}<div class="champions-desktop-bracket"><div class="champions-round-headings"><span>Oitavas de final</span><span>Quartas de final</span><span>Semifinal</span><span>Final</span><span>Semifinal</span><span>Quartas de final</span><span>Oitavas de final</span></div><div class="champions-tree"><svg class="champions-tree-lines" viewBox="0 0 1400 560" preserveAspectRatio="none" fill="none" aria-hidden="true">${paths.join('')}</svg>${column(rounds[0],'left')}${column(rounds[1],'left')}${column(rounds[2],'left')}<div class="champions-tree-center"><div class="champions-tree-trophy"><img src="${t.mode==='world-cup'?'assets/competitions/world-cup-trophy.png':'assets/competitions/champions-trophy.png'}" alt="" width="80" height="100">${champion?`${badge(champion)}<strong>${esc(shortName(champion))}</strong><span>CAMPEÃO</span>`:`<strong>${esc(competitionName(t.mode))}</strong><span>O CAMINHO ATÉ A GLÓRIA</span>`}</div>${renderTie(t,rounds[3][0],helpers)}<span class="champions-final-tag">FINAL</span></div>${column(rounds[2],'right')}${column(rounds[1],'right')}${column(rounds[0],'right')}</div></div><div class="champions-mobile-bracket"><div class="champions-round-picker" role="group" aria-label="Escolher fase do mata-mata">${STAGES.map(([id,label],index)=>`<button data-action="champions-round" data-value="${id}" aria-pressed="${index===active}">${esc(label.replace(' de final',''))}</button>`).join('')}</div>${champion?`<div class="champions-mobile-winner">${icon('trophy')}${badge(champion)}<span><b>${esc(shortName(champion))}</b><small>Campeão · ${esc(competitionName(t.mode))}</small></span></div>`:''}<div class="champions-mobile-stage" aria-label="${STAGES[active][1]}">${rounds[active].map(node=>renderTie(t,node,helpers,true)).join('')}</div></div><p class="champions-knockout-legend"><i></i>Seu time <span>${t.mode==='world-cup'?'Clique em um confronto para ver a partida.':'Placar agregado · Clique em um confronto para ver ida e volta.'}</span></p></section>`;
}

export function renderChampionsCompetition(s,helpers) {
  const {icon,btn,esc}=helpers,t=s.tournament,view=s.championsView || (t.bracket.length?'knockout':'groups');
  return `<div class="champions-competition"><div class="screen-title champions-page-title"><div><img src="${competitionLogo(t.mode)}" class="competition-logo" width="48" height="48" alt=""><div><span class="eyebrow accent">${esc(competitionName(t.mode).toUpperCase())}</span><h1>A competição</h1><p>Seu grupo. Cada confronto. O caminho até a final.</p></div></div>${btn(icon('back')+' Voltar ao jogo','back-match')}</div><nav class="champions-phase-picker" aria-label="Fases da ${esc(competitionName(t.mode))}"><button data-action="champions-view" data-value="groups" aria-pressed="${view==='groups'}">${icon('calendar')}Classificação</button><button data-action="champions-view" data-value="knockout" aria-pressed="${view==='knockout'}">${icon('bracket')}Mata-mata</button></nav><div id="champions-content">${view==='knockout'?renderKnockout(s,helpers):renderGroups(s,helpers)}</div></div>`;
}

export function renderChampionsTieDetails(t,id,{esc,icon,badge}) {
  const node=championsBracket(t).flat().find(node=>node.id===id && node.known);
  if(!node)return '';
  return `<div class="champions-tie-dialog"><div class="modal-head"><div><span class="eyebrow accent">${esc(competitionName(t.mode).toUpperCase())}</span><h2 id="modal-title">${node.label}</h2></div><button class="icon-button" data-action="close-modal" aria-label="Fechar">${icon('close')}</button></div><p class="champions-detail-label">${(t.mode==='world-cup'||node.stage==='final')?'Jogo único':'Placar agregado'}</p><div class="champions-detail-score">${node.entries.map((entry,index)=>{const team=teamFor(t,entry.id);return `<div class="${node.winnerId===entry.id?'winner':''}">${badge(team)}<strong>${esc(shortName(team))}</strong><small>${team.id===t.userTeamId?'Seu time':esc(team.ano || '')}</small><b>${node.scores[index]??'—'}</b></div>`;}).join('')}</div>${node.games.map(game=>`<div class="champions-detail-leg"><div><strong>${game.neutral?'Jogo único':game.leg===2?'Volta ·':'Ida ·'} ${game.neutral?'Campo neutro':esc(shortName(teamFor(t,game.homeId)))}</strong><span>${esc(shortName(teamFor(t,game.homeId)))} × ${esc(shortName(teamFor(t,game.awayId)))}</span></div><b>${game.result?`${game.result.homeGoals} – ${game.result.awayGoals}`:'A disputar'}</b></div>`).join('')}${node.penalties?`<p class="champions-detail-penalties">Pênaltis <b>${node.penalties.join(' – ')}</b></p>`:''}<p class="champions-detail-outcome">${node.winnerId?`${icon('check')}${node.stage==='final'?'Campeão':'Classificado'}: <b>${esc(shortName(teamFor(t,node.winnerId)))}</b>`:'Confronto em aberto'}</p></div>`;
}
