/**
 * Three curated peak-era XIs for each of the 20 national teams in the mode.
 * Ratings are editorial ScoreFut peak-era references (not FIFA 20 ratings).
 * Each squad has eleven unique players and one goalkeeper.
 */
const slug = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const clamp = value => Math.max(10,Math.min(96,value));
function player(line,index){
  const [role,name,ratingText]=line.split('|'),tags=role.split('/'),ovr=Number(ratingText),goalkeeper=tags.includes('GOL');
  const defensive=tags.some(tag=>['ZAG','LD','LE'].includes(tag));
  const holding=tags.some(tag=>['VOL','MC'].includes(tag));
  return {id:slug(name),nome:name,tags,ovr,camisa:goalkeeper?1:index+1,atributos:{
    ataque:clamp(ovr-(goalkeeper?68:defensive?15:holding?5:2)),
    meio:clamp(ovr-(goalkeeper?69:defensive?6:holding?0:2)),
    defesa:clamp(ovr-(goalkeeper?0:defensive?0:holding?8:18)),
    finalizacao:clamp(ovr-(goalkeeper?75:defensive?24:holding?9:2)),
    reflexo:goalkeeper?ovr:10,
    posicionamento:goalkeeper?clamp(ovr+1):clamp(ovr-(defensive?5:2))
  },ratingEdition:'Pico histórico ScoreFut'};
}
function phase(ano,conquistas,roster){
  return {ano,conquistas,jogadores:roster.split(';').map((line,index)=>player(line.trim(),index))};
}
function country(id,nome,monograma,cores,eras){
  return eras.map(([ano,conquistas,roster])=>({id,nome,monograma,cores,ano,conquistas,jogadores:phase(ano,conquistas,roster).jogadores}));
}

