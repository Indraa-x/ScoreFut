import {escapeHtml as esc} from './html.js';
import {FORMATIONS} from './engine.js';
import {competitionName} from '../data/competitions.js';
import {createChallenge,decodeChallenge,validateChallenge,challengeLink} from './challenge.js';

const choices=['world-cup','copa-do-brasil','champions'];
const close='<button class="icon-button" type="button" data-action="close-modal" aria-label="Fechar desafio">×</button>';
const head=title=>`<div class="modal-head"><div><span class="eyebrow accent">DESAFIO COM AMIGOS</span><h2 id="modal-title">${title}</h2></div>${close}</div>`;
const error='<p class="challenge-error" role="alert"></p>';

/** Loaded only when the user opens a challenge. Opening a link never starts a game. */
export function initChallengeDialog({modal,content,getSelection,loadSquads,startChallenge,toast}){
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
      const selection=getSelection(),mode=choices.includes(selection.mode)?selection.mode:'world-cup';
      mount(`${head('Um sorteio, duas histórias')}<p class="challenge-intro">Escolha a competição e a formação para gerar um código e compartilhar.</p><form data-challenge-form="create"><div class="challenge-fields"><label class="challenge-field">Competição<select name="mode">${choices.map(id=>`<option value="${id}"${id===mode?' selected':''}>${esc(competitionName(id))}</option>`).join('')}</select></label><label class="challenge-field">Formação<select name="formation">${Object.entries(FORMATIONS).map(([id,f])=>`<option value="${id}"${id===selection.formation?' selected':''}>${esc(f.name)}</option>`).join('')}</select></label></div>${error}<button class="btn btn-primary challenge-launch" type="submit">Gerar código <span aria-hidden="true">→</span></button></form><p class="challenge-small">Primeiro sorteio igual, três skips e liberdade para escolher os jogadores.</p>`);
    }else{
      mount(`${head('Entre no desafio')}<p class="challenge-intro">Digite os 6 caracteres ou cole o link que você recebeu.</p><form data-challenge-form="enter"><label class="challenge-field">Código ou link<input type="text" name="code" id="challenge-input" value="${esc(code)}" maxlength="400" required autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="A1B2C3"></label>${error}<button class="btn btn-primary challenge-launch" type="submit">Conferir desafio <span aria-hidden="true">→</span></button></form>`);
      content.querySelector('#challenge-input')?.focus();
      if(code){const version=generation;void inspect(code,version).catch(error=>{if(version===generation&&modal.open)showError(error.message);});}
    }
  }
  content.addEventListener('submit',async event=>{
    const form=event.target.closest('[data-challenge-form]');if(!form)return;event.preventDefault();if(busy)return;
    const version=++generation,submit=form.querySelector('[type="submit"]');busy=true;submit.disabled=true;showError('');
    try{
      if(form.dataset.challengeForm==='enter')await inspect(form.elements.code.value,version);
      else{
        const mode=form.elements.mode.value,formation=form.elements.formation.value,squads=await loadSquads(mode);
        if(version===generation&&modal.open)preview(createChallenge({mode,formation,seed:crypto.getRandomValues(new Uint32Array(1))[0]},squads));
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
