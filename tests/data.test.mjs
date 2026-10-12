import test from 'node:test';
import assert from 'node:assert/strict';
import { clubs, allSquads, ELENCO_TAMANHO, validateData } from '../data/clubs.js';

const entradas = clubs.flatMap(club => club.temporadas.flatMap(temporada =>
  temporada.jogadores.map(jogador => ({ clube: club.id, ano: temporada.ano, ...jogador }))));
const porNome = nome => entradas.filter(jogador => jogador.nome === nome);
const porId = id => entradas.filter(jogador => jogador.id === id);
const elenco = (clube, ano) => allSquads.find(time => time.clubId === clube && time.ano === ano);

test('a base completa contém os 36 clubes, 144 elencos e 1584 entradas válidas', () => {
  assert.equal(ELENCO_TAMANHO, 11);
  assert.deepEqual(validateData(), {
    valid: true, errors: [], clubs: 36, squads: 144, players: 1584
  });
  assert.equal(entradas.length, 1584);
  assert.equal(new Set(allSquads.map(time => time.id)).size, 144);
});

test('cada clube usa exatamente os quatro anos solicitados', () => {
  const esperados = {
    'real-madrid': [2002, 2014, 2017, 2024], barcelona: [1992, 2009, 2011, 2015],
    bayern: [2001, 2010, 2013, 2020], milan: [1990, 1994, 2003, 2007],
    'manchester-united': [1994, 1999, 2008, 2009], liverpool: [2005, 2019, 2020, 2025],
    'manchester-city': [2018, 2021, 2023, 2024], arsenal: [1998, 2002, 2004, 2006],
    chelsea: [2005, 2010, 2012, 2021], inter: [1998, 2007, 2010, 2024],
    juventus: [1996, 1998, 2015, 2017], ajax: [1992, 1995, 1996, 2019],
    napoli: [1990, 2018, 2023, 2025], tottenham: [2016, 2017, 2019, 2025],
    'atletico-madrid': [1996, 2014, 2016, 2021],
    'borussia-dortmund': [1997, 2012, 2013, 2024], psg: [1996, 2016, 2020, 2025],
    porto: [1996, 2003, 2004, 2011], benfica: [1990, 2010, 2014, 2022],
    valencia: [2000, 2001, 2002, 2004], monaco: [1997, 2000, 2004, 2017],
    flamengo: [2009, 2019, 2022, 2025], palmeiras: [1996, 1999, 2020, 2021],
    'sao-paulo': [1992, 1993, 2005, 2006], corinthians: [1999, 2000, 2012, 2015],
    santos: [2002, 2004, 2010, 2011], gremio: [1995, 1996, 2001, 2017],
    internacional: [2006, 2007, 2008, 2010], vasco: [1997, 1998, 2000, 2011],
    fluminense: [2007, 2010, 2012, 2023], botafogo: [1995, 2007, 2023, 2024],
    cruzeiro: [1997, 2003, 2013, 2014], 'atletico-mineiro': [1999, 2013, 2021, 2024],
    'athletico-paranaense': [2001, 2005, 2018, 2021], bahia: [2001, 2017, 2021, 2025],
    fortaleza: [2018, 2019, 2022, 2023]
  };
  assert.deepEqual(new Set(clubs.map(clube => clube.id)), new Set(Object.keys(esperados)));
  for (const clube of clubs) {
    assert.deepEqual(clube.temporadas.map(temporada => temporada.ano).sort((a, b) => a - b),
      esperados[clube.id], clube.id);
  }
});

