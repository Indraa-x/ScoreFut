import {
  CAREER_TEAM, CAREER_CHAMPIONS_MATCHDAYS, careerFixtures, careerChampionsFixture, careerNextCompetition,
  prepareCareerRound, commitCareerRound, prepareCareerChampionsMatch, commitCareerChampionsMatch,
  updateCareerTransferOffers,
} from './career.js';

const DAY = 86400000;
const iso = date => new Date(date).toISOString().slice(0, 10);
export const calendarAddDays = (day, amount) => iso(Date.parse(day+'T00:00:00Z') + amount * DAY);
export function calendarValidDay(day) {
  return typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day)
    && Number.isFinite(Date.parse(day+'T00:00:00Z')) && iso(Date.parse(day+'T00:00:00Z')) === day;
}

// Campaign dates follow the existing fixture order, not a live federation calendar.
export function careerCalendarRange(career) {
  const year=2025+career.season, european=career.leagueId && career.leagueId!=='brasileirao';
  const anchor=new Date(Date.UTC(year,european?7:0,european?15:24));
  const first=iso(anchor.getTime()+((6-anchor.getUTCDay()+7)%7)*DAY);
  const stored=career.calendar?.season===career.season?career.calendar.schedule:null;
  const last=stored?[...stored.league,...stored.champions].filter(calendarValidDay).sort().at(-1):null;
  const end=calendarAddDays(first,7*(careerFixtures(career).length-1)+4);
  return {first,start:calendarAddDays(first,-3),end:last&&last>end?last:end};
}
function legacyFixtureDay(first, competition, round) {
  return calendarAddDays(first,competition==='league' ? (round-1)*7
    : ((CAREER_CHAMPIONS_MATCHDAYS[round-1]??(30+(round-10)*2))-1)*7+3);
}
const scheduleHash = value => [...String(value)].reduce((hash,char)=>(Math.imul(hash,31)+char.charCodeAt(0))>>>0,7);
function calendarSchedule(career) {
  const range=careerCalendarRange(career),saved=career.calendar?.season===career.season?career.calendar:null;
  if(saved?.version===2&&saved.schedule)return saved.schedule;
  const count=careerFixtures(career).length,league=[],champions=[];
  const legacy=saved?.version!==2&&(career.round>0||saved?.day||career.champions?.tournament?.matches.some(match=>match.result));
  const playedChampions=new Set((career.champions?.tournament?.matches??[]).filter(match=>match.result).map(match=>match.round));
  const activeChampions=career.champions?.replay?.match?.round;
  const before=new Set(career.champions?CAREER_CHAMPIONS_MATCHDAYS:[]);
  const hash=scheduleHash(career.seed+':'+career.clubId+':'+career.season);
  const pattern=[0,1,-1,1,0,-3,2,0,1,-1,0,1];
  const entries=[];
  for(let round=1;round<=count;round++){
    let offset=pattern[(round-1+hash)%pattern.length];
    if(before.has(round))offset=Math.min(offset,0);
    if(before.has(round-1))offset=Math.max(offset,0);
    entries.push({competition:'league',round,order:round*2,candidate:calendarAddDays(range.first,(round-1)*7+offset),
      fixed:legacy&&(round<=career.round||career.replay?.season===career.season&&career.replay.round===round-1)});
  }
  for(let round=1;round<=CAREER_CHAMPIONS_MATCHDAYS.length;round++){
    entries.push({competition:'champions',round,order:CAREER_CHAMPIONS_MATCHDAYS[round-1]*2+1,
      candidate:calendarAddDays(range.first,(CAREER_CHAMPIONS_MATCHDAYS[round-1]-1)*7+3+(hash+round)%2),
      fixed:legacy&&(playedChampions.has(round)||activeChampions===round)});
  }
  let cursor=range.start;
  if(legacy){
    for(const entry of entries)if(entry.fixed){
      entry.date=legacyFixtureDay(range.first,entry.competition,entry.round);
      if(entry.date>cursor)cursor=entry.date;
    }
    if(calendarValidDay(saved?.day)&&saved.day>cursor&&saved.day<=range.end)cursor=saved.day;
  }
  for(const entry of entries.sort((a,b)=>a.order-b.order)){
    if(!entry.fixed){
      // Reserve European midweek slots only for campaigns that participate.
      const reserve=entry.competition==='league'||Boolean(career.champions&&(!legacy||!career.champions.tournament.complete));
      const earliest=calendarAddDays(cursor,3);
      entry.date=reserve&&entry.candidate<earliest?earliest:entry.candidate;
      if(reserve)cursor=entry.date;
    }
    (entry.competition==='league'?league:champions)[entry.round-1]=entry.date;
  }
  return {league,champions};
}
export function migrateCareerCalendar(career) {
  if(career.calendar?.season===career.season&&career.calendar.version===2)return career;
  const schedule=calendarSchedule(career);
  const day=career.calendar?.season===career.season&&calendarValidDay(career.calendar.day)?career.calendar.day:undefined;
  return {...career,calendar:{season:career.season,version:2,schedule,...(day?{day}:{})}};
}
export function careerCalendarEvents(career) {
  const schedule=calendarSchedule(career);
  const league=careerFixtures(career).map((fixtures,index)=>{
    const [homeId,awayId]=fixtures.find(pair=>pair.includes(CAREER_TEAM));
    const result=index<career.round ? career.results[index]?.find(game=>[game.home,game.away].includes(CAREER_TEAM))??null : null;
    return {key:'league:'+index,date:schedule.league[index],competition:'league',round:index+1,
      homeId,awayId,opponentId:homeId===CAREER_TEAM?awayId:homeId,result};
  });
  const european=(career.champions?.tournament?.matches??[])
    .filter(match=>Number.isInteger(match.round)&&match.round>0&&[match.homeId,match.awayId].includes(CAREER_TEAM))
    .map(match=>({key:'champions:'+match.id,date:schedule.champions[match.round-1]??legacyFixtureDay(careerCalendarRange(career).first,'champions',match.round),competition:'champions',
      round:match.round,homeId:match.homeId,awayId:match.awayId,
      opponentId:match.homeId===CAREER_TEAM?match.awayId:match.homeId,result:match.result??null}));
  return [...league,...european].sort((a,b)=>a.date.localeCompare(b.date));
}
export function careerCalendarPending(career) {
  return Boolean(career.replay?.round===career.round&&career.replay.season===career.season || career.champions?.replay);
}
export function careerCalendarToday(career,events=careerCalendarEvents(career)) {
  const range=careerCalendarRange(career);
  let day=career.calendar?.season===career.season&&calendarValidDay(career.calendar.day)
    ? career.calendar.day : range.start;
  for(const event of events)if(event.result&&event.date>day)day=event.date;
  return day<range.start?range.start:day>range.end?range.end:day;
}
export function careerCalendarNext(career,events=careerCalendarEvents(career)) {
  const competition=careerNextCompetition(career);
  const key=competition==='league'?'league:'+career.round:competition==='champions'?'champions:'+careerChampionsFixture(career).id:null;
  return events.find(event=>event.key===key)??null;
}
export function careerCalendarMonth(career,input={}) {
  const range=careerCalendarRange(career),events=careerCalendarEvents(career),today=careerCalendarToday(career,events);
  const firstMonth=range.start.slice(0,7),lastMonth=range.end.slice(0,7);
  const requested=/^\d{4}-\d{2}$/.test(input.month??'')&&calendarValidDay(input.month+'-01')?input.month:null;
  const month=requested&&requested>=firstMonth&&requested<=lastMonth?requested:today.slice(0,7);
  const selected=calendarValidDay(input.selected)&&input.selected>=range.start&&input.selected<=range.end ? input.selected : today;
  const first=month+'-01',weekday=(new Date(first+'T00:00:00Z').getUTCDay()+6)%7;
  const beginning=calendarAddDays(first,-weekday);
  const nextMonth=iso(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5,7)),1));
  const daysInMonth=new Date(Date.parse(nextMonth+'T00:00:00Z')-DAY).getUTCDate();
  const cells=Math.ceil((weekday+daysInMonth)/7)*7;
  const days=Array.from({length:cells},(_,index)=>{
    const date=calendarAddDays(beginning,index);
    return {date,number:Number(date.slice(-2)),outside:date.slice(0,7)!==month,
      disabled:date<range.start||date>range.end,event:events.find(event=>event.date===date)??null};
  });
  return {range,events,today,month,selected,days,next:careerCalendarNext(career,events),pending:careerCalendarPending(career),
    previous:iso(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5,7))-2,1)).slice(0,7),nextMonth:nextMonth.slice(0,7),
    firstMonth,lastMonth};
}
export function advanceCareerCalendar(career,target) {
  const range=careerCalendarRange(career),today=careerCalendarToday(career);
  if(!calendarValidDay(target)||target<range.start||target>range.end)throw Error('Escolha uma data desta temporada.');
  if(target<=today)return career;
  if(careerCalendarPending(career))throw Error('Conclua a partida em andamento antes de avançar o calendário.');
  let next=migrateCareerCalendar(career);
  for(let count=0;count<64;count++){
    const fixture=careerCalendarNext(next);
    if(!fixture||fixture.date>target)break;
    const before=next;
    if(fixture.competition==='league'){
      const replay=prepareCareerRound(next);
      next=commitCareerRound({...next,replay:{...replay,minute:replay.tournament.userMatches[0].result.duration}});
    }else{
      const replay=prepareCareerChampionsMatch(next);
      next=commitCareerChampionsMatch({...next,champions:{...next.champions,replay:{...replay,minute:replay.match.result.duration,penaltyReplay:null}}});
    }
    if(next.round===before.round&&next.champions?.tournament===before.champions?.tournament)
      throw Error('Não foi possível concluir a partida do calendário.');
    next=updateCareerTransferOffers(next);
  }
  return {...next,calendar:{...next.calendar,season:career.season,day:target}};
}
