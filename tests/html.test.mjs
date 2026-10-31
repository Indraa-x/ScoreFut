import test from 'node:test';
import assert from 'node:assert/strict';
import {escapeHtml} from '../js/html.js';
test('HTML text and quoted attributes escape all delimiters, including user names',()=>{
 assert.equal(escapeHtml('<img onerror="x"> & \'name\''),'&lt;img onerror=&quot;x&quot;&gt; &amp; &#39;name&#39;');
 assert.equal(escapeHtml(null),'');assert.equal(escapeHtml(undefined),'');assert.equal(escapeHtml(0),'0');
});
