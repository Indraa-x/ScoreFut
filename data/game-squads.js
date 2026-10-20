import {allSquads as clubSquads} from './clubs.js?v=worldcup-20261020';
import {nationalSquads} from './national-teams.js?v=worldcup-20261020';
export {clubs,validateData} from './clubs.js?v=worldcup-20261020';
export const allSquads = [...clubSquads,...nationalSquads];
