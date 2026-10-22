import test from 'node:test';
import assert from 'node:assert/strict';
import {quickCatalog,filterQuickClubs,quickSeasons} from '../js/quick-catalog.js';
import {allSquads} from '../data/clubs.js';
import {selectQuickTeam} from '../js/quick-game.js';
import {calculateTeam,FORMATIONS,squadTeam} from '../js/engine.js';
import {renderSetup,renderSummary,renderQuickClubCards,renderHelp} from '../js/ui.js';

test('club cards show the latest available season and the same rating as its actual selected lineup',()=>{
  assert.equal(quickCatalog.length,43);
  for(const club of quickCatalog){
    const selection=selectQuickTeam({squadId:club.squad.id,seed:1,date:'2026-10-11',squads:allSquads});
    assert.equal(club.overall,Math.round(calculateTeam(selection.draft.picks).overall));
    assert.equal(club.squad.ano,Math.max(...allSquads.filter(item=>item.clubId===club.id).map(item=>item.ano)));
    assert.equal(club.seasonCount,allSquads.filter(item=>item.clubId===club.id).length);
    assert.equal(club.temporadas.length,5);assert.ok(renderQuickClubCards([club]).includes('5 épocas'));
    const preview=renderSummary({mode:'quick',...selection});
    assert.ok(preview.includes(club.squad.conquistas));
    assert.ok(preview.includes('aria-current="step"'));
    assert.equal((preview.match(/data-action="tournament"/g)||[]).length,1);
  }
});

test('search ignores accents, case and outer spaces, and composes with region filters',()=>{
  assert.deepEqual(filterQuickClubs({search:'  SAO PAULO  '}).map(club=>club.id),['sao-paulo']);
  assert.deepEqual(filterQuickClubs({search:'GRÊMIO'}).map(club=>club.id),['gremio']);
  assert.deepEqual(filterQuickClubs({search:'PSG'}).map(club=>club.id),['psg']);
  assert.deepEqual(filterQuickClubs({search:'barcelona',region:'brasil'}),[]);
  assert.equal(filterQuickClubs({region:'brasil'}).length,15);
  assert.equal(filterQuickClubs({region:'europa'}).length,28);
  assert.equal(filterQuickClubs({search:'  ',region:'all'}).length,43);
  assert.equal(filterQuickClubs({search:'not a club'}).length,0);
});

test('filtered selection and empty state remain actionable and escape the search value',()=>{
  const html=renderSetup({mode:'quick',quickSearch:'sao',quickRegion:'brasil',quickStep:'clubs',formation:'4-3-3'});
  assert.equal((html.match(/data-action="quick-team"/g)||[]).length,1);
  assert.ok(html.includes('id="quick-search"'));
  assert.ok(html.includes('1 clube'));
  assert.ok(html.includes('data-value="brasil" aria-pressed="true"'));
  const empty=renderSetup({mode:'quick',quickSearch:'"><script>alert(1)</script>',quickStep:'clubs',formation:'4-3-3'});
  assert.ok(!empty.includes('<script>'));
  assert.ok(empty.includes('Nenhum clube encontrado'));
  assert.ok(empty.includes('data-action="quick-clear"'));
  assert.ok(!renderQuickClubCards([]).includes('data-action="quick-team"'));
  const help=renderHelp();
  assert.ok(help.includes('Modo rápido'));
  assert.ok(!/undefined|fator de entrosamento|Copa ScoreFut|\+2%|\+5%/.test(help));
});

test('formation-specific cards expose only compatible seasons and keep incompatible clubs visibly disabled',()=>{
  for(const formation of Object.keys(FORMATIONS)){
    const catalog=filterQuickClubs({formation});
    assert.equal(catalog.length,43);
    for(const club of catalog){
      const seasons=quickSeasons(club.id,formation);
      assert.equal(club.seasonCount,seasons.length);
      assert.equal(club.available,Boolean(seasons.length));
      if(seasons.length){
        assert.equal(club.squad.id,seasons[0].id);
        assert.equal(club.overall,Math.round(squadTeam(club.squad,formation).strength.overall));
        const selection=selectQuickTeam({squadId:club.squad.id,formation,seed:1,date:'2026-10-12',squads:allSquads});
        const preview=renderSummary({mode:'quick',...selection});
        const values=[...preview.matchAll(/<option value="([^"]+)"/g)].map(match=>match[1]);
        assert.deepEqual(values,seasons.map(squad=>squad.id));
      }else{
        const card=renderQuickClubCards([club]);
        assert.ok(card.includes('disabled'));
        assert.ok(card.includes('Sem elenco para '+formation));
        assert.ok(!card.includes('data-action="quick-team"'));
      }
    }
  }
});
