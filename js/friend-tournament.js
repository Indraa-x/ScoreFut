import {hashSeed,mulberry32,resolveKnockoutTie,simulateMatch,SIMULATION_SETTINGS} from './engine.js';

const labels={semi:'Semifinal',final:'Final'};

function playStage(tournament,stage,pairings,firstRound){
  const rng=mulberry32(tournament.rngState);
  const ties=pairings.map(([homeId,awayId],index)=>({
    id:`${stage}-tie-${index+1}`,teamIds:[homeId,awayId],winnerId:null,aggregate:null,bye:false,matchIds:[],
  }));
  const fixtures=[];
  for(const [leg,round] of [[1,firstRound],[2,firstRound+1]]){
    const matches=ties.map((tie,index)=>{
      const [first,second]=tie.teamIds;
      const homeId=leg===1?first:second,awayId=leg===1?second:first;
      const title=stage==='semi'?`${labels[stage]} ${index+1}`:labels[stage];
      const match={id:`${tie.id}-${leg}`,tieId:tie.id,stage,leg,stageLabel:`${title} · ${leg===1?'Ida':'Volta'}`,homeId,awayId,round,neutral:false,result:null};
      tie.matchIds.push(match.id);return match;
    });
    fixtures.push(...matches);
    if(leg===1){
      for(const match of matches){
        const home=tournament.teams.find(team=>team.id===match.homeId),away=tournament.teams.find(team=>team.id===match.awayId);
        match.result=simulateMatch(home,away,rng,{knockout:false,extraTimeAllowed:false,stoppageTimeAllowed:true,mode:'friends',settings:tournament.settings});
      }
    }else{
      for(const match of matches){
        const home=tournament.teams.find(team=>team.id===match.homeId),away=tournament.teams.find(team=>team.id===match.awayId);
        const first=fixtures.find(previous=>previous.id===match.id.replace(/-2$/,'-1'));
        const aggregateDraw=scores=>first.result.awayGoals+scores[0]===first.result.homeGoals+scores[1];
        match.result=simulateMatch(home,away,rng,{knockout:false,extraTimeAllowed:true,extraTimeTrigger:aggregateDraw,stoppageTimeAllowed:true,mode:'friends',settings:tournament.settings});
        const resolved=resolveKnockoutTie(first,match,home,away,rng,tournament.settings);
        const tie=ties.find(item=>item.id===match.tieId);
        match.result=resolved.result;tie.winnerId=resolved.winnerId;tie.aggregate=[resolved.aggregate[1],resolved.aggregate[0]];
      }
    }
  }
  tournament.matches.push(...fixtures);
  tournament.bracket.push({stage,label:labels[stage],ties,matches:fixtures});
  tournament.rngState=rng.getState();
  return {ties,matches:fixtures};
}

/** Build and simulate a two- or four-player, two-legged friend tournament. */
export function createFriendTournament(teams,{seed,settings=SIMULATION_SETTINGS}={}){
  if(!Array.isArray(teams)||![2,4].includes(teams.length)||new Set(teams.map(team=>team.id)).size!==teams.length){
    throw new Error('O desafio precisa ter dois ou quatro times diferentes.');
  }
  const tournament={mode:'friends',friendsTournament:true,seed:hashSeed(seed),rngState:hashSeed(seed),settings:{...settings},
    userTeamId:teams[0].id,teams:[...teams],groups:[],matches:[],bracket:[],cupStages:teams.length===2?['final']:['semi','final'],
    progressRound:0,userMatches:[],championId:null,complete:false};
  let finalists;
  if(teams.length===4){
    const semi=playStage(tournament,'semi',[[teams[0].id,teams[3].id],[teams[1].id,teams[2].id]],1);
    finalists=semi.ties.map(tie=>tie.winnerId);
  }else finalists=teams.map(team=>team.id);
  const final=playStage(tournament,'final',[finalists],teams.length===4?3:1);
  tournament.championId=final.ties[0].winnerId;tournament.complete=true;
  tournament.userMatches=[...tournament.matches];
  tournament.progressRound=teams.length===4?4:2;
  return tournament;
}
