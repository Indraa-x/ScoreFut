// Top four of the 2025/26 domestic tables who entered the 2026/27 Champions League.
// UEFA: https://www.uefa.com/uefachampionsleague/news/02a8-2171a88881a0-c70193b972c6-1000--meet-the-2026-27-champions-league-league-phase-teams/
// Aston Villa finished fourth and also won the Europa League: https://www.premierleague.com/en/tables/premier-league/2025-26
const topFour = {
  bundesliga: [21, 22, 112172, 36], // Bayern, Dortmund, Leipzig, Stuttgart
  premier: [1, 10, 11, 2], // Arsenal, Man. City, Man. United, Aston Villa
  laliga: [241, 243, 483, 240], // Barcelona, Real Madrid, Villarreal, Atlético
  seriea: [131682, 48, 52, 1745], // Inter, Napoli, Roma, Como
};

export const FIRST_CHAMPIONS_FIELD = Object.entries(topFour).map(([league, ids]) =>
  ids.map(id => `career26-${league}-${id}`));

const qualifiers = new Set(FIRST_CHAMPIONS_FIELD.flat());
export const startsInChampions = clubId => qualifiers.has(clubId);
