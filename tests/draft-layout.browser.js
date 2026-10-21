import {renderDraft} from '../js/ui.js';
import {allSquads} from '../data/clubs.js';
import {FORMATIONS,positionFit} from '../js/engine.js';
import {createDraft} from '../js/draft.js';

const query=new URLSearchParams(location.search);
const cases=[
  {id:'empty',label:'Sem sorteio',formation:'4-3-3'},
  {id:'rolling',label:'Sorteando',formation:'4-3-3'},
  ...Object.keys(FORMATIONS).map(formation=>({id:'players',label:'Jogadores e indisponíveis',formation})),
  ...Object.keys(FORMATIONS).map(formation=>({id:'full-lineup',label:'Onze jogadores e nomes longos',formation})),
  {id:'legends',label:'Lendas e indisponíveis',formation:'4-3-3'},
  {id:'long-header',label:'Olympique de Marseille 1993',formation:'4-3-3'}
].filter(fixture=>query.get('suite')!=='markers'||['empty','full-lineup'].includes(fixture.id));
const sizes=query.get('suite')==='markers'
  ? [[320,568],[360,640],[768,1024],[1024,600],[1366,768],[1920,1080]]
  : [[320,568],[360,640],[768,1024],[1024,600],[1093,540],[1280,720],[1366,768],[1440,900],[1920,1080],[1024,639],[1024,640],[1366,639],[1366,640]];
const epsilon=1.2;
const fixtureURL=fixture=>{
  const url=new URL(location.pathname,location.href);
  url.searchParams.set('fixture',fixture.id);
  url.searchParams.set('formation',fixture.formation);
  return url;
};

function fixtureState(id,formation){
  const squad=allSquads.find(s=>s.id===(id==='long-header'?'marseille-1993':'bayern-2020'))||allSquads[0];
  const draft=createDraft(62137,'2026-10-16',id==='legends'?'legends':'champions');
  const picks=[];
  if(['players','legends','long-header','full-lineup'].includes(id)){
    const labelLength=player=>(player.nome.length>17?player.nome.split(' ').at(-1):player.nome).length;
    const candidates=id==='full-lineup'
      ? allSquads.flatMap(team=>team.jogadores.map(player=>({player,squad:team}))).sort((a,b)=>labelLength(b.player)-labelLength(a.player))
      : squad.jogadores.map(player=>({player,squad}));
    // Real roster entries are retained, including long names and multirole tags.
    for(const slot of FORMATIONS[formation].slots){
      const entry=candidates.find(({player})=>!picks.some(pick=>pick.player.id===player.id)&&positionFit(player,slot)!==null);
      if(entry){const {player,squad:team}=entry;picks.push({player,slot,squadId:team.id,clubId:team.clubId,clubName:team.nome,ano:team.ano});}
      if(id!=='full-lineup'&&picks.length===8)break;
    }
    Object.assign(draft,{picks,currentSquad:squad,currentSquadId:squad.id,otherSeasonAvailable:true});
  }
  return {screen:'draft',mode:id==='legends'?'legends':'champions',formation,teamName:'Meu time',draft,rolling:id==='rolling'};
}

async function renderFixture(){
  const id=query.get('fixture'),formation=query.get('formation')||'4-3-3';
  if(!cases.some(c=>c.id===id)||!FORMATIONS[formation])throw new Error('Fixture ou formação desconhecida.');
  const root=new URL('../',location.href);
  const response=await fetch(new URL('index.html',root),{cache:'no-store'});
  if(!response.ok)throw new Error(`Não foi possível carregar index.html: HTTP ${response.status}`);
  const source=new DOMParser().parseFromString(await response.text(),'text/html');
  document.documentElement.lang=source.documentElement.lang;
  document.documentElement.dataset.theme=source.documentElement.dataset.theme;
  document.querySelector('#runner-style')?.remove();
  const pending=[];
  for(const original of source.querySelectorAll('head link')){
    const link=original.cloneNode(true);
    link.href=new URL(original.getAttribute('href'),root).href;
    if(link.rel==='stylesheet')pending.push(new Promise((resolve,reject)=>{
      link.addEventListener('load',resolve,{once:true});
      link.addEventListener('error',()=>reject(new Error(`Falha ao carregar ${link.href}`)),{once:true});
    }));
    document.head.append(link);
  }
  document.body.replaceChildren();
  for(const selector of ['body > .skip-link','body > header','body > main','body > footer']){
    const original=source.querySelector(selector);
    if(original)document.body.append(original.cloneNode(true));
  }
  for(const image of document.querySelectorAll('img[src]'))image.src=new URL(image.getAttribute('src'),root).href;
  const app=document.querySelector('#app');
  app.dataset.screen='draft';
  const state=fixtureState(id,formation);
  app.innerHTML=renderDraft(state);
  // Badge URLs emitted by renderDraft are relative to the real site root.
  for(const image of app.querySelectorAll('img[src]'))image.src=new URL(image.getAttribute('src'),root).href;
  await Promise.all(pending);
  await document.fonts.ready;
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  window.draftLayoutFixture={id,formation,state,inspect:inspectGeometry};
  document.documentElement.dataset.fixtureReady='true';
  window.dispatchEvent(new Event('fixture-ready'));
}

