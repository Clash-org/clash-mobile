import { fighterDefault } from "@/store";
import {
  ParticipantPlayoffType,
  ParticipantType,
  TeamPlayOffType,
  TeamStats,
  TeamType,
} from "@/typings";

export const getTopThreeFighters = (
  duels: ParticipantType[][][],
): ParticipantType[] => {
  // Создаем объект для подсчета побед
  const winsMap: Record<string, ParticipantType> = {};

  // Перебираем все дуэли и бои
  duels.forEach((round) => {
    round.forEach((match) => {
      match.forEach((fighter) => {
        const key = fighter.id;

        if (!winsMap[key]) {
          winsMap[key] = { ...fighter };
        }

        winsMap[key].wins += fighter.wins;
      });
    });
  });

  // Преобразуем в массив и сортируем по количеству побед
  const fightersWithWins = Object.values(winsMap);
  fightersWithWins.sort((a, b) => b.wins - a.wins);
  if (fightersWithWins.length < 3) fightersWithWins.push({ ...fighterDefault });

  // Берем топ-3 и возвращаем только информацию о бойцах
  return fightersWithWins.slice(0, 3);
};

/**
 * Определение победителей в круговой системе
 * Возвращает массив из трёх лучших участников (1-е, 2-е, 3-е место)
 */
export function getWinnersRobin(participants: ParticipantType[]): {
  winners: ParticipantType[];
  ranking: ParticipantType[]; // полный рейтинг на случай если нужно
} {
  if (participants.length < 3) {
    throw new Error("Для круговой системы нужно минимум 3 участника");
  }

  // 1. Вычисляем дополнительные показатели для каждого участника
  const participantsWithStats = participants.map((p) => {
    const totalFights = p.wins + p.losses + p.draws;
    const tournamentPoints = p.wins * 3 + p.draws; // 3 за победу, 1 за ничью

    return {
      ...p,
      tournamentPoints,
      totalFights,
      avgScorePerFight: totalFights > 0 ? p.scores / totalFights : 0,
    };
  });

  // 2. Сортируем по всем критериям
  const sorted = [...participantsWithStats].sort((a, b) => {
    // 1. ГЛАВНЫЙ КРИТЕРИЙ: турнирные очки (wins*3 + draws)
    if (a.tournamentPoints !== b.tournamentPoints) {
      return b.tournamentPoints - a.tournamentPoints;
    }

    // 2. При равенстве очков - количество побед
    if (a.wins !== b.wins) {
      return b.wins - a.wins;
    }

    // 3. Затем - меньше поражений
    if (a.losses !== b.losses) {
      return a.losses - b.losses;
    }

    // 4. Затем - общее количество технических очков
    if (a.scores !== b.scores) {
      return b.scores - a.scores;
    }

    // 5. Затем - среднее количество очков за бой
    if (a.avgScorePerFight !== b.avgScorePerFight) {
      return b.avgScorePerFight - a.avgScorePerFight;
    }

    // 6. Если всё равно - по алфавиту
    return a.name.localeCompare(b.name);
  });

  // // 3. Формируем детальную информацию
  // const details = sorted.map((p, index) => ({
  //   place: index + 1,
  //   name: p.name,
  //   points: p.tournamentPoints,
  //   wins: p.wins,
  //   draws: p.draws,
  //   losses: p.losses,
  //   totalScore: p.scores,
  //   avgScorePerFight: Math.round(p.avgScorePerFight * 10) / 10
  // }));

  return {
    winners: [sorted[0], sorted[1], sorted[2]],
    ranking: sorted,
  };
}

