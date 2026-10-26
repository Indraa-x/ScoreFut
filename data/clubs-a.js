/**
 * ScoreFut — 15 clubes europeus, 60 temporadas e 660 entradas de jogadores.
 * Ano = encerramento da temporada europeia (2017 significa 2016/17).
 * A seleção de dez atletas de linha por elenco é editorial. Os OVRs conferidos
 * em edições FIFA/FC são aplicados por ratings.js; os demais usam uma escala
 * editorial calibrada. Atributos são parâmetros do jogo, não dados históricos.
 * Atributos são parâmetros do jogo, derivados de OVR/posição; não são estatísticas
 * históricas. IDs representam a pessoa, portanto não incluem clube ou ano.
 * Camisas incertas ficam vazias (a interface exibe “—”). Fontes em VERIFICACAO-A.md.
 */

import { recalibratePlayer } from './ratings.js?v=world-cup-20261026';

const limite = valor => Math.max(15, Math.min(99, Math.round(valor)));
const perfis = {
  // ataque, meio, defesa, finalização, reflexo, posicionamento (deltas sobre OVR)
  GOL: [-65, -47, -55, -70, 1, 0],
  ZAG: [-38, -25, 1, -35, -62, -2],
  LD: [-15, -13, -3, -24, -62, -3],
  LE: [-15, -13, -3, -24, -62, -3],
  VOL: [-16, -1, -6, -19, -62, -4],
  MC: [-9, 1, -17, -13, -62, -5],
  MEI: [-2, 1, -31, -6, -62, -6],
  MD: [-6, -2, -22, -12, -62, -7],
  ME: [-6, -2, -22, -12, -62, -7],
  PE: [1, -7, -37, -2, -62, -5],
  PD: [1, -7, -37, -2, -62, -5],
  SA: [1, -5, -36, 0, -62, -3],
  CA: [1, -19, -38, 2, -62, -2]
};
const chaves = ['ataque', 'meio', 'defesa', 'finalizacao', 'reflexo', 'posicionamento'];
const pessoaId = nome => nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const P = (nome, posicoes, ovr, camisa = '', destaque = '', id = pessoaId(nome)) => {
  const tags = posicoes.split('/');
  const atributos = Object.fromEntries(chaves.map((chave, indice) => [
    chave, limite(ovr + Math.max(...tags.map(tag => perfis[tag][indice])))
  ]));
  return { id, nome, camisa: String(camisa), tags, ovr, atributos, destaque };
};
const T = (ano, conquistas, jogadores) => ({ ano, conquistas, jogadores: jogadores.map(p => recalibratePlayer(p, 15)) });
const C = (id, nome, monograma, cores, temporadas) => ({ id, nome, monograma, cores, temporadas });

