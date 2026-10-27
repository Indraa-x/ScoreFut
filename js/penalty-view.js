import {PENALTY_TARGETS,penaltyTurn} from './penalty-shootout.js?v=penalty-direction-fix-20261027';

export function renderPenaltyShootout(state,match,home,away,{esc,icon}){
  const shootout=match.result.interactiveShootout,turn=penaltyTurn(shootout,home,away);
  const busy=!!state.penaltyBusy,loading=state.penaltyAssetsReady===false,revealed=!!state.penaltyReveal,last=shootout.kicks.at(-1);
  const visibleKicks=busy&&!revealed?shootout.kicks.slice(0,-1):shootout.kicks;
  const scores=visibleKicks.reduce((score,kick)=>{if(kick.converted)score[kick.side]++;return score;},[0,0]);
  const number=busy?shootout.kicks.filter(kick=>kick.side===last.side).length:turn?.number;
  const attacking=busy&&last?(last.side?away:home).id===shootout.userTeamId:turn?.attacking;
  const finished=shootout.complete&&!busy;
  const shotTarget=last&&PENALTY_TARGETS.find(target=>target.id===last.target);
  const ballX=last?.outcome==='wide'?(shotTarget?.column==='left'?26:74):shotTarget?.column==='left'?35:65;
  const ballY=last?.outcome==='wide'?63:56.5;
  const diveX=last?.dive==='left'?40:60;
  const teamName=team=>team.ano&&team.name.endsWith(` ${team.ano}`)?team.name.slice(0,-String(team.ano).length-1):team.name;
  const marks=side=>{
    const kicks=visibleKicks.filter(kick=>kick.side===side),count=Math.max(5,kicks.length),start=Math.max(0,count-8);
    return Array.from({length:count-start},(_,i)=>{const kick=kicks[i+start];return `<span class="penalty-mark ${kick?kick.converted?'scored':'missed':'waiting'}" aria-label="Cobrança ${i+start+1}: ${kick?kick.converted?'gol':'perdida':finished?'não necessária':'a cobrar'}">${kick?(kick.converted?'✓':'×'):''}</span>`;}).join('');
  };
  const header=finished?(shootout.winnerId===shootout.userTeamId?'Você venceu nos pênaltis':'Fim da disputa'):busy&&!attacking?'Aguarde sua vez':busy?'A cobrança…':attacking?'Escolha onde bater':'Sua vez em instantes';
  const prompt=finished?'A decisão está no placar. Continue sua campanha pelo botão acima.':busy
    ?attacking?`${last.player.nome} cobra para o seu time.`:'O placar da disputa será atualizado automaticamente.'
    :attacking?`${turn.player.nome} na bola. Escolha esquerda ou direita.`:'A próxima cobrança do seu time será liberada em seguida.';
  const resultLabel=last?.outcome==='goal'?'marcou':last?.outcome==='saved'?'foi defendida':'foi para fora';
  const feedback=loading?'Preparando os jogadores…':busy?(revealed?(attacking?last.outcome==='goal'?'Gol!':last.outcome==='saved'?'Defendeu!':'Para fora!':`Adversário ${resultLabel}.`):attacking?'A cobrança…':'Atualizando o placar…'):finished?'Disputa encerrada':attacking?'':'Sua vez chega em instantes…';
  return `<section class="penalty-game ${busy?'is-resolving':''} ${busy&&revealed?'is-revealed':''} ${finished?'is-complete':''} ${last?.dive==='left'?'dive-left':'dive-right'}" aria-label="Disputa interativa de pênaltis" style="--shot-x:${ballX}%;--shot-y:${ballY}%;--dive-x:${diveX}%">
    <div class="penalty-heading"><span class="penalty-eyebrow">${icon('ball')} DECISÃO NOS PÊNALTIS</span><span class="penalty-round">Jogo ${match.result.homeGoals}–${match.result.awayGoals} · ${finished?'Encerrada':number>5?'Alternadas':`${number||5}ª cobrança`}</span></div>
    <div class="penalty-score"><div><strong>${esc(teamName(home))}</strong><div class="penalty-attempts">${marks(0)}</div></div><b aria-label="Placar dos pênaltis">${scores[0]} <i>–</i> ${scores[1]}</b><div><strong>${esc(teamName(away))}</strong><div class="penalty-attempts">${marks(1)}</div></div></div>
    <div class="penalty-instructions"><h2 tabindex="-1">${header}</h2><p>${esc(prompt)}</p></div>
    ${attacking?`<div class="penalty-stage" aria-label="Cobrança de pênalti, visão de trás do batedor">
      <div class="penalty-scene" aria-hidden="true">
      <div class="penalty-keeper" aria-hidden="true"><img class="penalty-pose-ready" src="assets/penalties/keeper-ready.png" alt="" decoding="async"><img class="penalty-pose-action" src="assets/penalties/keeper-dive.png" alt="" decoding="async"></div>
      <div class="penalty-shooter" aria-hidden="true"><img class="penalty-pose-ready" src="assets/penalties/shooter-ready.png" alt="" decoding="async"><img class="penalty-pose-action" src="assets/penalties/shooter-kick.png" alt="" decoding="async"></div>
      <div class="penalty-ball">${icon('ball')}</div>
      </div>
    </div>`:`<div class="penalty-stage penalty-auto-stage" role="status" aria-label="Sua próxima cobrança será liberada em seguida"><span class="penalty-auto-message">${finished?'Disputa encerrada':'Aguarde sua cobrança'}</span></div>`}
    <div class="penalty-feedback ${busy&&revealed?last.outcome:''}" role="status" aria-live="polite">${esc(feedback)}</div>
    ${!finished?`<div class="penalty-directions" role="group" aria-label="Escolha o lado da cobrança">${PENALTY_TARGETS.map(target=>`<button type="button" class="btn btn-primary penalty-direction penalty-direction-${target.id}" data-action="penalty-shoot" data-value="${target.id}" aria-label="Cobrar para a ${target.label.toLowerCase()}" ${loading||busy||!attacking?'disabled':''}>${target.id==='left'?icon('arrow'):''}<span>${target.label}</span>${target.id==='right'?icon('arrow'):''}</button>`).join('')}</div><p class="penalty-tip">${attacking?'Toque em um dos botões para cobrar.':'Você joga apenas as cobranças do seu time.'}</p>`:''}
  </section>`;
}