function visible(element){
  const style=getComputedStyle(element),rect=element.getBoundingClientRect();
  return style.display!=='none'&&style.visibility!=='hidden'&&rect.width>0&&rect.height>0;
}
function coords(element){
  const rect=element.getBoundingClientRect();
  return `${Math.round(rect.x)},${Math.round(rect.y)} ${Math.round(rect.width)}×${Math.round(rect.height)}`;
}
function contains(outer,inner){
  return inner.left>=outer.left-epsilon&&inner.right<=outer.right+epsilon&&inner.top>=outer.top-epsilon&&inner.bottom<=outer.bottom+epsilon;
}
function overlaps(a,b){
  return Math.min(a.right,b.right)-Math.max(a.left,b.left)>epsilon&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>epsilon;
}

function inspectGeometry(){
  const failures=[],metrics={};
  const fail=(condition,message)=>{if(!condition)failures.push(message);};
  const page=document.scrollingElement;
  metrics.viewport=`${innerWidth}×${innerHeight}`;
  metrics.pageWidth=page.scrollWidth;
  fail(page.scrollWidth<=document.documentElement.clientWidth+epsilon,`Overflow horizontal: página ${page.scrollWidth}px, viewport ${document.documentElement.clientWidth}px.`);
  const selectors=['.draw-card','.players-panel','.draft-center','.draft-right'];
  const panels=selectors.map(selector=>[selector,document.querySelector(selector)]).filter(([,el])=>el&&visible(el));
  for(const [selector,el] of panels){
    metrics[selector]=coords(el);
    const rect=el.getBoundingClientRect();
    fail(rect.left>=-epsilon&&rect.right<=innerWidth+epsilon,`${selector} fora da largura da tela: ${coords(el)}.`);
  }
  for(let i=0;i<panels.length;i++)for(let j=i+1;j<panels.length;j++){
    const [nameA,a]=panels[i],[nameB,b]=panels[j];
    fail(!overlaps(a.getBoundingClientRect(),b.getBoundingClientRect()),`Painéis sobrepostos: ${nameA} (${coords(a)}) e ${nameB} (${coords(b)}).`);
  }
  const card=document.querySelector('.draw-card'),cardRect=card.getBoundingClientRect();
  for(const element of card.querySelectorAll('.draw-card-top,.draw-club,.season-award,.reroll-block,.draw-empty,.reroll-buttons .btn')){
    if(visible(element))fail(contains(cardRect,element.getBoundingClientRect()),`Cabeçalho corta ${element.className}: ${coords(element)}; card ${coords(card)}.`);
  }
  const buttons=[...document.querySelectorAll('.player-select')].filter(visible);
  metrics.playerRows=buttons.length;
  metrics.minimumRowHeight=buttons.length?Math.min(...buttons.map(b=>b.getBoundingClientRect().height)):null;
  for(const button of buttons){
    const name=button.querySelector('.player-name')?.textContent||'jogador';
    const buttonRect=button.getBoundingClientRect();
    fail(buttonRect.height>=60-epsilon,`Linha de ${name} tem ${buttonRect.height.toFixed(1)}px; mínimo 60px.`);
    fail(button.scrollWidth<=button.clientWidth+epsilon,`Conteúdo horizontal excede botão de ${name}: ${button.scrollWidth}/${button.clientWidth}px.`);
    for(const content of button.querySelectorAll('.player-avatar,.player-name,.player-details,.player-status,.player-ovr')){
      if(!visible(content))continue;
      fail(contains(buttonRect,content.getBoundingClientRect()),`Conteúdo de ${name} fora do botão: .${content.className} (${coords(content)}); botão ${coords(button)}.`);
      if(content.classList.contains('player-name')||content.classList.contains('player-status')){
        const range=document.createRange();range.selectNodeContents(content);
        for(const rect of range.getClientRects())fail(contains(buttonRect,rect),`Texto de ${name} excede o botão (${content.className}).`);
      }
    }
  }
  const pitch=document.querySelector('.draft-pitch'),center=document.querySelector('.draft-center'),header=center?.querySelector('.pitch-header');
  fail(Boolean(pitch)&&visible(pitch),'Campo ausente ou sem dimensões.');
  if(pitch&&visible(pitch)){
    metrics.pitch=coords(pitch);
    const pitchRect=pitch.getBoundingClientRect();
    fail(contains(center.getBoundingClientRect(),pitchRect),`Campo cortado pelo painel: campo ${coords(pitch)}, painel ${coords(center)}.`);
    if(header)fail(!overlaps(header.getBoundingClientRect(),pitchRect),'Cabeçalho da escalação sobrepõe o campo.');
    const circles=[...pitch.querySelectorAll('.slot-circle')].filter(visible);
    metrics.minimumCircleSize=Math.min(...circles.map(circle=>circle.getBoundingClientRect().width));
    fail(circles.length===11,`Campo exibe ${circles.length} círculos; esperado 11.`);
    for(const circle of circles){
      const rect=circle.getBoundingClientRect();
      fail(contains(pitchRect,rect),`Círculo ${circle.textContent.trim()} cortado: ${coords(circle)}; campo ${coords(pitch)}.`);
      fail(rect.width>=40-epsilon,`Círculo pequeno: ${rect.width.toFixed(1)}px.`);
      fail(Math.abs(rect.width-rect.height)<=epsilon,'Marcador deixou de ser circular.');
      const range=document.createRange();range.selectNodeContents(circle);
      for(const glyph of range.getClientRects())fail(contains(rect,glyph),`OVR ou posição ${circle.textContent.trim()} excede o círculo.`);
    }
    for(let i=0;i<circles.length;i++)for(let j=i+1;j<circles.length;j++)fail(!overlaps(circles[i].getBoundingClientRect(),circles[j].getBoundingClientRect()),`Círculos ${i+1} e ${j+1} sobrepostos no campo.`);
    const labels=[...pitch.querySelectorAll('.pitch-slot small')].filter(visible);
    for(const label of labels){
      const labelRect=label.getBoundingClientRect(),slot=label.closest('.pitch-slot');
      fail(contains(pitchRect,labelRect),`Label “${label.textContent.trim()}” cortada pelo campo: ${coords(label)}; campo ${coords(pitch)}.`);
      for(const circle of circles){
        if(slot?.contains(circle))continue;
        fail(!overlaps(labelRect,circle.getBoundingClientRect()),`Label “${label.textContent.trim()}” sobrepõe o círculo de outra posição (${circle.closest('.pitch-slot')?.dataset.slotLabel||circle.textContent.trim()}).`);
      }
    }
    // Use line boxes of the text itself: a centered label may have spare width.
    const labelTextRects=labels.map(label=>{
      const range=document.createRange();range.selectNodeContents(label);
      return [...range.getClientRects()].filter(rect=>rect.width>0&&rect.height>0);
    });
    for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++){
      const collides=labelTextRects[i].some(a=>labelTextRects[j].some(b=>overlaps(a,b)));
      fail(!collides,`Labels “${labels[i].textContent.trim()}” e “${labels[j].textContent.trim()}” sobrepostos no campo.`);
    }
  }
  if(['players','legends','long-header'].includes(query.get('fixture'))){
    fail(buttons.length===11,`Fixture deveria conter 11 jogadores; há ${buttons.length}.`);
    fail(Boolean(document.querySelector('.player-row.unavailable')),'Fixture não exercita jogadores indisponíveis.');
    fail(Boolean(document.querySelector('.pitch-slot.picked')),'Fixture não exercita jogadores escalados.');
  }
  return {pass:failures.length===0,failures,metrics};
}