export const clubsA = [
  C('real-madrid', 'Real Madrid', 'RM', ['#F4F4EF', '#D6AB4A'], [
    T(2002, 'Campeão da Champions', [
      P('Iker Casillas', 'GOL', 90, 1), P('Roberto Carlos', 'LE', 94, 3),
      P('Luís Figo', 'PD/MD', 94, 10), P('Zinedine Zidane', 'MEI/MC', 97, 5, 'Autor do gol decisivo na final'),
      P('Raúl', 'SA/CA', 95, 7),
      P("Fernando Hierro", "ZAG", 92),
      P("Claude Makélélé", "VOL", 92),
      P("Fernando Morientes", "CA", 91),
      P("Iván Helguera", "ZAG/VOL", 91),
      P("Santiago Solari", "ME/PE", 87),
      P("Míchel Salgado", "LD", 90)
    ]),
    T(2014, 'Champions e Copa do Rei', [
      P('Iker Casillas', 'GOL', 88, 1), P('Sergio Ramos', 'ZAG', 93, 4, 'Gol de empate na final da Champions'),
      P('Ángel Di María', 'MC/PD', 94, 22), P('Luka Modrić', 'MC', 93, 19),
      P('Cristiano Ronaldo', 'PE/CA', 98, 7, '17 gols na edição da Champions'),
      P("Dani Carvajal", "LD", 89),
      P("Pepe", "ZAG", 91),
      P("Xabi Alonso", "VOL", 92),
      P("Gareth Bale", "PD", 94),
      P("Karim Benzema", "CA", 93),
      P("Marcelo", "LE", 92)
    ]),
    T(2017, 'Champions e La Liga', [
      P('Keylor Navas', 'GOL', 90, 1), P('Sergio Ramos', 'ZAG', 93, 4),
      P('Toni Kroos', 'MC/VOL', 95, 8), P('Luka Modrić', 'MC', 96, 19),
      P('Cristiano Ronaldo', 'PE/CA', 98, 7, 'Dois gols na final da Champions'),
      P("Dani Carvajal", "LD", 92),
      P("Marcelo", "LE", 94),
      P("Casemiro", "VOL", 93),
      P("Isco", "MEI/MC", 94),
      P("Karim Benzema", "CA", 93),
      P("Raphaël Varane", "ZAG", 92)
    ]),
    T(2024, 'Champions e La Liga', [
      P('Andriy Lunin', 'GOL', 88, 13, 'Decisivo nos pênaltis contra o City'),
      P('Dani Carvajal', 'LD', 93, 2, 'Melhor jogador da final da Champions'),
      P('Toni Kroos', 'MC/VOL', 94, 8), P('Jude Bellingham', 'MEI/MC', 96, 5),
      P('Vinícius Júnior', 'PE/CA', 97, 7, 'Gol na final da Champions'),
      P("Antonio Rüdiger", "ZAG", 94),
      P("Federico Valverde", "MC/MD", 94),
      P("Eduardo Camavinga", "VOL/MC", 91),
      P("Aurélien Tchouaméni", "VOL/MC/ZAG", 92),
      P("Rodrygo", "PD/PE", 93),
      P("Ferland Mendy", "LE", 91)
    ])
  ]),
  C('barcelona', 'FC Barcelona', 'FCB', ['#A82447', '#214F9C'], [
    T(1992, 'Copa dos Campeões e La Liga', [
      P('Andoni Zubizarreta', 'GOL', 89), P('Ronald Koeman', 'ZAG/VOL', 93, '', 'Gol do primeiro título europeu'),
      P('Pep Guardiola', 'VOL/MC', 89), P('Michael Laudrup', 'MEI/SA', 95),
      P('Hristo Stoichkov', 'PE/CA', 94),
      P("Albert Ferrer", "LD", 86),
      P("José Mari Bakero", "MEI/MC", 90),
      P("Eusebio Sacristán", "MC/MD", 87),
      P("Nando Muñoz", "ZAG", 88),
      P("Julio Salinas", "CA", 88),
      P("Juan Carlos Rodríguez", "LE", 87)
    ]),
    T(2009, 'Tríplice coroa: Champions, Liga e Copa', [
      P('Víctor Valdés', 'GOL', 89, 1), P('Carles Puyol', 'ZAG/LD', 92, 5),
      P('Xavi', 'MC', 96, 6), P('Andrés Iniesta', 'MC/MEI', 94, 8),
      P('Lionel Messi', 'PD/SA', 98, 10),
      P("Dani Alves", "LD", 93),
      P("Gerard Piqué", "ZAG", 91),
      P("Sergio Busquets", "VOL", 90),
      P("Samuel Eto'o", "CA", 96),
      P("Thierry Henry", "PE/CA", 94),
      P("Eric Abidal", "LE", 91)
    ]),
    T(2011, 'Champions e La Liga', [
      P('Víctor Valdés', 'GOL', 91, 1), P('Dani Alves', 'LD', 93, 2),
      P('Xavi', 'MC', 96, 6), P('Andrés Iniesta', 'MC/MEI', 95, 8),
      P('Lionel Messi', 'SA/PD', 99, 10, 'Gol na final de Wembley'),
      P("Carles Puyol", "ZAG/LD", 93),
      P("Gerard Piqué", "ZAG", 91),
      P("Sergio Busquets", "VOL", 93),
      P("Pedro Rodríguez", "PE/PD", 92),
      P("David Villa", "CA/PE", 95),
      P("Eric Abidal", "LE", 92)
    ]),
    T(2015, 'Tríplice coroa: Champions, Liga e Copa', [
      P('Marc-André ter Stegen', 'GOL', 88, 1), P('Gerard Piqué', 'ZAG', 91, 3),
      P('Neymar', 'PE', 96, 11), P('Luis Suárez', 'CA', 97, 9),
      P('Lionel Messi', 'PD/SA', 99, 10),
      P("Dani Alves", "LD", 92),
      P("Jordi Alba", "LE", 92),
      P("Sergio Busquets", "VOL", 94),
      P("Andrés Iniesta", "MC/MEI", 95),
      P("Ivan Rakitić", "MC", 93),
      P("Javier Mascherano", "ZAG/VOL", 93)
    ])
  ]),
  C('bayern', 'Bayern de Munique', 'BAY', ['#D8323D', '#F1F3F1'], [
    T(2001, 'Champions e Bundesliga', [
      P('Oliver Kahn', 'GOL', 96, '', 'Decisivo na disputa de pênaltis da final'),
      P('Bixente Lizarazu', 'LE', 90), P('Stefan Effenberg', 'MC/VOL', 94),
      P('Mehmet Scholl', 'MEI', 92), P('Giovane Élber', 'CA', 92),
      P("Samuel Kuffour", "ZAG", 89),
      P("Patrik Andersson", "ZAG", 89),
      P("Willy Sagnol", "LD", 87),
      P("Hasan Salihamidžić", "MD/LD", 88),
      P("Owen Hargreaves", "VOL", 88),
      P("Carsten Jancker", "CA", 88)
    ]),
    T(2010, 'Bundesliga e Copa da Alemanha', [
      P('Hans-Jörg Butt', 'GOL', 85, 22), P('Philipp Lahm', 'LD/LE', 93, 21),
      P('Bastian Schweinsteiger', 'MC/VOL', 93, 31), P('Franck Ribéry', 'PE', 94, 7),
      P('Arjen Robben', 'PD', 96, 10),
      P("Daniel van Buyten", "ZAG", 88),
      P("Martín Demichelis", "ZAG", 87),
      P("Mark van Bommel", "VOL", 90),
      P("Thomas Müller", "MEI/SA", 93),
      P("Ivica Olić", "CA", 92),
      P("Holger Badstuber", "LE/ZAG", 89)
    ]),
    T(2013, 'Tríplice coroa: Champions, Liga e Copa', [
      P('Manuel Neuer', 'GOL', 94, 1), P('Philipp Lahm', 'LD/LE', 95, 21),
      P('Bastian Schweinsteiger', 'MC/VOL', 94, 31), P('Franck Ribéry', 'PE', 97, 7),
      P('Arjen Robben', 'PD', 96, 10, 'Gol do título europeu em Wembley'),
      P("Jérôme Boateng", "ZAG", 91),
      P("Dante", "ZAG", 91),
      P("David Alaba", "LE", 92),
      P("Javi Martínez", "VOL", 93),
      P("Thomas Müller", "MEI/SA", 94),
      P("Mario Mandžukić", "CA", 94)
    ]),
    T(2020, 'Tríplice coroa: Champions, Liga e Copa', [
      P('Manuel Neuer', 'GOL', 96, 1), P('David Alaba', 'ZAG/LE', 93, 27),
      P('Joshua Kimmich', 'VOL/LD', 95, 32), P('Thomas Müller', 'MEI/SA', 95, 25),
      P('Robert Lewandowski', 'CA', 98, 9),
      P("Jérôme Boateng", "ZAG", 90),
      P("Alphonso Davies", "LE", 94),
      P("Thiago Alcântara", "MC/VOL", 95),
      P("Leon Goretzka", "MC/VOL", 94),
      P("Serge Gnabry", "PD/PE", 95),
      P("Kingsley Coman", "PE", 93)
    ])
  ]),
  C('milan', 'AC Milan', 'MIL', ['#CE303B', '#242728'], [
    T(1990, 'Campeão da Copa dos Campeões', [
      P('Giovanni Galli', 'GOL', 88), P('Franco Baresi', 'ZAG', 96),
      P('Paolo Maldini', 'LE/ZAG', 94), P('Frank Rijkaard', 'VOL/ZAG', 95, '', 'Gol do título europeu'),
      P('Marco van Basten', 'CA', 97),
      P("Alessandro Costacurta", "ZAG", 92),
      P("Mauro Tassotti", "LD", 91),
      P("Carlo Ancelotti", "MC/VOL", 91),
      P("Roberto Donadoni", "MD/ME", 91),
      P("Daniele Massaro", "CA/SA", 92),
      P("Alberico Evani", "ME/MC", 89)
    ]),
    T(1994, 'Champions e Campeonato Italiano', [
      P('Sebastiano Rossi', 'GOL', 90), P('Franco Baresi', 'ZAG', 95),
      P('Paolo Maldini', 'ZAG/LE', 96), P('Demetrio Albertini', 'MC/VOL', 92),
      P('Dejan Savićević', 'MEI/SA', 95, '', 'Gol na final da Champions'),
      P("Alessandro Costacurta", "ZAG", 93),
      P("Mauro Tassotti", "LD", 91),
      P("Marcel Desailly", "VOL/ZAG", 94),
      P("Zvonimir Boban", "MEI/MC", 92),
      P("Daniele Massaro", "CA", 92),
      P("Roberto Donadoni", "MD/ME", 92)
    ]),
    T(2003, 'Champions e Copa da Itália', [
      P('Dida', 'GOL', 93, 1), P('Paolo Maldini', 'ZAG/LE', 95, 3),
      P('Alessandro Nesta', 'ZAG', 94, 13), P('Andrea Pirlo', 'VOL/MC', 93, 21),
      P('Andriy Shevchenko', 'CA', 94, 7, 'Cobrança decisiva na final da Champions'),
      P("Rui Costa", "MEI", 94),
      P("Alessandro Costacurta", "ZAG/LD", 90),
      P("Gennaro Gattuso", "VOL", 91),
      P("Clarence Seedorf", "MC/MEI", 94),
      P("Filippo Inzaghi", "CA", 93),
      P("Kakha Kaladze", "LE/ZAG", 90)
    ]),
    T(2007, 'Campeão da Champions', [
      P('Dida', 'GOL', 89, 1), P('Alessandro Nesta', 'ZAG', 93, 13),
      P('Andrea Pirlo', 'VOL/MC', 94, 21), P('Clarence Seedorf', 'MC/MEI', 94, 10),
      P('Kaká', 'MEI/SA', 98, 22, 'Artilheiro da Champions com 10 gols'),
      P("Paolo Maldini", "ZAG/LE", 93),
      P("Massimo Oddo", "LD", 89),
      P("Gennaro Gattuso", "VOL", 92),
      P("Massimo Ambrosini", "VOL/MC", 91),
      P("Filippo Inzaghi", "CA", 94),
      P("Marek Jankulovski", "LE", 90)
    ])
  ]),
  C('manchester-united', 'Manchester United', 'MU', ['#D8413C', '#E9E5DA'], [
    T(1994, 'Premier League e Copa da Inglaterra', [
      P('Peter Schmeichel', 'GOL', 93), P('Steve Bruce', 'ZAG', 89),
      P('Paul Ince', 'VOL/MC', 91), P('Ryan Giggs', 'ME/PE', 93),
      P('Eric Cantona', 'SA/MEI', 96),
      P("Denis Irwin", "LE", 91),
      P("Gary Pallister", "ZAG", 90),
      P("Roy Keane", "VOL/MC", 92),
      P("Andrei Kanchelskis", "PD/MD", 91),
      P("Mark Hughes", "CA/SA", 91),
      P("Paul Parker", "LD", 89)
    ]),
    T(1999, 'Tríplice coroa: Champions, Liga e Copa', [
      P('Peter Schmeichel', 'GOL', 93, 1), P('Jaap Stam', 'ZAG', 93, 6),
      P('Roy Keane', 'VOL/MC', 95, 16), P('David Beckham', 'MD/MC', 95, 7),
      P('Dwight Yorke', 'CA/SA', 94, 19),
      P("Denis Irwin", "LE", 91),
      P("Gary Neville", "LD", 90),
      P("Paul Scholes", "MC/MEI", 94),
      P("Ryan Giggs", "ME/PE", 94),
      P("Andy Cole", "CA", 93),
      P("Ronny Johnsen", "ZAG/VOL", 90)
    ]),
    T(2008, 'Champions e Premier League', [
      P('Edwin van der Sar', 'GOL', 92, 1), P('Rio Ferdinand', 'ZAG', 94, 5),
      P('Nemanja Vidić', 'ZAG', 93, 15), P('Wayne Rooney', 'SA/CA', 94, 10),
      P('Cristiano Ronaldo', 'PD/PE', 98, 7),
      P("Patrice Evra", "LE", 92),
      P("Wes Brown", "ZAG/LD", 90),
      P("Michael Carrick", "VOL/MC", 92),
      P("Paul Scholes", "MC", 92),
      P("Carlos Tévez", "CA/SA", 94),
      P("Owen Hargreaves", "VOL/MC/MD", 90)
    ]),
    T(2009, 'Premier League e Copa da Liga', [
      P('Edwin van der Sar', 'GOL', 94, 1), P('Nemanja Vidić', 'ZAG', 95, 15),
      P('Ryan Giggs', 'MC/ME', 91, 11), P('Wayne Rooney', 'SA/CA', 94, 10),
      P('Cristiano Ronaldo', 'PE/PD', 97, 7),
      P("Rio Ferdinand", "ZAG", 93),
      P("Patrice Evra", "LE", 92),
      P("Michael Carrick", "MC/VOL", 92),
      P("Paul Scholes", "MC", 91),
      P("Dimitar Berbatov", "CA", 93),
      P("John O'Shea", "LD/ZAG/LE", 90)
    ])
  ]),
  C('liverpool', 'Liverpool', 'LIV', ['#C72D40', '#EFEBDD'], [
    T(2005, 'Campeão da Champions', [
      P('Jerzy Dudek', 'GOL', 89, 1, 'Decisivo nos pênaltis em Istambul'),
      P('Jamie Carragher', 'ZAG', 91, 23), P('Xabi Alonso', 'MC/VOL', 91, 14),
      P('Luis García', 'MEI/SA', 89, 10), P('Steven Gerrard', 'MC/MEI', 96, 8),
      P("Steve Finnan", "LD", 88),
      P("Sami Hyypiä", "ZAG", 90),
      P("John Arne Riise", "LE/ME", 89),
      P("Dietmar Hamann", "VOL", 89),
      P("Milan Baroš", "CA", 88),
      P("Djibril Cissé", "CA", 88)
    ]),
    T(2019, 'Campeão da Champions', [
      P('Alisson', 'GOL', 95, 13), P('Virgil van Dijk', 'ZAG', 97, 4),
      P('Fabinho', 'VOL', 91, 3), P('Sadio Mané', 'PE', 95, 10),
      P('Mohamed Salah', 'PD', 96, 11),
      P("Trent Alexander-Arnold", "LD", 94),
      P("Andrew Robertson", "LE", 93),
      P("Jordan Henderson", "MC/VOL", 91),
      P("Georginio Wijnaldum", "MC/VOL", 92),
      P("Roberto Firmino", "CA/SA", 93),
      P("Joël Matip", "ZAG", 92)
    ]),
    T(2020, 'Campeão da Premier League', [
      P('Alisson', 'GOL', 94, 1), P('Virgil van Dijk', 'ZAG', 96, 4),
      P('Jordan Henderson', 'MC/VOL', 92, 14), P('Sadio Mané', 'PE', 96, 10),
      P('Mohamed Salah', 'PD', 95, 11),
      P("Trent Alexander-Arnold", "LD", 94),
      P("Andrew Robertson", "LE", 94),
      P("Fabinho", "VOL", 93),
      P("Georginio Wijnaldum", "MC/VOL", 92),
      P("Roberto Firmino", "CA/SA", 93),
      P("Joe Gomez", "ZAG", 91)
    ]),
    T(2025, 'Campeão da Premier League', [
      P('Alisson', 'GOL', 93, 1), P('Virgil van Dijk', 'ZAG', 95, 4),
      P('Ryan Gravenberch', 'VOL/MC', 92, 38, 'Jovem jogador da temporada da Premier League'),
      P('Alexis Mac Allister', 'MC/MEI', 93, 10), P('Mohamed Salah', 'PD', 98, 11),
      P("Trent Alexander-Arnold", "LD", 92),
      P("Ibrahima Konaté", "ZAG", 91),
      P("Dominik Szoboszlai", "MC/MEI", 92),
      P("Luis Díaz", "PE", 93),
      P("Cody Gakpo", "CA/PE", 92),
      P("Andrew Robertson", "LE", 90)
    ])
  ]),
  C('manchester-city', 'Manchester City', 'MC', ['#6BAFC8', '#EDF4F0'], [
    T(2018, 'Premier League e Copa da Liga', [
      P('Ederson', 'GOL', 90, 31), P('Fernandinho', 'VOL', 92, 25),
      P('David Silva', 'MEI/MC', 94, 21), P('Kevin De Bruyne', 'MC/MEI', 96, 17),
      P('Sergio Agüero', 'CA', 95, 10),
      P("Kyle Walker", "LD", 92),
      P("Nicolás Otamendi", "ZAG", 91),
      P("Vincent Kompany", "ZAG", 90),
      P("Raheem Sterling", "PE/PD", 93),
      P("Leroy Sané", "PE", 94),
      P("Fabian Delph", "LE/VOL", 88)
    ]),
    T(2021, 'Premier League e Copa da Liga', [
      P('Ederson', 'GOL', 91, 31), P('Rúben Dias', 'ZAG', 94, 3),
      P('İlkay Gündoğan', 'MC', 93, 8), P('Kevin De Bruyne', 'MC/MEI', 96, 17),
      P('Riyad Mahrez', 'PD', 92, 26),
      P("Kyle Walker", "LD", 92),
      P("John Stones", "ZAG", 92),
      P("Rodri", "VOL", 92),
      P("Gabriel Jesus", "CA/PD", 90),
      P("Phil Foden", "MEI/PE", 92),
      P("Oleksandr Zinchenko", "LE/MC", 90)
    ]),
    T(2023, 'Tríplice coroa: Champions, Liga e Copa', [
      P('Ederson', 'GOL', 92, 31), P('Rúben Dias', 'ZAG', 94, 3),
      P('Rodri', 'VOL', 97, 16, 'Gol do título na final da Champions'),
      P('Kevin De Bruyne', 'MC/MEI', 97, 17), P('Erling Haaland', 'CA', 98, 9),
      P("John Stones", "ZAG/VOL", 94),
      P("Nathan Aké", "ZAG/LE", 92),
      P("İlkay Gündoğan", "MC", 95),
      P("Bernardo Silva", "MC/MEI/PD", 94),
      P("Jack Grealish", "PE", 93),
      P("Kyle Walker", "LD", 92)
    ]),
    T(2024, 'Campeão da Premier League', [
      P('Ederson', 'GOL', 91, 31), P('Rúben Dias', 'ZAG', 93, 3),
      P('Rodri', 'VOL', 98, 16), P('Phil Foden', 'MEI/PD', 96, 47),
      P('Erling Haaland', 'CA', 96, 9),
      P("Kyle Walker", "LD", 91),
      P("Joško Gvardiol", "ZAG/LE", 92),
      P("Bernardo Silva", "MC/MEI", 93),
      P("Kevin De Bruyne", "MC/MEI", 96),
      P("Julián Álvarez", "CA/SA", 93),
      P("Manuel Akanji", "ZAG/LD", 92)
    ])
  ]),
  C('arsenal', 'Arsenal', 'ARS', ['#DB4A4D', '#F1EEE7'], [
    T(1998, 'Premier League e Copa da Inglaterra', [
      P('David Seaman', 'GOL', 91), P('Tony Adams', 'ZAG', 93),
      P('Patrick Vieira', 'VOL/MC', 94), P('Marc Overmars', 'PE/ME', 93),
      P('Dennis Bergkamp', 'SA/MEI', 97),
      P("Lee Dixon", "LD", 89),
      P("Nigel Winterburn", "LE", 89),
      P("Emmanuel Petit", "VOL/MC", 92),
      P("Ray Parlour", "MD/MC", 89),
      P("Nicolas Anelka", "CA", 91),
      P("Martin Keown", "ZAG", 91)
    ]),
    T(2002, 'Premier League e Copa da Inglaterra', [
      P('David Seaman', 'GOL', 88, 1), P('Sol Campbell', 'ZAG', 93, 23),
      P('Patrick Vieira', 'VOL/MC', 95, 4), P('Robert Pirès', 'ME/PE', 95, 7),
      P('Thierry Henry', 'CA/PE', 97, 14),
      P("Ashley Cole", "LE", 92),
      P("Martin Keown", "ZAG", 90),
      P("Fredrik Ljungberg", "MD/PD", 93),
      P("Dennis Bergkamp", "SA/MEI", 94),
      P("Ray Parlour", "MD/MC", 91),
      P("Lauren", "LD", 91)
    ]),
    T(2004, 'Campeão inglês invicto', [
      P('Jens Lehmann', 'GOL', 91, 1), P('Sol Campbell', 'ZAG', 94, 23),
      P('Patrick Vieira', 'VOL/MC', 96, 4), P('Robert Pirès', 'ME/PE', 95, 7),
      P('Thierry Henry', 'CA/PE', 99, 14),
      P("Ashley Cole", "LE", 94),
      P("Kolo Touré", "ZAG", 92),
      P("Gilberto Silva", "VOL", 92),
      P("Fredrik Ljungberg", "MD/PD", 93),
      P("Dennis Bergkamp", "SA/MEI", 94),
      P("Lauren", "LD", 92)
    ]),
    T(2006, 'Finalista da Champions', [
      P('Jens Lehmann', 'GOL', 92, 1), P('Kolo Touré', 'ZAG', 91, 28),
      P('Gilberto Silva', 'VOL', 90, 19), P('Cesc Fàbregas', 'MC/MEI', 91, 15),
      P('Thierry Henry', 'CA/PE', 97, 14),
      P("Emmanuel Eboué", "LD", 88),
      P("Sol Campbell", "ZAG", 91),
      P("Robert Pirès", "ME/PE", 92),
      P("Fredrik Ljungberg", "MD/PD", 91),
      P("José Antonio Reyes", "PE/CA", 91),
      P("Ashley Cole", "LE", 91)
    ])
  ]),
  C('chelsea', 'Chelsea', 'CHE', ['#3562BA', '#EBEFEA'], [
    T(2005, 'Premier League e Copa da Liga', [
      P('Petr Čech', 'GOL', 95, 1), P('John Terry', 'ZAG', 95, 26),
      P('Claude Makélélé', 'VOL', 93, 4), P('Frank Lampard', 'MC/MEI', 96, 8),
      P('Arjen Robben', 'PE/PD', 93, 16),
      P("Ricardo Carvalho", "ZAG", 94),
      P("Paulo Ferreira", "LD", 90),
      P("William Gallas", "ZAG/LE", 92),
      P("Damien Duff", "PE/ME", 92),
      P("Didier Drogba", "CA", 92),
      P("Tiago Mendes", "MC/VOL", 90)
    ]),
    T(2010, 'Premier League e Copa da Inglaterra', [
      P('Petr Čech', 'GOL', 92, 1), P('John Terry', 'ZAG', 92, 26),
      P('Frank Lampard', 'MC/MEI', 96, 8), P('Florent Malouda', 'PE/ME', 92, 15),
      P('Didier Drogba', 'CA', 97, 11),
      P("Branislav Ivanović", "ZAG/LD", 92),
      P("Ashley Cole", "LE", 94),
      P("Michael Essien", "VOL/MC", 92),
      P("Nicolas Anelka", "CA/PD", 93),
      P("Michael Ballack", "MC", 92),
      P("Ricardo Carvalho", "ZAG", 92)
    ]),
    T(2012, 'Champions e Copa da Inglaterra', [
      P('Petr Čech', 'GOL', 95, 1), P('John Terry', 'ZAG', 91, 26),
      P('Frank Lampard', 'MC/MEI', 93, 8), P('Ramires', 'MC/MD', 91, 7),
      P('Didier Drogba', 'CA', 95, 11, 'Gol e pênalti decisivo na final da Champions'),
      P("Branislav Ivanović", "ZAG/LD", 92),
      P("Ashley Cole", "LE", 93),
      P("Gary Cahill", "ZAG", 91),
      P("Juan Mata", "MEI", 94),
      P("John Obi Mikel", "VOL", 89),
      P("Fernando Torres", "CA", 90)
    ]),
    T(2021, 'Campeão da Champions', [
      P('Édouard Mendy', 'GOL', 91, 16), P('Thiago Silva', 'ZAG', 92, 6),
      P("N'Golo Kanté", 'VOL/MC', 96, 7), P('Mason Mount', 'MEI/MC', 91, 19),
      P('Kai Havertz', 'MEI/SA', 89, 29, 'Gol do título na final da Champions'),
      P("Antonio Rüdiger", "ZAG", 93),
      P("César Azpilicueta", "LD/ZAG", 92),
      P("Reece James", "LD", 91),
      P("Ben Chilwell", "LE", 90),
      P("Jorginho", "VOL/MC", 92, "", "", "jorginho-frello"),
      P("Timo Werner", "CA/PE", 90)
    ])
  ]),
  C('inter', 'Inter de Milão', 'INT', ['#3780C6', '#22292D'], [
    T(1998, 'Campeão da Copa UEFA', [
      P('Gianluca Pagliuca', 'GOL', 92), P('Javier Zanetti', 'LD/LE', 92),
      P('Diego Simeone', 'VOL/MC', 90), P('Youri Djorkaeff', 'MEI/SA', 93),
      P('Ronaldo', 'CA', 99, 9),
      P("Giuseppe Bergomi", "ZAG/LD", 91),
      P("Taribo West", "ZAG", 89),
      P("Francesco Moriero", "MD/PD", 89),
      P("Iván Zamorano", "CA", 92),
      P("Álvaro Recoba", "MEI/SA", 90),
      P("Francesco Colonnese", "LE/ZAG", 89)
    ]),
    T(2007, 'Campeão italiano', [
      P('Júlio César', 'GOL', 90, 12), P('Javier Zanetti', 'LD/VOL', 93, 4),
      P('Esteban Cambiasso', 'VOL/MC', 92, 19), P('Dejan Stanković', 'MC/MEI', 92, 5),
      P('Zlatan Ibrahimović', 'CA', 95, 8),
      P("Walter Samuel", "ZAG", 92),
      P("Marco Materazzi", "ZAG", 92),
      P("Maicon", "LD", 92),
      P("Luís Figo", "MD/MEI", 91),
      P("Hernán Crespo", "CA", 92),
      P("Maxwell", "LE", 90)
    ]),
    T(2010, 'Tríplice coroa: Champions, Liga e Copa', [
      P('Júlio César', 'GOL', 95, 12), P('Lúcio', 'ZAG', 94, 6),
      P('Esteban Cambiasso', 'VOL/MC', 93, 19), P('Wesley Sneijder', 'MEI', 97, 10),
      P('Diego Milito', 'CA', 96, 22, 'Dois gols na final da Champions'),
      P("Walter Samuel", "ZAG", 94),
      P("Javier Zanetti", "LD/LE/VOL", 93),
      P("Maicon", "LD", 95),
      P("Thiago Motta", "VOL/MC", 92),
      P("Samuel Eto'o", "CA/PD", 95),
      P("Goran Pandev", "PE/SA", 91)
    ]),
    T(2024, 'Campeão italiano e Supercopa', [
      P('Yann Sommer', 'GOL', 91, 1), P('Alessandro Bastoni', 'ZAG', 93, 95),
      P('Nicolò Barella', 'MC', 93, 23), P('Hakan Çalhanoğlu', 'VOL/MC', 94, 20),
      P('Lautaro Martínez', 'CA/SA', 96, 10),
      P("Benjamin Pavard", "ZAG/LD", 91),
      P("Francesco Acerbi", "ZAG", 92),
      P("Federico Dimarco", "LE/ME", 92),
      P("Henrikh Mkhitaryan", "MC/MEI", 91),
      P("Marcus Thuram", "CA/SA", 93),
      P("Denzel Dumfries", "LD/MD", 91)
    ])
  ]),
  C('juventus', 'Juventus', 'JUV', ['#ECEDE8', '#2B2C31'], [
    T(1996, 'Campeão da Champions', [
      P('Angelo Peruzzi', 'GOL', 93), P('Ciro Ferrara', 'ZAG', 91),
      P('Didier Deschamps', 'VOL', 92), P('Alessandro Del Piero', 'SA/MEI', 95),
      P('Gianluca Vialli', 'CA', 93),
      P("Moreno Torricelli", "LD/ZAG", 89),
      P("Pietro Vierchowod", "ZAG", 90),
      P("Antonio Conte", "MC/MD", 90),
      P("Paulo Sousa", "VOL/MC", 91),
      P("Fabrizio Ravanelli", "CA", 93),
      P("Gianluca Pessotto", "LE", 89)
    ]),
    T(1998, 'Campeão italiano; finalista europeu', [
      P('Angelo Peruzzi', 'GOL', 93, 1), P('Paolo Montero', 'ZAG', 91, 4),
      P('Zinedine Zidane', 'MEI/MC', 96, 21), P('Alessandro Del Piero', 'SA/MEI', 97, 10),
      P('Filippo Inzaghi', 'CA', 94, 9),
      P("Ciro Ferrara", "ZAG", 92),
      P("Didier Deschamps", "VOL", 92),
      P("Edgar Davids", "MC/VOL", 94),
      P("Angelo Di Livio", "MD/MC", 90),
      P("Gianluca Pessotto", "LE", 89),
      P("Moreno Torricelli", "LD/ZAG", 90)
    ]),
    T(2015, 'Campeonato Italiano e Copa da Itália', [
      P('Gianluigi Buffon', 'GOL', 95, 1), P('Giorgio Chiellini', 'ZAG', 93, 3),
      P('Paul Pogba', 'MC', 94, 6), P('Arturo Vidal', 'MC/VOL', 93, 23),
      P('Carlos Tévez', 'CA/SA', 96, 10),
      P("Leonardo Bonucci", "ZAG", 93),
      P("Andrea Pirlo", "MC/VOL", 94),
      P("Claudio Marchisio", "MC/VOL", 93),
      P("Stephan Lichtsteiner", "LD", 91),
      P("Álvaro Morata", "CA", 92),
      P("Patrice Evra", "LE", 91)
    ]),
    T(2017, 'Campeonato Italiano e Copa da Itália', [
      P('Gianluigi Buffon', 'GOL', 96, 1), P('Leonardo Bonucci', 'ZAG', 94, 19),
      P('Miralem Pjanić', 'MC/VOL', 92, 5), P('Paulo Dybala', 'SA/MEI', 95, 21),
      P('Gonzalo Higuaín', 'CA', 95, 9),
      P("Giorgio Chiellini", "ZAG", 94),
      P("Andrea Barzagli", "ZAG", 93),
      P("Alex Sandro", "LE", 93),
      P("Sami Khedira", "VOL/MC", 91),
      P("Dani Alves", "LD", 94),
      P("Mario Mandžukić", "PE/CA", 93)
    ])
  ]),
  C('ajax', 'Ajax', 'AJA', ['#C63245', '#F0F0E9'], [
    T(1992, 'Campeão da Copa UEFA', [
      P('Stanley Menzo', 'GOL', 87), P('Danny Blind', 'ZAG', 90),
      P('Wim Jonk', 'VOL/MC', 90), P('Aron Winter', 'MC/MD', 89),
      P('Dennis Bergkamp', 'SA/MEI', 95),
      P("Frank de Boer", "ZAG/LE", 89),
      P("Sonny Silooy", "LD/ZAG", 86),
      P("Bryan Roy", "PE", 90),
      P("John van 't Schip", "PD/MD", 88),
      P("Stefan Pettersson", "CA", 90),
      P("Michel Kreek", "ZAG/VOL", 86)
    ]),
    T(1995, 'Champions e Campeonato Holandês', [
      P('Edwin van der Sar', 'GOL', 92), P('Frank Rijkaard', 'VOL/ZAG', 94),
      P('Jari Litmanen', 'MEI/SA', 96), P('Marc Overmars', 'PE/ME', 93),
      P('Patrick Kluivert', 'CA', 92, '', 'Gol do título na final da Champions'),
      P("Danny Blind", "ZAG", 93),
      P("Frank de Boer", "ZAG/LE", 91),
      P("Clarence Seedorf", "MC", 92),
      P("Edgar Davids", "MC/VOL", 93),
      P("Finidi George", "PD", 91),
      P("Michael Reiziger", "LD", 91)
    ]),
    T(1996, 'Campeão holandês; finalista europeu', [
      P('Edwin van der Sar', 'GOL', 92), P('Frank de Boer', 'ZAG/LE', 92),
      P('Edgar Davids', 'VOL/MC', 93), P('Jari Litmanen', 'MEI/SA', 96),
      P('Patrick Kluivert', 'CA', 93),
      P("Danny Blind", "ZAG", 92),
      P("Michael Reiziger", "LD", 91),
      P("Ronald de Boer", "MEI/SA", 93),
      P("Nwankwo Kanu", "CA/SA", 92),
      P("Finidi George", "PD", 92),
      P("Winston Bogarde", "LE/ZAG", 89)
    ]),
    T(2019, 'Campeonato Holandês e Copa', [
      P('André Onana', 'GOL', 89, 24), P('Matthijs de Ligt', 'ZAG', 93, 4),
      P('Frenkie de Jong', 'MC/VOL', 94, 21), P('Hakim Ziyech', 'MEI/PD', 93, 22),
      P('Dušan Tadić', 'SA/PE', 94, 10),
      P("Daley Blind", "ZAG/VOL", 92),
      P("Nicolás Tagliafico", "LE", 90),
      P("Lasse Schöne", "VOL/MC", 90),
      P("Donny van de Beek", "MC/MEI", 92),
      P("David Neres", "PE/PD", 91),
      P("Noussair Mazraoui", "LD", 89)
    ])
  ]),
  C('napoli', 'Napoli', 'NAP', ['#3BA5C8', '#EFF3EC'], [
    T(1990, 'Campeão italiano', [
      P('Giuliano Giuliani', 'GOL', 85), P('Ciro Ferrara', 'ZAG/LD', 90),
      P('Alemão', 'VOL/MC', 91), P('Diego Maradona', 'MEI/SA', 98),
      P('Careca', 'CA', 95),
      P("Marco Baroni", "ZAG", 89),
      P("Giovanni Francini", "LE", 89),
      P("Fernando De Napoli", "MC", 89),
      P("Massimo Crippa", "VOL/MC", 89),
      P("Andrea Carnevale", "CA", 91),
      P("Giancarlo Corradini", "ZAG", 88)
    ]),
    T(2018, 'Vice-campeão italiano', [
      P('Pepe Reina', 'GOL', 87, 25), P('Kalidou Koulibaly', 'ZAG', 94, 26),
      P('Marek Hamšík', 'MC/MEI', 92, 17), P('Lorenzo Insigne', 'PE', 93, 24),
      P('Dries Mertens', 'CA/SA', 94, 14),
      P("Raúl Albiol", "ZAG", 90),
      P("Mario Rui", "LE", 89),
      P("Jorginho", "VOL/MC", 92, "", "", "jorginho-frello"),
      P("Allan", "VOL/MC", 91),
      P("José Callejón", "PD", 91),
      P("Elseid Hysaj", "LD", 90)
    ]),
    T(2023, 'Campeão italiano', [
      P('Alex Meret', 'GOL', 89, 1), P('Kim Min-jae', 'ZAG', 93, 3),
      P('Stanislav Lobotka', 'VOL/MC', 92, 68), P('Khvicha Kvaratskhelia', 'PE', 95, 77),
      P('Victor Osimhen', 'CA', 96, 9, 'Gol que confirmou o título italiano'),
      P("Giovanni Di Lorenzo", "LD", 92),
      P("Amir Rrahmani", "ZAG", 91),
      P("André-Frank Zambo Anguissa", "VOL/MC", 92),
      P("Piotr Zieliński", "MC/MEI", 91),
      P("Matteo Politano", "PD", 90),
      P("Mario Rui", "LE", 90)
    ]),
    T(2025, 'Campeão italiano', [
      P('Alex Meret', 'GOL', 90, 1), P('Giovanni Di Lorenzo', 'LD', 91, 22),
      P('André-Frank Zambo Anguissa', 'MC/VOL', 91, 99),
      P('Scott McTominay', 'MC/MEI', 94, 8), P('Romelu Lukaku', 'CA', 93, 11),
      P("Alessandro Buongiorno", "ZAG", 91),
      P("Amir Rrahmani", "ZAG", 91),
      P("Stanislav Lobotka", "VOL/MC", 92),
      P("Matteo Politano", "PD", 90),
      P("Giacomo Raspadori", "CA/SA", 90),
      P("Leonardo Spinazzola", "LE", 89)
    ])
  ]),
  C('tottenham', 'Tottenham', 'TOT', ['#E7ECEB', '#26395E'], [
    T(2016, '3º lugar na Premier League', [
      P('Hugo Lloris', 'GOL', 90, 1), P('Toby Alderweireld', 'ZAG', 92, 4),
      P('Mousa Dembélé', 'MC/VOL', 92, 19), P('Dele Alli', 'MEI/SA', 91, 20),
      P('Harry Kane', 'CA', 95, 10),
      P("Kyle Walker", "LD", 91),
      P("Jan Vertonghen", "ZAG/LE", 91),
      P("Eric Dier", "VOL/ZAG", 90),
      P("Christian Eriksen", "MEI/MC", 92),
      P("Erik Lamela", "PD/MEI", 89),
      P("Danny Rose", "LE", 91)
    ]),
    T(2017, 'Vice-campeão da Premier League', [
      P('Hugo Lloris', 'GOL', 91, 1), P('Jan Vertonghen', 'ZAG/LE', 92, 5),
      P('Christian Eriksen', 'MEI/MC', 94, 23), P('Dele Alli', 'MEI/SA', 93, 20),
      P('Harry Kane', 'CA', 96, 10),
      P("Toby Alderweireld", "ZAG", 92),
      P("Kyle Walker", "LD", 92),
      P("Mousa Dembélé", "MC/VOL", 93),
      P("Victor Wanyama", "VOL", 91),
      P("Son Heung-min", "PE", 92),
      P("Danny Rose", "LE", 91)
    ]),
    T(2019, 'Finalista da Champions', [
      P('Hugo Lloris', 'GOL', 91, 1), P('Toby Alderweireld', 'ZAG', 91, 4),
      P('Christian Eriksen', 'MEI/MC', 93, 23), P('Son Heung-min', 'PE/SA', 94, 7),
      P('Harry Kane', 'CA', 95, 10),
      P("Jan Vertonghen", "ZAG/LE", 92),
      P("Danny Rose", "LE", 90),
      P("Moussa Sissoko", "MC/MD", 90),
      P("Dele Alli", "MEI/SA", 91),
      P("Lucas Moura", "PD/SA", 93),
      P("Kieran Trippier", "LD", 89)
    ]),
    T(2025, 'Campeão da Europa League', [
      P('Guglielmo Vicario', 'GOL', 88, 1), P('Cristian Romero', 'ZAG', 92, 17),
      P('Pedro Porro', 'LD/MD', 90, 23), P('Brennan Johnson', 'PD', 90, 22, 'Gol do título da Europa League'),
      P('Dominic Solanke', 'CA', 89, 19),
      P("Micky van de Ven", "ZAG", 91),
      P("Destiny Udogie", "LE", 89),
      P("Dejan Kulusevski", "PD/MEI", 91),
      P("James Maddison", "MEI", 90),
      P("Son Heung-min", "PE", 91),
      P("Rodrigo Bentancur", "VOL/MC", 90)
    ])
  ]),
  C('atletico-madrid', 'Atlético de Madrid', 'ATM', ['#D84B51', '#E5E8E5'], [
    T(1996, 'La Liga e Copa do Rei', [
      P('José Francisco Molina', 'GOL', 90), P('Diego Simeone', 'VOL/MC', 92),
      P('José Luis Caminero', 'MEI/MD', 93), P('Milinko Pantić', 'MEI', 93),
      P('Kiko', 'SA/CA', 92),
      P("Roberto Solozábal", "ZAG", 89),
      P("Santi Denia", "ZAG", 88),
      P("Delfí Geli", "LD", 88),
      P("Juan Vizcaíno", "VOL", 89),
      P("Luboslav Penev", "CA", 93),
      P("Toni Muñoz", "LE", 89)
    ]),
    T(2014, 'Campeão de La Liga', [
      P('Thibaut Courtois', 'GOL', 95, 13), P('Diego Godín', 'ZAG', 94, 2),
      P('Gabi', 'VOL/MC', 92, 14), P('Koke', 'MC/ME', 93, 6),
      P('Diego Costa', 'CA', 95, 19),
      P("Juanfran", "LD", 92),
      P("Filipe Luís", "LE", 93),
      P("Miranda", "ZAG", 93),
      P("Arda Turan", "MEI/MD", 93),
      P("David Villa", "CA/PE", 91),
      P("Tiago Mendes", "VOL/MC", 91)
    ]),
    T(2016, 'Finalista da Champions', [
      P('Jan Oblak', 'GOL', 96, 13), P('Diego Godín', 'ZAG', 95, 2),
      P('Koke', 'MC/ME', 93, 6), P('Saúl Ñíguez', 'MC/VOL', 92, 17),
      P('Antoine Griezmann', 'SA/CA', 97, 7),
      P("Juanfran", "LD", 92),
      P("Filipe Luís", "LE", 94),
      P("José María Giménez", "ZAG", 92),
      P("Gabi", "VOL/MC", 92),
      P("Yannick Carrasco", "PE", 91),
      P("Fernando Torres", "CA", 91)
    ]),
    T(2021, 'Campeão de La Liga', [
      P('Jan Oblak', 'GOL', 96, 13), P('Stefan Savić', 'ZAG', 91, 15),
      P('Koke', 'MC/VOL', 92, 6), P('Marcos Llorente', 'MC/MD', 94, 14),
      P('Luis Suárez', 'CA', 95, 9),
      P("José María Giménez", "ZAG", 91),
      P("Kieran Trippier", "LD", 91),
      P("Yannick Carrasco", "PE/ME", 92),
      P("Ángel Correa", "SA/PD", 91),
      P("Mario Hermoso", "ZAG/LE", 90),
      P("Thomas Lemar", "MC/ME", 91)
    ])
  ])
];
