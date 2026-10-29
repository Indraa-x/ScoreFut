/** Animate the public catalog totals once per page visit, without changing the data. */
export function initHomeCounters(){
 const duration=900,reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
 let frame=null,startedAt=null,completed=false;
 return {update(root,screen){
  if(frame!==null){cancelAnimationFrame(frame);frame=null;}
  if(screen!=='home'){if(startedAt!==null)completed=true;return;}
  const counters=[...root.querySelectorAll('.hero-steps li>span')].map(node=>({node,target:Number(node.textContent)})).filter(({target})=>Number.isInteger(target)&&target>0);
  if(!counters.length||completed||reducedMotion.matches)return;
  // Screen readers hear the stable final total, rather than every animation frame.
  counters.forEach(({node})=>{node.parentElement.setAttribute('aria-label',node.parentElement.textContent.trim());node.setAttribute('aria-hidden','true');});
  startedAt??=performance.now();
  const paint=now=>{
   frame=null;
   if(!root.contains(counters[0].node)){completed=true;return;}
   const progress=reducedMotion.matches?1:Math.min(1,Math.max(0,(now-startedAt)/duration));
   const eased=1-(1-progress)**3;
   counters.forEach(({node,target})=>{node.textContent=String(1+Math.floor((target-1)*eased));});
   if(progress<1)frame=requestAnimationFrame(paint);else completed=true;
  };
  paint(performance.now());
 }};
}
