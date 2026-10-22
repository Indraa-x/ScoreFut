/** Five curated eras per club. Year is the season's closing year.
 * Lineups are seasonal selections, not a claim that all eleven started every match.
 * Initial OVRs below are editorial fallbacks; release-ratings.js replaces verified entries.
 * Selection criteria and squad references: FIVE-ERAS.md.
 */
const additions = [
 ['real-madrid',2022,'Champions League e La Liga',`
Thibaut Courtois|GOL|90
Dani Carvajal|LD|84
Éder Militão|ZAG|84
David Alaba|ZAG/LE|86
Ferland Mendy|LE|83
Casemiro|VOL|89
Toni Kroos|MC|88
Luka Modrić|MC|88
Federico Valverde|MC/MD|84
Vinícius Júnior|PE|86
Karim Benzema|CA|91`],
 ['barcelona',2006,'Champions League e La Liga',`
Víctor Valdés|GOL|84
Oleguer|LD/ZAG|77
Carles Puyol|ZAG|89
Rafael Márquez|ZAG/VOL|84
Giovanni van Bronckhorst|LE|81
Edmílson|VOL/ZAG|82
Deco|MC/MEI|87
Xavi|MC|85
Ronaldinho Gaúcho|PE/MEI|94
Lionel Messi|PD|84
Samuel Eto'o|CA|89`],
 ['bayern',1974,'Campeão europeu e alemão',`
Sepp Maier|GOL|91
Johnny Hansen|LD|82
Hans-Georg Schwarzenbeck|ZAG|86
Franz Beckenbauer|ZAG/VOL|94
Paul Breitner|LE/MC|90
Rainer Zobel|VOL|82
Franz Roth|MC|84
Jupp Kapellmann|MC/MD|83
Uli Hoeneß|PD/SA|88
Conny Torstensson|ME/SA|82
Gerd Müller|CA|94`],
 ['milan',1989,'Campeão europeu e mundial',`
Giovanni Galli|GOL|84
Mauro Tassotti|LD|86
Franco Baresi|ZAG|93
Alessandro Costacurta|ZAG|86
Paolo Maldini|LE/ZAG|90
Frank Rijkaard|VOL/ZAG|91
Carlo Ancelotti|MC|85
Angelo Colombo|MC/MD|79
Roberto Donadoni|ME/MD|88
Ruud Gullit|MEI/SA|92
Marco van Basten|CA|93`],
 ['manchester-united',1968,'Campeão da Copa dos Campeões da Europa',`
Alex Stepney|GOL|84
Shay Brennan|LD|80
Bill Foulkes|ZAG|84
David Sadler|ZAG|81
Tony Dunne|LE|82
Nobby Stiles|VOL|85
Pat Crerand|MC|84
Bobby Charlton|MEI/MC|92
George Best|PD/PE|93
Brian Kidd|CA|80
Denis Law|CA|91`],
 ['liverpool',1984,'Campeão europeu, inglês e da Copa da Liga',`
Bruce Grobbelaar|GOL|85
Phil Neal|LD|86
Alan Hansen|ZAG|89
Mark Lawrenson|ZAG|86
Alan Kennedy|LE|83
Graeme Souness|VOL/MC|89
Sammy Lee|MC/MD|81
Ronnie Whelan|MC/ME|84
Craig Johnston|MD|81
Kenny Dalglish|SA/MEI|92
Ian Rush|CA|91`],
 ['manchester-city',2012,'Primeiro título inglês da era Premier League',`
Joe Hart|GOL|85
Pablo Zabaleta|LD|81
Vincent Kompany|ZAG|86
Joleon Lescott|ZAG|81
Gaël Clichy|LE|82
Gareth Barry|VOL|81
Yaya Touré|MC/VOL|86
David Silva|MEI/ME|88
Samir Nasri|MEI/MD|85
Sergio Agüero|CA|88
Edin Džeko|CA|84`],
 ['arsenal',1971,'Dobradinha: Campeonato Inglês e FA Cup',`
Bob Wilson|GOL|83
Pat Rice|LD|82
Frank McLintock|ZAG|87
Peter Simpson|ZAG|83
Bob McNab|LE|82
Peter Storey|VOL|83
George Graham|MC|83
George Armstrong|MD/ME|84
Charlie George|SA/MEI|85
John Radford|CA|84
Ray Kennedy|CA/ME|84`],
 ['chelsea',2017,'Campeão inglês com 93 pontos',`
Thibaut Courtois|GOL|89
César Azpilicueta|ZAG/LD|85
David Luiz|ZAG|84
Gary Cahill|ZAG|83
Victor Moses|MD/LD|80
Marcos Alonso|LE/ME|82
N'Golo Kanté|VOL/MC|88|ngolo-kante
Nemanja Matić|VOL|83
Cesc Fàbregas|MC|86
Eden Hazard|PE/MEI|90
Diego Costa|CA|86`],
 ['inter',1965,'Campeão europeu, italiano e mundial',`
Giuliano Sarti|GOL|85
Tarcisio Burgnich|LD/ZAG|87
Aristide Guarneri|ZAG|85
Armando Picchi|ZAG|88
Giacinto Facchetti|LE|92
Gianfranco Bedin|VOL|82
Luis Suárez Miramontes|MC/MEI|91|luis-suarez-miramontes
Jair da Costa|PD|86
Mario Corso|ME/MEI|88
Sandro Mazzola|SA/MEI|91
Joaquín Peiró|CA|84`],
 ['juventus',1985,'Campeã da Copa dos Campeões da Europa',`
Stefano Tacconi|GOL|85
Luciano Favero|LD|81
Sergio Brio|ZAG|84
Gaetano Scirea|ZAG|92
Antonio Cabrini|LE|89
Massimo Bonini|VOL|83
Marco Tardelli|MC|88
Michel Platini|MEI|94
Zbigniew Boniek|SA/ME|89
Paolo Rossi|CA|88
Massimo Briaschi|PD/CA|82`],
 ['ajax',1972,'Tríplice coroa europeia, holandesa e da copa',`
Heinz Stuy|GOL|82
Wim Suurbier|LD|86
Barry Hulshoff|ZAG|85
Horst Blankenburg|ZAG|83
Ruud Krol|LE/ZAG|91
Johan Neeskens|MC/VOL|91
Arie Haan|VOL/MC|86
Gerrie Mühren|MC|85
Sjaak Swart|PD|87
Piet Keizer|PE|89
Johan Cruyff|SA/MEI|95`],
 ['napoli',1987,'Primeiro Scudetto e Copa da Itália',`
Claudio Garella|GOL|82
Giuseppe Bruscolotti|LD|82
Ciro Ferrara|ZAG/LD|85
Alessandro Renica|ZAG|83
Moreno Ferrario|ZAG|82
Fernando De Napoli|MC/VOL|84
Salvatore Bagni|MC/VOL|86
Francesco Romano|MC|82
Diego Maradona|MEI/SA|95
Bruno Giordano|CA|86
Andrea Carnevale|CA|82`],
 ['tottenham',1961,'Dobradinha: Campeonato Inglês e FA Cup',`
Bill Brown|GOL|84
Peter Baker|LD|81
Maurice Norman|ZAG|86
Ron Henry|LE/ZAG|82
Danny Blanchflower|VOL/MC|90
Dave Mackay|VOL/ZAG|89
John White|MEI|87
Terry Medwin|PD|82
Cliff Jones|PE|88
Bobby Smith|CA|86
Les Allen|SA/CA|83`],
 ['atletico-madrid',2018,'Campeão da Europa League',`
Jan Oblak|GOL|90
Juanfran|LD|82
Diego Godín|ZAG|90
José María Giménez|ZAG|84
Filipe Luís|LE|85
Gabi|VOL|82
Saúl Ñíguez|MC/ME|85
Koke|MC/MD|85
Thomas Partey|VOL/MC|82
Antoine Griezmann|SA/CA|89
Diego Costa|CA|85`],
 ['borussia-dortmund',2002,'Campeão alemão e finalista da Copa da UEFA',`
Jens Lehmann|GOL|85
Evanílson|LD|80
Christoph Metzelder|ZAG|82
Christian Wörns|ZAG|84
Dédê|LE|83
Sebastian Kehl|VOL|81
Tomáš Rosický|MEI/MC|86
Lars Ricken|MEI/MD|82
Jörg Heinrich|ME/LE|82
Márcio Amoroso|CA|86
Jan Koller|CA|85`],
 ['psg',1994,'Campeão francês e semifinalista da Recopa',`
Bernard Lama|GOL|87
Alain Roche|ZAG|84
Ricardo Gomes|ZAG|85
Paul Le Guen|VOL/ZAG|83
Alain Colleter|LE|80
Valdo|MC/MEI|86
Vincent Guérin|MC|82
Laurent Fournier|MD/VOL|80
Raí|MEI|87
David Ginola|PE/ME|86
George Weah|CA|90`],
 ['porto',1987,'Campeão europeu e mundial',`
Józef Młynarczyk|GOL|84
João Pinto|LD|85|joao-pinto-defensor
Eduardo Luís|ZAG|81
Celso|ZAG|83|celso-dias-dos-santos
Augusto Inácio|LE|81
André|VOL|82|andre-alves-da-silva
Jaime Magalhães|MD|83
António Frasco|MC|83
Paulo Futre|PE|90
Rabah Madjer|SA/CA|88
Fernando Gomes|CA|86`],
 ['benfica',1962,'Bicampeão da Copa dos Campeões da Europa',`
Costa Pereira|GOL|84
Mário João|LD|80
Germano|ZAG|88
Ângelo Martins|LE|82
Cruz|VOL|80|fernando-da-conceicao-cruz
Mário Coluna|MC|91
Domiciano Cavém|MC/LD|83|domiciano-cavem
José Augusto|PD|87
António Simões|PE|87
Eusébio|CA/SA|94
José Águas|CA|89`],
 ['valencia',1980,'Campeão da Recopa Europeia',`
Carlos Pereira|GOL|82|carlos-pereira-goleiro
Carrete|LD|81|jose-carrete
Miguel Tendillo|ZAG|84
Salvador Arias|ZAG|83
Botubot|ZAG|81|manuel-botubot
Enrique Saura|MC/MEI|83
Rainer Bonhof|VOL|86
Javier Subirats|MC|82
Mario Kempes|SA/CA|91
Pablo Rodríguez|PD/CA|81|pablo-rodriguez-escobar
Daniel Solsona|MC/MEI|84`],
 ['monaco',1988,'Campeão francês com Arsène Wenger',`
Jean-Luc Ettori|GOL|84
Manuel Amoros|LD/LE|88
Patrick Battiston|ZAG/LD|85
Rémy Vogel|ZAG|81
Luc Sonor|ZAG/LE|82
Marcel Dib|VOL|81
Claude Puel|VOL/MC|82
Jean-Marc Ferratge|ME|80
Glenn Hoddle|MEI/MC|87
Youssouf Fofana|PE|84|youssouf-falikou-fofana
Mark Hateley|CA|85`],
 ['flamengo',1981,'Campeão da Libertadores e mundial',`
Raul Plassmann|GOL|85
Leandro|LD|90|jose-leandro-de-souza-ferreira
Mozer|ZAG|85
Marinho|ZAG|83|marinho-mario-custodio-nazare
Júnior|LE/MC|91|leovegildo-lins-da-gama-junior
Andrade|VOL|85|jorge-luis-andrade-da-silva
Adílio|MC|86
Zico|MEI|94
Tita|PD/MEI|86|milton-queiroz-da-paixao
Lico|PE|81|antonio-nunes-lico
Nunes|CA|85|joao-batista-nunes-de-oliveira`],
 ['palmeiras',1993,'Campeão brasileiro e paulista',`
Sérgio|GOL|82|sergio-luis-de-araujo
Gil Baiano|LD|81
Antônio Carlos Zago|ZAG|83
Cléber|ZAG|82|cleber-amaro-dos-santos
Roberto Carlos|LE|87
César Sampaio|VOL|85
Zinho|MC/ME|86
Edmundo|SA/PD|88
Edílson|SA/PE|85|edilson
Evair|CA|87
Mazinho|MC/VOL|85`],
 ['sao-paulo',2008,'Tricampeonato brasileiro consecutivo',`
Rogério Ceni|GOL|86
Miranda|ZAG|82
André Dias|ZAG|81
Rodrigo|ZAG|79|rodrigo-defensor
Zé Luís|LD/VOL|77|jose-luis-dos-santos
Jorge Wagner|ME/LE|81
Jean|VOL/LD|76|jean-raphael-vanderlei-moreira
Hernanes|MC|83
Hugo|MEI|79|hugo-henrique-assis-do-nascimento
Dagoberto|SA/PE|81
Borges|CA|80|borges-humberlito`],
 ['corinthians',2017,'Campeão brasileiro e paulista',`
Cássio|GOL|81|cassio
Fagner|LD|80
Balbuena|ZAG|79|fabian-balbuena
Pablo|ZAG|78|pablo-nascimento-castro
Guilherme Arana|LE|77
Gabriel|VOL|76|gabriel-girotto-franco
Maycon|MC|77
Jadson|MEI|81
Rodriguinho|MEI/MC|80
Romero|PD/PE|76|angel-romero
Jô|CA|81|jo`],
 ['santos',1963,'Bicampeão da Libertadores e mundial',`
Gilmar|GOL|90|gilmar-dos-santos-neves
Lima|LD/VOL|85|antonio-lima-dos-santos
Mauro Ramos|ZAG|88
Calvet|ZAG|83|raul-donazar-calvet
Dalmo|LE|82|dalmo-gaspar
Zito|VOL|89|jose-ely-de-miranda
Mengálvio|MC|85|mengalvio-pedro-figueiro
Dorval|PD|86|dorval-rodrigues
Pepe|PE|89|jose-macia
Coutinho|CA|89|antonio-wilson-vieira-honorio
Pelé|SA/MEI|96|pele`],
 ['gremio',1983,'Campeão da Libertadores e mundial',`
Mazaropi|GOL|84|geraldo-pereira-de-matos-filho
Paulo Roberto|LD|81|paulo-roberto-cury
Hugo de León|ZAG|87
Baidek|ZAG|81|jorge-baidek
Paulo César|LE|80|paulo-cesar-magalhaes
China|VOL|81|henrique-valmir-da-conceicao
Osvaldo|MC|81|osvaldo-dario-alves
Mário Sérgio|MC/MEI|86
Renato Gaúcho|PD/SA|89
Tarciso|PE/PD|84
Caio|CA|82|luiz-carlos-tavares-franco`],
 ['internacional',1979,'Campeão brasileiro invicto',`
Benítez|GOL|84|jose-de-la-cruz-benitez
João Carlos|LD|80|joao-carlos-marinho
Mauro Galvão|ZAG|85
Mauro Pastor|ZAG|80
Cláudio Mineiro|LE|80|claudio-antunes-mineiro
Falcão|MC/VOL|92|paulo-roberto-falcao
Batista|VOL|87|joao-batista-da-silva
Jair|MC|80|jair-jose-guimaraes
Mário Sérgio|ME/MEI|86
Valdomiro|PD|85|valdomiro-vaz-franco
Bira|CA|81|ubirajara-silva`],
 ['internacional',1976,'Bicampeão brasileiro e octacampeão gaúcho',`
Manga|GOL|89|haiel-de-souza
Cláudio Duarte|LD|83
Elías Figueroa|ZAG|92
Marinho Peres|ZAG|85
Vacaria|LE|82|luiz-carlos-machado
Caçapava|VOL|84|luis-carlos-ferreira
Falcão|MC/VOL|91|paulo-roberto-falcao
Paulo César Carpegiani|MC|88
Valdomiro|PD|86|valdomiro-vaz-franco
Dario|CA|88|dario-jose-dos-santos
Lula|PE|84|luiz-ribeiro-pinto-neto`],
 ['vasco',1989,'Campeão brasileiro',`
Acácio|GOL|82
Luís Carlos Winck|LD|83
Quiñónez|ZAG|83|luis-carlos-quinonez
Marco Aurélio|ZAG|80|marco-aurelio-martins
Mazinho|LE/VOL|85
Zé do Carmo|VOL|81|jose-do-carmo-silva
Andrade|VOL|83|jorge-luis-andrade-da-silva
Bismarck|MEI|84
William|PD|81|william-cesar-de-oliveira
Bebeto|SA/CA|89
Sorato|CA|81|aginaldo-liz-sorato`],
 ['fluminense',1984,'Campeão brasileiro',`
Paulo Vítor|GOL|84|paulo-vitor-barbosa-de-carvalho
Aldo|LD|80|aldo-goncalves
Ricardo Gomes|ZAG|86
Duílio|ZAG|81|duilio-dias-junior
Branco|LE|86
Jandir|VOL|79|jandir-morais
Delei|MC|82|wanderley-alves-de-oliveira
Assis|SA/MEI|84|benedito-de-assis-da-silva
Tato|PE|80|carlos-alberto-fonseca
Washington|CA|84|washington-cesar-santos
Romerito|MD/MEI|85|julio-cesar-romero`],
 ['botafogo',1968,'Campeão da Taça Brasil e carioca',`
Cao|GOL|83|luis-fernando-claudino-dos-santos
Moreira|LD|81|wilson-moreira
Zé Carlos|ZAG|82|jose-carlos-da-silva-jose
Leônidas|ZAG|83|leonidas-da-silva-lemos
Valtencir|LE|82|valtencir-gomes-de-brito
Carlos Roberto|VOL|82|carlos-roberto-de-carvalho
Gérson|MC|91|gerson-de-oliveira-nunes
Jairzinho|PD/SA|91
Paulo Cézar Caju|PE/MEI|87
Roberto Miranda|CA|85
Rogério|MD/PD|82|rogerio-hetiemann`],
 ['botafogo',1962,'Campeão carioca e do Rio–São Paulo',`
Manga|GOL|88|haiel-de-souza
Joel|LD|82|joel-roberto-carvalho
Zé Maria|ZAG|82|ze-maria-defensor-botafogo
Nílton Santos|ZAG/LE|92
Rildo|LE|84|rildo-da-costa-menezes
Ayrton|VOL|81|ayrton-ferreira-da-silva
Didi|MC/MEI|92|waldyr-pereira
Garrincha|PD|95|manuel-francisco-dos-santos
Quarentinha|SA/CA|88|waldir-cardoso-lebre
Amarildo|CA|88|amarildo-tavares-da-silveira
Zagallo|PE/ME|87|mario-jorge-lobo-zagallo`],
 ['cruzeiro',1976,'Campeão da Libertadores',`
Raul Plassmann|GOL|85
Nelinho|LD|88
Morais|ZAG|81|josue-camilo-de-morais
Darci Menezes|ZAG|82
Vanderlei|LE|80|vanderlei-lazaro
Piazza|VOL/ZAG|89|wilson-da-silva-piazza
Zé Carlos|MC|81|jose-carlos-de-andrade
Eduardo|MEI|82|eduardo-amorim
Jairzinho|PD/CA|87
Joãozinho|PE|85|joao-soares-de-almeida-filho
Palhinha|CA|86|vanderlei-eustaquio-de-oliveira`],
 ['atletico-mineiro',2014,'Campeão da Copa do Brasil e da Recopa Sul-Americana',`
Victor|GOL|81
Marcos Rocha|LD|78
Leonardo Silva|ZAG|79
Jemerson|ZAG|76
Douglas Santos|LE|77
Leandro Donizete|VOL|77
Pierre|VOL|77
Jesús Dátolo|MEI/ME|79|jesus-datolo
Luan|MD/SA|77|luan-madson-gedeao-de-paiva
Carlos|PE/CA|74|carlos-alberto-carvalho-da-silva-junior
Diego Tardelli|CA/SA|82`],
 ['atletico-mineiro',1971,'Primeiro campeão do Campeonato Brasileiro',`
Renato|GOL|82|renato-da-cunha-valle
Humberto Monteiro|LD|82
Vantuir|ZAG|83|vantuir-galdino-ramos
Grapete|ZAG|83|jose-borges-do-couto
Oldair|LE/VOL|83|oldair-barchi
Vanderlei Paiva|VOL|82
Humberto Ramos|MC|80
Romeu|MEI|83|romeu-cambalhota
Ronaldo Drummond|PD|82
Dario|CA|87|dario-jose-dos-santos
Tião|PE|80|sebastiao-silva`],
 ['athletico-paranaense',2019,'Campeão da Copa do Brasil',`
Santos|GOL|80|aderbar-melo-dos-santos-neto
Jonathan|LD|78|jonathan-cicero-moreira
Léo Pereira|ZAG|77|leo-pereira
Thiago Heleno|ZAG|78
Márcio Azevedo|LE|76
Wellington|VOL|76|wellington-wellington-aparecido-martins
Bruno Guimarães|MC/VOL|80
Léo Cittadini|MC/MEI|76
Nikão|PD/MEI|79|nikao
Rony|PE|78
Marco Ruben|CA|78`],
 ['bahia',1988,'Bicampeão brasileiro',`
Ronaldo|GOL|83|ronaldo-passos
Tarantini|LD|79|jose-carlos-da-silva-tarantini
João Marcelo|ZAG|82
Claudir|ZAG|80|claudir-fernandes
Paulo Róbson|LE|79
Paulo Rodrigues|VOL|80
Gil Sergipano|MC|81
Bobô|MEI|86|raimundo-nonato-tavares-da-silva
Zé Carlos|PD|81|jose-carlos-da-silva-bahia
Charles|CA|83|charles-fabian
Sandro|PE|81|sandro-bahia-1988`],
 ['bahia',1959,'Campeão da Taça Brasil',`
Nadinho|GOL|85|leonardo-conceicao-cardoso
Beto|LD|81|beto-bahia
Henrique|ZAG|81|henrique-bahia
Flávio|ZAG|82|flavio-bahia
Nenzinho|LE|82|valdir-evangelista-barbosa
Vicente|VOL|82|vicente-bahia
Mário|MC|81|mario-bahia
Marito|PD|82|marito-bahia
Alencar|SA/CA|84|alencar-pimentel
Léo|CA|83|leo-bahia
Biriba|PE|82|biriba-bahia`],
 ['fortaleza',2021,'4º no Brasileirão e semifinalista da Copa do Brasil',`
Marcelo Boeck|GOL|76
Tinga|ZAG/LD|76|tinga-guilherme-de-jesus-da-silva
Marcelo Benevenuto|ZAG|76
Titi|ZAG|76|titi-cristian-chagas-tarouco
Yago Pikachu|MD/LD|78
Lucas Crispim|ME/MEI|76
Felipe|VOL/MC|75|felipe-felipe-rodrigues-dos-santos
Éderson|MC/VOL|77|ederson-jose-dos-santos-lourenco-da-silva
David|PE/CA|77|david-correa-da-fonseca
Robson|SA/CA|76|robson-dos-santos-fernandes
Wellington Paulista|CA|76`],
 ['fortaleza',2024,'4º no Brasileirão e campeão da Copa do Nordeste',`
João Ricardo|GOL|78
Tinga|LD/ZAG|77|tinga-guilherme-de-jesus-da-silva
Brítez|ZAG/LD|77|emanuel-britez
Titi|ZAG|76|titi-cristian-chagas-tarouco
Bruno Pacheco|LE|76
Zé Welison|VOL|75
Hércules|MC|77
Tomás Pochettino|MEI/MC|78
Marinho|PD|76|marinho-mario-sergio-santos-costa
Breno Lopes|PE|76
Juan Martín Lucero|CA|79`],
 ['celtic',2001,'Tríplice coroa escocesa',`
Rab Douglas|GOL|78
Didier Agathe|MD/LD|79
Joos Valgaeren|ZAG|80
Johan Mjällby|ZAG|81
Tom Boyd|ZAG/LE|80
Neil Lennon|VOL|80
Paul Lambert|MC/VOL|83
Alan Thompson|ME|81
Stiliyan Petrov|MC|82
Chris Sutton|CA/SA|83
Henrik Larsson|CA|89`],
 ['celtic',2017,'Tríplice coroa escocesa invicta',`
Craig Gordon|GOL|77
Mikael Lustig|LD|76
Jozo Šimunović|ZAG|74
Dedryck Boyata|ZAG|75
Kieran Tierney|LE|76
Scott Brown|VOL|77
Stuart Armstrong|MC|76
Callum McGregor|MC/ME|75
Scott Sinclair|PE|77
James Forrest|PD|76
Moussa Dembélé|CA|76|moussa-dembele`],
 ['marseille',1989,'Campeão francês e da Copa da França',`
Gaëtan Huard|GOL|81
Philippe Thys|LD|79
Karlheinz Förster|ZAG|87
Éric Di Meco|LE|81
Yvon Le Roux|ZAG|83
Franck Sauzée|VOL/MC|84
Frédéric Meyrieu|MC/MEI|80
Bruno Germain|MC/VOL|81
Philippe Vercruysse|MEI|83
Jean-Pierre Papin|CA|90
Klaus Allofs|SA/CA|86`],
 ['marseille',2018,'Finalista da Europa League',`
Steve Mandanda|GOL|82
Hiroki Sakai|LD|77
Adil Rami|ZAG|81
Rolando|ZAG|77
Jordan Amavi|LE|78
Luiz Gustavo|VOL/ZAG|83
André-Frank Zambo Anguissa|MC/VOL|76
Dimitri Payet|MEI/PE|84
Florian Thauvin|PD|84
Lucas Ocampos|PE|78
Valère Germain|CA|77`],
 ['psv',1978,'Campeão holandês e da Copa da UEFA',`
Jan van Beveren|GOL|87
Jan Poortvliet|LD/MC|81
Huub Stevens|ZAG|83
Ernie Brandts|ZAG|83
Kees Krijgh|LE/ZAG|79
Willy van de Kerkhof|VOL|87
René van de Kerkhof|PD/MD|86
Willy van der Kuijlen|MEI/CA|89
Adrie van Kraay|ZAG|84
Harry Lubse|SA/CA|82
Gerrie Deijkers|CA|83`],
 ['psv',2024,'Campeão holandês com 91 pontos',`
Walter Benítez|GOL|80
Jordan Teze|LD/ZAG|77
André Ramalho|ZAG|76
Olivier Boscagli|ZAG|79
Sergiño Dest|LE/LD|79
Jerdy Schouten|VOL/MC|81
Joey Veerman|MC|81
Guus Til|MEI|77
Johan Bakayoko|PD|79
Hirving Lozano|PE/PD|80
Luuk de Jong|CA|81`],
 ['roma',1983,'Campeã italiana',`
Franco Tancredi|GOL|84
Sebastiano Nela|LD/LE|83
Pietro Vierchowod|ZAG|88
Aldo Maldera|LE|84
Ubaldo Righetti|ZAG|81
Falcão|MC/VOL|92|paulo-roberto-falcao
Agostino Di Bartolomei|VOL/MC|87
Carlo Ancelotti|MC|84
Bruno Conti|PD/MEI|90
Maurizio Iorio|SA/CA|82
Roberto Pruzzo|CA|86`],
 ['roma',2022,'Campeã da Conference League',`
Rui Patrício|GOL|82
Gianluca Mancini|ZAG|81
Chris Smalling|ZAG|81
Roger Ibañez|ZAG|79|roger-ibanez
Rick Karsdorp|LD|79
Nicola Zalewski|LE/ME|73
Bryan Cristante|VOL/MC|79
Sérgio Oliveira|MC|79
Lorenzo Pellegrini|MEI/MC|84
Nicolò Zaniolo|SA/MD|81
Tammy Abraham|CA|82`],
 ['galatasaray',1989,'Semifinalista da Copa dos Campeões da Europa',`
Zoran Simović|GOL|83
İsmail Demiriz|LD|79
Cüneyt Tanman|ZAG|83
Erhan Önal|ZAG|81
Semih Yuvakuran|LE|79
Muhammet Altıntaş|VOL|78
Savaş Koç|MD|79
Tugay Kerimoğlu|MC|80
Uğur Tütüneker|MC/MEI|82
Tanju Çolak|CA|87
Prekazi|ME/PE|83|dževad-prekazi`],
 ['galatasaray',2000,'Copa da UEFA, Campeonato e Copa da Turquia',`
Cláudio Taffarel|GOL|86|taffarel
Capone|LD/ZAG|78|carlos-alberto-de-oliveira-capone
Bülent Korkmaz|ZAG|83
Gheorghe Popescu|ZAG/VOL|85
Hakan Ünsal|LE|81
Okan Buruk|MC/MD|81
Suat Kaya|VOL|80
Emre Belözoğlu|MC|82
Gheorghe Hagi|MEI|89
Hakan Şükür|CA|85
Arif Erdem|SA/CA|81`],
 ['galatasaray',2013,'Campeão turco e quartas da Champions',`
Fernando Muslera|GOL|83
Emmanuel Eboué|LD|77
Dany Nounkeu|ZAG|75
Semih Kaya|ZAG|76
Albert Riera|LE/ME|77
Felipe Melo|VOL|80
Selçuk İnan|MC|80
Hamit Altıntop|MD/MC|78
Wesley Sneijder|MEI|84
Didier Drogba|CA|83
Burak Yılmaz|CA|81`],
 ['galatasaray',2024,'Campeão turco com 102 pontos',`
Fernando Muslera|GOL|81
Kaan Ayhan|LD/ZAG|75
Davinson Sánchez|ZAG|80
Abdülkerim Bardakcı|ZAG|77
Derrick Köhn|LE|73
Lucas Torreira|VOL|82
Kerem Demirbay|MC|79
Dries Mertens|MEI/SA|81
Hakim Ziyech|PD|80
Kerem Aktürkoğlu|PE|77
Mauro Icardi|CA|83`],
 ['galatasaray',2025,'Campeão turco e da Copa da Turquia',`
Fernando Muslera|GOL|81
Przemysław Frankowski|LD/MD|77
Davinson Sánchez|ZAG|83
Abdülkerim Bardakcı|ZAG|78
Ismail Jakobs|LE|74
Lucas Torreira|VOL|83
Mario Lemina|MC/VOL|79
Gabriel Sara|MC/MEI|80
Barış Alper Yılmaz|PD/PE|80
Yunus Akgün|PD/MEI|79
Victor Osimhen|CA|87`],
 ['fenerbahce',2008,'Quartas de final da Champions League',`
Volkan Demirel|GOL|81
Gökhan Gönül|LD|78
Edu Dracena|ZAG|79
Diego Lugano|ZAG|82
Roberto Carlos|LE|86
Mehmet Aurélio|VOL|81
Selçuk Şahin|MC/VOL|77
Alex|MEI|86|alex-de-souza
Deivid|PD/CA|80
Uğur Boral|PE/ME|76
Semih Şentürk|CA|78`],
 ['fenerbahce',2011,'Campeão turco',`
Volkan Demirel|GOL|82
Gökhan Gönül|LD|80
Diego Lugano|ZAG|81
Joseph Yobo|ZAG|79
André Santos|LE|79
Mehmet Topuz|MD/MC|78
Emre Belözoğlu|MC|80
Cristian Baroni|VOL|78
Alex|MEI|87|alex-de-souza
Miroslav Stoch|PE|77
Mamadou Niang|CA|81`],
 ['fenerbahce',2013,'Copa da Turquia e semifinal da Europa League',`
Volkan Demirel|GOL|82
Gökhan Gönül|LD|81
Joseph Yobo|ZAG|78
Egemen Korkmaz|ZAG|78
Reto Ziegler|LE|75
Mehmet Topal|VOL|78
Raul Meireles|MC|81
Cristian Baroni|MC/VOL|78
Dirk Kuyt|PD/CA|80
Moussa Sow|CA/PE|81
Pierre Webó|CA|77`],
 ['fenerbahce',2014,'Campeão turco',`
Volkan Demirel|GOL|81
Gökhan Gönül|LD|80
Bruno Alves|ZAG|81
Egemen Korkmaz|ZAG|77
Caner Erkin|LE|78
Mehmet Topal|VOL|79
Emre Belözoğlu|MC|79
Raul Meireles|MC|80
Dirk Kuyt|PD/MD|79
Moussa Sow|PE/CA|81
Emmanuel Emenike|CA|79`],
 ['fenerbahce',2024,'99 pontos no Campeonato Turco',`
Dominik Livaković|GOL|81
Bright Osayi-Samuel|LD|77
Alexander Djiku|ZAG|78
Rodrigo Becão|ZAG|78
Ferdi Kadıoğlu|LE/LD|81
İsmail Yüksek|VOL|77
Fred|MC|81|frederico-rodrigues-de-paula-santos
Sebastian Szymański|MEI|79
Dušan Tadić|PE/MEI|83
İrfan Can Kahveci|PD/MC|79
Edin Džeko|CA|82`],
 ['rb-leipzig',2017,'Vice-campeão alemão na estreia na Bundesliga',`
Péter Gulácsi|GOL|80
Benno Schmitz|LD|71
Willi Orbán|ZAG|78
Marvin Compper|ZAG|75
Marcel Halstenberg|LE|75
Stefan Ilsanker|VOL|75
Naby Keïta|MC|82
Diego Demme|VOL|76
Emil Forsberg|MEI/ME|82
Marcel Sabitzer|MD/MC|79
Timo Werner|CA|82`],
 ['rb-leipzig',2020,'Semifinalista da Champions League',`
Péter Gulácsi|GOL|85
Lukas Klostermann|LD/ZAG|80
Dayot Upamecano|ZAG|79
Marcel Halstenberg|ZAG/LE|82
Angeliño|LE/ME|80|angelino
Konrad Laimer|VOL/MC|82
Kevin Kampl|MC|81
Marcel Sabitzer|MC/MD|83
Christopher Nkunku|MEI/PE|80
Dani Olmo|MEI/PD|79
Timo Werner|CA|85`],
 ['rb-leipzig',2021,'Vice-campeão alemão e finalista da Copa da Alemanha',`
Péter Gulácsi|GOL|85
Nordi Mukiele|LD/ZAG|81
Dayot Upamecano|ZAG|82
Willi Orbán|ZAG|81
Angeliño|LE/ME|83|angelino
Tyler Adams|VOL|77
Marcel Sabitzer|MC|84
Kevin Kampl|MC|80
Christopher Nkunku|MEI/SA|81
Dani Olmo|MEI/PD|82
Yussuf Poulsen|CA|78`],
 ['rb-leipzig',2022,'Copa da Alemanha e semifinal da Europa League',`
Péter Gulácsi|GOL|85
Mohamed Simakan|ZAG/LD|78
Willi Orbán|ZAG|82
Joško Gvardiol|ZAG/LE|81
Benjamin Henrichs|LD/LE|77
Angeliño|LE/ME|83|angelino
Konrad Laimer|VOL/MC|83
Kevin Kampl|MC|80
Dani Olmo|MEI|82
Christopher Nkunku|SA/MEI|86
André Silva|CA|82`],
 ['rb-leipzig',2023,'Bicampeão da Copa da Alemanha',`
Janis Blaswich|GOL|77
Benjamin Henrichs|LD|80
Willi Orbán|ZAG|84
Joško Gvardiol|ZAG|82
David Raum|LE|78
Konrad Laimer|VOL/MC|83
Xaver Schlager|VOL/MC|81
Dominik Szoboszlai|MEI/MD|82
Dani Olmo|MEI/PE|83
Christopher Nkunku|SA/MEI|86
Timo Werner|CA|82`],
];

