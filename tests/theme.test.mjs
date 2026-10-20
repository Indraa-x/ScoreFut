import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../css/force-light.css',import.meta.url),'utf8');

test('the site forces its light palette and native controls on every device',()=>{
  assert.match(html,/<meta name="color-scheme" content="light">/);
  assert.match(html,/css\/force-light\.css\?v=/);
  assert.match(css,/color-scheme:\s*only light\s*!important/);
  assert.match(css,/--bg:\s*#f4f5f6\s*!important/);
  assert.match(css,/--surface:\s*#fff\s*!important/);
});
