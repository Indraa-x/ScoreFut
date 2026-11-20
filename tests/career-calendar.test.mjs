import test from 'node:test';
import assert from 'node:assert/strict';
import {CAREER_LEAGUES} from '../data/career-leagues.js';
import {
  createCareer, CAREER_KEY, CAREER_TEAM, careerFixtures, careerNextCompetition, careerTable, careerTopScorers,
  prepareCareerRound, commitCareerRound, prepareCareerChampionsMatch, commitCareerChampionsMatch,
  updateCareerTransferOffers, advanceCareerSeason,
} from '../js/career.js';
import {careerCalendarEvents,careerCalendarRange,careerCalendarMonth,careerCalendarToday,careerCalendarNext,advanceCareerCalendar,calendarAddDays} from '../js/career-calendar.js';
import {calendarScore,renderCareerCalendar} from '../js/career-calendar-view.js';
import {initCareer} from '../js/career-controller.js';
import * as ui from '../js/ui.js';
const base=()=>createCareer(42,'career26-bundesliga-21');
const art={badge:id=>'<span class="test-crest">'+id+'</span>',name:id=>id};

function manual(career,target){
  let c=career;
  for(let count=0;count<64;count++){
    const next=careerCalendarNext(c);if(!next||next.date>target)break;
    if(careerNextCompetition(c)==='league'){
      const r=prepareCareerRound(c);c=commitCareerRound({...c,replay:{...r,minute:r.tournament.userMatches[0].result.duration}});
    }else{
      const r=prepareCareerChampionsMatch(c);c=commitCareerChampionsMatch({...c,champions:{...c.champions,replay:{...r,minute:r.match.result.duration}}});
    }
    c=updateCareerTransferOffers(c);
  }
  return c;
}

test('all leagues get stable weekly domestic dates, midweek Champions and the correct season year',()=>{
  for(const league of CAREER_LEAGUES){
    const c=createCareer(55,league.teams[0].id),before=structuredClone(c),events=careerCalendarEvents(c);
    assert.equal(events.filter(e=>e.competition==='league').length,careerFixtures(c).length);
    assert.equal(new Set(events.map(e=>e.date)).size,events.length);
    for(const event of events)assert.equal(new Date(event.date+'T00:00:00Z').getUTCDay(),event.competition==='league'?6:2);
    assert.equal(careerCalendarRange(c).start.slice(0,4),'2026');
    assert.equal(careerCalendarRange({...c,season:2}).start.slice(0,4),'2027');
    assert.deepEqual(c,before);
  }
});

test('pending simulated scores stay private and completed results exactly match the table',()=>{
  const c=base(),r=prepareCareerRound(c),pending={...c,replay:{...r,minute:20}};
  assert.equal(careerCalendarEvents(pending).filter(e=>e.result).length,0);
  assert.doesNotMatch(renderCareerCalendar(pending,ui,{},art),/class="career-calendar-day[^"\n]* is-(win|loss|draw)/);
  const done=commitCareerRound({...pending,replay:{...r,minute:r.tournament.userMatches[0].result.duration}});
  const entry=careerCalendarEvents(done).find(e=>e.key==='league:0');
  const recorded=done.results[0].find(m=>[m.home,m.away].includes(CAREER_TEAM));
  assert.deepEqual(entry.result,recorded);
  assert.equal(careerCalendarToday(done),entry.date);
  assert.match(renderCareerCalendar(done,ui,{selected:entry.date,month:entry.date.slice(0,7)},art),new RegExp(calendarScore(entry).text));
});

test('calendar simulation matches sequential league and Champions commits including money, form and scorers',()=>{
  const c=base(),original=structuredClone(c);
  const target=calendarAddDays(careerCalendarRange(c).first,10*7+4);
  const expected=manual(c,target),actual=advanceCareerCalendar(c,target);
  const {calendar,...game}=actual;
  assert.deepEqual(game,expected);
  assert.deepEqual(careerTable(actual),careerTable(expected));
  assert.deepEqual(careerTopScorers(actual),careerTopScorers(expected));
  assert.deepEqual(c,original);
  assert.equal(calendar.day,target);
  assert.equal(advanceCareerCalendar(actual,target),actual);
  assert.deepEqual(careerCalendarEvents(JSON.parse(JSON.stringify(actual))),careerCalendarEvents(actual));
});

