/** Mouse/pen dragging uses the field's circular club/OVR marker. */
export function dragPreviewScale(distance,sourceSize,targetSize=sourceSize) {
  const close=targetSize*.55,far=Math.max(120,targetSize*2.4);
  const progress=Math.max(0,Math.min(1,(distance-close)/(far-close)));
  const eased=progress*progress*(3-2*progress);
  const fitted=targetSize/sourceSize;
  return fitted+(1.6-fitted)*eased;
}

export function initPlayerDrag({app,getPlayer,onStart,onPlace,onCancel,renderPreview}) {
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

  function positionPreview(g) {
    const {target,inField}=dropTarget(g.x,g.y);
    const compatible=slots().filter(slot=>!slot.disabled&&slot.classList.contains('compatible'));
    const nearby=compatible.map(slot=>{
      const rect=slot.querySelector('.slot-circle').getBoundingClientRect();
      return {rect,distance:Math.hypot(g.x-rect.x-rect.width/2,g.y-rect.y-rect.height/2)};
    }).sort((a,b)=>a.distance-b.distance)[0];
    const scale=dragPreviewScale(nearby?.distance??Infinity,g.size,nearby?.rect.width??g.size);
    const width=g.size*scale,height=width;
    const x=Math.max(8,Math.min(innerWidth-width-8,g.x-g.grabX*scale));
    const y=Math.max(8,Math.min(innerHeight-height-8,g.y-g.grabY*scale));
    g.card.style.transform=`translate3d(${x+(width-g.size)/2}px,${y+(height-g.size)/2}px,0) scale(${scale})`;
    slots().forEach(slot=>slot.classList.toggle('drop-target',slot===target));
    g.card.classList.toggle('over-slot',!!target);
    g.card.classList.toggle('invalid-slot',inField&&!target);
    g.card.querySelector('.drag-feedback').textContent=target?(target.dataset.lineupPlayer?'Trocar em ':'Soltar em ')+target.dataset.slotLabel:inField?'Posição indisponível':'Leve até o campo';
  }

  function activate(g) {
    if(g!==gesture||g.active)return;
    const player=getPlayer(g.id);
    if(!player||!onStart(g.id)){finish(false);return;}
    const originCircle=g.source.querySelector('.slot-circle');
    const circle=originCircle||slots().find(slot=>slot.classList.contains('compatible'))?.querySelector('.slot-circle');
    const rect=circle?.getBoundingClientRect(),size=rect?.width||58;
    g.size=size;
    const grabbedCircle=originCircle&&g.startX>=rect.left&&g.startX<=rect.right&&g.startY>=rect.top&&g.startY<=rect.bottom;
    g.grabX=grabbedCircle?g.startX-rect.left:size/2;
    g.grabY=grabbedCircle?g.startY-rect.top:size/2;
    g.active=true;
    clearTimeout(g.holdTimer);
    g.source.classList.add('dragging');
    g.source.closest('.player-row')?.classList.add('drag-origin');
    document.body.classList.add('player-dragging');
    g.card=document.createElement('div');
    g.card.className='player-drag';
    g.card.style.setProperty('--drag-circle-size',`${size}px`);
    g.card.style.setProperty('--drag-ovr-size',circle?getComputedStyle(circle).fontSize:'18px');
    g.card.setAttribute('aria-hidden','true');
    g.card.innerHTML=renderPreview(player);
    document.body.append(g.card);
    positionPreview(g);
    if(!reducedMotion())g.card.firstElementChild.animate(
      [{opacity:0,transform:'scale(.94) translateY(5px)'},{opacity:1,transform:'scale(1) translateY(0)'}],
      {duration:180,easing:'cubic-bezier(.2,.7,.3,1)'}
    );
  }

  function animateAway(card,destination,placed) {
    if(reducedMotion()){card.remove();return;}
    const size=parseFloat(getComputedStyle(card).width);
    const scale=placed&&destination?Math.min(destination.width/size,destination.height/size):.94;
    const end=destination?`translate3d(${destination.x+destination.width/2-size/2}px,${destination.y+destination.height/2-size/2}px,0) scale(${scale})`:card.style.transform+' scale(.94)';
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
    if(place&&g.active){g.x=event.clientX;g.y=event.clientY;positionPreview(g);}
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
    const destination=placed?slots().find(slot=>slot.dataset.value===slotId)?.querySelector('.slot-circle')
      :slots().find(slot=>slot.dataset.lineupPlayer===g.id)?.querySelector('.slot-circle')
        ||(g.source.isConnected?g.source.querySelector('.player-avatar')||g.source:null);
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
    g.frame=requestAnimationFrame(()=>{if(gesture===g)positionPreview(g);});
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
