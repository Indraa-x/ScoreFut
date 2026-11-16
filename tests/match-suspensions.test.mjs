import assert from 'node:assert/strict';
import test from 'node:test';
import {allSquads} from '../data/clubs.js';
import {careerLeague} from '../data/career-leagues.js';
import {CAREER_TEAM, createCareer, prepareCareerRound, commitCareerRound, prepareCareerChampionsMatch, commitCareerChampionsMatch} from '../js/career.js';
import {createTournament, matchTeams, playNextRound, SIMULATION_SETTINGS, squadTeam} from '../js/engine.js';
import {createFriendTournament} from '../js/friend-tournament.js';
import {currentMatch, prepareUserRound} from '../js/match-session.js';
import {renderLivePitch} from '../js/match-view.js';
import {escapeHtml as esc} from '../js/html.js';
import {icon, pitchLines} from '../js/ui.js';

const roundTrip = value => JSON.parse(JSON.stringify(value));
const userSide = (match, id) => match.homeId === id ? 'home' : 'away';
const includesPlayer = (team, player) => team.lineup.some(entry => entry.player.id === player.id);

function eject(match, side, player) {
  match.result.events.push({type: 'red', team: side, player, minute: match.result.duration - 1});
}

function checkAbsence(match, side, player) {
  assert.ok(match.result.events.every(event =>
    !(event.team === side && event.player?.id === player.id)
    && !(event.offendingTeam === side && event.offender?.id === player.id)));
}

test('the standard simulator suspends a player for the next fixture only, including in the replay', () => {
  const user = {...squadTeam(allSquads[0]), id: 'user', clubId: 'user', reserves: []};
  const tournament = playNextRound(createTournament(user, allSquads, {mode: 'champions', seed: 42}));
  const first = tournament.userMatches[0];
  const player = user.lineup.find(entry => entry.slot.position !== 'GOL').player;
  const side = userSide(first, user.id);
  first.result.events = first.result.events.filter(event => event.type !== 'red' || event.team !== side);
  eject(first, side, player);

  const state = prepareUserRound(roundTrip(tournament));
  const second = currentMatch(state);
  const nextSide = userSide(second, user.id);
  const nextTeam = matchTeams(state.tournament, second).find(team => team.id === user.id);
  assert.equal(nextTeam.lineup.length, 10);
  assert.ok(!includesPlayer(nextTeam, player));
  checkAbsence(second, nextSide, player);
  const pitch = renderLivePitch({...state, matchMinute: 0}, {esc, icon, pitchLines});
  assert.match(pitch, /Suspensos nesta partida/);
  const third = playNextRound(roundTrip(state.pendingRound));
  assert.ok(includesPlayer(matchTeams(third, third.userMatches[2]).find(team => team.id === user.id), player));
});

test('the career league uses an available reserve and stores the ban across save and reload', () => {
  let career = createCareer(42, careerLeague('brasileirao').teams.find(team => team.nome === 'Palmeiras').id);
  const replay = prepareCareerRound(career);
  const team = replay.tournament.teams.find(team => team.id === CAREER_TEAM);
  const [starter] = team.lineup.filter(entry => entry.slot.position !== 'GOL');
  const match = replay.tournament.userMatches[0];
  const side = userSide(match, CAREER_TEAM);
  match.result.events = match.result.events.filter(event => event.type !== 'red' || event.team !== side);
  eject(match, side, starter.player);
  career = commitCareerRound({...career, replay: {...replay, minute: match.result.duration}});
  career = roundTrip({...career, replay: null});

  const second = prepareCareerRound(career);
  const selected = second.tournament.teams.find(team => team.id === CAREER_TEAM);
  assert.equal(selected.lineup.length, 11);
  assert.ok(!includesPlayer(selected, starter.player));
  checkAbsence(second.tournament.userMatches[0], userSide(second.tournament.userMatches[0], CAREER_TEAM), starter.player);
  career = commitCareerRound({...career, replay: {...second, minute: second.tournament.userMatches[0].result.duration}});
  const third = prepareCareerRound(career);
  assert.ok(includesPlayer(third.tournament.teams.find(team => team.id === CAREER_TEAM), starter.player));
});

test('the career Champions keeps red cards when its saved results discard the event log', () => {
  let career = createCareer(42, careerLeague('bundesliga').teams.find(team => team.nome === 'Bayern Munich').id);
  const replay = prepareCareerChampionsMatch(career);
  const {match} = replay;
  const previous = replay.pending.matches.find(game => game.id === match.id);
  const team = matchTeams(replay.pending, match).find(team => team.id === CAREER_TEAM);
  const player = team.lineup.find(entry => entry.slot.position !== 'GOL').player;
  const side = userSide(match, CAREER_TEAM);
  delete previous.result.expulsions;
  eject(match, side, player);
  career = roundTrip(commitCareerChampionsMatch({...career, champions: {...career.champions,
    replay: {...replay, minute: match.result.duration}}}));
  const second = prepareCareerChampionsMatch(career);
  assert.ok(!includesPlayer(matchTeams(second.pending, second.match).find(team => team.id === CAREER_TEAM), player));
  checkAbsence(second.match, userSide(second.match, CAREER_TEAM), player);
});

test('a red card in the first leg also keeps players out of the return in a friend challenge', () => {
  const [home, away] = allSquads.slice(0, 2).map(squad => squadTeam(squad));
  const tournament = createFriendTournament([home, away], {
    seed: 42, settings: {...SIMULATION_SETTINGS, redCardChance: 1},
  });
  const [first, second] = tournament.userMatches;
  const sentOff = first.result.events.filter(event => event.type === 'red');
  assert.ok(sentOff.length);
  for (const event of sentOff) {
    const id = event.team === 'home' ? first.homeId : first.awayId;
    assert.ok(!includesPlayer(matchTeams(tournament, second).find(team => team.id === id), event.player));
    checkAbsence(second, userSide(second, id), event.player);
  }
});
