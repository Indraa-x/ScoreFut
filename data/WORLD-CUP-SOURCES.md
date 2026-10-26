# Copa do Mundo: épocas, elencos e notas

O modo reúne **32 seleções históricas, 155 épocas e 1.705 jogadores**, com onze jogadores por elenco. A seleção das épocas é editorial: títulos e melhores campanhas são priorizados, com recorte até 2022. Seleções com menos de cinco participações reais têm somente suas edições disponíveis. Não são elencos de 2020 rebatizados nem convocações projetadas para 2026.

## Épocas

| Seleção | Copas incluídas |
| --- | --- |
| Brasil | 1958, 1962, 1970, 1994, 2002 |
| Argentina | 1978, 1986, 1990, 2014, 2022 |
| Alemanha | 1954, 1966, 1974, 1990, 2014 |
| Itália | 1934, 1938, 1970, 1982, 2006 |
| França | 1958, 1998, 2006, 2018, 2022 |
| Uruguai | 1930, 1950, 1954, 1970, 2010 |
| Inglaterra | 1966, 1990, 2006, 2018, 2022 |
| Espanha | 1950, 1986, 1994, 2002, 2010 |
| Países Baixos | 1974, 1978, 1998, 2010, 2014 |
| Portugal | 1966, 2006, 2010, 2018, 2022 |
| Croácia | 1998, 2006, 2014, 2018, 2022 |
| Bélgica | 1982, 1986, 2002, 2014, 2018 |
| Suécia | 1938, 1950, 1958, 1994, 2018 |
| Hungria | 1934, 1938, 1954, 1962, 1966 |
| Polônia | 1974, 1978, 1982, 1986, 2022 |
| Dinamarca | 1986, 1998, 2002, 2010, 2018 |
| Suíça | 1934, 1938, 1954, 2014, 2022 |
| Chile | 1962, 1966, 1998, 2010, 2014 |
| Colômbia | 1990, 1994, 1998, 2014, 2018 |
| México | 1970, 1986, 1998, 2006, 2014 |
| Estados Unidos | 1930, 1994, 2002, 2010, 2014 |
| Japão | 2002, 2006, 2010, 2018, 2022 |
| Coreia do Sul | 2002, 2006, 2010, 2018, 2022 |
| Austrália | 2006, 2010, 2014, 2018, 2022 |
| Marrocos | 1986, 1994, 1998, 2018, 2022 |
| Senegal | 2002, 2018, 2022 |
| Camarões | 1982, 1990, 2002, 2010, 2022 |
| Gana | 2006, 2010, 2014, 2022 |
| Nigéria | 1994, 1998, 2002, 2014, 2018 |
| Argélia | 1982, 1986, 2010, 2014 |
| Costa Rica | 1990, 2002, 2006, 2014, 2022 |
| Equador | 2002, 2006, 2014, 2022 |

Alemanha inclui as campanhas da Alemanha Ocidental, seguindo a continuidade histórica da seleção. As seleções usam os escudos atuais de suas federações, incluindo nas épocas antigas.

## Elencos e posições