export const nationalTeams = [
  ...country('selecao-brasil','Brasil','BRA',['#07834b','#e8bf29'],[
    [2002,'Campeão da Copa do Mundo · pentacampeão','GOL|Marcos|88;LD|Cafu|91;ZAG|Lúcio|89;ZAG|Roque Júnior|84;LE|Roberto Carlos|92;VOL|Gilberto Silva|86;MC|Kléberson|85;MEI|Ronaldinho Gaúcho|94;MEI/SA|Rivaldo|93;CA|Ronaldo|96;CA/SA|Juninho Paulista|87'],
    [1994,'Campeão da Copa do Mundo · tetracampeão','GOL|Taffarel|88;LD|Jorginho|86;ZAG|Aldair|88;ZAG|Márcio Santos|85;LE|Branco|86;VOL|Dunga|89;VOL/MC|Mauro Silva|88;MEI|Zinho|86;PD/SA|Bebeto|91;CA|Romário|96;MEI|Mazinho|85'],
    [1970,'Campeão da Copa do Mundo · tricampeão','GOL|Félix|84;LD|Carlos Alberto Torres|92;ZAG|Brito|86;ZAG/VOL|Wilson Piazza|88;LE|Everaldo|84;VOL|Clodoaldo|89;MC|Gérson|92;PD|Jairzinho|94;CA|Pelé|96;CA|Tostão|93;MEI/PE|Rivelino|93']
  ]),
  ...country('selecao-argentina','Argentina','ARG',['#72bde8','#ffffff'],[
    [2022,'Campeão da Copa do Mundo · tricampeão','GOL|Emiliano Martínez|89;LD|Nahuel Molina|84;ZAG|Cristian Romero|87;ZAG|Nicolás Otamendi|85;LE|Marcos Acuña|85;MC|Rodrigo De Paul|88;MC/VOL|Enzo Fernández|88;MC|Alexis Mac Allister|88;PE|Ángel Di María|91;MEI/PD|Lionel Messi|96;CA|Julián Álvarez|88'],
    [1986,'Campeão da Copa do Mundo · México','GOL|Nery Pumpido|86;LD|José Luis Brown|86;ZAG|Oscar Ruggeri|89;ZAG|José Cuciuffo|85;LE|Julio Olarticoechea|86;VOL|Sergio Batista|86;MC|Ricardo Giusti|86;MC|Jorge Burruchaga|90;MEI|Diego Maradona|96;CA|Jorge Valdano|91;PE|Héctor Enrique|86'],
    [1978,'Campeão da Copa do Mundo · Argentina','GOL|Ubaldo Fillol|90;LD|Jorge Olguín|85;ZAG|Daniel Passarella|93;ZAG|Luis Galván|86;LE|Alberto Tarantini|87;MC|Osvaldo Ardiles|90;VOL|Américo Gallego|87;MEI|Mario Kempes|95;PD|Daniel Bertoni|88;CA|Leopoldo Luque|89;PE|René Houseman|88']
  ]),
  ...country('selecao-franca','França','FRA',['#18358c','#ed3345'],[
    [2018,'Campeã da Copa do Mundo · bicampeã','GOL|Hugo Lloris|89;LD|Benjamin Pavard|84;ZAG|Raphaël Varane|87;ZAG|Samuel Umtiti|86;LE|Lucas Hernández|84;VOL|N’Golo Kanté|90;MC|Paul Pogba|88;MC|Blaise Matuidi|86;PD|Kylian Mbappé|96;MEI|Antoine Griezmann|92;CA|Olivier Giroud|86'],
    [1998,'Campeã da Copa do Mundo · primeira estrela','GOL|Fabien Barthez|89;LD|Lilian Thuram|90;ZAG|Marcel Desailly|91;ZAG|Frank Lebœuf|87;LE|Bixente Lizarazu|88;VOL|Didier Deschamps|88;MC|Emmanuel Petit|89;MEI|Zinedine Zidane|96;PE|Youri Djorkaeff|90;CA|Thierry Henry|91;CA|David Trezeguet|89'],
    [2006,'Vice-campeã da Copa do Mundo · geração de Zidane','GOL|Fabien Barthez|90;LD|Willy Sagnol|89;ZAG|Lilian Thuram|92;ZAG|William Gallas|90;LE|Éric Abidal|88;VOL|Claude Makélélé|92;MC|Patrick Vieira|94;MEI|Zinedine Zidane|96;PE|Franck Ribéry|90;CA|Thierry Henry|95;CA|David Trezeguet|90']
  ]),
  ...country('selecao-alemanha','Alemanha','GER',['#111827','#dd1e2f'],[
    [2014,'Campeã da Copa do Mundo · tetracampeã','GOL|Manuel Neuer|94;LD|Philipp Lahm|92;ZAG|Jérôme Boateng|88;ZAG|Mats Hummels|89;LE|Benedikt Höwedes|86;VOL|Sami Khedira|88;MC|Toni Kroos|92;MC|Bastian Schweinsteiger|91;MEI|Mesut Özil|90;PE|Thomas Müller|93;CA|Miroslav Klose|91'],
    [1990,'Campeã da Copa do Mundo · Itália','GOL|Bodo Illgner|87;LD|Klaus Augenthaler|88;ZAG|Guido Buchwald|88;ZAG|Jürgen Kohler|89;LE|Andreas Brehme|91;VOL|Thomas Berthold|86;MC|Lothar Matthäus|96;MC|Pierre Littbarski|90;MEI|Thomas Häßler|89;CA|Rudi Völler|91;CA|Jürgen Klinsmann|92'],
    [1974,'Campeã da Copa do Mundo · Alemanha Ocidental','GOL|Sepp Maier|93;LD|Berti Vogts|90;ZAG|Franz Beckenbauer|96;ZAG|Hans-Georg Schwarzenbeck|88;LE|Rainer Bonhof|89;VOL|Uli Hoeneß|89;MC|Wolfgang Overath|91;MC|Paul Breitner|93;MEI|Günter Netzer|92;CA|Gerd Müller|96;CA|Jürgen Grabowski|88']
  ]),
  ...country('selecao-espanha','Espanha','ESP',['#d82635','#f6c445'],[
    [2010,'Campeã da Copa do Mundo · campeã mundial','GOL|Iker Casillas|93;LD|Sergio Ramos|91;ZAG|Carles Puyol|91;ZAG|Gerard Piqué|89;LE|Joan Capdevila|86;VOL|Sergio Busquets|91;MC|Xabi Alonso|91;MC|Xavi Hernández|96;MEI|Andrés Iniesta|95;PE|David Villa|94;CA|Fernando Torres|90'],
    [2008,'Campeã da Euro · início da era de ouro','GOL|Iker Casillas|93;LD|Sergio Ramos|89;ZAG|Carles Puyol|90;ZAG|Carlos Marchena|86;LE|Joan Capdevila|85;VOL|Marcos Senna|89;MC|Xavi Hernández|95;MC|Andrés Iniesta|92;MEI|Cesc Fàbregas|90;CA|Fernando Torres|93;CA|David Villa|93'],
    [2012,'Bicampeã da Euro · geração dominante','GOL|Iker Casillas|93;LD|Álvaro Arbeloa|86;ZAG|Sergio Ramos|92;ZAG|Gerard Piqué|90;LE|Jordi Alba|89;VOL|Sergio Busquets|92;MC|Xabi Alonso|91;MC|Xavi Hernández|95;MEI|Andrés Iniesta|95;PD|David Silva|91;CA|Fernando Torres|90']
  ]),
  ...country('selecao-italia','Itália','ITA',['#138b59','#ffffff'],[
    [2006,'Campeã da Copa do Mundo · tetracampeã','GOL|Gianluigi Buffon|95;LD|Gianluca Zambrotta|90;ZAG|Fabio Cannavaro|95;ZAG|Marco Materazzi|89;LE|Fabio Grosso|87;VOL|Gennaro Gattuso|90;MC|Andrea Pirlo|94;MC|Simone Perrotta|87;MEI|Francesco Totti|92;CA|Luca Toni|91;CA|Alessandro Del Piero|91'],
    [1982,'Campeã da Copa do Mundo · Espanha','GOL|Dino Zoff|94;LD|Claudio Gentile|91;ZAG|Gaetano Scirea|93;ZAG|Giuseppe Bergomi|88;LE|Antonio Cabrini|91;VOL|Marco Tardelli|92;MC|Bruno Conti|91;MC|Gabriele Oriali|88;MEI|Giancarlo Antognoni|90;CA|Paolo Rossi|95;CA|Francesco Graziani|89'],
    [1990,'Terceiro lugar na Copa do Mundo · Itália','GOL|Walter Zenga|92;LD|Giuseppe Bergomi|91;ZAG|Franco Baresi|95;ZAG|Riccardo Ferri|87;LE|Paolo Maldini|93;VOL|Carlo Ancelotti|91;MC|Giuseppe Giannini|90;MC|Roberto Donadoni|90;MEI|Roberto Baggio|96;CA|Salvatore Schillaci|92;CA|Gianluca Vialli|90']
  ]),
  ...country('selecao-inglaterra','Inglaterra','ENG',['#ffffff','#c8102e'],[
    [1966,'Campeã da Copa do Mundo · única estrela','GOL|Gordon Banks|95;LD|George Cohen|89;ZAG|Bobby Moore|96;ZAG|Jack Charlton|90;LE|Ray Wilson|88;VOL|Nobby Stiles|89;MC|Bobby Charlton|96;MC|Martin Peters|92;PD|Alan Ball|90;CA|Geoff Hurst|94;CA|Roger Hunt|92'],
    [1990,'Quarto lugar na Copa do Mundo · Itália','GOL|Peter Shilton|91;LD|Gary Stevens|86;ZAG|Terry Butcher|90;ZAG|Des Walker|91;LE|Stuart Pearce|90;VOL|Paul Gascoigne|94;MC|David Platt|92;MC|Chris Waddle|90;MEI|John Barnes|92;CA|Gary Lineker|95;CA|Peter Beardsley|90'],
    [2018,'Quarto lugar na Copa do Mundo · nova geração','GOL|Jordan Pickford|85;LD|Kyle Walker|88;ZAG|John Stones|86;ZAG|Harry Maguire|86;LE|Ashley Young|84;VOL|Jordan Henderson|88;MC|Dele Alli|89;MC|Jesse Lingard|87;CA|Harry Kane|95;PD|Raheem Sterling|90;PE|Marcus Rashford|88']
  ]),
  ...country('selecao-portugal','Portugal','POR',['#08783e','#d62635'],[
    [2016,'Campeão da Euro · primeiro título','GOL|Rui Patrício|88;LD|Cédric Soares|84;ZAG|Pepe|91;ZAG|José Fonte|87;LE|Raphaël Guerreiro|86;VOL|William Carvalho|87;MC|João Moutinho|89;MC|Renato Sanches|87;MEI|André Gomes|86;PE|Cristiano Ronaldo|96;CA|Nani|90'],
    [1966,'Terceiro lugar na Copa do Mundo · estreia histórica','GOL|José Pereira|90;LD|Amândio|86;ZAG|Germano|91;ZAG|Vicente Lucas|91;LE|Hilário|87;VOL|Mário Coluna|94;MC|Jaime Graça|87;PE|Simões|90;PD|José Augusto|92;CA|Eusébio|96;CA|José Torres|92'],
    [2006,'Quarto lugar na Copa do Mundo · Alemanha','GOL|Ricardo Pereira|89;LD|Miguel Monteiro|88;ZAG|Ricardo Carvalho|92;ZAG|Fernando Meira|87;LE|Nuno Valente|86;VOL|Costinha|88;MC|Maniche|91;MEI|Deco|94;PE|Cristiano Ronaldo|93;PD|Luís Figo|94;CA|Pauleta|91']
  ]),
  ...country('selecao-holanda','Países Baixos','NED',['#f47b20','#ffffff'],[
    [1974,'Vice-campeã da Copa do Mundo · futebol total','GOL|Jan Jongbloed|87;LD|Ruud Krol|92;ZAG|Arie Haan|91;ZAG|Wim Rijsbergen|87;LE|Wim Suurbier|89;VOL|Johan Neeskens|94;MC|Wim van Hanegem|94;MC|Wim Jansen|89;MEI|Johan Cruyff|96;CA|Johnny Rep|91;CA|Rob Rensenbrink|94'],
    [1978,'Vice-campeã da Copa do Mundo · Argentina','GOL|Jan Jongbloed|86;LD|Wim Suurbier|89;ZAG|Ruud Krol|92;ZAG|Ernie Brandts|87;LE|Jan Poortvliet|86;VOL|Johan Neeskens|93;MC|Wim Jansen|89;MEI|Willy van de Kerkhof|89;PE|Rob Rensenbrink|94;CA|Johnny Rep|90;CA|Dick Nanninga|89'],
    [2010,'Vice-campeã da Copa do Mundo · África do Sul','GOL|Maarten Stekelenburg|87;LD|Gregory van der Wiel|86;ZAG|John Heitinga|88;ZAG|Joris Mathijsen|86;LE|Giovanni van Bronckhorst|87;VOL|Mark van Bommel|89;MC|Nigel de Jong|88;MC|Wesley Sneijder|94;PE|Arjen Robben|95;CA|Robin van Persie|92;CA|Dirk Kuyt|89']
  ]),
  ...country('selecao-belgica','Bélgica','BEL',['#e6323b','#f2cb36'],[
    [2018,'Terceiro lugar na Copa do Mundo · geração de ouro','GOL|Thibaut Courtois|92;LD|Thomas Meunier|86;ZAG|Toby Alderweireld|88;ZAG|Vincent Kompany|91;LE|Jan Vertonghen|89;VOL|Axel Witsel|88;MC|Marouane Fellaini|86;MC|Kevin De Bruyne|96;PE|Eden Hazard|94;PD|Dries Mertens|90;CA|Romelu Lukaku|92'],
    [1986,'Quarto lugar na Copa do Mundo · México','GOL|Jean-Marie Pfaff|93;LD|Eric Gerets|90;ZAG|Michel Renquin|86;ZAG|Georges Grün|87;LE|Franky Van der Elst|88;VOL|René Vandereycken|87;MC|Jan Ceulemans|93;MC|Frank Vercauteren|91;MEI|Enzo Scifo|94;CA|Nico Claesen|88;CA|Erwin Vandenbergh|90'],
    [2014,'Quartas de final · geração de ouro','GOL|Thibaut Courtois|90;LD|Toby Alderweireld|87;ZAG|Vincent Kompany|90;ZAG|Daniel Van Buyten|86;LE|Jan Vertonghen|88;VOL|Axel Witsel|88;MC|Marouane Fellaini|86;MEI|Kevin De Bruyne|91;PE|Eden Hazard|93;PD|Dries Mertens|88;CA|Romelu Lukaku|89']
  ]),
  ...country('selecao-croacia','Croácia','CRO',['#e53946','#1643a1'],[
    [2018,'Vice-campeã da Copa do Mundo · Rússia','GOL|Danijel Subašić|89;LD|Šime Vrsaljko|86;ZAG|Dejan Lovren|88;ZAG|Domagoj Vida|87;LE|Ivan Strinić|85;VOL|Marcelo Brozović|90;MC|Ivan Rakitić|93;MC|Luka Modrić|96;MEI|Ivan Perišić|91;CA|Mario Mandžukić|91;MEI|Ante Rebić|87'],
    [1998,'Terceiro lugar na Copa do Mundo · França','GOL|Dražen Ladić|88;LD|Dario Šimić|86;ZAG|Slaven Bilić|90;ZAG|Igor Štimac|88;LE|Robert Jarni|90;VOL|Zvonimir Soldo|87;MC|Robert Prosinečki|92;MC|Mario Stanić|89;MEI|Zvonimir Boban|94;CA|Davor Šuker|96;CA|Goran Vlaović|89'],
    [2022,'Terceiro lugar na Copa do Mundo · Catar','GOL|Dominik Livaković|90;LD|Josip Juranović|86;ZAG|Dejan Lovren|87;ZAG|Joško Gvardiol|92;LE|Borna Sosa|87;VOL|Marcelo Brozović|90;MC|Mateo Kovačić|91;MC|Luka Modrić|95;MEI|Andrej Kramarić|89;PE|Ivan Perišić|90;CA|Bruno Petković|87']
  ]),
  ...country('selecao-uruguai','Uruguai','URU',['#70b9e7','#111827'],[
    [1950,'Campeão da Copa do Mundo · Maracanazo','GOL|Roque Máspoli|91;LD|Matías González|87;ZAG|Eusebio Tejera|90;ZAG|Héctor Vilches|86;LE|Schubert Gambetta|90;VOL|Obdulio Varela|94;MC|Víctor Rodríguez Andrade|90;MC|Juan Alberto Schiaffino|95;MEI|Julio Pérez|90;CA|Óscar Míguez|93;CA|Alcides Ghiggia|94'],
    [1930,'Campeão da Copa do Mundo · primeiro torneio','GOL|Enrique Ballestrero|88;LD|José Nasazzi|95;ZAG|Ernesto Mascheroni|91;ZAG|Domingo Tejera|88;LE|Pablo Dorado|89;VOL|Álvaro Gestido|88;MC|José Andrade|95;MC|Lorenzo Fernández|91;MEI|José Pedro Cea|92;CA|Héctor Scarone|96;CA|Héctor Castro|91'],
    [2010,'Quarto lugar na Copa do Mundo · África do Sul','GOL|Fernando Muslera|90;LD|Maximiliano Pereira|88;ZAG|Diego Lugano|90;ZAG|Diego Godín|91;LE|Jorge Fucile|86;VOL|Diego Pérez|87;MC|Egidio Arévalo Ríos|88;MC|Álvaro Pereira|87;MEI|Diego Forlán|96;CA|Luis Suárez|91;CA|Edinson Cavani|89']
  ]),
  ...country('selecao-colombia','Colômbia','COL',['#f7c934','#2352aa'],[
    [2014,'Quartas de final na Copa do Mundo · Brasil','GOL|David Ospina|88;LD|Juan Camilo Zúñiga|86;ZAG|Cristian Zapata|86;ZAG|Mario Yepes|87;LE|Pablo Armero|85;VOL|Carlos Sánchez|87;MC|Abel Aguilar|86;MC|Juan Cuadrado|91;MEI|James Rodríguez|95;PE|Teófilo Gutiérrez|88;CA|Jackson Martínez|89'],
    [1990,'Oitavas de final na Copa do Mundo · Itália','GOL|René Higuita|93;LD|Luis Carlos Perea|88;ZAG|Andrés Escobar|90;ZAG|Luis Fernando Herrera|87;LE|Luis Fernando Mosquera|85;VOL|Leonel Álvarez|90;MC|Freddy Rincón|92;MC|Gabriel Gómez|88;MEI|Carlos Valderrama|96;CA|Arnoldo Iguarán|91;CA|Albeiro Usuriaga|89'],
    [2001,'Campeã da Copa América · título invicto','GOL|Óscar Córdoba|91;LD|Iván López|85;ZAG|Mario Yepes|90;ZAG|Iván Ramiro Córdoba|92;LE|Gerardo Bedoya|87;VOL|Leonel Álvarez|89;MC|Freddy Rincón|92;MC|Giovanni Hernández|90;MEI|Víctor Aristizábal|93;CA|Jairo Castillo|88;PE|Eudalio Arriaga|86']
  ]),
  ...country('selecao-mexico','México','MEX',['#087a49','#f7f7f7'],[
    [1986,'Quartas de final na Copa do Mundo · anfitrião','GOL|Pablo Larios|89;LD|Raúl Servín|85;ZAG|Fernando Quirarte|89;ZAG|Héctor Esparza|86;LE|Mario Trejo|85;VOL|Tomás Boy|91;MEI|Manuel Negrete|92;MC|Javier Aguirre|87;CA|Hugo Sánchez|96;CA|Luis Flores|90;PE|Francisco Javier Cruz|88'],
    [1999,'Campeão da Copa das Confederações · geração de ouro','GOL|Óscar Pérez|87;LD|Salvador Carmona|86;ZAG|Rafael Márquez|91;ZAG|Claudio Suárez|90;LE|Ramón Ramírez|88;VOL|Pável Pardo|89;MC|Germán Villa|87;MEI|Cuauhtémoc Blanco|95;PE|Jesús Arellano|90;CA|Luis Hernández|93;CA|Francisco Palencia|89'],
    [2014,'Oitavas de final na Copa do Mundo · Brasil','GOL|Guillermo Ochoa|91;LD|Paul Aguilar|86;ZAG|Rafael Márquez|90;ZAG|Héctor Moreno|88;LE|Miguel Layún|87;VOL|José Juan Vázquez|86;MC|Héctor Herrera|89;MC|Andrés Guardado|89;MEI|Giovani dos Santos|90;PE|Oribe Peralta|89;CA|Javier Hernández|91']
  ]),
  ...country('selecao-estados-unidos','Estados Unidos','USA',['#1b3d7c','#d52b35'],[
    [2002,'Quartas de final na Copa do Mundo · Coreia/Japão','GOL|Brad Friedel|92;LD|Steve Cherundolo|87;ZAG|Eddie Pope|89;ZAG|Gregg Berhalter|86;LE|Eddie Lewis|87;VOL|Claudio Reyna|91;MC|John O’Brien|89;MC|Pablo Mastroeni|86;MEI|Landon Donovan|94;CA|Brian McBride|91;PE|DaMarcus Beasley|89'],
    [1994,'Oitavas de final na Copa do Mundo · anfitrião','GOL|Tony Meola|89;LD|Alexi Lalas|87;ZAG|Marcelo Balboa|90;ZAG|Fernando Clavijo|86;LE|Paul Caligiuri|89;VOL|John Harkes|90;MC|Tab Ramos|89;MC|Thomas Dooley|90;MEI|Claudio Reyna|91;CA|Eric Wynalda|92;CA|Joe-Max Moore|88'],
    [1930,'Semifinalista da Copa do Mundo · primeiro torneio','GOL|Jimmy Douglas|87;LD|George Moorhouse|88;ZAG|Alexander Wood|89;ZAG|Jimmy Gallagher|86;LE|Ralph Tracey|85;VOL|Billy Gonsalves|92;MC|Andy Auld|88;MC|Tom Florie|89;PE|James Brown|91;CA|Bert Patenaude|93;CA|Bart McGhee|90']
  ]),
  ...country('selecao-japao','Japão','JPN',['#ffffff','#d9253f'],[
    [2022,'Oitavas de final na Copa do Mundo · Catar','GOL|Shuichi Gonda|84;LD|Miki Yamane|83;ZAG|Maya Yoshida|86;ZAG|Ko Itakura|85;LE|Yuto Nagatomo|84;VOL|Wataru Endo|88;MC|Hidemasa Morita|85;MC|Ao Tanaka|85;MEI|Daichi Kamada|88;PE|Takefusa Kubo|89;CA|Takuma Asano|86'],
    [2002,'Oitavas de final na Copa do Mundo · anfitrião','GOL|Yoshikatsu Kawaguchi|87;LD|Akira Narahashi|84;ZAG|Tsuyoshi Nakazawa|86;ZAG|Morio Hasegawa|84;LE|Naoki Matsuda|87;VOL|Hidetoshi Nakata|94;MC|Shinji Ono|91;MC|Kazuyuki Toda|85;MEI|Shunsuke Nakamura|91;PE|Junichi Inamoto|89;CA|Takayuki Suzuki|87'],
    [2010,'Oitavas de final na Copa do Mundo · África do Sul','GOL|Eiji Kawashima|86;LD|Yuto Nagatomo|87;ZAG|Yuji Nakazawa|88;ZAG|Tulio Tanaka|88;LE|Atsuto Uchida|86;VOL|Yasuhito Endo|91;MC|Makoto Hasebe|88;MC|Daisuke Matsui|87;MEI|Keisuke Honda|93;PE|Shinji Okazaki|89;CA|Yoshito Okubo|87']
  ]),
  ...country('selecao-coreia-do-sul','Coreia do Sul','KOR',['#d52740','#183b80'],[
    [2002,'Quarto lugar na Copa do Mundo · anfitrião','GOL|Lee Woon-jae|90;LD|Choi Sung-yong|86;ZAG|Hong Myung-bo|94;ZAG|Kim Tae-young|88;LE|Lee Young-pyo|91;VOL|Yoo Sang-chul|92;MC|Park Ji-sung|93;MC|Kim Nam-il|89;MEI|Lee Chun-soo|90;CA|Ahn Jung-hwan|93;PE|Hwang Sun-hong|91'],
    [2010,'Oitavas de final na Copa do Mundo · África do Sul','GOL|Jung Sung-ryong|85;LD|Cha Du-ri|87;ZAG|Lee Jung-soo|88;ZAG|Cho Yong-hyung|85;LE|Lee Young-pyo|89;VOL|Kim Jung-woo|87;MC|Ki Sung-yueng|88;MC|Park Ji-sung|92;MEI|Lee Chung-yong|89;PE|Park Chu-young|89;CA|Lee Dong-gook|88'],
    [2022,'Oitavas de final na Copa do Mundo · Catar','GOL|Kim Seung-gyu|85;LD|Kim Moon-hwan|83;ZAG|Kim Min-jae|91;ZAG|Kim Young-gwon|86;LE|Kim Jin-su|84;VOL|Jung Woo-young|84;MC|Hwang In-beom|87;MC|Lee Jae-sung|86;MEI|Son Heung-min|94;PD|Hwang Hee-chan|87;CA|Cho Gue-sung|86']
  ]),
  ...country('selecao-marrocos','Marrocos','MAR',['#c12740','#168447'],[
    [2022,'Quarto lugar na Copa do Mundo · melhor campanha africana','GOL|Yassine Bounou|91;LD|Achraf Hakimi|93;ZAG|Romain Saïss|87;ZAG|Nayef Aguerd|88;LE|Noussair Mazraoui|87;VOL|Sofyan Amrabat|90;MC|Azzedine Ounahi|88;MC|Selim Amallah|86;MEI|Hakim Ziyech|91;PE|Sofiane Boufal|88;CA|Youssef En-Nesyri|88'],
    [1986,'Oitavas de final na Copa do Mundo · primeira seleção africana líder de grupo','GOL|Badou Zaki|93;LD|Abdelmajid Lamriss|86;ZAG|Noureddine Naybet|89;ZAG|Mustapha El Haddaoui|87;LE|Abderrazak Khairi|90;VOL|Fathi Jamal|86;MC|Mohamed Timoumi|93;MC|Aziz Bouderbala|91;MEI|Merry Krimau|88;CA|Abdelkrim Merry|87;PE|Mustapha Merry|86'],
    [1998,'Fase de grupos na Copa do Mundo · geração técnica','GOL|Driss Benzekri|85;LD|Rachid Azzouzi|85;ZAG|Noureddine Naybet|91;ZAG|Abdelilah Fahmi|86;LE|Mustapha Hadji|92;VOL|Salaheddine Bassir|88;MC|Youssef Chippo|87;MC|Hassan Kachloul|87;MEI|Abdeljalil Hadda|89;CA|Mokhtari|85;PE|Hassan Nader|88']
  ]),
  ...country('selecao-senegal','Senegal','SEN',['#138c4d','#f1c52c'],[
    [2002,'Quartas de final na Copa do Mundo · estreia histórica','GOL|Tony Sylva|88;LD|Omar Daf|86;ZAG|Habib Beye|88;ZAG|Pape Malick Diop|86;LE|Lamine Diatta|87;VOL|Amdy Faye|87;MC|Papa Bouba Diop|93;MC|Salif Diao|89;MEI|Khalilou Fadiga|91;PE|El Hadji Diouf|94;CA|Henri Camara|92'],
    [2021,'Campeão da Copa Africana de Nações · primeiro título','GOL|Édouard Mendy|90;LD|Youssouf Sabaly|86;ZAG|Kalidou Koulibaly|93;ZAG|Abdou Diallo|87;LE|Saliou Ciss|86;VOL|Idrissa Gueye|89;MC|Nampalys Mendy|86;MC|Cheikhou Kouyaté|88;MEI|Ismaïla Sarr|90;PE|Sadio Mané|96;CA|Boulaye Dia|87'],
    [2022,'Oitavas de final na Copa do Mundo · Catar','GOL|Édouard Mendy|89;LD|Youssouf Sabaly|86;ZAG|Kalidou Koulibaly|92;ZAG|Abdou Diallo|87;LE|Ismail Jakobs|85;VOL|Idrissa Gueye|89;MC|Nampalys Mendy|86;MC|Pape Gueye|86;MEI|Ismaïla Sarr|90;PE|Sadio Mané|95;CA|Boulaye Dia|87']
  ]),
  ...country('selecao-australia','Austrália','AUS',['#1b3f8b','#e6c532'],[
    [2006,'Oitavas de final na Copa do Mundo · geração de ouro','GOL|Mark Schwarzer|91;LD|Luke Wilkshire|87;ZAG|Lucas Neill|90;ZAG|Craig Moore|88;LE|Scott Chipperfield|89;VOL|Vince Grella|88;MC|Tim Cahill|94;MC|Jason Culina|88;MEI|Harry Kewell|94;CA|Mark Viduka|93;CA|John Aloisi|90'],
    [2015,'Campeã da Copa da Ásia · primeiro título como anfitriã','GOL|Mathew Ryan|88;LD|Ivan Franjić|84;ZAG|Trent Sainsbury|86;ZAG|Matthew Spiranovic|86;LE|Jason Davidson|85;VOL|Mark Milligan|88;MC|Massimo Luongo|89;MC|Mile Jedinak|90;MEI|Tom Rogić|88;PE|Robbie Kruse|88;CA|Tim Cahill|93'],
    [2022,'Oitavas de final na Copa do Mundo · Catar','GOL|Mathew Ryan|87;LD|Miloš Degenek|85;ZAG|Harry Souttar|87;ZAG|Kye Rowles|85;LE|Aziz Behich|86;VOL|Jackson Irvine|87;MC|Aaron Mooy|87;MC|Riley McGree|85;MEI|Ajdin Hrustić|87;PE|Mathew Leckie|88;CA|Mitchell Duke|86']
  ])
];

export const nationalSquads = nationalTeams.map(team=>({...team,id:`${team.id}-${team.ano}`,clubId:team.id}));

