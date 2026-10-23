const TROPHIES={euro:'assets/competitions/euro-trophy.png',champions:'assets/competitions/champions-trophy.png','copa-do-brasil':'assets/competitions/brazil-cup-trophy.png'};
const COLORS=['#f6bc24','#ee4663','#3388f5','#1cb879','#ad5ce5','#18bdce','#ff8b35'];

export function championDecoration(record){
  if(!record.champion)return '';
  const trophy=TROPHIES[record.mode];
  return trophy?`<img class="champion-trophy" src="${trophy}" alt="Troféu ${record.mode==='euro'?'da Euro':record.mode==='champions'?'da Champions League':'da Copa do Brasil'}" decoding="async">`:'';
}
export function championConfetti(){
  return `<div class="confetti champion-confetti" aria-hidden="true">${Array.from({length:132},(_,i)=>`<i style="--x:${(i*37.7)%100}%;--delay:${(i%22)*.12}s;--duration:${4+(i%5)*.35}s;--drift:${(i%13-6)*12}px;--spin:${540+(i%6)*90}deg;--c:${COLORS[i%COLORS.length]};--w:${5+i%5}px;--h:${9+i%8}px;--round:${i%6===0?'50%':'1px'}"></i>`).join('')}</div>`;
}

const CROWD_AUDIO='assets/audio/champion-crowd.mp3';

/** Real field-recorded crowd, stored locally; attribution in assets/audio/sources.json. */
export function initCelebration({app,getRecord,getScreen}){
  let context=null, recording=null, enabled=true, activeKey=null, generation=0, sources=[];
  function stop(){generation++;for(const source of sources){try{source.stop();}catch{}}sources=[];}
  function audio(){
    const Audio=window.AudioContext||window.webkitAudioContext;
    if(!Audio)return null;
    if(!context)context=new Audio();
    return context;
  }
  function loadRecording(ctx){
    if(!recording)recording=fetch(CROWD_AUDIO).then(response=>{
      if(!response.ok)throw new Error('Crowd recording unavailable');
      return response.arrayBuffer();
    }).then(bytes=>ctx.decodeAudioData(bytes)).catch(error=>{recording=null;throw error;});
    return recording;
  }
  function button(){
    const control=app.querySelector('[data-action="celebration-sound"]');
    if(control){control.textContent=enabled?'♫ Som ligado':'♫ Som desligado';control.setAttribute('aria-pressed',String(enabled));control.setAttribute('aria-label',enabled?'Desligar som de comemoração':'Ligar som de comemoração');}
  }
  async function play(){
    stop();const token=generation;
    if(!enabled)return;
    try{
      const ctx=audio();if(!ctx)return;
      await ctx.resume();
      if(token!==generation||!enabled||getScreen()!=='result'||!getRecord()?.champion)return;
      const buffer=await loadRecording(ctx);
      if(token!==generation||!enabled||getScreen()!=='result'||!getRecord()?.champion)return;
      const start=ctx.currentTime+.04;
      const duration=Math.min(12,buffer.duration), crowd=ctx.createBufferSource(), gain=ctx.createGain();
      crowd.buffer=buffer;
      gain.gain.setValueAtTime(0,start);
      gain.gain.linearRampToValueAtTime(.025,start+.15);
      gain.gain.setValueAtTime(.025,start+Math.max(.15,duration-1.8));
      gain.gain.linearRampToValueAtTime(0,start+duration);
      crowd.connect(gain);gain.connect(ctx.destination);
      crowd.onended=()=>{sources=sources.filter(source=>source!==crowd);crowd.disconnect();gain.disconnect();};
      sources.push(crowd);crowd.start(start,0,duration);
    }catch{/* An unavailable or blocked audio device must not interrupt the game. */}
  }
  function attach(){
    const record=getRecord(), key=getScreen()==='result'&&record?.champion?record.id:null;
    const hero=app.querySelector('.result-hero');
    if(hero)hero.style.setProperty('--confetti-fall',`${hero.clientHeight+40}px`);
    button();
    if(key===activeKey)return;
    activeKey=key;stop();
    if(key)void play();
  }
  // Unlock the audio device in a real interaction, before the final-result render.
  const unlock=()=>{if(enabled){try{const ctx=audio();if(ctx){void ctx.resume().catch(()=>{});void loadRecording(ctx).catch(()=>{});}}catch{}}};
  document.addEventListener('pointerdown',unlock,{capture:true});
  document.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' ')unlock();},{capture:true});
  app.addEventListener('click',event=>{
    if(!event.target.closest('[data-action="celebration-sound"]'))return;
    enabled=!enabled;button();if(enabled)void play();else stop();
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  return {attach};
}