async function loadCase(frame,fixture,width,height){
  frame.width=String(width);frame.height=String(height);
  frame.style.width=`${width}px`;frame.style.height=`${height}px`;
  const ready=new Promise((resolve,reject)=>{
    const timeout=setTimeout(()=>reject(new Error('Timeout de 20s ao carregar fixture/folhas/fontes.')),20000);
    frame.onload=()=>{
      const win=frame.contentWindow;
      const complete=()=>{clearTimeout(timeout);resolve(win.draftLayoutFixture.inspect());};
      if(win.document.documentElement.dataset.fixtureReady==='true')complete();
      else{
        win.addEventListener('fixture-ready',complete,{once:true});
        win.addEventListener('fixture-error',event=>{clearTimeout(timeout);reject(new Error(event.detail));},{once:true});
        if(win.document.documentElement.dataset.fixtureError){clearTimeout(timeout);reject(new Error(win.document.documentElement.dataset.fixtureError));}
      }
    };
  });
  frame.src=fixtureURL(fixture).href;
  return ready;
}

function appendResult(width,height,fixture,result){
  const row=document.createElement('tr');
  const size=document.createElement('td');size.textContent=`${width} × ${height}`;
  const state=document.createElement('td');
  const link=document.createElement('a');link.href=fixtureURL(fixture).href;link.target='_blank';link.rel='noopener';link.textContent=`${fixture.label} · ${fixture.formation}`;state.append(link);
  const status=document.createElement('td');status.className=result.pass?'pass':'fail';status.textContent=result.pass?'PASS':'FAIL';
  const info=document.createElement('td'),details=document.createElement('details'),summary=document.createElement('summary');
  summary.textContent=result.pass?'Medidas verificadas':`${result.failures.length} problema(s)`;details.append(summary);
  if(result.failures.length){const list=document.createElement('ul');for(const message of result.failures){const item=document.createElement('li');item.textContent=message;list.append(item);}details.append(list);}
  const pre=document.createElement('pre');pre.textContent=JSON.stringify(result.metrics,null,2);details.append(pre);info.append(details);row.append(size,state,status,info);document.querySelector('#results').append(row);
}

