/** Only committed fixtures are passed here; undecided stages have no opponents. */
export function renderBrazilCupBracket(s, {esc, icon, badge, btn, competitionMark}) {
  const t=s.tournament, team=id=>t.teams.find(team=>team.id===id);
  const stages={round16:'Oitavas de final',quarter:'Quartas de final',semi:'Semifinal',final:'Final'};
  const tieCard=(tie,stageId)=>{
    const games=tie.matchIds.map(id=>t.matches.find(match=>match.id===id));
    const score=id=>games.filter(game=>game.result).reduce((total,game)=>total+(game.homeId===id?game.result.homeGoals:game.result.awayGoals),0);
    const last=games.at(-1), penalties=last?.result?.penalties;
    const penaltyScore=penalties && (last.homeId===tie.teamIds[0]?penalties:[...penalties].reverse());
    return `<article class="bracket-match cup-tie ${tie.teamIds.includes(t.userTeamId)?'cup-user-tie':''}">
      <span class="cup-tie-label">${tie.bye?'Acesso à próxima fase':games.length===1?'Jogo único':'Placar agregado'}</span>
      ${tie.teamIds.map(id=>`<div class="bracket-team ${tie.winnerId===id?'winner':''}">${badge({...team(id),nome:team(id).name})}<span class="bracket-team-name">${esc(team(id).name)}</span><strong>${games.some(game=>game.result)?score(id):'—'}</strong></div>`).join('')}
      ${games.map(game=>`<div class="cup-leg"><span>${game.neutral?'Campo neutro':game.leg===1?'Ida':'Volta'}${game.neutral?'':` · ${esc(team(game.homeId).sigla || team(game.homeId).name)}`}</span><b>${game.result?`${game.result.homeGoals}–${game.result.awayGoals}`:'—'}</b></div>`).join('')}
      ${penaltyScore?`<small>Pênaltis: ${penaltyScore.join('–')}</small>`:''}
      ${tie.winnerId?`<small class="cup-qualified">${icon('check')} ${stageId==='final'?'Campeão':'Classificado'}: ${esc(team(tie.winnerId).name)}</small>`:''}
    </article>`;
  };
  return `<div class="screen-title match-page-title"><div>${competitionMark('copa-do-brasil')}<div><span class="eyebrow accent">COPA DO BRASIL</span><h1>Chaveamento</h1><p>Ida e volta até a semifinal. Final em jogo único.</p></div></div>${btn(icon('back')+' Voltar ao jogo','back-match')}</div>
    <p class="bracket-note">Avança quem marcar mais gols no agregado. Empate: pênaltis, sem prorrogação e sem vantagem de gol fora.</p>
    <div class="bracket-grid brazil-cup-bracket">${t.cupStages.map(id=>{
      const stage=t.bracket.find(stage=>stage.stage===id);
      return `<section class="bracket-stage"><h3><span>${esc(stages[id])}</span><small>${stage?stage.ties.length+' confronto'+(stage.ties.length===1?'':'s'):'A definir'}</small></h3>${stage?stage.ties.map(tie=>tieCard(tie,id)).join(''):`<div class="cup-stage-pending">${icon('bracket')}<strong>Confrontos a definir</strong><p>${id==='quarter'?'Sorteio entre os classificados das oitavas.':'Os vencedores da fase anterior avançam.'}</p></div>`}</section>`;
    }).join('')}</div>
    <p class="mode-note">Edição histórica com até 16 equipes: seu time e os clubes participantes disponíveis na base. Confrontos e mandos sorteados nas oitavas e quartas; semifinais seguem o chaveamento das quartas.</p>`;
}
