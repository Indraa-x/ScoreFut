import test from 'node:test';
import assert from 'node:assert/strict';
import {CAREER_LEAGUES} from '../data/career-leagues.js';
import {
  createCareer, CAREER_KEY, CAREER_TEAM, careerFixtures, careerNextCompetition, careerTable, careerTopScorers,
  prepareCareerRound, commitCareerRound, prepareCareerChampionsMatch, commitCareerChampionsMatch,
  updateCareerTransferOffers, advanceCareerSeason,
} from '../js/career.js';
import {careerCalendarEvents,careerCalendarRange,careerCalendarMonth,careerCalendarToday,careerCalendarNext,advanceCareerCalendar,calendarAddDays,migrateCareerCalendar} from '../js/career-calendar.js';
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

test('all leagues get varied domestic dates, midweek Champions and the correct season year',()=>{
  for(const league of CAREER_LEAGUES){
    const c=createCareer(55,league.teams[0].id),before=structuredClone(c),events=careerCalendarEvents(c);
    assert.equal(events.filter(e=>e.competition==='league').length,careerFixtures(c).length);
    assert.equal(new Set(events.map(e=>e.date)).size,events.length);
    const leagueDays=new Set(events.filter(e=>e.competition==='league').map(e=>new Date(e.date+'T00:00:00Z').getUTCDay()));
    assert.ok(leagueDays.size>=3);
    for(const event of events.filter(e=>e.competition==='champions'))assert.ok([2,3].includes(new Date(event.date+'T00:00:00Z').getUTCDay()));
    for(let index=1;index<events.length;index++)assert.ok((Date.parse(events[index].date)-Date.parse(events[index-1].date))/86400000>=3);
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
  const {calendar:expectedCalendar,...expectedGame}=expected;
  assert.deepEqual(game,expectedGame);
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
  const {calendar:originalCalendar,...originalGame}=c;
  assert.deepEqual(same,originalGame);
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

function controllerFixture(fail=false,options={}){
  let saved=base(),writes=0,errors=[];
  const page=initCareer({app:{addEventListener(){},querySelector(){return null;}},ui,
    storage:{read:key=>key==='coach-career-active'?saved.clubId:key===CAREER_KEY+':'+saved.clubId?saved:null,
      write:(key,next)=>{if(fail)return false;saved=next;writes++;return true;}},
    calendarWait:async()=>{},calendarReducedMotion:()=>false,render(){},navigate(){},toast:message=>errors.push(message),...options});
  page.setTab('calendar');
  return {page,get saved(){return saved;},get writes(){return writes;},errors};
}
test('calendar controller persists progress, prevents duplicate clicks and retains results on reopening',async()=>{
  const p=controllerFixture(),target=calendarAddDays(careerCalendarRange(p.saved).first,3);
  const action=p.page.actions['career-calendar-advance'](target);
  p.page.actions['career-calendar-advance'](target);
  await action;
  assert.equal(p.writes,2);
  assert.equal(p.saved.round,1);
  assert.match(p.page.open(),/partida concluída/);
  await p.page.actions['career-calendar-advance'](target);
  assert.equal(p.writes,2);
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

test('existing campaigns keep completed dates and results while future fixtures vary and stay fixed after migration',()=>{
  let old=base();delete old.calendar;
  for(let index=0;index<7;index++){
    const r=prepareCareerRound(old);old=commitCareerRound({...old,replay:{...r,minute:r.tournament.userMatches[0].result.duration}});
  }
  const first=careerCalendarRange(old).first,cutoff=calendarAddDays(first,6*7+1);
  old={...old,calendar:{season:old.season,day:cutoff}};
  const before=structuredClone(old),next=migrateCareerCalendar(old);
  const past=careerCalendarEvents(next).filter(e=>e.competition==='league'&&e.result);
  assert.equal(past.length,7);
  for(const e of past)assert.equal(e.date,calendarAddDays(first,(e.round-1)*7));
  assert.deepEqual(old,before);
  assert.deepEqual(next.results,old.results);
  assert.equal(migrateCareerCalendar(next),next);
  const future=careerCalendarEvents(next).filter(e=>!e.result);
  assert.ok(future.every(e=>e.date>cutoff));
  const played=advanceCareerCalendar(next,calendarAddDays(cutoff,30));
  const dates=new Map(careerCalendarEvents(played).map(e=>[e.key,e.date]));
  for(const e of careerCalendarEvents(next))assert.equal(dates.get(e.key),e.date);
});

test('every club gets repeatable varied dates without changing the actual order of fixtures',()=>{
  for(const league of CAREER_LEAGUES)for(const club of league.teams){
    const c=createCareer(14,club.id),events=careerCalendarEvents(c);
    assert.deepEqual(careerCalendarEvents(JSON.parse(JSON.stringify(c))),events);
    const domestic=events.filter(e=>e.competition==='league');
    assert.ok(new Set(domestic.map(e=>new Date(e.date+'T00:00:00Z').getUTCDay())).size>=3);
    assert.deepEqual(domestic.map(e=>e.round),Array.from({length:domestic.length},(_,i)=>i+1));
    for(let i=1;i<events.length;i++)assert.ok(Date.parse(events[i].date)-Date.parse(events[i-1].date)>=3*86400000);
  }
});

test('animated advance visits every day across month boundaries and reveals only reached matches',async()=>{
  const waits=[],frames=[];let p;
  p=controllerFixture(false,{calendarWait:async ms=>{waits.push(ms);},render(){if(p)frames.push(p.page.open());}});
  const start=careerCalendarToday(p.saved),target=calendarAddDays(start,24);
  await p.page.actions['career-calendar-advance'](target);
  const visited=frames.map(html=>html.match(/class="career-calendar-day[^"\n]* is-advancing" data-action="career-calendar-day" data-value="([^"]+)"/)?.[1]).filter(Boolean);
  assert.deepEqual([...new Set(visited)],Array.from({length:25},(_,i)=>calendarAddDays(start,i)));
  assert.ok(waits.every(ms=>ms>0));
  assert.equal(careerCalendarToday(p.saved),target);
  assert.ok(frames.some(html=>html.includes('aria-label="Avanço até')));
  assert.doesNotMatch(p.page.open(),/is-advancing|aria-busy="true"/);
});

test('stopping an animation preserves the reached day and never commits later games',async()=>{
  let release,p;
  p=controllerFixture(false,{calendarWait:()=>new Promise(resolve=>{release=resolve;})});
  const start=careerCalendarToday(p.saved),target=calendarAddDays(start,25);
  const action=p.page.actions['career-calendar-advance'](target);
  release();await new Promise(resolve=>setImmediate(resolve));
  p.page.actions['career-calendar-stop']();
  release();await action;
  assert.equal(careerCalendarToday(p.saved),calendarAddDays(start,1));
  assert.equal(p.saved.round,0);
  assert.doesNotMatch(p.page.open(),/aria-busy="true"/);
});

test('reduced motion goes directly to the requested day with identical real results',async()=>{
  let waits=0;
  const p=controllerFixture(false,{calendarReducedMotion:()=>true,calendarWait:async()=>{waits++;}});
  const target=calendarAddDays(careerCalendarToday(p.saved),40),expected=advanceCareerCalendar(p.saved,target);
  await p.page.actions['career-calendar-advance'](target);
  assert.equal(waits,1);assert.equal(p.writes,1);
  assert.deepEqual(p.saved,expected);
});
