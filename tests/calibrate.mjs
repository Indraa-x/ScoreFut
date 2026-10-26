/** Run `node tests/calibrate.mjs` to audit 1,000 full cups at each strength. */
import { allSquads } from '../data/clubs.js';
import { calibrateChampionship, SIMULATION_SETTINGS } from '../js/engine.js';

const squads = allSquads;
const runs = Number(process.argv[2]) || 1000;
const strengths = [76, 82, 88, 94];
console.log('Copa completa de 32 times; 4–3–3 sem química; atributos relativos à posição derivados da base.');
console.log(`Cada força usa ${runs} sementes. Margem aproximada de 95% em pontos percentuais.`);
console.log(`Modelo ${SIMULATION_SETTINGS.modelVersion}: ajuste leve para o usuário: xG a favor ×${SIMULATION_SETTINGS.userAttackMultiplier}, xG do adversário ÷${SIMULATION_SETTINGS.userDefenseMultiplier}.`);
console.log(`OVR do usuário >${SIMULATION_SETTINGS.dominantUserMinOverall} contra adversário <${SIMULATION_SETTINGS.weakOpponentMaxOverall}: xG a favor ×${SIMULATION_SETTINGS.dominanceAttackMultiplier}, xG contra ÷${SIMULATION_SETTINGS.dominanceDefenseMultiplier} adicionais.`);
console.table(calibrateChampionship(squads, { runs, strengths }));
