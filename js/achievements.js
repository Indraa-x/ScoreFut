const titleCount=history=>history.filter(record=>record.champion).length;
const longestWinningStreak=history=>{let streak=0;for(const record of [...history].reverse()){if(!record.champion)break;streak++;}return streak;};
const wonMode=(history,mode)=>history.some(record=>record.champion&&record.mode===mode)?1:0;

const definitions=[
  {id:'first-campaign',name:'Primeira campanha',description:'Finalize sua primeira competição.',icon:'ball',target:1,progress:history=>history.length},
  {id:'three-campaigns',name:'Ritmo de jogo',description:'Complete três campanhas.',icon:'play',target:3,progress:history=>history.length},
  {id:'ten-campaigns',name:'Colecionador',description:'Complete dez campanhas.',icon:'users',target:10,progress:history=>history.length},
  {id:'first-title',name:'Primeira taça',description:'Conquiste seu primeiro título.',icon:'trophy',target:1,progress:titleCount},
  {id:'three-titles',name:'Tricampeão',description:'Conquiste três títulos.',icon:'star',target:3,progress:titleCount},
  {id:'five-titles',name:'Dinastia',description:'Conquiste cinco títulos.',icon:'flame',target:5,progress:titleCount},
  {id:'three-win-streak',name:'Em sequência',description:'Vença três campanhas seguidas.',icon:'bolt',target:3,progress:longestWinningStreak},
  {id:'euro-title',name:'Rei da Europa',description:'Seja campeão da Euro.',icon:'trophy',target:1,progress:history=>wonMode(history,'euro')},
  {id:'champions-title',name:'Noite dos campeões',description:'Conquiste a Champions League.',icon:'star',target:1,progress:history=>wonMode(history,'champions')},
  {id:'brazil-title',name:'Glória brasileira',description:'Conquiste a Copa do Brasil.',icon:'shield',target:1,progress:history=>wonMode(history,'copa-do-brasil')}
];

export function achievementsFor(records=[]){
  const history=Array.isArray(records)?records:[];
  return definitions.map(({progress,...achievement})=>{
    const value=Math.max(0,Number(progress(history))||0);
    return {...achievement,value:Math.min(value,achievement.target),target:achievement.target,unlocked:value>=achievement.target};
  });
}

export function achievementSummary(records=[]){
  const achievements=achievementsFor(records);
  return {unlocked:achievements.filter(item=>item.unlocked).length,total:achievements.length};
}
