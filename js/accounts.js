import * as storage from './storage.js?v=account-storage-move-20261025';

const ACCOUNT_INDEX='accounts';
const HASH_ITERATIONS=160000;
const encodeHex=bytes=>Array.from(bytes,value=>value.toString(16).padStart(2,'0')).join('');
const decodeHex=value=>Uint8Array.from(value.match(/.{2}/g)||[],part=>parseInt(part,16));
function listAccounts(){const value=storage.read(ACCOUNT_INDEX,[]);return Array.isArray(value)?value:[];}
function publicAccount(account){const username=account?.username||account?.name||'';return account?{id:account.id,name:username,username,createdAt:account.createdAt}:null;}
function makeSalt(){const salt=crypto.getRandomValues(new Uint8Array(16));return encodeHex(salt);}
async function hashPassword(password,salt){
  if(!crypto.subtle)throw new Error('Este navegador não permite criar uma conta segura.');
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
  const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:decodeHex(salt),iterations:HASH_ITERATIONS,hash:'SHA-256'},key,256);
  return encodeHex(new Uint8Array(bits));
}
function equalHash(left,right){if(left.length!==right.length)return false;let difference=0;for(let i=0;i<left.length;i++)difference|=left.charCodeAt(i)^right.charCodeAt(i);return difference===0;}
function normalizeUsername(username){return String(username||'').trim().normalize('NFKC').toLocaleLowerCase('pt-BR');}

export function currentAccount(){
  const id=storage.activeAccountId();
  if(!id)return null;
  const account=listAccounts().find(item=>item.id===id);
  if(!account){storage.setAccountSession(null);return null;}
  return publicAccount(account);
}

export async function createAccount({username,password}){
  const safeUsername=String(username||'').trim().normalize('NFKC');
  const normalizedUsername=normalizeUsername(safeUsername);
  if(safeUsername.length<3||safeUsername.length>24||! /^[\p{L}\p{N}][\p{L}\p{N}_.-]*$/u.test(safeUsername))throw new Error('Use de 3 a 24 letras, números, ponto, hífen ou sublinhado no nome de usuário.');
  if(String(password||'').length<8)throw new Error('A senha precisa ter pelo menos 8 caracteres.');
  if(String(password).length>128)throw new Error('A senha pode ter no máximo 128 caracteres.');

  const accounts=listAccounts();
  if(accounts.some(account=>normalizeUsername(account.username||account.name)===normalizedUsername))throw new Error('Já existe uma conta com este nome de usuário neste navegador.');
  const salt=makeSalt();
  const account={id:crypto.randomUUID(),name:safeUsername,username:safeUsername,salt,passwordHash:await hashPassword(String(password),salt),createdAt:new Date().toISOString()};
  if(!storage.write(ACCOUNT_INDEX,[...accounts,account]))throw new Error('Não foi possível salvar a conta neste navegador.');
  if(!storage.moveGuestProgressToAccount(account.id)){
    storage.write(ACCOUNT_INDEX,accounts);
    throw new Error('Não foi possível transferir o histórico. Seus dados antigos continuam salvos neste navegador.');
  }
  if(!storage.setAccountSession(account.id)){
    storage.moveAccountProgressToGuest(account.id);
    storage.write(ACCOUNT_INDEX,accounts);
    throw new Error('Não foi possível iniciar a conta. Seus dados antigos continuam salvos neste navegador.');
  }
  return publicAccount(account);
}

export async function loginAccount({username,password}){
  const safeUsername=normalizeUsername(username);
  const account=listAccounts().find(item=>normalizeUsername(item.username||item.name)===safeUsername);
  if(!account||!String(password||'')||String(password).length>128)throw new Error('Nome de usuário ou senha inválidos.');
  const submitted=await hashPassword(String(password),account.salt);
  if(!equalHash(submitted,account.passwordHash))throw new Error('Nome de usuário ou senha inválidos.');
  if(!storage.setAccountSession(account.id))throw new Error('Não foi possível iniciar a conta neste navegador.');
  return publicAccount(account);
}

export function logoutAccount(){storage.setAccountSession(null);}
