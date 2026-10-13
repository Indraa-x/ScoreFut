const BRAZIL_IDS = new Set(['flamengo','palmeiras','sao-paulo','corinthians','santos','gremio','internacional','vasco','fluminense','botafogo','cruzeiro','atletico-mineiro','athletico-paranaense','bahia','fortaleza']);

export function squadForClub(clubs, allSquads, clubId) {
  const club = clubs.find(item => item.id === clubId);
  if (!club) return null;
  const squad = allSquads.filter(item => item.clubId === clubId).sort((a, b) => b.ano - a.ano)[0];
  return squad ? { club, squad } : null;
}

export function playerValue(player) {
  const rating = Math.max(50, Math.min(99, Number(player?.ovr) || 50));
  const value = 0.25 + Math.max(0, rating - 60) ** 2 * 0.035 + (rating >= 90 ? 5 : 0);
  return Math.round(value * 10) / 10;
}

export function managerSquadStrength(roster) {
  if (!roster?.length) return 0;
  return Math.round(roster.reduce((sum, entry) => sum + (Number(entry.ovr) || 0), 0) / roster.length);
}

export function createManagerCareer(club, squad, budget, id = `${Date.now()}`) {
  const roster = squad.jogadores.map((player, index) => ({
    ...player,
    entryId: `${player.id}-${index}`,
    sourceClubId: club.id,
    sourceClubName: club.nome,
    sourceYear: squad.ano,
    initial: true,
    transferFee: 0
  }));
  return {
    version: 1,
    id,
    clubId: club.id,
    clubName: club.nome,
    monograma: club.monograma,
    cores: club.cores,
    region: BRAZIL_IDS.has(club.id) ? 'brasil' : 'europa',
    season: 2026,
    budget: Math.max(50, Math.min(500, Number(budget) || 100)),
    roster,
    transfers: [],
    seasons: [],
    createdAt: new Date().toISOString()
  };
}

export function managerMarket(allSquads, career) {
  const bestByPlayer = new Map();
  for (const squad of allSquads) for (const player of squad.jogadores) {
    const previous = bestByPlayer.get(player.id);
    if (!previous || player.ovr > previous.ovr || (player.ovr === previous.ovr && squad.ano > previous.sourceYear)) {
      bestByPlayer.set(player.id, { ...player, sourceClubId: squad.clubId, sourceClubName: squad.nome, sourceYear: squad.ano });
    }
  }
  const owned = new Set((career?.roster || []).map(player => player.id));
  return [...bestByPlayer.values()]
    .filter(player => !owned.has(player.id))
    .map(player => ({ ...player, value: playerValue(player) }))
    .sort((a, b) => Number(b.value <= (career?.budget || 0)) - Number(a.value <= (career?.budget || 0)) || b.ovr - a.ovr || a.nome.localeCompare(b.nome, 'pt-BR'));
}

export function signManagerPlayer(career, player) {
  if (!career || !player) return { ok: false, reason: 'Jogador indisponível.' };
  if (career.roster.some(entry => entry.id === player.id)) return { ok: false, reason: 'Este jogador já faz parte do elenco.' };
  const fee = playerValue(player);
  if (fee > career.budget) return { ok: false, reason: 'A contratação ultrapassa o orçamento disponível.' };
  const signing = {
    ...player,
    entryId: `${player.id}-${career.season}-${career.transfers.length + 1}`,
    initial: false,
    transferFee: fee,
    signedSeason: career.season
  };
  return {
    ok: true,
    career: {
      ...career,
      budget: Math.round((career.budget - fee) * 10) / 10,
      roster: [...career.roster, signing],
      transfers: [...career.transfers, { type: 'in', playerId: player.id, playerName: player.nome, fee, season: career.season }]
    }
  };
}

export function sellManagerPlayer(career, entryId) {
  const player = career?.roster.find(entry => entry.entryId === entryId);
  if (!player) return { ok: false, reason: 'Jogador não encontrado.' };
  if (career.roster.length <= 11) return { ok: false, reason: 'Mantenha ao menos 11 jogadores no elenco.' };
  const fee = Math.round(playerValue(player) * 0.7 * 10) / 10;
  return {
    ok: true,
    fee,
    career: {
      ...career,
      budget: Math.round((career.budget + fee) * 10) / 10,
      roster: career.roster.filter(entry => entry.entryId !== entryId),
      transfers: [...career.transfers, { type: 'out', playerId: player.id, playerName: player.nome, fee, season: career.season }]
    }
  };
}

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let result = value;
    result = Math.imul(result ^ result >>> 15, result | 1);
    result ^= result + Math.imul(result ^ result >>> 7, result | 61);
    return ((result ^ result >>> 14) >>> 0) / 4294967296;
  };
}

