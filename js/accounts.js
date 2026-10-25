import * as storage from './storage.js?v=local-accounts-20261025';

const ACCOUNT_INDEX='accounts';
const HASH_ITERATIONS=160000;
const encodeHex=bytes=>Array.from(bytes,value=>value.toString(16).padStart(2,'0')).join('');
const decodeHex=value=>Uint8Array.from(value.match(/.{2}/g)||[],part=>parseInt(part,16));
function listAccounts(){const value=storage.read(ACCOUNT_INDEX,[]);return Array.isArray(value)?value:[];}
function publicAccount(account){return account?{id:account.id,name:account.name,email:account.email,createdAt:account.createdAt}:null;}
function makeSalt(){const salt=crypto.getRandomValues(new Uint8Array(16));return encodeHex(salt);}
async function hashPassword(password,salt){
  if(!crypto.subtle)throw new Error('Este navegador não permite criar uma conta segura.');
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
  const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:decodeHex(salt),iterations:HASH_ITERATIONS,hash:'SHA-256'},key,256);
  return encodeHex(new Uint8Array(bits));
}
function equalHash(left,right){if(left.length!==right.length)return false;let difference=0;for(let i=0;i<left.length;i++)difference|=left.charCodeAt(i)^right.charCodeAt(i);return difference===0;}
function normalizeEmail(email){return String(email||'').trim().toLowerCase();}

export function currentAccount(){
  const id=storage.activeAccountId();
  if(!id)return null;
  const account=listAccounts().find(item=>item.id===id);
  if(!account){storage.setAccountSession(null);return null;}
  return publicAccount(account);
}

export async function createAccount({name,email,password}){
  const safeName=String(name||'').trim().replace(/\s+/g,' ');
  const safeEmail=normalizeEmail(email);
  if(safeName.length<2||safeName.length>40)throw new Error('Digite um nome entre 2 e 40 caracteres.');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safeEmail))throw new Error('Digite um e-mail válido.');
  if(String(password||'').length<8)throw new Error('A senha precisa ter pelo menos 8 caracteres.');
  if(String(password).length>128)throw new Error('A senha pode ter no máximo 128 caracteres.');

  const accounts=listAccounts();
  if(accounts.some(account=>account.email===safeEmail))throw new Error('Já existe uma conta com este e-mail neste navegador.');
  const guestHistory=storage.read('history',[]);
  const guestActive=storage.read('active');
  const salt=makeSalt();
  const account={id:crypto.randomUUID(),name:safeName,email:safeEmail,salt,passwordHash:await hashPassword(String(password),salt),createdAt:new Date().toISOString()};
  if(!storage.write(ACCOUNT_INDEX,[...accounts,account]))throw new Error('Não foi possível salvar a conta neste navegador.');
  if(!storage.setAccountSession(account.id)){
    storage.write(ACCOUNT_INDEX,accounts);
    throw new Error('Não foi possível iniciar a conta neste navegador.');
  }
  const historySaved=storage.write('history',Array.isArray(guestHistory)?guestHistory:[]);
  const activeSaved=guestActive==null||storage.write('active',guestActive);
  if(!historySaved||!activeSaved){
    storage.setAccountSession(null);
    storage.clearAccountProgress(account.id);
    storage.write(ACCOUNT_INDEX,accounts);
    throw new Error('Não foi possível salvar o histórico da conta. Seus dados anteriores foram mantidos.');
  }
  storage.clearGuestProgress();
  return publicAccount(account);
}

export async function loginAccount({email,password}){
  const safeEmail=normalizeEmail(email);
  const account=listAccounts().find(item=>item.email===safeEmail);
  if(!account||!String(password||'')||String(password).length>128)throw new Error('E-mail ou senha inválidos.');
  const submitted=await hashPassword(String(password),account.salt);
  if(!equalHash(submitted,account.passwordHash))throw new Error('E-mail ou senha inválidos.');
  if(!storage.setAccountSession(account.id))throw new Error('Não foi possível iniciar a conta neste navegador.');
  return publicAccount(account);
}

export function logoutAccount(){storage.setAccountSession(null);}