export function getWinnersSwiss(participants: ParticipantType[]) {
  const sortedParticipants = [...participants].sort((a, b) => {
    // 1. Главный критерий - ОЧКИ (победы + 0.5*ничьи)
    const pointsA = a.wins + a.draws * 0.5;
    const pointsB = b.wins + b.draws * 0.5;

    if (Math.abs(pointsA - pointsB) > 0.01) {
      return pointsB - pointsA; // больше очков = выше место
    }

    // 2. ПРИ РАВЕНСТВЕ ОЧКОВ - коэффициент Бухгольца
    // (сумма очков всех соперников)
    if (a.buchholz !== b.buchholz) {
      return b.buchholz - a.buchholz;
    }

    // 3. При равенстве Бухгольца - усечённый Бухгольц
    // (без учёта лучшего и худшего результата)
    const medianBuchholzA = calculateMedianBuchholz(a, participants);
    const medianBuchholzB = calculateMedianBuchholz(b, participants);

    if (medianBuchholzA !== medianBuchholzB) {
      return medianBuchholzB - medianBuchholzA;
    }

    // 5. Количество побед
    if (a.wins !== b.wins) {
      return b.wins - a.wins;
    }

    // 6. Доп. показатели (технические очки, меньше поражений и т.д.)
    return 0;
  });

  return {
    winners: sortedParticipants.slice(0, 3),
    ranking: sortedParticipants,
  };
}

function calculateMedianBuchholz(
  fighter: ParticipantType,
  allParticipants: ParticipantType[],
): number {
  // Если нет соперников, возвращаем 0
  if (!fighter.opponents || fighter.opponents.length === 0) {
    return 0;
  }

  // Собираем ОЧКИ (wins + 0.5*draws) всех соперников
  const opponentsPoints: number[] = [];

  for (const opponentId of fighter.opponents) {
    const opponent = allParticipants.find((p) => p.id === opponentId);
    if (opponent) {
      // Используем те же очки, что и в основном критерии
      const opponentPoints = opponent.wins + opponent.draws * 0.5;
      opponentsPoints.push(opponentPoints);
    }
  }

  // Если меньше 3 соперников, возвращаем обычную сумму
  if (opponentsPoints.length < 3) {
    return opponentsPoints.reduce((sum, points) => sum + points, 0);
  }

  // Сортируем по возрастанию
  opponentsPoints.sort((a, b) => a - b);

  // Убираем лучшего и худшего соперника
  opponentsPoints.pop(); // убираем лучшего
  opponentsPoints.shift(); // убираем худшего

  // Суммируем оставшиеся
  return opponentsPoints.reduce((sum, points) => sum + points, 0);
}

export function getAllInOneParticipants(
  duels: ParticipantType[][][],
  fightersBuchholz?: { [id: string]: number },
) {
  const allInOneParticipants: Record<string, ParticipantType> = {};
  duels.forEach((round) => {
    round.forEach((match) => {
      match.forEach((fighter) => {
        const key = fighter.id;

        if (!allInOneParticipants[key]) {
          allInOneParticipants[key] = {
            ...fighter,
            wins: 0,
            draws: 0,
            losses: 0,
            scores: 0,
            buchholz: fightersBuchholz
              ? fightersBuchholz[key]
              : fighter.buchholz,
          };
        }

        allInOneParticipants[key].wins += fighter.wins;
        allInOneParticipants[key].draws += fighter.draws;
        allInOneParticipants[key].scores += fighter.scores;
        allInOneParticipants[key].losses += fighter.losses;
      });
    });
  });

  return Object.values(allInOneParticipants);
}

// --------------------------------------------------------------------
/**
 * Тип для матча
 */
export type MatchType = {
  id: string;
  tournamentId: string;
  matchIndex: number;
  pairIndex: number;
  fighter1Id: string;
  fighter2Id: string;
  fighter1Name: string;
  fighter2Name: string;
  fighter1Score: number; // очки первого бойца
  fighter2Score: number; // очки второго бойца
  fighter1Stats?: {
    wins: number;
    draws: number;
    losses: number;
    scores: number;
  };
  fighter2Stats?: {
    wins: number;
    draws: number;
    losses: number;
    scores: number;
  };
  status: "scheduled" | "ongoing" | "completed";
  winnerId: string | null;
  round: number;
};

/**
 * Расчёт RD (разницы очков) для всех участников на основе массива пар
 * @param pairs - массив пар формата ParticipantType[][][], где самый вложенный массив - пара бойцов
 * @returns Map<string, number> где ключ - id бойца, значение - его RD
 */