- [FIFA Archives: edições históricas](https://www.archives.fifa.com/fifa_world_cup).
- [The Fjelstul World Cup Database](https://github.com/jfjelstul/worldcup): participantes, convocações, datas de nascimento, escalações e desempenho de cada época. Cada jogador preserva o identificador `worldCupPlayerId` para permitir a conferência.
- Os onze são uma seleção de participantes da convocação real. De 1970 em diante, a escalação do último jogo é a referência usual, com adaptações entre os convocados para representar um onze utilizável no jogo. As primeiras edições e algumas exceções têm seleção individual conferida contra a convocação.
- Posições genéricas da base foram cruzadas com os registros FIFA e com a função real dos jogadores. As formações antigas usam equivalências atuais, como zagueiro/volante para o antigo médio central defensivo. Não se apresenta uma formação atual como a formação tática original de 1930.
- Identidades são cruzadas por nome completo e nascimento; nomes de uma palavra não bastam para transferir notas entre pessoas diferentes.

## OVR

Mantém-se a política do ScoreFut: a época usa a edição lançada naquele ano. Exemplos: **2006 → FIFA 07, 2010 → FIFA 11, 2014 → FIFA 15, 2018 → FIFA 19, 2022 → FIFA 23**. Não se transporta uma nota recente para uma época antiga como se fosse registro verificado.

Nesta base, **683 entradas têm nota de edição identificada** e **1022 têm estimativa histórica individual explicitamente marcada**. Épocas anteriores à série FIFA não recebem uma edição inventada. Valores inválidos do arquivo de consulta, incluindo placeholders de 39 em quatro registros de Camarões de 2010, foram rejeitados; os registros de Eto’o e N’Koulou foram conferidos diretamente nas páginas da edição.

Fontes de consulta:

- [Luke Benz: base FIFA Index 2005–2020](https://github.com/lbenz730/fifa_model), usando as edições 07 e 11 correspondentes às épocas de 2006 e 2010. Cada nota verificada aponta também à página individual da edição.
- Arquivos FIFA 15 e FIFA 19 de SoFIFA já pesquisados no projeto, com correspondência por ID EA e nascimento.
- [Arquivo FIFA 23 publicado pelo curso de Gyu Bin Choi](https://github.com/guebin/DV2022/blob/master/posts/FIFA23_official_data.csv), cruzado por ID EA. Usa-se o campo `Overall`, sem trocar pela avaliação de potencial.
- [Samuel Eto’o, FIFA 11](https://www.fifaindex.com/player/9676/samuel-etoo/fifa11/): 84.
- [Nicolas N’Koulou, FIFA 11](https://fifaindex.com/players/188829-nicolas-nkoulou-ndoubena/fifa11): 74.

As estimativas são ajustes editoriais do jogo, com valores individuais para craques e titulares de cada época; não são apresentadas como notas oficiais da EA. As alterações pessoais dos clubes permanecem nos arquivos próprios dos clubes. Os atributos de simulação usam o mesmo modelo por posição e OVR do modo de seleções.

## Formato no jogo

32 equipes, oito grupos de quatro, três partidas por seleção. Os dois primeiros avançam. Oitavas, quartas, semifinal e final em jogo único e campo neutro, com prorrogação e pênaltis no mata-mata. A rota ao título tem 48 partidas de grupos e 15 partidas eliminatórias; não há disputa de terceiro lugar. Critérios dos grupos: pontos, saldo, gols marcados, confronto direto, disciplina e sorteio reproduzível.

O sorteio do draft escolhe primeiro a seleção com intervalos iguais, depois uma época ainda disponível. O número de épocas e o OVR não dão mais chances a uma seleção. Os adversários também são selecionados por país antes da época, sem duplicar uma seleção no torneio.

## Imagens

- `assets/competitions/world-cup-trophy.png`: PNG fornecido pelo usuário, copiado sem alteração.
- Escudos das federações via [football-logos.cc](https://football-logos.cc/national-teams/), servidos localmente. Fontes individuais e SHA-256: `assets/logos/world-cup-sources.json`. Não são bandeiras usadas como substitutas dos escudos.

## Atribuição e licença dos dados derivados

O recorte de convocações e participações de `world-cup-squads.js` deriva do trabalho **© 2023 Joshua C. Fjelstul, Ph.D.**, [The Fjelstul World Cup Database](https://github.com/jfjelstul/worldcup). Esse recorte e sua organização derivada são disponibilizados sob [CC-BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/legalcode), conforme a licença da base. Modificações: seleção das 32 equipes e épocas, seleção dos onze, nomes de exibição e identidades canônicas, tradução e revisão das posições, acréscimo de OVR e atributos do jogo. Imagens e referências FIFA/EA conservam a autoria de seus titulares.

Pesquisa e conferência: 26 de outubro de 2026.
