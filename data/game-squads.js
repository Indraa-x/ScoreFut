import {allSquads as clubSquads} from './clubs.js?v=national-peaks-curated-20261020';
import {nationalSquads} from './national-teams.js?v=national-peaks-curated-20261020';
export {clubs,validateData} from './clubs.js?v=national-peaks-curated-20261020';
export const allSquads = [...clubSquads,...nationalSquads];
