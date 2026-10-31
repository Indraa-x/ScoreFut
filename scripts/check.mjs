import {validateData} from '../data/game-squads.js';
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
const data=validateData();console.log(JSON.stringify(data,null,2));if(!data.valid)process.exit(1);
function scripts(folder){return fs.readdirSync(folder,{withFileTypes:true}).flatMap(file=>file.isDirectory()?scripts(`${folder}/${file.name}`):file.name.endsWith('.js')?[`${folder}/${file.name}`]:[]);}
for(const file of ['js','data'].flatMap(scripts)){const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(result.status){console.error(result.stderr);process.exit(1);}}
console.log('Sintaxe JavaScript válida.');
