import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

test('Mbappé receives an elite attacking share over 40 real Madrid league seasons', () => {
  const result = JSON.parse(execFileSync(process.execPath, ['scripts/check-attacker-scoring.mjs'], {
    cwd: new URL('..', import.meta.url), encoding: 'utf8',
  }));
  assert.equal(result.seasons, 40);
  assert.ok(result.mbappePerSeason >= 18 && result.mbappePerSeason < 32, JSON.stringify(result));
  assert.ok(result.share > .28 && result.share < .5, JSON.stringify(result));
  assert.equal(result.seasonsUnderFive, 0);
  // Goal attribution must preserve the existing live configuration's team score budget.
  assert.equal(Math.round(result.teamGoalsPerSeason * result.seasons), 2836);
});
