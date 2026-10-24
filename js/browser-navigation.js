const SCREENS=new Set(['home','setup','draft','summary','match','bracket','result','history']);
const valid=route=>route&&SCREENS.has(route.screen);

/** Browser entries contain view identifiers, never copies of match results. */
export function initBrowserNavigation({getRoute,onVisit,host=window}){
  let visiting=false,started=false,current=null;
  const url=route=>{const url=new URL(host.location.href);url.hash=route.screen;return url.href;};
  function write(route,replace){
    if(!valid(route))return;
    const data={...host.history.state,scorefutNavigation:{version:1,route}};
    host.history[replace?'replaceState':'pushState'](data,'',url(route));current=route;
  }
  function read(){
    const saved=host.history.state?.scorefutNavigation;
    if(saved?.version===1&&valid(saved.route))return saved.route;
    const screen=host.location.hash.slice(1);return SCREENS.has(screen)?{screen}:{screen:'home'};
  }
  function visit(route){
    visiting=true;
    try{onVisit(route);}finally{visiting=false;write(getRoute(),true);}
  }
  host.addEventListener('popstate',()=>visit(read()));
  return {
    start(){if(started)return;started=true;visit(read());},
    push(){if(!started||visiting)return;const route=getRoute();if(JSON.stringify(route)!==JSON.stringify(current))write(route,false);},
    sync(){if(started&&!visiting)write(getRoute(),true);},
  };
}