test('os onze candidatos têm um goleiro e dez atletas de linha', () => {
  for (const time of allSquads) {
    assert.equal(time.jogadores.length, 11, time.id);
    assert.equal(time.jogadores.filter(jogador => jogador.tags.includes('GOL')).length, 1, time.id);
    assert.equal(new Set(time.jogadores.map(jogador => jogador.id)).size, 11, time.id);
    for (const jogador of time.jogadores) {
      assert.match(jogador.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      assert.ok(Number.isInteger(jogador.ovr) && jogador.ovr >= 50 && jogador.ovr <= 99);
      assert.equal(typeof jogador.camisa, 'string');
      assert.ok(jogador.camisa === '' || /^\d+$/.test(jogador.camisa));
      for (const atributo of Object.values(jogador.atributos)) {
        assert.ok(Number.isFinite(atributo) && atributo >= 0 && atributo <= 99);
      }
    }
  }
});

test('a mesma pessoa conserva o ID entre temporadas e entre clubes', () => {
  const casos = [
    ['neymar', ['santos', 'barcelona', 'psg']],
    ['thiago-silva', ['psg', 'chelsea']],
    ['angel-di-maria', ['benfica', 'real-madrid', 'psg']],
    ['arjen-robben', ['chelsea', 'bayern']],
    ['robert-lewandowski', ['borussia-dortmund', 'bayern']],
    ['ilkay-gundogan', ['borussia-dortmund', 'manchester-city']],
    ['dida', ['corinthians', 'milan', 'cruzeiro']],
    ['fabinho', ['monaco', 'liverpool']],
    ['jan-oblak', ['benfica', 'atletico-madrid']],
    ['thierry-henry', ['monaco', 'arsenal']],
    ['frank-rijkaard', ['milan', 'ajax']],
    ['edwin-van-der-sar', ['ajax', 'manchester-united']],
    ['everton-ribeiro', ['flamengo', 'cruzeiro', 'bahia']],
    ['fabio-deivson-lopes-maciel', ['cruzeiro', 'fluminense']],
    ['alessandro-nunes', ['corinthians', 'athletico-paranaense']],
    ['helton', ['porto', 'vasco']],
    ['claudemir-vitor', ['sao-paulo', 'cruzeiro']],
    ['maurinho-mauro-silva-gomes', ['santos', 'cruzeiro']]
  ];
  for (const [id, clubesEsperados] of casos) {
    const ocorrencias = porId(id);
    assert.ok(ocorrencias.length >= clubesEsperados.length, id);
    for (const clube of clubesEsperados) assert.ok(ocorrencias.some(jogador => jogador.clube === clube), `${id}/${clube}`);
  }
  assert.equal(new Set(porNome('Neymar').map(jogador => jogador.id)).size, 1);
  assert.equal(new Set(porNome('Thiago Silva').map(jogador => jogador.id)).size, 1);
});

test('Seedorf e Jorginho usam IDs da pessoa, sem clube, edição ou apelido ambíguo', () => {
  assert.ok(porNome('Clarence Seedorf').length > 0);
  assert.deepEqual(new Set(porNome('Clarence Seedorf').map(jogador => jogador.id)),
    new Set(['clarence-seedorf']));
  assert.ok(porNome('Jorginho').length > 0);
  assert.deepEqual(new Set(porNome('Jorginho').map(jogador => jogador.id)),
    new Set(['jorginho-frello']));
});

test('homônimos reais permanecem pessoas diferentes', () => {
  assert.deepEqual(new Set(porNome('Alex').map(jogador => jogador.id)), new Set([
    'alex-de-souza', 'alex-rodrigo-dias-da-costa', 'alex-meschini'
  ]));
  assert.deepEqual(new Set(porNome('Danilo').map(jogador => jogador.id)), new Set([
    'danilo-gabriel-andrade', 'danilo-luiz-da-silva', 'danilo-dos-santos-de-oliveira'
  ]));
  assert.notEqual(porNome('Ronaldo')[0].id, porNome('Cristiano Ronaldo')[0].id);
  assert.notEqual(porNome('Müller')[0].id, porNome('Thomas Müller')[0].id);
  assert.notEqual(porNome('Mousa Dembélé')[0].id, porNome('Ousmane Dembélé')[0].id);
});

test('camisas selecionadas pertencem à temporada, preservando alterações posteriores', () => {
  const camisa = (clube, ano, id) => elenco(clube, ano).jogadores.find(jogador => jogador.id === id).camisa;
  assert.equal(camisa('bayern', 2020, 'joshua-kimmich'), '32');
  assert.equal(camisa('juventus', 2015, 'paul-pogba'), '6');
  assert.equal(camisa('liverpool', 2019, 'alisson'), '13');
  assert.equal(camisa('liverpool', 2020, 'alisson'), '1');
  assert.equal(camisa('real-madrid', 2017, 'luka-modric'), '19');
  assert.equal(camisa('inter', 2007, 'zlatan-ibrahimovic'), '8');
});
