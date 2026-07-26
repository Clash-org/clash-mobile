import i18n from "@/i18n";
import {
  ParticipantPlayoffType,
  ParticipantType,
  TeamPlayOffType,
  TeamType,
} from "@/typings";
import Toast from "react-native-toast-message";
import { getTeamMembersByTeamId } from "./helpers";
import { getHeadToHeadResult, getTeamStatsFromDuels } from "./matchesHandlers";

function createPairsByStrength(
  participants: ParticipantPlayoffType[],
): [ParticipantPlayoffType, ParticipantPlayoffType][] {
  // Сортируем участников по силе (от сильного к слабому)
  const sortedParticipants = [...participants].sort((a, b) => {
    // 1. Сравниваем по differenceWinsLosses
    if (a.differenceWinsLosses !== b.differenceWinsLosses) {
      return b.differenceWinsLosses - a.differenceWinsLosses;
    }
    // 2. Если равны, сравниваем по wins
    if (a.wins !== b.wins) {
      return b.wins - a.wins;
    }
    // 3. Если и wins равны, сравниваем по ratioWinsLosses
    return b.ratioWinsLosses - a.ratioWinsLosses;
  });

  const pairs: [ParticipantPlayoffType, ParticipantPlayoffType][] = [];
  const length = sortedParticipants.length;

  // Создаем пары: первый с последним, второй с предпоследним и т.д.
  for (let i = 0; i < Math.floor(length / 2); i++) {
    const strong = sortedParticipants[i];
    const weak = sortedParticipants[length - 1 - i];

    pairs.push([strong, weak]);
  }

  if (length % 2 !== 0) {
    Toast.show({
      type: "error",
      text1: `${i18n.t("withoutPair")}: ${sortedParticipants[Math.floor(length / 2)].name}`,
    });
  }

  return pairs;
}

function removeWeakestParticipants(
  participants: ParticipantPlayoffType[],
  countToRemove: number = 1, // сколько самых слабых нужно удалить
): ParticipantPlayoffType[] {
  // Создаем копию массива, чтобы не мутировать оригинал
  const sortedParticipants = [...participants].sort((a, b) => {
    // 1. Сравниваем по differenceWinsLosses (чем больше, тем лучше)
    if (a.differenceWinsLosses !== b.differenceWinsLosses) {
      return b.differenceWinsLosses - a.differenceWinsLosses; // По убыванию
    }

    // 2. Если difference равны, сравниваем по wins
    if (a.wins !== b.wins) {
      return b.wins - a.wins; // По убыванию
    }

    // 3. Если и wins равны, сравниваем по ratioWinsLosses
    return b.ratioWinsLosses - a.ratioWinsLosses; // По убыванию
  });

  // Удаляем указанное количество самых слабых (с конца отсортированного массива)
  return sortedParticipants.slice(0, sortedParticipants.length - countToRemove);
}

