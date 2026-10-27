import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { renderAchievementsView } from '../js/achievements-view.js';
import { updateAchievementLedger } from '../js/achievements.js';
import { statistics } from '../js/storage.js';

const helpers={icon:name=>`<svg data-icon="${name}" aria-hidden="true"></svg>`};
const history=Array.from({length:12},(_,i)=>({id:`record-${i}`,teamName:'<script>private name</script>',mode:'quick',champion:i===4||i===10}));

test('achievements are a full page without the browser save notice, account or campaign list',()=>{
  const html=renderAchievementsView(history,statistics(history),updateAchievementLedger(history),helpers);
  assert.match(html,/<h1>Conquistas<\/h1>/);
  assert.equal((html.match(/data-achievement="/g)||[]).length,10);
  assert.equal((html.match(/achievement-tile is-earned/g)||[]).length,4);
  assert.doesNotMatch(html,/achievements-save-note|salvas automaticamente neste navegador/);
  assert.doesNotMatch(html,/<form|password|username|account-|login|Histórico|history-result|private name|<script>/i);
});

test('previous medals remain shown with an empty or pruned campaign history',()=>{
  const ledger=updateAchievementLedger([{id:'world-cup-title',mode:'world-cup',champion:true},...Array.from({length:2},(_,i)=>({id:String(i),champion:true}))]);
  const html=renderAchievementsView([],statistics([]),ledger,helpers);
  assert.match(html,/is-earned" data-achievement="world-cup-title"/);
  assert.match(html,/is-earned" data-achievement="three-win-streak"/);
  assert.match(html,/Sua trajetória/);
});

test('public navigation exposes achievements and does not load login or account modules',()=>{
  const index=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const main=fs.readFileSync(new URL('../js/main.js',import.meta.url),'utf8');
  assert.match(index,/data-action="achievements">Conquistas<\/button>/);
  assert.doesNotMatch(index,/account-trigger|account\.css|account-career\.css|data-action="history"/);
  assert.doesNotMatch(main,/accounts\.js|renderAccount|account-open|account-form|loginAccount|createAccount/);
  assert.match(main,/saveCampaignProgress\(record,history/);
});
