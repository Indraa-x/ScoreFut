/*
 * Lote C: oito clubes brasileiros, 32 temporadas e 352 jogadores.
 * Notas editoriais já calibradas, na mesma escala final dos outros lotes.
 * Onze destaques por temporada com cobertura de posições; não é um ranking oficial.
 * Camisas desconhecidas ficam vazias. Vínculos e conquistas: fontes-c.md.
 */
import { recalibratePlayer } from './ratings.js?v=leverkusen-20261029';

const slug = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const profiles = {
  GOL: [-61,-48,-5,-69,1,-1], ZAG: [-28,-19,1,-34,-64,0],
  LD: [-12,-6,-2,-24,-65,-2], LE: [-12,-6,-2,-24,-65,-2],
  VOL: [-14,0,-3,-21,-66,-2], MC: [-7,1,-15,-14,-66,-3],
  MEI: [-1,1,-30,-8,-67,-2], MD: [-3,0,-25,-11,-67,-3], ME: [-3,0,-25,-11,-67,-3],
  PE: [1,-8,-38,-3,-68,-2], PD: [1,-8,-38,-3,-68,-2],
  SA: [1,-9,-37,0,-68,-1], CA: [1,-22,-42,2,-68,0],
};
const keys = ['ataque','meio','defesa','finalizacao','reflexo','posicionamento'];
function p(nome, positions, ovr, id = slug(nome)) {
  const tags = positions.split(' ');
  return {id,nome,tags,ovr,camisa:'',destaque:'',atributos:Object.fromEntries(
    keys.map((key,i)=>[key,Math.max(1,Math.min(99,ovr+profiles[tags[0]][i]))]))};
}
const s = (ano,conquistas,jogadores)=>({ano,conquistas,jogadores});
const c = (id,nome,monograma,cores,temporadas)=>({id,nome,monograma,cores,temporadas:temporadas.map(season=>({...season,jogadores:season.jogadores.map(player=>recalibratePlayer(player))}))});

