const TROPHIES={'world-cup':'assets/competitions/world-cup-trophy.png',champions:'assets/competitions/champions-trophy.png','copa-do-brasil':'assets/competitions/brazil-cup-trophy.png'};
const COLORS=['#f6bc24','#ee4663','#3388f5','#1cb879','#ad5ce5','#18bdce','#ff8b35'];

export function championDecoration(record){
  if(!record.champion)return '';
  const trophy=TROPHIES[record.mode];
  return trophy?`<img class="champion-trophy" src="${trophy}" alt="Troféu ${record.mode==='world-cup'?'da Copa do Mundo':record.mode==='champions'?'da Champions League':'da Copa do Brasil'}" decoding="async">`:'';
}
export function championConfetti(){
  return `<div class="confetti champion-confetti" aria-hidden="true">${Array.from({length:132},(_,i)=>`<i style="--x:${(i*37.7)%100}%;--delay:${(i%22)*.12}s;--duration:${4+(i%5)*.35}s;--drift:${(i%13-6)*12}px;--spin:${540+(i%6)*90}deg;--c:${COLORS[i%COLORS.length]};--w:${5+i%5}px;--h:${9+i%8}px;--round:${i%6===0?'50%':'1px'}"></i>`).join('')}</div>`;
}

/** Keep the confetti sized to the result card; celebrations are silent. */
export function initCelebration({app}){
  return {attach(){
    const hero=app.querySelector('.result-hero');
    if(hero)hero.style.setProperty('--confetti-fall',`${hero.clientHeight+40}px`);
  }};
}