export function calculateAllRD(
  pairs: ParticipantType[][][],
): Map<string, number> {
  // Словарь для хранения RD каждого бойца
  const sdMap = new Map<string, number>();

  // Проходим по всем пулам
  for (const pool of pairs) {
    // Проходим по всем парам в пуле
    for (const pair of pool) {
      // Проверяем, что пара содержит ровно двух бойцов
      if (pair.length !== 2) continue;

      const [fighter1, fighter2] = pair;

      // Пропускаем пары с —
      if (fighter1.name === "—" || fighter2.name === "—") continue;

      // Вычисляем RD для этой пары
      // RD = очки первого - очки второго (в этом сходе)
      // Но у нас есть только общие scores, а не очки за конкретный бой
      // Поэтому используем разницу в scores между бойцами как приближение
      const sdForThisMatch = fighter1.scores - fighter2.scores;

      // Обновляем RD для первого бойца
      const currentSD1 = sdMap.get(fighter1.id) || 0;
      sdMap.set(fighter1.id, currentSD1 + sdForThisMatch);

      // Обновляем RD для второго бойца (с обратным знаком)
      const currentSD2 = sdMap.get(fighter2.id) || 0;
      sdMap.set(fighter2.id, currentSD2 - sdForThisMatch);
    }
  }

  return sdMap;
}

// --------------------------------------------------------------------

/**
 * Преобразование массива пар в массив матчей
 * @param pairs - массив пар вида [ [fighter1, fighter2], [fighter3, fighter4], ... ]
 * @param tournamentId - ID турнира
 * @param round - номер тура (опционально)
 * @returns массив матчей
 */
function convertPairsToMatches(
  pairs: ParticipantType[][][],
  tournamentId: string,
  round?: number,
  results?: Map<string, { fighter1Score: number; fighter2Score: number }>,
): MatchType[] {
  const matches: MatchType[] = [];

  pairs.forEach((pool, poolIndex) => {
    pool.forEach((pair, pairIndex) => {
      if (pair.length !== 2) return;

      const [fighter1, fighter2] = pair;

      if (fighter1.name === "—" || fighter2.name === "—") return;

      const matchId = `match_${tournamentId}_r${round || 0}_p${poolIndex}_i${pairIndex}`;
      const matchResult = results?.get(matchId);

      const match: MatchType = {
        id: matchId,
        tournamentId,
        matchIndex: pairIndex,
        pairIndex,
        fighter1Id: fighter1.id,
        fighter2Id: fighter2.id,
        fighter1Name: fighter1.name,
        fighter2Name: fighter2.name,
        fighter1Score: matchResult?.fighter1Score ?? 0,
        fighter2Score: matchResult?.fighter2Score ?? 0,
        fighter1Stats: {
          wins: fighter1.wins,
          draws: fighter1.draws,
          losses: fighter1.losses,
          scores: fighter1.scores,
        },
        fighter2Stats: {
          wins: fighter2.wins,
          draws: fighter2.draws,
          losses: fighter2.losses,
          scores: fighter2.scores,
        },
        status: matchResult ? "completed" : "scheduled",
        winnerId: matchResult
          ? matchResult.fighter1Score > matchResult.fighter2Score
            ? fighter1.id
            : matchResult.fighter2Score > matchResult.fighter1Score
              ? fighter2.id
              : null
          : null,
        round: round || 1,
      };

      matches.push(match);
    });
  });

  return matches;
}

/**
 * Определяет 3 команды-победителя по круговой системе на основе всех критериев из правил
 * @param poolDuels - массив дуэлей пула (каждый элемент - массив пар [ParticipantType, ParticipantType])
 * @param teams - массив команд
 * @returns массив из 3 команд-победителей (отсортированных по критериям)
 */
