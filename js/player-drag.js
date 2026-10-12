/** Mouse/pen dragging with a live card instead of the browser's row snapshot. */
export function initPlayerDrag({app,getPlayer,onStart,onPlace,onCancel,renderCard}) {
  let gesture=null,ignoreClickUntil=0;
  const reducedMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  const slots=()=>[...app.querySelectorAll('[data-action="slot"]')];

  function dropTarget(x,y) {
    const hit=document.elementFromPoint(x,y);
    const field=hit?.closest('.draft-pitch');
    if(!field)return {target:null,inField:false};
    const direct=hit.closest('[data-action="slot"]');
    const distance=slot=>{
      const rect=slot.querySelector('.slot-circle').getBoundingClientRect();
      return Math.hypot(x-rect.x-rect.width/2,y-rect.y-rect.height/2);
    };
    const nearest=direct||[...field.querySelectorAll('[data-action="slot"]')].sort((a,b)=>distance(a)-distance(b))[0];
    return {target:nearest&&!nearest.disabled&&nearest.classList.contains('compatible')?nearest:null,inField:true};
  }

  function positionCard(g) {
    const {width,height}=g.card.getBoundingClientRect();
    const x=Math.max(12,Math.min(innerWidth-width-12,g.x-width/2));
    const y=Math.max(12,Math.min(innerHeight-height-12,g.y-height/2));
    g.card.style.transform=`translate3d(${x}px,${y}px,0)`;
    const {target,inField}=dropTarget(g.x,g.y);
    slots().forEach(slot=>slot.classList.toggle('drop-target',slot===target));
    g.card.classList.toggle('over-slot',!!target);
    g.card.classList.toggle('invalid-slot',inField&&!target);
    g.card.querySelector('.drag-card-feedback').textContent=target?(target.dataset.lineupPlayer?'Trocar em ':'Soltar em ')+target.dataset.slotLabel:inField?'Posição indisponível':'Leve até o campo';
  }

  function activate(g) {
    if(g!==gesture||g.active)return;
    const player=getPlayer(g.id);
    if(!player||!onStart(g.id)){finish(false);return;}
    g.active=true;
    clearTimeout(g.holdTimer);
    g.source.classList.add('dragging');
    g.source.closest('.player-row')?.classList.add('drag-origin');
    document.body.classList.add('player-dragging');
    g.card=document.createElement('div');
    g.card.className='player-drag';
    g.card.setAttribute('aria-hidden','true');
    g.card.innerHTML=renderCard(player);
    const portrait=g.card.querySelector('[data-player-portrait]');
    if(portrait){
      const show=()=>{portrait.parentElement.classList.add('photo-ready');};
      const fallback=()=>{portrait.hidden=true;portrait.parentElement.classList.remove('photo-ready');};
      portrait.addEventListener('load',show,{once:true});
      portrait.addEventListener('error',fallback,{once:true});
      if(portrait.complete){if(portrait.naturalWidth)show();else fallback();}
    }
    document.body.append(g.card);
    positionCard(g);
    if(!reducedMotion())g.card.firstElementChild.animate(
      [{opacity:0,transform:'scale(.94) translateY(5px)'},{opacity:1,transform:'scale(1) translateY(0)'}],
      {duration:180,easing:'cubic-bezier(.2,.7,.3,1)'}
    );
  }

  function animateAway(card,destination,placed) {
    if(reducedMotion()){card.remove();return;}
    const rect=card.getBoundingClientRect();
    const scale=placed&&destination?Math.min(destination.width/rect.width,destination.height/rect.height):.94;
    const end=destination?`translate3d(${destination.x+destination.width/2-rect.width/2}px,${destination.y+destination.height/2-rect.height/2}px,0) scale(${scale})`:card.style.transform+' scale(.94)';
    const frames=[{transform:card.style.transform,opacity:1}];
    if(placed)frames.push({transform:end,opacity:.95,offset:.78});
    frames.push({transform:end,opacity:0});
    card.animate(
      frames,
      {duration:placed?300:160,easing:'cubic-bezier(.2,.7,.3,1)',fill:'forwards'}
    ).finished.then(()=>card.remove()).catch(()=>card.remove());
  }

  function finish(place,event) {
    const g=gesture;if(!g)return;
    if(place&&g.active){g.x=event.clientX;g.y=event.clientY;positionCard(g);}
    gesture=null;clearTimeout(g.holdTimer);cancelAnimationFrame(g.frame);
    if(g.source.hasPointerCapture?.(g.pointerId))g.source.releasePointerCapture(g.pointerId);
    if(!g.active)return;
    ignoreClickUntil=performance.now()+250;
    const {target}=place?dropTarget(event.clientX,event.clientY):{target:null};
    const slotId=target?.dataset.value;
    g.source.classList.remove('dragging');
    g.source.closest('.player-row')?.classList.remove('drag-origin');
    document.body.classList.remove('player-dragging');
    slots().forEach(slot=>slot.classList.remove('drop-target'));
    const placed=!!target&&onPlace(g.id,slotId);
    if(!placed)onCancel();
    const destination=placed?slots().find(slot=>slot.dataset.value===slotId)?.querySelector('.slot-circle'):g.source.isConnected?g.source:null;
    animateAway(g.card,destination?.getBoundingClientRect(),placed);
    if(placed&&destination&&!reducedMotion())destination.animate(
      [{transform:'scale(.88)',opacity:.2},{transform:'scale(1.04)',opacity:1,offset:.75},{transform:'scale(1)',opacity:1}],
      {duration:220,delay:170,easing:'cubic-bezier(.2,.7,.3,1)',fill:'backwards'}
    );
  }

  app.addEventListener('pointerdown',event=>{
    if(event.button!==0||event.isPrimary===false||event.pointerType==='touch')return;
    const source=event.target.closest('[data-action="player"],[data-lineup-player]');
    const id=source?.dataset.lineupPlayer||source?.dataset.value;
    if(!source||source.disabled||!getPlayer(id))return;
    finish(false);
    const g=gesture={id,source,pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,x:event.clientX,y:event.clientY,active:false};
    try{source.setPointerCapture(event.pointerId);}catch{/* Document listeners still finish the gesture if capture is unavailable. */}
    source.focus({preventScroll:true});
    g.holdTimer=setTimeout(()=>activate(g),140);
  });
  document.addEventListener('pointermove',event=>{
    const g=gesture;if(!g||event.pointerId!==g.pointerId)return;
    g.x=event.clientX;g.y=event.clientY;
    if(!g.active&&Math.hypot(g.x-g.startX,g.y-g.startY)>=5)activate(g);
    if(!g.active)return;
    event.preventDefault();
    cancelAnimationFrame(g.frame);
    g.frame=requestAnimationFrame(()=>{if(gesture===g)positionCard(g);});
  },{passive:false});
  document.addEventListener('pointerup',event=>{
    if(gesture&&event.pointerId===gesture.pointerId)finish(true,event);
  });
  document.addEventListener('pointercancel',event=>{
    if(gesture&&event.pointerId===gesture.pointerId)finish(false);
  });
  app.addEventListener('lostpointercapture',event=>{
    if(gesture&&event.pointerId===gesture.pointerId)finish(false);
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&gesture){event.preventDefault();finish(false);}
  });
  document.addEventListener('click',event=>{
    if(event.detail&&performance.now()<ignoreClickUntil){event.preventDefault();event.stopImmediatePropagation();ignoreClickUntil=0;}
  },true);
  app.addEventListener('dragstart',event=>{
    if(event.target.closest('[data-action="player"],[data-lineup-player]'))event.preventDefault();
  });
  window.addEventListener('blur',()=>finish(false));
  window.addEventListener('resize',()=>finish(false));
  return {cancel:()=>finish(false)};
}