export function generatePlayoffPairs(
  duels: ParticipantType[][][][],
  poolCountDelete: number,
  isPoolRating: boolean,
) {
  const poolPlayoffParticipants: ParticipantPlayoffType[][] = [];
  duels.forEach((duelsPool, poolIndex) => {
    poolPlayoffParticipants[poolIndex] = [];
    const ids: string[] = [];
    duelsPool.forEach((pairs) => {
      for (const duel of pairs) {
        if (duel[0].name === "—" || duel[1].name === "—") continue;
        ids.push(duel[0].id);
        ids.push(duel[1].id);
      }
      const pureIds = [...new Set(ids)];

      for (const pair of pairs) {
        if (pair[0].name === "—" || pair[1].name === "—") continue;
        pureIds.forEach((id) => {
          const trueIndex = id === pair[0].id ? 0 : 1;
          if (id === pair[trueIndex].id) {
            let participantIndex = -1;
            if (poolPlayoffParticipants[poolIndex]) {
              for (const key in poolPlayoffParticipants[poolIndex]) {
                if (
                  poolPlayoffParticipants[poolIndex][key].id ===
                  pair[trueIndex].id
                ) {
                  participantIndex = Number(key);
                  break;
                }
              }
            }

            if (participantIndex < 0) {
              poolPlayoffParticipants[poolIndex].push({
                id: pair[trueIndex].id,
                name: pair[trueIndex].name,
                scores: 0,
                wins: pair[trueIndex].wins,
                differenceWinsLosses:
                  pair[trueIndex].scores - pair[trueIndex === 0 ? 1 : 0].scores,
                ratioWinsLosses:
                  pair[trueIndex].scores / pair[trueIndex === 0 ? 1 : 0].scores,
                warnings: pair[trueIndex].warnings,
                protests: pair[trueIndex].protests,
                doubleHits: pair[trueIndex].doubleHits,
              });
            } else {
              poolPlayoffParticipants[poolIndex][participantIndex] = {
                ...poolPlayoffParticipants[poolIndex][participantIndex],
                scores: 0,
                wins:
                  poolPlayoffParticipants[poolIndex][participantIndex].wins +
                  pair[trueIndex].wins,
                differenceWinsLosses:
                  poolPlayoffParticipants[poolIndex][participantIndex]
                    .differenceWinsLosses +
                  (pair[trueIndex].scores -
                    pair[trueIndex === 0 ? 1 : 0].scores),
                ratioWinsLosses:
                  poolPlayoffParticipants[poolIndex][participantIndex]
                    .differenceWinsLosses +
                  pair[trueIndex].scores / pair[trueIndex === 0 ? 1 : 0].scores,
              };
            }
          }
        });
      }
    });
  });

  let playoffParticipants: ParticipantPlayoffType[] = [];
  if (isPoolRating) {
    poolPlayoffParticipants.forEach((participants) => {
      playoffParticipants = [
        ...playoffParticipants,
        ...removeWeakestParticipants(participants, poolCountDelete),
      ];
    });
  } else {
    playoffParticipants = [
      ...removeWeakestParticipants(
        poolPlayoffParticipants.flat(),
        poolCountDelete,
      ),
    ];
  }

  return [createPairsByStrength(playoffParticipants)];
}

/**
 * Формирует пары для плей-офф по олимпийской системе
 * @param poolDuels - массив дуэлей пула
 * @param teams - команды
 * @returns массив пар команд для плей-офф
 */
export const getPlayoffTriathlonTeamsPairs = (
  poolDuels: ParticipantType[][][],
  teams: TeamType[],
): [TeamPlayOffType, TeamPlayOffType][] => {
  const activeTeams = teams.filter((t) => !t.deactive);

  // 1. Получаем полную статистику команд
  const teamStats = getTeamStatsFromDuels(poolDuels, activeTeams);

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
      activeTeams,
      poolDuels,
    );
    if (headToHead !== 0) return headToHead;

    // Критерий 4: Количество набранных баллов (больше → выше)
    if (b.scoresFor !== a.scoresFor) return b.scoresFor - a.scoresFor;

    // Если всё равно - по id
    return a.teamId - b.teamId;
  });

  const participants = poolDuels
    .flat()
    .flat()
    .filter((obj, idx, arr) => idx === arr.findIndex((t) => t.id === obj.id));
  // 3. Преобразуем в TeamPlayOffType
  const allTeamsScores: TeamPlayOffType[] = sortedStats.map((stat) => ({
    id: stat.teamId,
    name:
      activeTeams.find((t) => t.id === stat.teamId)?.name ||
      String(stat.teamId),
    scores: stat.scoresFor,
    members: getTeamMembersByTeamId(stat.teamId, activeTeams, participants).map(
      (fighter) => ({
        ...fighter,
        scores: 0,
        wins: 0,
        protests: 0,
        warnings: 0,
        doubleHits: 0,
        opponents: [],
        losses: 0,
      }),
    ),
  }));

  // 4. Определяем сколько команд выходит в плей-офф (не менее половины)
  const playoffCount = Math.ceil(teams.length / 2);

  // Берём топ-N команд
  const playoffTeams = allTeamsScores.slice(0, playoffCount);

  // 5. Формируем пары по олимпийской системе (1-й vs последний, 2-й vs предпоследний)
  const pairs: [TeamPlayOffType, TeamPlayOffType][] = [];
  const half = Math.ceil(playoffTeams.length / 2);

  for (let i = 0; i < half; i++) {
    const team1 = playoffTeams[i];
    const team2 = playoffTeams[playoffTeams.length - 1 - i];

    // Если это одна и та же команда (нечётное количество), она проходит дальше без боя
    if (team1 && team2 && team1.id !== team2.id) {
      pairs.push([
        {
          id: team1.id,
          name: team1.name,
          scores: 0,
          members: team1.members,
        },
        {
          id: team2.id,
          name: team2.name,
          scores: 0,
          members: team2.members,
        },
      ]);
    }
  }

  return pairs;
};
