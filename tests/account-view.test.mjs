import test from 'node:test';
import assert from 'node:assert/strict';
import { renderAccountView } from '../js/account-view.js';
import { achievementBadge } from '../js/achievement-badges.js';
import { achievementsFor } from '../js/achievements.js';

const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const helpers={esc,icon:name=>`<svg data-icon="${name}" aria-hidden="true"></svg>`};
const user={name:'Indraa',username:'Indraa',createdAt:'2026-10-25T12:00:00Z'};
const history=Array.from({length:12},(_,i)=>({teamName:`Time ${i}`,mode:'quick',champion:i===4||i===10,stageLabel:'Quartas de final',date:'2026-10-25'}));
const stats={played:12,titles:2,winRate:17,streak:0};

test('every achievement has distinct vector artwork in both lock states',()=>{
  const art=achievementsFor([]).map(item=>{
    const earned=achievementBadge(item.id,true),locked=achievementBadge(item.id,false);
    assert.match(earned,/ earned"/);
    assert.match(locked,/ pending"/);
    assert.match(earned,/aria-hidden="true"/);
    assert.doesNotMatch(earned,/<image|id="/);
    return earned.match(/<g class="medal-art"[^>]*>(.*?)<\/g>/s)[1];
  });
  assert.equal(new Set(art).size,10);
});

test('profile preserves account actions, progress, and saved recency order',()=>{
  const html=renderAccountView(user,history,stats,'login',helpers);
  assert.equal((html.match(/data-achievement="/g)||[]).length,10);
  assert.equal((html.match(/achievement-tile is-earned/g)||[]).length,4);
  assert.match(html,/data-action="account-logout"/);
  assert.match(html,/data-action="account-history"/);
  assert.match(html,/data-action="close-modal"/);
  assert.ok(html.indexOf('Time 11')<html.indexOf('Time 10'));
  assert.ok(html.indexOf('Time 10')<html.indexOf('Time 9'));
  assert.doesNotMatch(html,/Time 8</);
  assert.match(html,/2 de 3/);
});

test('names and history cannot inject markup into the redesigned profile',()=>{
  const unsafe={...user,name:'<img src=x>',username:'<img src=x>'};
  const html=renderAccountView(unsafe,[{teamName:'<script>alert(1)</script>',stageLabel:'<b>Fim</b>'}],stats,'login',helpers);
  assert.doesNotMatch(html,/<img src=x>|<script>alert|<b>Fim<\/b>/);
  assert.match(html,/&lt;img src=x&gt;/);
  assert.match(html,/&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
});

test('empty career and sign-in modes keep usable username-only forms',()=>{
  const emptyStats={played:0,titles:0,winRate:0,streak:0};
  assert.match(renderAccountView(user,[],emptyStats,'login',helpers),/Sua primeira campanha começa no campo/);
  for(const mode of ['login','register']){
    const html=renderAccountView(null,[],emptyStats,mode,helpers);
    assert.match(html,/id="account-form"/);
    assert.match(html,/name="username"/);
    assert.match(html,/name="password"/);
    assert.doesNotMatch(html,/name="email"|type="email"/);
    assert.match(html,new RegExp(`data-mode="${mode}"`));
    assert.match(html,/data-action="account-mode"/);
    assert.equal((html.match(/class="achievement-badge /g)||[]).length,3);
  }
});