export const clubsC = [
  c('vasco','Vasco da Gama','VG',['#15191E','#FAFAFA'],[
    s(1997,'Campeão brasileiro',[
      p('Carlos Germano','GOL',84),
      p('Válber','ZAG LD',79,'valber-roel-de-oliveira'),
      p('Mauro Galvão','ZAG',85), p('Odvan','ZAG',79),
      p('Felipe','LE MEI',85,'felipe-jorge-loureiro'),
      p('Nasa','VOL',78), p('Luisinho','VOL MC',79,'luisinho-quintanilha'),
      p('Juninho Pernambucano','MC MEI',88), p('Ramon','MEI ME',83,'ramon-menezes'),
      p('Evair','CA',86), p('Edmundo','SA CA',92),
    ]),
    s(1998,'Campeão da Libertadores',[
      p('Carlos Germano','GOL',85), p('Vágner','LD MC',80,'vagner-rogerio-nunes'),
      p('Mauro Galvão','ZAG',86), p('Odvan','ZAG',80),
      p('Felipe','LE MEI',86,'felipe-jorge-loureiro'),
      p('Nasa','VOL',79), p('Luisinho','VOL MC',80,'luisinho-quintanilha'),
      p('Juninho Pernambucano','MC MEI',89), p('Pedrinho','MEI ME',84,'pedrinho-pedro-paulo-de-oliveira'),
      p('Donizete Pantera','SA CA',84,'donizete-pantera'), p('Luizão','CA',87,'luizao'),
    ]),
    s(2000,'Campeão brasileiro · Copa Mercosul',[
      p('Hélton','GOL',83), p('Clébson','LD',78), p('Odvan','ZAG',81),
      p('Júnior Baiano','ZAG',83), p('Jorginho Paulista','LE ME',80),
      p('Nasa','VOL',79), p('Jorginho Campos','VOL LD',86,'jorginho-campos'),
      p('Juninho Pernambucano','MC MEI',90), p('Juninho Paulista','MEI SA',88),
      p('Euller','SA PE',84), p('Romário','CA',98),
    ]),
    s(2011,'Campeão da Copa do Brasil · Vice brasileiro',[
      p('Fernando Prass','GOL',84), p('Fagner','LD',83), p('Dedé','ZAG',87),
      p('Anderson Martins','ZAG',82), p('Ramon','LE',78,'ramon-ramon-de-moraes-motta'),
      p('Rômulo','VOL MC',81,'romulo-romulo-borges-monteiro'),
      p('Eduardo Costa','VOL MC',79), p('Felipe','MEI ME',83,'felipe-jorge-loureiro'),
      p('Diego Souza','MEI SA',85), p('Éder Luís','PD SA',82), p('Alecsandro','CA',80),
    ]),
  ]),
  c('fluminense','Fluminense','FL',['#7A1836','#176348'],[
    s(2007,'Campeão da Copa do Brasil',[
      p('Fernando Henrique','GOL',80,'fernando-henrique-dos-anjos'),
      p('Gabriel Rodrigues','LD',79,'gabriel-rodrigues-dos-santos'),
      p('Thiago Silva','ZAG',88), p('Luiz Alberto','ZAG',79,'luiz-alberto-da-silva-oliveira'),
      p('Júnior César','LE',79), p('Arouca','VOL MC',81),
      p('Fabinho','VOL MC',79,'fabinho-fabio-de-jesus'),
      p('Thiago Neves','MEI ME',85), p('Carlos Alberto','MEI SA',82,'carlos-alberto-gomes-de-jesus'),
      p('Alex Dias','SA CA',79), p('Adriano Magrão','CA',77),
    ]),
    s(2010,'Campeão brasileiro',[
      p('Ricardo Berna','GOL',81), p('Mariano','LD',83), p('Gum','ZAG',82),
      p('Leandro Euzébio','ZAG',80), p('Carlinhos','LE',81,'carlinhos-carlos-andrade-souza'),
      p('Diguinho','VOL MC',80), p('Edwin Valencia','VOL',79),
      p('Darío Conca','MEI MC',89), p('Deco','MEI MC',88),
      p('Fred','CA',86), p('Emerson Sheik','SA PE',84),
    ]),
    s(2012,'Campeão brasileiro · Campeonato Carioca',[
      p('Diego Cavalieri','GOL',85), p('Bruno','LD',79,'bruno-vieira'),
      p('Gum','ZAG',83), p('Leandro Euzébio','ZAG',81),
      p('Carlinhos','LE',82,'carlinhos-carlos-andrade-souza'),
      p('Edinho','VOL ZAG',81,'edinho-edimo-ferreira-campos'),
      p('Jean','MC VOL LD',83,'jean-raphael-vanderlei-moreira'),
      p('Deco','MEI MC',89), p('Thiago Neves','MEI ME',85),
      p('Rafael Sóbis','SA CA',83), p('Fred','CA',88),
    ]),
    s(2023,'Campeão da Libertadores · Campeonato Carioca',[
      p('Fábio','GOL',86,'fabio-deivson-lopes-maciel'), p('Samuel Xavier','LD',80),
      p('Nino','ZAG',83), p('Felipe Melo','ZAG VOL',82), p('Marcelo','LE',90),
      p('André','VOL MC',85,'andre-trindade-da-costa-neto'), p('Martinelli','MC VOL',81,'matheus-martinelli'),
      p('Paulo Henrique Ganso','MEI MC',84), p('Jhon Arias','PD MEI',86),
      p('Keno','PE SA',82), p('Germán Cano','CA',88),
    ]),
  ]),
  c('botafogo','Botafogo','BO',['#181C23','#F7F7F7'],[
    s(1995,'Campeão brasileiro',[
      p('Wagner','GOL',82,'wagner-sebastiao-wagner-de-souza-e-silva'), p('Wilson Goiano','LD',79),
      p('Gonçalves','ZAG',84,'goncalves-marcelo-goncalves-costa-lopes'),
      p('Wilson Gottardo','ZAG',82), p('André Silva','LE',77,'andre-silva-gomes'),
      p('Leandro Ávila','VOL MC',83), p('Jamir','VOL',79),
      p('Beto','MEI MC',82,'beto-joubert-araujo-martins'), p('Sérgio Manoel','MEI ME',84),
      p('Donizete Pantera','SA CA',85,'donizete-pantera'), p('Túlio Maravilha','CA',89),
    ]),
    s(2007,'Campeão da Taça Rio · Semifinal da Copa do Brasil',[
      p('Júlio César','GOL',77,'julio-cesar-julio-cesar-jacobi'),
      p('Joílson','LD MD',79), p('Alex Bruno','ZAG',78,'alex-bruno-costa'),
      p('Juninho','ZAG',80,'juninho-anselmo-vendrechovski-junior'), p('Luciano Almeida','LE',77),
      p('Túlio','VOL MC',80,'tulio-tulio-lustosa-seixas-pinheiro'), p('Leandro Guerreiro','VOL MC',80),
      p('Lúcio Flávio','MEI MC',82), p('Zé Roberto','MEI PE',81,'ze-roberto-jose-roberto-de-oliveira'),
      p('Jorge Henrique','SA PD',82), p('Dodô','CA',86,'dodo-ricardo-lucas'),
    ]),
    s(2023,'5º lugar no Brasileirão',[
      p('Lucas Perri','GOL',83), p('Di Placido','LD',78,'leonel-di-placido'),
      p('Adryelson','ZAG',83), p('Víctor Cuesta','ZAG',82), p('Marçal','LE',80),
      p('Marlon Freitas','VOL MC',82), p('Tchê Tchê','MC VOL',81),
      p('Eduardo','MEI MC',82,'eduardo-carlos-eduardo-de-oliveira-alves'),
      p('Júnior Santos','PD CA',82), p('Víctor Sá','PE',80), p('Tiquinho Soares','CA',85),
    ]),
    s(2024,'Campeão brasileiro · Libertadores',[
      p('John','GOL',85,'john-victor-maciel-furtado'),
      p('Vitinho','LD',81,'vitinho-victor-alexander-da-silva'), p('Bastos','ZAG',84),
      p('Alexander Barboza','ZAG',84), p('Alex Telles','LE',83),
      p('Marlon Freitas','VOL MC',84), p('Gregore','VOL',83), p('Thiago Almada','MEI MC',86),
      p('Luiz Henrique','PD',87,'luiz-henrique-andre-rosa-da-silva'),
      p('Jefferson Savarino','PE MEI',86), p('Igor Jesus','CA',85,'igor-jesus-maciel-da-cruz'),
    ]),
  ]),
  c('cruzeiro','Cruzeiro','CR',['#175CB8','#EDF3FD'],[
    s(1997,'Campeão da Libertadores',[
      p('Dida','GOL',87), p('Vítor','LD',80,'claudemir-vitor'),
      p('Gélson Baresi','ZAG',79), p('Wilson Gottardo','ZAG',83), p('Nonato','LE',80,'nonato-raimundo-nonato-da-silva'),
      p('Fabinho','VOL',80,'fabinho-fabio-da-silva-azevedo'),
      p('Ricardinho','MC VOL',83,'ricardinho-ricardo-alexandre-martins'),
      p('Donizete Oliveira','VOL MC',79), p('Elivélton','ME PE',82),
      p('Palhinha','SA MEI',85,'palhinha-jorge-ferreira-da-silva'), p('Marcelo Ramos','CA',86),
    ]),
    s(2003,'Tríplice coroa · Brasileiro, Copa do Brasil e Mineiro',[
      p('Gomes','GOL',84,'heurelho-gomes'), p('Maurinho','LD',81,'maurinho-mauro-silva-gomes'), p('Cris','ZAG',84),
      p('Edu Dracena','ZAG',83), p('Leandro','LE',80,'leandro-leandro-silva-wanderley'),
      p('Claudio Maldonado','VOL',84), p('Augusto Recife','VOL MC',79), p('Wendel','MC ME',82,'wendel-geraldo-mauricio-da-silva'),
      p('Alex','MEI',92,'alex-de-souza'), p('Deivid','CA SA',85), p('Aristizábal','CA',85,'victor-aristizabal'),
    ]),
    s(2013,'Campeão brasileiro',[
      p('Fábio','GOL',85,'fabio-deivson-lopes-maciel'), p('Ceará','LD',81,'ceara-marcos-venancio-de-albuquerque'),
      p('Dedé','ZAG',85), p('Bruno Rodrigo','ZAG',81), p('Egídio','LE',80),
      p('Souza','VOL MC',82,'souza-josef-de-souza-dias'), p('Lucas Silva','VOL MC',82),
      p('Everton Ribeiro','MEI PD',86,'everton-ribeiro'), p('Ricardo Goulart','MEI SA',85),
      p('Dagoberto','PE SA',83), p('Borges','CA',83,'borges-humberlito'),
    ]),
    s(2014,'Campeão brasileiro · Campeonato Mineiro',[
      p('Fábio','GOL',86,'fabio-deivson-lopes-maciel'), p('Mayke','LD',81),
      p('Léo','ZAG',81,'leo-leonardo-renan-simoes-de-lacerda'), p('Bruno Rodrigo','ZAG',82), p('Egídio','LE',81),
      p('Henrique','VOL MC',82,'henrique-henrique-pacheco-de-lima'), p('Lucas Silva','VOL MC',83),
      p('Everton Ribeiro','MEI PD',87,'everton-ribeiro'), p('Ricardo Goulart','MEI SA',86),
      p('Willian','PE SA',82,'willian-gomes-de-siqueira'), p('Marcelo Moreno','CA',84),
    ]),
  ]),
  c('atletico-mineiro','Atlético-MG','AM',['#20252B','#F6F7F8'],[
    s(1999,'Vice-campeão brasileiro',[
      p('Velloso','GOL',83), p('Mancini','LD MD',80,'amantino-mancini'),
      p('Cláudio Caçapa','ZAG',83), p('Galván','ZAG',80,'carlos-alberto-galvan'), p('Ronildo','LE',77),
      p('Gallo','VOL',79,'alexandre-gallo'), p('Belletti','MC LD',82),
      p('Valdir','MC VOL',78,'valdir-valdir-benedito'), p('Robert','MEI MC',80,'robert-robert-da-silva-almeida'),
      p('Marques','SA PE',85,'marques-marques-batista-de-abreu'), p('Guilherme','CA',86,'guilherme-guilherme-de-cassio-alves'),
    ]),
    s(2013,'Campeão da Libertadores · Campeonato Mineiro',[
      p('Victor','GOL',87,'victor-leandro-bagy'), p('Marcos Rocha','LD',83),
      p('Réver','ZAG',84), p('Leonardo Silva','ZAG',84), p('Richarlyson','LE VOL',80),
      p('Pierre','VOL',81), p('Leandro Donizete','VOL MC',81), p('Ronaldinho Gaúcho','MEI SA',94),
      p('Bernard','PE ME',85), p('Diego Tardelli','SA PD',85), p('Jô','CA',85),
    ]),
    s(2021,'Campeão brasileiro · Copa do Brasil · Mineiro',[
      p('Everson','GOL',85), p('Mariano','LD',83), p('Nathan Silva','ZAG',81),
      p('Júnior Alonso','ZAG',84), p('Guilherme Arana','LE ME',85),
      p('Allan Rodrigues','VOL MC',83,'allan-rodrigues-de-souza'),
      p('Jair','VOL MC',83,'jair-rodrigues-junior'), p('Matías Zaracho','MC MEI',84),
      p('Nacho Fernández','MEI MC',85), p('Keno','PE SA',84), p('Hulk','CA SA',89),
    ]),
    s(2024,'Vice da Libertadores · Copa do Brasil · Campeão mineiro',[
      p('Everson','GOL',84), p('Renzo Saravia','LD ZAG',80), p('Lyanco','ZAG',80),
      p('Júnior Alonso','ZAG',82), p('Guilherme Arana','LE ME',84),
      p('Rodrigo Battaglia','VOL ZAG',83), p('Alan Franco','MC VOL',82,'alan-steven-franco-palma'),
      p('Gustavo Scarpa','MEI MD',83), p('Paulinho','SA PE',84,'paulinho-paulo-henrique-sampaio-filho'),
      p('Hulk','CA SA',88), p('Deyverson','CA',81),
    ]),
  ]),
  c('athletico-paranaense','Athletico-PR','AP',['#C92B35','#20252B'],[
    s(2001,'Campeão brasileiro',[
      p('Flávio','GOL',80,'flavio-flavio-emidio-dos-santos-vieira'),
      p('Alessandro','LD',80,'alessandro-nunes'), p('Gustavo Caiche','ZAG',80),
      p('Nem','ZAG',79,'nem-ronaldo-alves-da-silva'), p('Rogério Corrêa','ZAG',81),
      p('Fabiano','LE ME',79,'fabiano-lima-rodrigues'),
      p('Cocito','VOL',80), p('Kléberson','MC VOL',85), p('Adriano Gabiru','MEI SA',82),
      p('Kléber Pereira','CA',84), p('Alex Mineiro','CA SA',86),
    ]),
    s(2005,'Vice-campeão da Libertadores',[
      p('Diego','GOL',80,'diego-diego-costa-silva'), p('Jancarlos','LD',80),
      p('Danilo Larangeira','ZAG',83,'danilo-larangeira'), p('Durval','ZAG',82),
      p('Marcão','LE ZAG',80,'marcao-marcos-alberto-skavinski'),
      p('Cocito','VOL',79), p('Fabrício','VOL MC',81,'fabricio-fabricio-fabio-dos-santos-silva'),
      p('Alan Bahia','MC VOL',81), p('Fernandinho','MC MEI',84,'fernandinho'),
      p('Lima','SA CA',83,'lima-aparecido-francisco-de-lima'), p('Aloísio','CA',83,'aloisio-jose-da-silva'),
    ]),
    s(2018,'Campeão da Copa Sul-Americana',[
      p('Santos','GOL',84,'aderbar-melo-dos-santos-neto'),
      p('Jonathan','LD',81,'jonathan-cicero-moreira'), p('Paulo André','ZAG',81),
      p('Thiago Heleno','ZAG',83), p('Renan Lodi','LE',83),
      p('Wellington','VOL',80,'wellington-wellington-aparecido-martins'),
      p('Bruno Guimarães','MC VOL',84), p('Raphael Veiga','MEI',82),
      p('Nikão','PD MEI',83), p('Rony','PE SA',82), p('Pablo','CA',83,'pablo-pablo-felipe-teixeira'),
    ]),
    s(2021,'Campeão da Copa Sul-Americana · Vice da Copa do Brasil',[
      p('Santos','GOL',84,'aderbar-melo-dos-santos-neto'),
      p('Pedro Henrique','ZAG',80,'pedro-henrique-pedro-henrique-ribeiro-goncalves'),
      p('Thiago Heleno','ZAG',84), p('Nico Hernández','ZAG',79,'nicolas-hernandez'),
      p('Marcinho','LD MD',78,'marcinho-marcio-almeida-de-oliveira'),
      p('Erick','VOL MC',81,'erick-erick-luis-conrado-carvalho'), p('Léo Cittadini','MC MEI',81),
      p('Abner','LE ME',80,'abner-vinicius-da-silva-santos'), p('David Terans','MEI SA',84),
      p('Nikão','PD MEI',84), p('Renato Kayzer','CA',79),
    ]),
  ]),
  c('bahia','Bahia','BA',['#1975C7','#CE303F'],[
    s(2001,'Campeão da Copa do Nordeste · Campeonato Baiano',[
      p('Emerson','GOL',77,'emerson-ferretti'), p('Japinha','LD',75),
      p('Jean Elias','ZAG',77), p('Carlinhos Paulista','ZAG',76), p('Jefferson','LE',75,'jefferson-vieira-da-silva'),
      p('Bebeto Campos','VOL',76), p('Preto Casagrande','MC MEI',80),
      p('Claiton','MC VOL',78,'claiton-claiton-alberto-fontoura-dos-santos'), p('Alex Oliveira','MEI',77),
      p('Robgol','CA',80,'jose-robson-do-nascimento'), p('Nonato','CA',81,'nonato-raimundo-nonato-lima-ribeiro'),
    ]),
    s(2017,'Campeão da Copa do Nordeste',[
      p('Jean','GOL',79,'jean-jean-paulo-fernandes-filho'), p('Eduardo','LD',76,'eduardo-jose-diniz-costa'),
      p('Tiago','ZAG',77,'tiago-pagnussat'), p('Lucas Fonseca','ZAG',78), p('Pablo Armero','LE',79),
      p('Renê Júnior','VOL MC',79), p('Edson','VOL',77,'edson-edson-fernando-da-silva-gomes'),
      p('Régis','MEI',80,'regis-regis-augusto-salmazzo'), p('Zé Rafael','MEI ME',81),
      p('Agustín Allione','PD MEI',79), p('Edigar Junio','CA SA',80),
    ]),
    s(2021,'Campeão da Copa do Nordeste',[
      p('Matheus Teixeira','GOL',76), p('Nino Paraíba','LD',77), p('Germán Conti','ZAG',78),
      p('Luiz Otávio','ZAG',77,'luiz-otavio-assis-santos'), p('Matheus Bahia','LE',76),
      p('Patrick de Lucca','VOL MC',77), p('Thaciano','MC MEI',79),
      p('Daniel','MC MEI',78,'daniel-daniel-simoes'), p('Rodriguinho','MEI SA',80),
      p('Rossi','PD',77,'rossi-rossi-pereira'), p('Gilberto','CA',82,'gilberto-gilberto-oliveira-souza-junior'),
    ]),
    s(2025,'Campeão da Copa do Nordeste · Campeonato Baiano',[
      p('Ronaldo Strada','GOL',78,'ronaldo-de-oliveira-strada'),
      p('Gilberto','LD',79,'gilberto-moraes-junior'), p('Gabriel Xavier','ZAG',80),
      p('Rezende','ZAG VOL',77,'julio-cesar-rezende'), p('Iago Borduchi','LE',79),
      p('Rodrigo Nestor','MC MEI',81), p('Michel Araújo','MC ME',79),
      p('Everton Ribeiro','MEI PD',83,'everton-ribeiro'), p('Cauly','MEI',82,'cauly-oliveira-souza'),
      p('Luciano Rodríguez','CA SA',81), p('Tiago','CA PE',78,'tiago-de-souza-santos'),
    ]),
  ]),
  c('fortaleza','Fortaleza','FO',['#285EAC','#C73246'],[
    s(2018,'Campeão brasileiro da Série B',[
      p('Marcelo Boeck','GOL',78), p('Tinga','LD ZAG',77,'tinga-guilherme-de-jesus-da-silva'),
      p('Diego Jussani','ZAG',75), p('Ligger','ZAG',76), p('Bruno Melo','LE ZAG',77),
      p('Felipe','VOL MC',77,'felipe-felipe-rodrigues-dos-santos'),
      p('Derley','VOL MC',76,'derley-wanderley-de-jesus-sousa'), p('Dodô','MEI MC',78,'dodo-luiz-paulo-hilario'),
      p('Marcinho','PD MEI',77,'marcinho-marcio-augusto-da-silva-barbosa'),
      p('Gustavo (Gustagol)','CA',80,'gustavo-henrique-da-silva-sousa'),
      p('Romarinho','PE SA',77,'romarinho-jose-romario-silva-de-souza'),
    ]),
    s(2019,'Campeão da Copa do Nordeste · Campeonato Cearense',[
      p('Felipe Alves','GOL',79), p('Tinga','LD ZAG',79,'tinga-guilherme-de-jesus-da-silva'),
      p('Juan Quintero','ZAG',78,'juan-camilo-quintero-fletcher'), p('Roger Carvalho','ZAG',77),
      p('Bruno Melo','LE ZAG',79), p('Felipe','VOL MC',79,'felipe-felipe-rodrigues-dos-santos'),
      p('Juninho','MC VOL',79,'juninho-paulo-roberto-valoura-junior'),
      p('Edinho','PD MEI',79,'edinho-edson-alves-de-oliveira'), p('Osvaldo','PE',80),
      p('Romarinho','PE SA',79,'romarinho-jose-romario-silva-de-souza'), p('Wellington Paulista','CA',80),
    ]),
    s(2022,'Campeão do Nordeste · Cearense · Oitavas da Libertadores',[
      p('Fernando Miguel','GOL',80), p('Tinga','LD ZAG',81,'tinga-guilherme-de-jesus-da-silva'),
      p('Emanuel Brítez','ZAG LD',80), p('Titi','ZAG',80,'titi-cristian-chagas-tarouco'),
      p('Juninho Capixaba','LE ME',81), p('Zé Welison','VOL MC',80), p('Lucas Sasha','VOL MC',79),
      p('Lucas Crispim','MEI ME',79), p('Yago Pikachu','MD PD',82), p('Moisés','PE',81,'moises-moises-vieira-da-veiga'),
      p('Thiago Galhardo','CA MEI',81),
    ]),
    s(2023,'Vice da Copa Sul-Americana · Campeão cearense',[
      p('João Ricardo','GOL',82), p('Tinga','LD ZAG',81,'tinga-guilherme-de-jesus-da-silva'),
      p('Emanuel Brítez','ZAG LD',81), p('Titi','ZAG',81,'titi-cristian-chagas-tarouco'), p('Bruno Pacheco','LE',80),
      p('Zé Welison','VOL MC',81), p('Caio Alexandre','MC VOL',82), p('Tomás Pochettino','MEI MC',81),
      p('Marinho','PD',80,'marinho-mario-sergio-santos-costa'),
      p('Guilherme','PE',80,'guilherme-guilherme-augusto-vieira-dos-santos'), p('Juan Martín Lucero','CA',83),
    ]),
  ]),
];
