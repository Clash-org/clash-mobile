import i18n from "@/i18n";
import { ParticipantPlayoffType, ParticipantType } from "@/typings";
import Toast from "react-native-toast-message";

function createPairsByStrength(
  participants: ParticipantPlayoffType[],
): ParticipantPlayoffType[][] {
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
  let countPools = 0;
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
    countPools++;
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
