import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {prerenderHome} from '../scripts/prerender-home.mjs';

const source=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const canonical='https://indraa-x.github.io/ScoreFut/';

test('the public home has crawlable content before JavaScript and stays in sync with the game',()=>{
  const main=source.match(/<main\b[^>]*>[\s\S]*?<\/main>/)?.[0];
  assert.ok(main?.includes('<h1>'));
  for(const name of ['Champions League','Copa do Brasil','Modo rápido'])assert.ok(main.includes(name));
  assert.ok(main.includes('data-action="play-home"'));
  assert.ok(main.includes('data-screen="home"'));
  assert.ok(!main.includes('editor-overs')&&!main.includes('scorefut.active'));
  assert.equal(prerenderHome(source),source);
  assert.equal((source.match(/<main\b/g)||[]).length,1);
});

test('canonical, sitemap and sharing metadata use the same clean public address',()=>{
  assert.ok(source.includes(`<link rel="canonical" href="${canonical}">`));
  assert.ok(source.includes(`<meta property="og:url" content="${canonical}">`));
  assert.match(source,/<title>ScoreFut[^<]*futebol[^<]*<\/title>/);
  assert.ok(!/noindex|nofollow/.test(source.match(/<meta name="robots"[^>]*>/)?.[0]||''));
  const sitemap=readFileSync(new URL('../sitemap.xml',import.meta.url),'utf8');
  assert.deepEqual([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match=>match[1]),[canonical]);
});

test('game structured data identifies ScoreFut and Indraa without invented reviews',()=>{
  const data=JSON.parse(source.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(data.name,'ScoreFut');
  assert.equal(data.url,canonical);
  assert.ok(data['@type'].includes('VideoGame'));
  assert.equal(data.author.name,'Indraa');
  assert.equal(data.isAccessibleForFree,true);
  assert.ok(!data.aggregateRating&&!data.review);
});
