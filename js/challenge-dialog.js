import {escapeHtml as esc} from './html.js';
import {FORMATIONS} from './engine.js';
import {competitionName} from '../data/competitions.js';
import {decodeChallenge,validateChallenge,challengeLink} from './challenge.js';

const close='<button class="icon-button" type="button" data-action="close-modal" aria-label="Fechar desafio">×</button>';
const head=title=>`<div class="modal-head"><div><span class="eyebrow accent">DESAFIO COM AMIGOS</span><h2 id="modal-title">${title}</h2></div>${close}</div>`;
const error='<p class="challenge-error" role="alert"></p>';

/** Loaded only when the user opens a challenge. Opening a link never starts a game. */
export function initChallengeDialog({modal,content,getSelection,loadSquads,startChallenge,startFriendChallenge,toast}){
  let current=null,generation=0,busy=false;
  modal.addEventListener('close',()=>{generation++;current=null;busy=false;});
  const showError=message=>{const node=content.querySelector('.challenge-error');if(node)node.textContent=message;};
  const mount=html=>{content.innerHTML=`<section class="challenge-dialog">${html}</section>`;if(!modal.open)modal.showModal();};
  function preview(challenge){
    current=challenge;
    mount(`${head('Convide alguém para jogar')}<p class="challenge-intro">O mesmo primeiro sorteio para os dois. Depois, as escolhas e os skips podem mudar o caminho.</p><div class="challenge-summary"><span>Competição<strong>${esc(competitionName(challenge.mode))}</strong></span><span>Formação<strong>${esc(FORMATIONS[challenge.formation].name)}</strong></span><span>Skips<strong>3 para cada jogador</strong></span></div><label class="challenge-field">Código do desafio<input type="text" id="challenge-code" value="${esc(challenge.code)}" readonly spellcheck="false" aria-label="Código do desafio"></label><div class="challenge-copy-actions"><button type="button" class="btn btn-outline" data-challenge-action="copy-code">Copiar código</button><button type="button" class="btn btn-outline" data-challenge-action="copy-link">Copiar link</button></div><p class="challenge-small">Cada pessoa joga sua própria campanha, no próprio navegador. Sem conta ou placar online.</p>${error}<button type="button" class="btn btn-primary challenge-launch" data-challenge-action="play">Começar desafio <span aria-hidden="true">→</span></button><button type="button" class="text-button" data-challenge-action="enter">Usar outro código</button>`);
  }
  async function copy(value){
    try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(value);toast('Copiado! Envie para quem vai jogar.');return;}}catch{/* Try the local selection fallback. */}
    const field=document.createElement('textarea');field.value=value;field.style.position='fixed';field.style.opacity='0';content.append(field);field.select();
    let copied=false;try{copied=document.execCommand('copy');}finally{field.remove();}
    if(!copied)throw new Error('Não foi possível copiar automaticamente. Selecione e copie o código acima.');
    toast('Copiado! Envie para quem vai jogar.');
  }
  async function inspect(code,version){
    const parsed=decodeChallenge(code),squads=await loadSquads(parsed.mode);
    if(version===generation&&modal.open)preview(validateChallenge(parsed,squads));
  }
  function show(kind='create',code=''){
    generation++;current=null;busy=false;
    if(kind==='create'){
      const selection=getSelection();
      const playerNames=Array.from({length:4},(_,index)=>`<label class="challenge-field challenge-player-name"${index>1?' hidden':''}>Jogador ${index+1}<input type="text" name="player${index+1}" value="Jogador ${index+1}" maxlength="20" autocomplete="off"></label>`).join('');
      mount(`${head('Prepare o torneio')}<p class="challenge-intro">Escolha o tamanho da chave, dê nome aos jogadores e monte os times em sequência.</p><form data-challenge-form="create"><fieldset class="challenge-player-count"><legend>Jogadores</legend><label class="challenge-player-option selected"><input type="radio" name="playerCount" value="2" checked><span><strong>2 jogadores</strong><small>Final · 2 jogos · ida e volta</small></span></label><label class="challenge-player-option"><input type="radio" name="playerCount" value="4"><span><strong>4 jogadores</strong><small>Semifinais e final · 6 jogos</small></span></label></fieldset><div class="challenge-player-fields"><label class="challenge-field">Formação<select name="formation">${Object.entries(FORMATIONS).map(([id,f])=>`<option value="${id}"${id===selection.formation?' selected':''}>${esc(f.name)}</option>`).join('')}</select></label><div class="challenge-player-names">${playerNames}</div></div>${error}<button class="btn btn-primary challenge-launch" type="submit">Começar desafio <span aria-hidden="true">→</span></button></form><p class="challenge-small">Cada pessoa monta seu time no mesmo aparelho. Todos os confrontos têm ida e volta; o placar agregado define quem avança.</p>`);
    }else{
      mount(`${head('Entre no desafio')}<p class="challenge-intro">Digite os 6 caracteres ou cole o link que você recebeu.</p><form data-challenge-form="enter"><label class="challenge-field">Código ou link<input type="text" name="code" id="challenge-input" value="${esc(code)}" maxlength="400" required autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="A1B2C3"></label>${error}<button class="btn btn-primary challenge-launch" type="submit">Conferir desafio <span aria-hidden="true">→</span></button></form>`);
      content.querySelector('#challenge-input')?.focus();
      if(code){const version=generation;void inspect(code,version).catch(error=>{if(version===generation&&modal.open)showError(error.message);});}
    }
  }
  content.addEventListener('change',event=>{
    if(event.target.name!=='playerCount')return;
    const form=event.target.form,count=Number(event.target.value);
    form?.querySelectorAll('.challenge-player-name').forEach((field,index)=>{field.hidden=index>=count;});
    form?.querySelectorAll('.challenge-player-option').forEach(option=>option.classList.toggle('selected',option.querySelector('input')?.checked));
  });
  content.addEventListener('submit',async event=>{
    const form=event.target.closest('[data-challenge-form]');if(!form)return;event.preventDefault();if(busy)return;
    const version=++generation,submit=form.querySelector('[type="submit"]');busy=true;submit.disabled=true;showError('');
    try{
      if(form.dataset.challengeForm==='enter')await inspect(form.elements.code.value,version);
      else{
        const count=Number(form.elements.playerCount.value),formation=form.elements.formation.value;
        const players=Array.from({length:count},(_,index)=>String(form.elements[`player${index+1}`].value||'').trim());
        if(players.some(name=>!name)||new Set(players.map(name=>name.toLocaleLowerCase('pt-BR'))).size!==players.length)throw new Error('Preencha os nomes dos jogadores com nomes diferentes.');
        await loadSquads('friends');
        if(version===generation&&modal.open){startFriendChallenge({count,formation,players});modal.close();}
      }
    }catch(error){if(version===generation&&modal.open)showError(error.message);}
    finally{if(version===generation){busy=false;if(submit.isConnected)submit.disabled=false;}}
  });
  content.addEventListener('click',async event=>{
    const action=event.target.closest('[data-challenge-action]');if(!action||busy)return;
    const kind=action.dataset.challengeAction;
    if(kind==='enter'){show('enter');return;}
    if(!current)return;
    try{
      if(kind==='copy-code')await copy(current.code);
      else if(kind==='copy-link')await copy(challengeLink(current.code,window.location.href));
      else if(kind==='play'){busy=true;action.disabled=true;await startChallenge(current);modal.close();}
    }catch(error){showError(error.message);}
    finally{busy=false;if(action.isConnected)action.disabled=false;}
  });
  return {show};
}
