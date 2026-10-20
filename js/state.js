import {BRAZIL_CUP_CLUB_IDS,EUROPE_CLUB_IDS} from '../data/competitions.js?v=club-only-cleanup-20261020';
export const state = {screen:'home',mode:'quick',formation:'4-3-3',teamName:'Meu time',quickSquadId:null,quickStep:'formation',quickSearch:'',quickRegion:'all',draft:null,tournament:null,pendingRound:null,matchFlowVersion:1,userMatchIndex:0,matchUnlockedIndex:0,matchMinute:0,matchSpeed:1,matchPlaying:false,returnScreen:'match',resultRecord:null,rolling:false};
export const MODES = [
  {id:'quick',name:'Modo rápido',tag:'SIMULAÇÃO COMPLETA',icon:'bolt',description:'Escolha a formação e o clube, confira o elenco e simule a campanha inteira de uma vez.',detail:'16 times · Até 4 jogos'},
  {id:'copa-do-brasil',name:'Copa do Brasil',tag:'MATA-MATA BRASILEIRO',icon:'trophy',description:'Escolha craques brasileiros e dispute as oitavas até a final. Ida e volta até a semifinal; final em jogo único.',detail:`${BRAZIL_CUP_CLUB_IDS.length} clubes históricos · Até 7 jogos`},
  {id:'champions',name:'Champions League',tag:'CLUBES EUROPEUS',icon:'trophy',description:'Escolha craques dos clubes europeus e dispute a Champions no formato clássico.',detail:`${EUROPE_CLUB_IDS.length} clubes históricos · Grupos e mata-mata`}
];
