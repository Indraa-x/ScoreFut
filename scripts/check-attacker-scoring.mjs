import {careerLeague} from '../data/career-leagues.js';
import {createCareer,careerPicks} from '../js/career.js';
import {calculateTeam,simulateMatch,mulberry32} from '../js/engine.js';
const league=careerLeague('laliga'),real=league.teams.find(t=>t.nome==='Real Madrid');
const team=club=>{const career=createCareer(42,club.id),lineup=careerPicks(career);return{id:club.id,name:club.nome,lineup,strength:calculateTeam(lineup)};};
const home=team(real),opponents=league.teams.filter(t=>t.id!==real.id).map(team);
let goals=0,star=0,low=0;
const seasons=40,totals=[];
for(let season=0;season<seasons;season++){
 let tally=0;
 for(const [i,away]of opponents.entries())for(let leg=0;leg<2;leg++){
  const result=simulateMatch(leg?away:home,leg?home:away,mulberry32(season*1000+i*2+leg+1));
  for(const event of result.events.filter(e=>e.type==='goal'&&e.team===(leg?'away':'home'))){goals++;if(event.player.nome.includes('Mbapp')){star++;tally++;}}
 }
 totals.push(tally);if(tally<5)low++;
}
console.log(JSON.stringify({seasons,mbappePerSeason:star/seasons,teamGoalsPerSeason:goals/seasons,share:star/goals,seasonsUnderFive:low,min:Math.min(...totals),max:Math.max(...totals)}));
