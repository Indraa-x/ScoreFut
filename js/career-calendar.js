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
  return {first,start:calendarAddDays(first,-3),end:calendarAddDays(first,7*(careerFixtures(career).length-1)+4)};
}
function fixtureDay(first, competition, round) {
  return calendarAddDays(first,competition==='league' ? (round-1)*7
    : ((CAREER_CHAMPIONS_MATCHDAYS[round-1]??(30+(round-10)*2))-1)*7+3);
}
export function careerCalendarEvents(career) {
  const {first}=careerCalendarRange(career);
  const league=careerFixtures(career).map((fixtures,index)=>{
    const [homeId,awayId]=fixtures.find(pair=>pair.includes(CAREER_TEAM));
    const result=index<career.round ? career.results[index]?.find(game=>[game.home,game.away].includes(CAREER_TEAM))??null : null;
    return {key:'league:'+index,date:fixtureDay(first,'league',index+1),competition:'league',round:index+1,
      homeId,awayId,opponentId:homeId===CAREER_TEAM?awayId:homeId,result};
  });
  const european=(career.champions?.tournament?.matches??[])
    .filter(match=>Number.isInteger(match.round)&&match.round>0&&[match.homeId,match.awayId].includes(CAREER_TEAM))
    .map(match=>({key:'champions:'+match.id,date:fixtureDay(first,'champions',match.round),competition:'champions',
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
  let next=career;
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
  return {...next,calendar:{season:career.season,day:target}};
}