async function run(){
  const button=document.querySelector('#run'),progress=document.querySelector('#progress');
  button.disabled=true;document.querySelector('#results').replaceChildren();document.querySelector('#error').textContent='';
  const frame=document.createElement('iframe');frame.className='fixture-frame';frame.title='Fixture de teste da seleção';document.body.append(frame);
  const results=[];let passed=0;
  try{
    for(const [width,height] of sizes)for(const fixture of cases){
      progress.textContent=`Testando ${results.length+1}/${sizes.length*cases.length}: ${width} × ${height} · ${fixture.formation}`;
      let result;
      try{result=await loadCase(frame,fixture,width,height);}catch(error){result={pass:false,failures:[error.message],metrics:{}};}
      results.push({width,height,fixture,...result});if(result.pass)passed++;
      appendResult(width,height,fixture,result);
    }
    window.draftLayoutResults=results;
    const failed=results.length-passed;
    progress.textContent=`${passed} PASS · ${failed} FAIL · ${results.length} casos. Finalizado.`;
    progress.className=failed?'fail':'pass';
    document.documentElement.dataset.testStatus=failed?'fail':'pass';
  }finally{frame.remove();button.disabled=false;}
}

if(query.has('fixture')){
  renderFixture().catch(error=>{
    document.documentElement.dataset.fixtureError=error.message;
    document.body.textContent=`Falha na fixture: ${error.message}`;
    window.dispatchEvent(new CustomEvent('fixture-error',{detail:error.message}));
  });
}else{
  for(const fixture of cases){const link=document.createElement('a');link.href=fixtureURL(fixture).href;link.target='_blank';link.rel='noopener';link.textContent=`${fixture.label} · ${fixture.formation}`;document.querySelector('#fixtures').append(link);}
  document.querySelector('#run').addEventListener('click',run);
}
