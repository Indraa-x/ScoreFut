import {validateData} from '../data/game-squads.js';
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
const data=validateData();console.log(JSON.stringify(data,null,2));if(!data.valid)process.exit(1);
for(const folder of ['js','data'])for(const file of fs.readdirSync(folder).filter(f=>f.endsWith('.js'))){const result=spawnSync(process.execPath,['--check',`${folder}/${file}`],{encoding:'utf8'});if(result.status){console.error(result.stderr);process.exit(1);}}
console.log('Sintaxe JavaScript válida.');
