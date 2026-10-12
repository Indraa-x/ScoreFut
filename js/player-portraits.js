import {PLAYER_PORTRAITS} from '../data/player-portraits.js';
const loaded=new Set();
export function preloadPlayerPortraits(players=[]){
  for(const player of players){const portrait=PLAYER_PORTRAITS[player.id];if(!portrait||loaded.has(player.id))continue;loaded.add(player.id);const photo=new Image();photo.decoding='async';photo.src=portrait.src;}
}
export const playerPortrait=id=>PLAYER_PORTRAITS[id]||null;
