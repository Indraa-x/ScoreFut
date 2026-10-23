import {BRAZIL_CUP_CLUB_IDS,EUROPE_CLUB_IDS} from '../data/competitions.js?v=euro-20261023';
export const state = {screen:'home',mode:'euro',formation:'4-3-3',teamName:'Meu time',quickSquadId:null,quickStep:'formation',quickSearch:'',quickRegion:'all',draft:null,tournament:null,pendingRound:null,matchFlowVersion:1,userMatchIndex:0,matchUnlockedIndex:0,matchMinute:0,matchSpeed:4,matchPlaying:false,returnScreen:'match',resultRecord:null,rolling:false};
export const MODES = [
  {id:'euro',name:'Euro',tag:'SELEÇÕES EUROPEIAS',icon:'trophy',description:'Reúna craques das seleções europeias de diferentes épocas. Dispute seis grupos e o mata-mata em jogo único até a taça.',detail:'24 seleções · Até 5 épocas por seleção'},
  {id:'copa-do-brasil',name:'Copa do Brasil',tag:'MATA-MATA BRASILEIRO',icon:'trophy',description:'Escolha craques brasileiros e dispute as oitavas até a final. Ida e volta até a semifinal; final em jogo único.',detail:`${BRAZIL_CUP_CLUB_IDS.length} clubes históricos · Até 7 jogos`},
  {id:'champions',name:'Champions League',tag:'CLUBES EUROPEUS',icon:'trophy',description:'Escolha craques europeus, avance nos grupos e dispute o mata-mata com ida e volta até a semifinal. Final em jogo único.',detail:`${EUROPE_CLUB_IDS.length} clubes históricos · Grupos, ida e volta`}
];
// Old saved campaigns remain readable after the visible mode is replaced.
export const LEGACY_QUICK_MODE={id:'quick',name:'Modo rápido',tag:'SIMULAÇÃO COMPLETA',icon:'bolt',description:'Confira o elenco e simule a campanha inteira de uma vez.',detail:'16 times · Até 4 jogos'};