export function getTriathlonWinnersFromDuels(
  poolDuels: ParticipantType[][][],
  teams: TeamType[],
): TeamType[] {
  // 1. Получаем статистику команд из дуэлей
  const teamStats = getTeamStatsFromDuels(poolDuels, teams);

  // 2. Сортируем по критериям из правил (п. 2.5.5)
  const sortedStats = [...teamStats].sort((a, b) => {
    // Критерий 1: Количество побед (больше → выше)
    if (b.wins !== a.wins) return b.wins - a.wins;

    // Критерий 2: Разница набранных/потерянных баллов (больше → выше)
    const diffA = a.scoresFor - a.scoresAgainst;
    const diffB = b.scoresFor - b.scoresAgainst;
    if (diffB !== diffA) return diffB - diffA;

    // Критерий 3: Результаты личной встречи
    const headToHead = getHeadToHeadResult(
      a.teamId,
      b.teamId,
      teams,
      poolDuels,
    );
    if (headToHead !== 0) return headToHead;

    // Критерий 4: Количество набранных баллов (больше → выше)
    if (b.scoresFor !== a.scoresFor) return b.scoresFor - a.scoresFor;

    // Если всё равно - по id
    return a.teamId - b.teamId;
  });

  // 3. Берём топ-3 команды
  const top3 = sortedStats.slice(0, 3);

  // 4. Находим полные объекты команд
  const winners: TeamType[] = top3.map((stat) => {
    const team = teams.find((t) => t.id === stat.teamId);
    if (!team) {
      throw new Error(`Team with id ${stat.teamId} not found`);
    }
    return team;
  });

  return winners;
}

/**
 * Получает статистику команд из дуэлей
 */
export function getTeamStatsFromDuels(
  poolDuels: (ParticipantType | ParticipantPlayoffType)[][][],
  teams: (TeamType | TeamPlayOffType)[],
): TeamStats[] {
  const statsMap = new Map<number, TeamStats>();

  // Инициализируем все команды
  teams.forEach((team) => {
    statsMap.set(team.id, {
      teamId: team.id,
      wins: 0,
      losses: 0,
      draws: 0,
      scoresFor: 0,
      scoresAgainst: 0,
      matchesCount: 0,
    });
  });

  poolDuels.forEach((matchPairs) => {
    // Каждый matchPairs - это массив из 3 боёв (для триатлона)
    // Или один бой (для обычного режима)
    let team1Total = 0;
    let team2Total = 0;
    let team1Id: number | null = null;
    let team2Id: number | null = null;

    matchPairs.forEach((pair) => {
      const fencer1 = pair[0];
      const fencer2 = pair[1];

      // Находим команды по участникам
      const team1 = findTeamByFencerId(fencer1.id, teams);
      const team2 = findTeamByFencerId(fencer2.id, teams);

      if (team1) {
        team1Id = team1.id;
        team1Total += fencer1.scores;
      }

      if (team2) {
        team2Id = team2.id;
        team2Total += fencer2.scores;
      }
    });

    if (team1Id !== null) {
      const stats1 = statsMap.get(team1Id);

      if (stats1) {
        stats1.scoresFor += team1Total;
        stats1.scoresAgainst += team2Total;
        stats1.matchesCount += 1;

        // Определяем победителя матча (по сумме очков за 3 боя)
        if (team1Total > team2Total) {
          stats1.wins += 1;
        } else if (team2Total > team1Total) {
          stats1.losses += 1;
        } else {
          stats1.draws += 1;
        }
      }
    }

    if (team2Id !== null) {
      const stats2 = statsMap.get(team2Id);

      if (stats2) {
        stats2.scoresFor += team2Total;
        stats2.scoresAgainst += team1Total;
        stats2.matchesCount += 1;

        if (team1Total > team2Total) {
          stats2.losses += 1;
        } else if (team2Total > team1Total) {
          stats2.wins += 1;
        } else {
          stats2.draws += 1;
        }
      }
    }
  });

  return Array.from(statsMap.values());
}

/**
 * Получает результат личной встречи между двумя командами
 * @returns 1 если team1 выиграла, -1 если team2 выиграла, 0 если ничья или не играли
 */
export function getHeadToHeadResult(
  team1Id: number,
  team2Id: number,
  teams: TeamType[],
  poolDuels: ParticipantType[][][],
): number {
  for (const matchPairs of poolDuels) {
    let team1Total = 0;
    let team2Total = 0;
    let foundTeam1 = false;
    let foundTeam2 = false;

    for (const pair of matchPairs) {
      const fencer1 = pair[0];
      const fencer2 = pair[1];

      // Проверяем, участвуют ли эти команды в матче
      const team1 = findTeamByFencerId(fencer1.id, teams);
      const team2 = findTeamByFencerId(fencer2.id, teams);

      if (team1 && team2) {
        if (team1.id === team1Id) {
          foundTeam1 = true;
          team1Total += fencer1.scores;
          team2Total += fencer2.scores;
        } else if (team1.id === team2Id) {
          foundTeam2 = true;
          team1Total += fencer2.scores;
          team2Total += fencer1.scores;
        }
      }
    }

    // Если нашли обе команды в этом матче
    if (foundTeam1 && foundTeam2) {
      if (team1Total > team2Total) return 1;
      if (team2Total > team1Total) return -1;
      return 0;
    }
  }

  return 0;
}

