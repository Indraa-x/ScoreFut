import {escapeHtml as esc} from './html.js';
import {CAREER_TEAM, careerCompetitionName} from './career.js';
import {careerCalendarMonth} from './career-calendar.js';

const date = value => new Date(value+'T00:00:00Z');
const shortDate = value => new Intl.DateTimeFormat('pt-BR',{day:'numeric',month:'short',timeZone:'UTC'}).format(date(value)).replaceAll('.','');
const longDate = value => new Intl.DateTimeFormat('pt-BR',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(date(value));
export function calendarScore(event) {
  if(!event?.result)return null;
  const {homeGoals,awayGoals,penalties,winnerId}=event.result,home=event.homeId===CAREER_TEAM;
  const own=home?homeGoals:awayGoals,rival=home?awayGoals:homeGoals;
  return {text:own+'–'+rival,penalties:penalties?(home?penalties:[penalties[1],penalties[0]]).join('–'):null,
    outcome:own>rival?'win':own<rival?'loss':penalties&&winnerId?winnerId===CAREER_TEAM?'win':'loss':'draw'};
}
export function renderCareerCalendar(career,ui,input={}, {badge,name}) {
  const model=careerCalendarMonth(career,input),{month,today,selected,days,events,pending}=model;
  const chosen=events.find(event=>event.date===selected),score=calendarScore(chosen);
  const competition=event=>event.competition==='champions'?'Champions League':careerCompetitionName(career);
  const describe=event=>`${event.homeId===CAREER_TEAM?'Em casa':'Fora'} contra ${name(event.opponentId)} · ${competition(event)}`;
  return `<section class="career-calendar career-calendar-page" aria-labelledby="career-calendar-title"${input.busy?' aria-busy="true"':''}>
    <header><h2 id="career-calendar-title">Calendário</h2><span>${longDate(input.cursor??today)}</span></header>
    <div class="career-calendar-body">
      <div class="career-calendar-month-view">
      <div class="career-calendar-month"><button type="button" data-action="career-calendar-month" data-value="${model.previous}" aria-label="Mês anterior"${month<=model.firstMonth||input.busy?' disabled':''}>${ui.icon('back')}</button><h3>${new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric',timeZone:'UTC'}).format(date(month+'-01'))}</h3><button type="button" data-action="career-calendar-month" data-value="${model.nextMonth}" aria-label="Próximo mês"${month>=model.lastMonth||input.busy?' disabled':''}>${ui.icon('arrow')}</button></div>
      <div class="career-calendar-shortcuts"><button type="button" data-action="career-calendar-today"${input.busy?' disabled':''}>Hoje</button>${model.next?'<button type="button" data-action="career-calendar-next"'+(input.busy?' disabled':'')+'>Próximo jogo '+ui.icon('arrow')+'</button>':''}</div>
      <div class="career-calendar-week" aria-hidden="true">${['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map(day=>'<span>'+day+'</span>').join('')}</div>
      <div class="career-calendar-days" role="group" aria-label="Dias do mês">${days.map(day=>{
        const result=calendarScore(day.event);
        const label=longDate(day.date)+(day.event?' · '+describe(day.event)+(result?' · Seu time '+result.text+(result.penalties?' · Pênaltis '+result.penalties:''):' · A jogar'):' · Sem partida');
        return `<button type="button" class="career-calendar-day${day.outside?' is-outside':''}${day.event?' is-match is-'+day.event.competition:''}${result?' is-'+result.outcome:''}${day.date===today?' is-today':''}${input.busy&&input.cursor===day.date?' is-advancing':''}" data-action="career-calendar-day" data-value="${day.date}"${day.event?` data-competition="${esc(day.event.competition==='champions'?'champions':career.leagueId??'league')}"`:''} aria-label="${esc(label)}" title="${esc(label)}" aria-pressed="${day.date===selected}"${day.date===today?' aria-current="date"':''}${day.disabled||input.busy?' disabled':''}><span>${day.number}</span>${day.event?`<span class="career-calendar-day-crest" aria-hidden="true">${badge(day.event.opponentId)}</span><b>${result?result.text:day.event.competition==='champions'?'UCL':'LIGA'}</b>`:''}</button>`;
      }).join('')}</div>
      </div><div class="career-calendar-day-view"><div class="career-calendar-selection" role="status"><span>${longDate(selected)}</span>${chosen?`<div>${badge(chosen.opponentId)}<strong>${esc(name(chosen.opponentId))}</strong>${score?`<b class="is-${score.outcome}">${score.text}</b>`:''}</div><small>${chosen.homeId===CAREER_TEAM?'Em casa':'Fora'} · ${esc(competition(chosen))}${score?.penalties?' · Pênaltis '+score.penalties:''}</small>`:'<p>Sem partida marcada.</p>'}</div>
      <button type="button" class="btn btn-primary career-calendar-advance" data-action="career-calendar-advance" data-value="${selected}"${selected<=today||pending||input.busy?' disabled':''}>${ui.icon(input.busy?'clock':'skip')}${input.busy?'Avançando · '+shortDate(input.cursor??today):'Avançar até '+shortDate(selected)}</button>
      ${input.busy?`<div class="career-calendar-progress" role="progressbar" aria-label="Avanço até ${shortDate(input.target)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${input.progress??0}"><span style="width:${input.progress??0}%"></span></div><div class="career-calendar-travel"><small>Até ${shortDate(input.target)}</small><button type="button" data-action="career-calendar-stop">Parar avanço</button></div>`:''}
      ${pending?'<small class="career-calendar-feedback">Conclua a partida em andamento.</small>':input.message?`<small class="career-calendar-feedback" role="status">${esc(input.message)}</small>`:''}
      </div>
    </div>
  </section>`;
}