test('a full season advances without inventing knockout opponents and next season resets the calendar',()=>{
  let c=base(),range=careerCalendarRange(c);
  assert.equal(careerCalendarEvents(c).filter(e=>e.competition==='champions').length,3);
  c=advanceCareerCalendar(c,range.end);
  assert.equal(c.round,careerFixtures(c).length);
  assert.equal(careerNextCompetition(c),null);
  assert.equal(c.champions.tournament.complete,true);
  assert.ok(careerCalendarEvents(c).every(e=>e.result));
  const next=advanceCareerSeason(c);
  assert.equal(careerCalendarToday(next).slice(0,4),'2027');
  assert.equal(careerCalendarEvents(next).filter(e=>e.result).length,0);
});

test('free days change only the calendar, not money, training or table',()=>{
  const c=base(),next=advanceCareerCalendar(c,calendarAddDays(careerCalendarToday(c),1));
  const {calendar,...same}=next;
  assert.deepEqual(same,c);
  assert.equal(calendar.season,c.season);
});

test('invalid dates and in-progress domestic or Champions games cannot be skipped or double credited',()=>{
  const c=base(),range=careerCalendarRange(c);
  for(const value of ['bad','2026-02-31','9999-01-01',calendarAddDays(range.end,1)])
    assert.throws(()=>advanceCareerCalendar(c,value),/data/);
  const league={...c,replay:prepareCareerRound(c)};
  assert.throws(()=>advanceCareerCalendar(league,range.end),/andamento/);
  const champions={...c,champions:{...c.champions,replay:prepareCareerChampionsMatch(c)}};
  assert.throws(()=>advanceCareerCalendar(champions,range.end),/andamento/);
});

test('month grids include leap days and shootouts use the user perspective without swapping winners',()=>{
  const c={...base(),season:2},model=careerCalendarMonth(c,{month:'2028-02'});
  assert.equal(model.days.filter(day=>!day.outside).length,29);
  assert.ok(model.days.some(day=>day.date==='2028-02-29'));
  const score=calendarScore({homeId:'rival',awayId:CAREER_TEAM,result:{homeGoals:1,awayGoals:1,penalties:[3,4],winnerId:CAREER_TEAM}});
  assert.deepEqual(score,{text:'1–1',penalties:'4–3',outcome:'win'});
});

function controllerFixture(fail=false){
  let saved=base(),writes=0,errors=[];
  const page=initCareer({app:{addEventListener(){},querySelector(){return null;}},ui,
    storage:{read:key=>key==='coach-career-active'?saved.clubId:key===CAREER_KEY+':'+saved.clubId?saved:null,
      write:(key,next)=>{if(fail)return false;saved=next;writes++;return true;}},
    render(){},navigate(){},toast:message=>errors.push(message)});
  page.setTab('calendar');
  return {page,get saved(){return saved;},get writes(){return writes;},errors};
}
test('calendar controller persists one batch, prevents duplicate clicks and retains results on reopening',async()=>{
  const p=controllerFixture(),target=calendarAddDays(careerCalendarRange(p.saved).first,3);
  const action=p.page.actions['career-calendar-advance'](target);
  p.page.actions['career-calendar-advance'](target);
  await action;
  assert.equal(p.writes,1);
  assert.equal(p.saved.round,1);
  assert.match(p.page.open(),/partida concluída/);
  await p.page.actions['career-calendar-advance'](target);
  assert.equal(p.writes,1);
  assert.equal(careerCalendarEvents(p.saved).filter(e=>e.result).length,1);
});
test('calendar persistence failure leaves the original campaign and its results intact',async()=>{
  const p=controllerFixture(true),before=structuredClone(p.saved);
  await p.page.actions['career-calendar-advance'](calendarAddDays(careerCalendarRange(p.saved).first,3));
  assert.deepEqual(p.saved,before);
  assert.equal(p.errors.length,1);
  assert.equal(careerCalendarEvents(p.saved).filter(e=>e.result).length,0);
});

test('calendar opens as a career section from the shared menu and stays hidden on other pages',()=>{
  const p=controllerFixture();
  p.page.setTab('overview');
  const overview=p.page.open();
  assert.match(overview,/<nav[^>]*class="career-tabs[^>]*>[\s\S]*data-value="calendar"[\s\S]*<\/nav>/);
  assert.doesNotMatch(overview,/class="career-calendar career-calendar-page"/);
  p.page.actions['career-tab']('calendar');
  const html=p.page.open();
  assert.equal(p.page.tab,'calendar');
  assert.match(html,/data-value="calendar" aria-current="page"/);
  assert.match(html,/data-career-tab="calendar">[\s\S]*class="career-calendar career-calendar-page"/);
  assert.doesNotMatch(html,/<aside[\s\S]*class="career-calendar career-calendar-page"[\s\S]*<\/aside>/);
  assert.equal(p.writes,0);
});
