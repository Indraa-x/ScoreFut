/** Run `node tests/calibrate.mjs` to audit 1,000 full cups at each strength. */
import { allSquads } from '../data/clubs.js';
import { calibrateChampionship, SIMULATION_SETTINGS } from '../js/engine.js';

const squads = allSquads;
const runs = Number(process.argv[2]) || 1000;
const strengths = [76, 82, 88, 94];
console.log('Copa completa de 32 times; 4–3–3 sem química; atributos relativos à posição derivados da base.');
console.log(`Cada força usa ${runs} sementes. Margem aproximada de 95% em pontos percentuais.`);
console.log(`Modelo ${SIMULATION_SETTINGS.modelVersion}: ajuste leve para o usuário: xG a favor ×${SIMULATION_SETTINGS.userAttackMultiplier}, xG do adversário ÷${SIMULATION_SETTINGS.userDefenseMultiplier}.`);
console.log(`Vantagem adicional cresce entre ${SIMULATION_SETTINGS.dominanceStartGap} e ${SIMULATION_SETTINGS.dominanceFullGap} pontos de OVR: até xG a favor ×${SIMULATION_SETTINGS.dominanceAttackMultiplier} e xG contra ÷${SIMULATION_SETTINGS.dominanceDefenseMultiplier}.`);
console.table(calibrateChampionship(squads, { runs, strengths }));