/**
 * Находит команду по id фехтовальщика
 */
export function findTeamByFencerId(
  fencerId: string,
  teams: (TeamType | TeamPlayOffType)[],
): TeamType | TeamPlayOffType | null {
  for (const team of teams) {
    const isTeamType = "deactive" in team;
    const hasFencer = isTeamType
      ? (team as TeamType).members.includes(fencerId)
      : (team as TeamPlayOffType).members.some((m) => m.id === fencerId);

    if (hasFencer) return team;
  }
  return null;
}

/**
 * Получает дополнительную статистику для отображения
 */
export function getTriathlonTeamStats(
  poolDuels: (ParticipantType | ParticipantPlayoffType)[][][],
  teams: (TeamType | TeamPlayOffType)[],
): (Omit<TeamStats, "teamId"> & {
  team: TeamType | TeamPlayOffType;
  difference: number;
})[] {
  const stats = getTeamStatsFromDuels(poolDuels, teams);

  return stats.map((stat) => {
    const team = teams.find((t) => t.id === stat.teamId)!;
    return {
      team,
      wins: stat.wins,
      losses: stat.losses,
      draws: stat.draws,
      scoresFor: stat.scoresFor,
      scoresAgainst: stat.scoresAgainst,
      difference: stat.scoresFor - stat.scoresAgainst,
      matchesCount: stat.matchesCount,
    };
  });
}

// --------------------------------------------------------------------------

/**
 * Функция для распределения по аренам (используется перед началом турнира)
 */
export function assignInitialArenas(
  participants: ParticipantType[],
  arenaCount: number = 3,
): ParticipantType[] {
  const participantsPerArena = Math.ceil(participants.length / arenaCount);

  return participants.map((p, index) => {
    const arena = Math.min(
      Math.floor(index / participantsPerArena),
      arenaCount - 1,
    );
    return { ...p, arena };
  });
}

/**
 * Получение рекомендуемого количества кругов для швейцарской системы
 * на основе количества участников
 */
export function getRecommendedRounds(totalParticipants: number): number {
  // Таблица рекомендаций для швейцарской системы
  if (totalParticipants <= 4) return 3;
  if (totalParticipants <= 8) return 4;
  if (totalParticipants <= 16) return 5;
  if (totalParticipants <= 32) return 6;
  if (totalParticipants <= 64) return 7;
  if (totalParticipants <= 128) return 8;
  if (totalParticipants <= 256) return 9;
  return 10;
}

/**
 * Преобразует данные триатлона (пары команд) в пары участников
 * @param triathlonData - данные триатлона в формате [TeamPlayOffType, TeamPlayOffType][][]
 * @param maxFencersPerTeam - максимальное количество фехтовальщиков в команде (по умолчанию 3)
 * @returns данные в формате [ParticipantType, ParticipantType][][]
 */
export function convertTriathlonToParticipantPairs(
  triathlonData: [TeamPlayOffType, TeamPlayOffType][][],
  maxFencersPerTeam: number = 3,
): [ParticipantType, ParticipantType][][] {
  if (!triathlonData || triathlonData.length === 0) {
    return [];
  }

  const result: [ParticipantType, ParticipantType][][] = [];

  triathlonData.forEach((round) => {
    const roundPairs: [ParticipantType, ParticipantType][] = [];

    round.forEach(([team1, team2]) => {
      if (!team1 || !team2 || !team1.members || !team2.members) {
        return;
      }

      for (let i = 0; i < maxFencersPerTeam; i++) {
        const fencer1 = team1.members[i];
        const fencer2 = team2.members[i];

        if (fencer1 && fencer2) {
          roundPairs.push([{ ...fencer1 }, { ...fencer2 }]);
        }
      }
    });

    if (roundPairs.length > 0) {
      result.push(roundPairs);
    }
  });

  return result;
}
