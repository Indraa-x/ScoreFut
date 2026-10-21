/** Explain an exhausted skip with local feedback, without starting another draw. */
export function initSkipFeedback({app,getDraft}) {
  app.addEventListener('click',event=>{
    const button=event.target.closest('[data-action="reroll-club"],[data-action="reroll-season"]');
    const draft=getDraft();
    if(!button||button.disabled||!draft||draft.rerolls>0)return;
    event.preventDefault();
    event.stopPropagation();

    // Restart only this feedback when the user taps again.
    for(const animation of button.getAnimations())if(animation.id==='skip-exhausted')animation.cancel();
    const style=getComputedStyle(button);
    const resting={backgroundColor:style.backgroundColor,borderColor:style.borderColor,transform:'translateX(0)'};
    const denied={backgroundColor:'#b42332',borderColor:'#991b2b'};
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const nudge=x=>`translateX(${reduced?0:x}px)`;
    const animation=button.animate([
      {...resting,offset:0},
      {...denied,transform:nudge(-4),offset:.14},
      {...denied,transform:nudge(4),offset:.28},
      {...denied,transform:nudge(-3),offset:.42},
      {...denied,transform:nudge(3),offset:.56},
      {...denied,transform:nudge(0),offset:.72},
      {...resting,offset:1},
    ],{duration:520,easing:'ease-out'});
    animation.id='skip-exhausted';
  });
}
