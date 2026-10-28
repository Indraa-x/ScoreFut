const keyFor=(state,match)=>`${state.tournament?.seed}:${match.id}`;
export const penaltyEvents=result=>(result.events||[]).filter(event=>event.type==='penalty'&&event.shootout);
export const penaltyInterval=speed=>speed===8?650:1800;

export function penaltyProgress(state,match){
  const events=penaltyEvents(match.result),replay=state.penaltyReplay;
  const clockEnded=state.matchMinute>=match.result.duration;
  const active=!!match.result.penalties&&replay?.key===keyFor(state,match);
  const revealed=clockEnded?(active?Math.min(events.length,Math.max(0,Math.floor(Number(replay.revealed)||0))):events.length):0;
  const visible=events.slice(0,revealed),scores=[0,0];
  for(const event of visible)if(event.converted)scores[event.team==='away'?1:0]++;
  if(clockEnded&&!events.length&&match.result.penalties)scores.splice(0,2,...match.result.penalties);
  return {events,visible,scores,revealed,playing:clockEnded&&active&&revealed<events.length};
}

export function matchHasEnded(state,match){
  return state.matchMinute>=match.result.duration&&!penaltyProgress(state,match).playing;
}

/** Only reveal the already simulated kicks; never change the winner or consume RNG. */
export function beginPenaltyReplay(state,match){
  if(!match.result.penalties||!penaltyEvents(match.result).length)return false;
  const key=keyFor(state,match);
  if(state.penaltyReplay?.key!==key)state.penaltyReplay={key,revealed:0,elapsedMs:0};
  return penaltyProgress(state,match).playing;
}

export function advancePenaltyReplay(state,match,milliseconds){
  if(!penaltyProgress(state,match).playing)return;
  const replay=state.penaltyReplay;
  // A suspended tab must not reveal a burst of kicks when it becomes visible again.
  replay.elapsedMs=Math.max(0,Number(replay.elapsedMs)||0)+Math.min(250,Math.max(0,Number(milliseconds)||0));
  if(replay.elapsedMs>=penaltyInterval(state.matchSpeed)){
    replay.revealed++;
    replay.elapsedMs=0;
  }
}

export function renderPenaltyMarks(state,match,names,esc){
  const progress=penaltyProgress(state,match),last=progress.visible.at(-1);
  const next=progress.playing?progress.events[progress.revealed]:null;
  return '<span class="shootout-title">Pênaltis</span>'+['home','away'].map((side,index)=>{
    const kicks=progress.visible.filter(event=>event.team===side),count=Math.max(5,kicks.length);
    const marks=Array.from({length:count},(_,i)=>{
      const event=kicks[i],latest=event&&event===last;
      const waiting=!event&&progress.playing,nextKick=next?.team===side&&i===kicks.length;
      const label=event?(event.converted?'acertou':'errou'):waiting?'aguardando':'não cobrada';
      return `<span class="shootout-dot ${event?event.converted?'scored':'missed':'waiting'}${latest?' is-latest':''}${nextKick?' is-next':''}" aria-label="${esc(names[side])}, ${i+1}ª cobrança: ${label}">${event?(event.converted?'✓':'×'):''}</span>`;
    }).join('');
    return `<div class="shootout-team ${side}" aria-label="${progress.scores[index]} gols nos pênaltis"><div class="shootout-dots" aria-label="Cobranças de ${esc(names[side])}">${marks}</div></div>`;
  }).join('');
}