const newClubs = [
 {id:'galatasaray',nome:'Galatasaray',monograma:'GAL',cores:['#A90432','#F6B70C'],temporadas:[]},
 {id:'fenerbahce',nome:'Fenerbahçe',monograma:'FEN',cores:['#101B49','#F5D52B'],temporadas:[]},
 {id:'rb-leipzig',nome:'RB Leipzig',monograma:'RBL',cores:['#DD0741','#172D50'],temporadas:[]},
];
const normalize=name=>name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/ł/g,'l').replace(/đ/g,'d').replace(/ı/g,'i').replace(/['’]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const profiles={GOL:[-65,-47,-55,-70,1,0],ZAG:[-38,-25,1,-35,-62,-2],LD:[-15,-13,-3,-24,-62,-3],LE:[-15,-13,-3,-24,-62,-3],VOL:[-16,-1,-6,-19,-62,-4],MC:[-9,1,-17,-13,-62,-5],MEI:[-2,1,-31,-6,-62,-6],MD:[-6,-2,-22,-12,-62,-7],ME:[-6,-2,-22,-12,-62,-7],PE:[1,-7,-37,-2,-62,-5],PD:[1,-7,-37,-2,-62,-5],SA:[1,-5,-36,0,-62,-3],CA:[1,-19,-38,2,-62,-2]};
const keys=['ataque','meio','defesa','finalizacao','reflexo','posicionamento'];
export function expandClubSeasons(originalClubs){
 const identities=new Map();
 for(const club of originalClubs)for(const season of club.temporadas)for(const player of season.jogadores){
  const name=normalize(player.nome),ids=identities.get(name)??new Set();ids.add(player.id);identities.set(name,ids);
 }
 // Prefer the national champions to relegation/collapse years in the old catalogue.
 const replaced={bahia:[2021],botafogo:[2023],internacional:[2007],'atletico-mineiro':[1999],fortaleza:[2019]};
 const result=[...originalClubs,...newClubs].map(club=>({...club,temporadas:club.temporadas.filter(season=>!replaced[club.id]?.includes(season.ano))}));
 for(const [clubId,ano,conquistas,rows] of additions){
  const club=result.find(club=>club.id===clubId);
  if(!club||club.temporadas.some(season=>season.ano===ano))throw new Error('Clube ou temporada duplicada: '+clubId+' '+ano);
  const jogadores=rows.trim().split('\n').map(row=>{
   const [nome,positions,rating,explicitId]=row.trim().split('|'),tags=positions.split('/'),ovr=Number(rating);
   const known=identities.get(normalize(nome));
   if(!explicitId&&known?.size>1)throw new Error('Identidade ambígua: '+nome);
   const id=normalize(explicitId??(known?.size?[...known][0]:nome));
   return {id,nome,tags,ovr,camisa:'',destaque:'',atributos:Object.fromEntries(keys.map((key,index)=>[key,Math.max(1,Math.min(99,ovr+Math.max(...tags.map(tag=>profiles[tag][index]))))]))};
  });
  club.temporadas.push({ano,conquistas,jogadores});
 }
 return result;
}