function poisson(lambda, random) {
  const limit = Math.exp(-lambda);
  let count = 0, product = 1;
  do { count++; product *= random(); } while (product > limit && count < 8);
  return count - 1;
}

function currentClubSquads(squads) {
  const latest = new Map();
  for (const squad of squads) if (!latest.has(squad.clubId) || latest.get(squad.clubId).ano < squad.ano) latest.set(squad.clubId, squad);
  return [...latest.values()];
}

export function simulateManagerSeason(career, allSquads, seed = Date.now()) {
  if (!career) return { ok: false, reason: 'Comece uma carreira primeiro.' };
  const random = seededRandom(Number(seed) || 1);
  const managedStrength = managerSquadStrength(career.roster);
  const leagueTeams = currentClubSquads(allSquads)
    .filter(squad => (BRAZIL_IDS.has(squad.clubId) ? 'brasil' : 'europa') === career.region)
    .map(squad => ({ id: squad.clubId, name: squad.nome, strength: squad.clubId === career.clubId ? managedStrength : managerSquadStrength(squad.jogadores) }));
  if (!leagueTeams.some(team => team.id === career.clubId)) leagueTeams.push({ id: career.clubId, name: career.clubName, strength: managedStrength });
  const table = new Map(leagueTeams.map(team => [team.id, { ...team, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, points: 0 }]));
  const clamp = value => Math.max(0.35, Math.min(2.5, value));
  for (let homeIndex = 0; homeIndex < leagueTeams.length; homeIndex++) for (let awayIndex = homeIndex + 1; awayIndex < leagueTeams.length; awayIndex++) {
    const home = leagueTeams[homeIndex], away = leagueTeams[awayIndex];
    const difference = home.strength - away.strength;
    const homeGoals = poisson(clamp(1.25 + difference * 0.045 + 0.15), random);
    const awayGoals = poisson(clamp(1.25 - difference * 0.045), random);
    const homeRow = table.get(home.id), awayRow = table.get(away.id);
    homeRow.played++; awayRow.played++;
    homeRow.gf += homeGoals; homeRow.ga += awayGoals; awayRow.gf += awayGoals; awayRow.ga += homeGoals;
    if (homeGoals > awayGoals) { homeRow.wins++; homeRow.points += 3; awayRow.losses++; }
    else if (homeGoals < awayGoals) { awayRow.wins++; awayRow.points += 3; homeRow.losses++; }
    else { homeRow.draws++; awayRow.draws++; homeRow.points++; awayRow.points++; }
  }
  const standings = [...table.values()].sort((a, b) => b.points - a.points || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf || a.name.localeCompare(b.name, 'pt-BR'));
  const place = standings.findIndex(team => team.id === career.clubId) + 1;
  const prize = place === 1 ? 35 : place <= 4 ? 23 : place <= 8 ? 15 : 8;
  const maintenance = Math.max(3, Math.round(career.roster.length * (managedStrength / 90) * 0.42 * 10) / 10);
  const net = Math.round((prize - maintenance) * 10) / 10;
  const seasonRecord = {
    year: career.season,
    place,
    points: standings[place - 1].points,
    wins: standings[place - 1].wins,
    draws: standings[place - 1].draws,
    losses: standings[place - 1].losses,
    goalsFor: standings[place - 1].gf,
    goalsAgainst: standings[place - 1].ga,
    teams: standings.length,
    strength: managedStrength,
    prize,
    maintenance,
    net,
    champion: place === 1,
    standings: standings.map(({ id, name, strength, points, wins, draws, losses, gf, ga }) => ({ id, name, strength, points, wins, draws, losses, gf, ga }))
  };
  return {
    ok: true,
    career: { ...career, season: career.season + 1, budget: Math.max(0, Math.round((career.budget + net) * 10) / 10), seasons: [...career.seasons, seasonRecord] },
    record: seasonRecord
  };
}
