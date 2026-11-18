import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {CAREER_LEAGUES} from '../data/career-leagues.js';
import {EUROPEAN_PORTRAITS} from '../data/career-2026/european-portraits.js';
import {careerPortraitUrl} from '../data/career-2026/player-portraits.js';
const sources = JSON.parse(fs.readFileSync(new URL('../data/career-2026/european-portrait-sources.json', import.meta.url))).players;
const players = CAREER_LEAGUES.filter(league => league.id !== 'brasileirao').flatMap(league => league.teams.flatMap(team => team.jogadores));

test('all 455 replacement portraits resolve for the matching European player', () => {
  assert.equal(EUROPEAN_PORTRAITS.size, 455);
  assert.equal(sources.length, 455);
  assert.equal(new Set(sources.map(source => source.id)).size, 455);
  for (const source of sources) {
    const player = players.find(player => player.id === source.id);
    assert.ok(player, `Missing player: ${source.name}`);
    assert.equal(player.nome, source.name, `Identity mismatch: ${source.id}`);
    assert.equal(careerPortraitUrl(player), source.image);
    assert.equal(new URL(source.image).protocol, 'https:');
    assert.equal(new URL(source.source).protocol, 'https:');
    assert.doesNotMatch(source.image, /default|silhouette|placeholder/i);
  }
});

test('the European catalog keeps photo coverage across all four leagues', () => {
  assert.equal(players.length, 2286);
  assert.ok(players.every(player => careerPortraitUrl(player)));
  for (const league of CAREER_LEAGUES.filter(league => league.id !== 'brasileirao')) {
    assert.ok(league.teams.some(team => team.jogadores.some(player => EUROPEAN_PORTRAITS.has(player.id))), league.name);
  }
  const haaland = players.find(player => player.nome === 'Erling Haaland');
  assert.match(careerPortraitUrl(haaland), /ratings-images-prod\.pulse\.ea\.com\/FC25\//);
  assert.equal(careerPortraitUrl({id: 'unknown-player'}), null);
});
