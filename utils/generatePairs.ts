import { fighterDefault } from "@/store";
import { Gender, ParticipantType, TeamType, TournamentSystem } from "@/typings";

export const generatePairs = (
  participants: ParticipantType[],
  tournamentSystem: TournamentSystem,
  poolIndex: number,
  setFighterPairs: React.Dispatch<
    React.SetStateAction<[ParticipantType, ParticipantType][][]>
  >,
  setCurrentPairIndex: React.Dispatch<React.SetStateAction<number[]>>,
  currentRound?: number,
  totalRounds?: number,
  fighterPairs?: [ParticipantType, ParticipantType][],
): [ParticipantType, ParticipantType][][] => {
  let pairs: [ParticipantType, ParticipantType][][] = [];
  const isGroupBattle = fighterPairs !== undefined;

  /* ---------- ОЛИМПИЙСКАЯ ---------- */
  if (tournamentSystem === TournamentSystem.OLYMPIC) {
    let shuffled = [...participants].sort(() => Math.random() - 0.5);

    const filter = (group: ParticipantType[]) => {
      for (let i = 0; i < group.length - 1; i += 2) {
        if (!pairs[poolIndex]) pairs[poolIndex] = [];
        pairs[poolIndex].push([group[i], group[i + 1]]);
      }
      if (group.length % 2 !== 0) {
        pairs[poolIndex].push([
          group[group.length - 1],
          {
            ...fighterDefault,
          },
        ]);
      }
    };

    filter(shuffled);
  } else if (
    tournamentSystem === TournamentSystem.HYBRID ||
    tournamentSystem === TournamentSystem.ROBIN
  ) {
    /* ---------- КРУГОВАЯ ---------- */
    let players = [[...participants]];

    players.forEach((group) => {
      // Проверяем, есть ли у участников пол
      const hasGender = group.some((p) => p.gender !== undefined);

      // Fisher-Yates shuffle
      const shuffle = <T>(array: T[]): T[] => {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
      };

      // Определяем команды на основе текущих пар
      let team1Ids = new Set<string>();
      let team2Ids = new Set<string>();

      if (isGroupBattle && fighterPairs.length > 0) {
        // Берем первую пару для определения команд
        const firstPair = fighterPairs[0];
        if (firstPair && firstPair[0] && firstPair[1]) {
          // Все кто на позиции 0 - команда 1
          fighterPairs.forEach((pair) => {
            if (pair[0]) team1Ids.add(pair[0].id);
            if (pair[1]) team2Ids.add(pair[1].id);
          });
        }
      } else if (isGroupBattle) {
        // Если нет пар, разделяем по половинам (fallback)
        const sortedForTeams = [...group].sort((a, b) => {
          const aOpponents = a.opponents?.length || 0;
          const bOpponents = b.opponents?.length || 0;
          return aOpponents - bOpponents;
        });

        const halfLength = Math.floor(sortedForTeams.length / 2);
        for (let i = 0; i < halfLength; i++) {
          team1Ids.add(sortedForTeams[i].id);
        }
        for (let i = halfLength; i < sortedForTeams.length; i++) {
          team2Ids.add(sortedForTeams[i].id);
        }
      }

      // Сортируем группу: сначала те, у кого меньше противников
      const sortedGroup = [...group].sort((a, b) => {
        const aOpponents = a.opponents?.length || 0;
        const bOpponents = b.opponents?.length || 0;
        return aOpponents - bOpponents;
      });

      // Разделяем по полу, если нужно
      let malePlayers: ParticipantType[] = [];
      let femalePlayers: ParticipantType[] = [];

      if (hasGender) {
        malePlayers = sortedGroup.filter((p) => p.gender === Gender.MALE);
        femalePlayers = sortedGroup.filter((p) => p.gender === Gender.FEMALE);
      }

      // Функция для создания пар в группе
      const createPairsInGroup = (
        playerPool: ParticipantType[],
        allowMixed: boolean = false,
        otherGenderPool: ParticipantType[] = [],
      ): [ParticipantType, ParticipantType][] => {
        const used = new Set<string>();
        const pairs: [ParticipantType, ParticipantType][] = [];

        if (isGroupBattle) {
          // Разделяем игроков на команды
          const team1Players = playerPool.filter((p) => team1Ids.has(p.id));
          const team2Players = playerPool.filter((p) => team2Ids.has(p.id));

          // Перемешиваем игроков в каждой команде
          const shuffledTeam1 = shuffle([...team1Players]);
          const shuffledTeam2 = shuffle([...team2Players]);

          // Создаем пары: каждый из team1 с каждым из team2
          for (const p1 of shuffledTeam1) {
            if (used.has(p1.id)) continue;

            let partner: ParticipantType | null = null;
            const shuffledTeam2Copy = shuffle([...shuffledTeam2]);

            for (const p2 of shuffledTeam2Copy) {
              if (used.has(p2.id)) continue;

              // Проверяем, не играли ли они уже
              const played =
                p1.opponents?.includes(p2.id) || p2.opponents?.includes(p1.id);
              if (!played) {
                partner = p2;
                break;
              }
            }

            if (partner) {
              pairs.push([p1, partner]);
              used.add(p1.id);
              used.add(partner.id);
            } else {
              // Если не нашли пару в своей команде и разрешены смешанные пары
              if (allowMixed && otherGenderPool.length > 0) {
                const otherGenderAvailable = otherGenderPool.filter(
                  (p) => !used.has(p.id) && p.id !== p1.id,
                );

                const shuffledOther = shuffle([...otherGenderAvailable]);
                let mixedPartner: ParticipantType | null = null;

                for (const p2 of shuffledOther) {
                  const played =
                    p1.opponents?.includes(p2.id) ||
                    p2.opponents?.includes(p1.id);
                  if (!played) {
                    mixedPartner = p2;
                    break;
                  }
                }

                if (mixedPartner) {
                  pairs.push([p1, mixedPartner]);
                  used.add(p1.id);
                  used.add(mixedPartner.id);
                } else {
                  pairs.push([
                    p1,
                    {
                      ...fighterDefault,
                    },
                  ]);
                  used.add(p1.id);
                }
              } else {
                pairs.push([
                  p1,
                  {
                    ...fighterDefault,
                  },
                ]);
                used.add(p1.id);
              }
            }
          }

          // Проверяем, остались ли игроки из team2 без пары
          const usedInPairs = new Set<string>();
          pairs.forEach((pair) => {
            usedInPairs.add(pair[0].id);
            if (pair[1].id) usedInPairs.add(pair[1].id);
          });

          const remainingTeam2 = shuffledTeam2.filter(
            (p) => !usedInPairs.has(p.id),
          );

          // Для оставшихся игроков team2 создаем пары с пустым соперником
          remainingTeam2.forEach((p) => {
            pairs.push([
              {
                ...fighterDefault,
              },
              p,
            ]);
          });
        } else {
          // Обычный режим без группового боя
          const poolUsed = new Set<string>();

          for (const p1 of playerPool) {
            if (poolUsed.has(p1.id)) continue;

            let available = playerPool.filter(
              (p) => !poolUsed.has(p.id) && p.id !== p1.id,
            );

            const shuffled = shuffle(available);
            let partner: ParticipantType | null = null;

            for (const p2 of shuffled) {
              const played =
                p1.opponents?.includes(p2.id) || p2.opponents?.includes(p1.id);
              if (!played) {
                partner = p2;
                break;
              }
            }

            if (partner) {
              pairs.push([p1, partner]);
              poolUsed.add(p1.id);
              poolUsed.add(partner.id);
            } else {
              // Если не нашли пару и разрешены смешанные пары
              if (allowMixed && otherGenderPool.length > 0) {
                const otherGenderAvailable = otherGenderPool.filter(
                  (p) => !poolUsed.has(p.id) && p.id !== p1.id,
                );

                const shuffledOther = shuffle([...otherGenderAvailable]);
                let mixedPartner: ParticipantType | null = null;

                for (const p2 of shuffledOther) {
                  const played =
                    p1.opponents?.includes(p2.id) ||
                    p2.opponents?.includes(p1.id);
                  if (!played) {
                    mixedPartner = p2;
                    break;
                  }
                }

                if (mixedPartner) {
                  pairs.push([p1, mixedPartner]);
                  poolUsed.add(p1.id);
                  poolUsed.add(mixedPartner.id);
                } else {
                  pairs.push([
                    p1,
                    {
                      ...fighterDefault,
                    },
                  ]);
                  poolUsed.add(p1.id);
                }
              } else {
                pairs.push([
                  p1,
                  {
                    ...fighterDefault,
                  },
                ]);
                poolUsed.add(p1.id);
              }
            }
          }
        }

        return pairs;
      };

      let resultPairs: [ParticipantType, ParticipantType][] = [];

      if (hasGender) {
        // 1. Создаем пары внутри мужской группы
        const malePairs = createPairsInGroup(malePlayers, false);
        resultPairs.push(...malePairs);

        // 2. Создаем пары внутри женской группы
        const femalePairs = createPairsInGroup(femalePlayers, false);
        resultPairs.push(...femalePairs);

        // 3. Проверяем, остались ли игроки без пар
        const usedInPairs = new Set<string>();
        resultPairs.forEach((pair) => {
          usedInPairs.add(pair[0].id);
          if (pair[1].id) usedInPairs.add(pair[1].id);
        });

        const remainingMale = malePlayers.filter((p) => !usedInPairs.has(p.id));
        const remainingFemale = femalePlayers.filter(
          (p) => !usedInPairs.has(p.id),
        );

        // 4. Если остались игроки, создаем смешанные пары
        if (remainingMale.length > 0 || remainingFemale.length > 0) {
          const allRemaining = [...remainingMale, ...remainingFemale];

          const mixedPairs = createPairsInGroup(
            allRemaining,
            true,
            allRemaining,
          );

          mixedPairs.forEach((pair) => {
            if (pair[1].id && pair[1].name && pair[1].name !== "—") {
              // При групповом бое проверяем, что позиции сохраняются
              if (isGroupBattle) {
                const p1 = pair[0];
                const p2 = pair[1];
                // Если p1 из team2, а p2 из team1 - меняем местами
                if (
                  p1.id &&
                  team2Ids.has(p1.id) &&
                  p2.id &&
                  team1Ids.has(p2.id)
                ) {
                  resultPairs.push([p2, p1]);
                } else {
                  resultPairs.push(pair);
                }
              } else {
                resultPairs.push(pair);
              }
            } else {
              if (pair[0].id) {
                resultPairs.push([
                  pair[0],
                  {
                    ...fighterDefault,
                  },
                ]);
              }
            }
          });
        }
      } else {
        // Без учета пола
        resultPairs = createPairsInGroup(sortedGroup, false);
      }

      if (!pairs[poolIndex]) pairs[poolIndex] = [];
      pairs[poolIndex].push(...resultPairs);
    });
  } else if (
    tournamentSystem === TournamentSystem.SWISS &&
    currentRound &&
    totalRounds
  ) {
    pairs = generateSwissPairs(
      participants,
      poolIndex,
      currentRound,
      totalRounds,
    );
  }

  // СОРТИРОВКА: пары с "—" в конец массива
  if (pairs[poolIndex] && pairs[poolIndex].length > 0) {
    pairs[poolIndex] = pairs[poolIndex].sort((a, b) => {
      const aHasDash = a[0]?.name === "—" || a[1]?.name === "—";
      const bHasDash = b[0]?.name === "—" || b[1]?.name === "—";

      // Если у обоих есть "—" или у обоих нет "—", порядок не меняем
      if (aHasDash === bHasDash) return 0;

      // Если у a есть "—", а у b нет, a должно быть после b
      return aHasDash ? 1 : -1;
    });
  }

  setFighterPairs((state) => {
    const buf = [...state];
    buf[poolIndex] = pairs[poolIndex];
    return buf;
  });
  setCurrentPairIndex((state) => {
    const buf = [...state];
    buf[poolIndex] = 0;
    return buf;
  });
  return pairs;
};

/**
 * Генерация пар для швейцарской системы с учётом Buchholz
 */
function generateSwissPairs(
  participantsArr: ParticipantType[],
  poolIndex: number,
  currentRound: number,
  totalRounds: number,
): [ParticipantType, ParticipantType][][] {
  const pairsArr: [ParticipantType, ParticipantType][][] = [];

  // Фильтруем только активных участников (исключаем —)
  const activeParticipants = participantsArr.filter((p) => p.name !== "—");

  if (activeParticipants.length === 0) return pairsArr;

  // 1. Сортируем участников по системе "победы -> Buchholz -> тех.очки"
  const sorted = sortParticipantsBySwissCriteria(activeParticipants);

  // 2. Группируем по ПОБЕДАМ (основной критерий швейцарской системы)
  const winGroups = groupByWins(sorted);

  // 3. Генерируем пары с учётом всех правил
  const tempPairs = generatePairsFromGroups(winGroups);

  // 4. Распределяем пары по 3 площадкам с учётом арены каждого участника
  const arenaPairs = distributePairsToArenas(
    tempPairs,
    currentRound,
    totalRounds,
  );

  // 5. Сортируем пары внутри каждой площадки (баи в конец)
  for (let i = 0; i < 3; i++) {
    if (arenaPairs[i] && arenaPairs[i].length > 0) {
      arenaPairs[i] = sortPairsWithByes(arenaPairs[i]);
    } else {
      arenaPairs[i] = [];
    }
  }

  pairsArr[poolIndex] = arenaPairs.flat();

  // 6. Обновляем арену у каждого участника в соответствии с распределением
  updateParticipantsArena(activeParticipants, arenaPairs);

  return pairsArr;
}

/**
 * Распределение пар по 3 площадкам с учётом существующей арены участников
 */
function distributePairsToArenas(
  pairs: [ParticipantType, ParticipantType][],
  currentRound: number,
  totalRounds: number,
): [ParticipantType, ParticipantType][][] {
  const arenas: [ParticipantType, ParticipantType][][] = [[], [], []];

  if (pairs.length === 0) return arenas;

  // 1. Сначала группируем пары по существующим аренам
  const pairsByArena = new Map<number, typeof pairs>();

  for (const pair of pairs) {
    let arena = -1;
    for (const player of pair) {
      if (
        player.name !== "—" &&
        player.arena !== undefined &&
        player.arena >= 0 &&
        player.arena < 3
      ) {
        arena = player.arena;
        break;
      }
    }

    if (!pairsByArena.has(arena)) {
      pairsByArena.set(arena, []);
    }
    pairsByArena.get(arena)!.push(pair);
  }

  // 2. Заполняем существующие арены
  for (const [arena, arenaPairs] of pairsByArena) {
    if (arena >= 0 && arena < 3) {
      arenas[arena] = arenaPairs;
    }
  }

  // 3. Распределяем нераспределённые пары
  const unassigned = pairsByArena.get(-1) || [];

  if (unassigned.length > 0) {
    // Сортируем по силе
    const sorted = [...unassigned].sort((a, b) => {
      const strengthA =
        a.reduce((sum, p) => sum + (p.buchholz || 0), 0) /
        a.filter((p) => p.name !== "—").length;
      const strengthB =
        b.reduce((sum, p) => sum + (p.buchholz || 0), 0) /
        b.filter((p) => p.name !== "—").length;
      return strengthB - strengthA;
    });

    // Определяем, сколько пар нужно в каждую арену
    const totalPairs = sorted.length;
    const existingCounts = arenas.map((a) => a.length);
    const totalExisting = existingCounts.reduce((s, c) => s + c, 0);
    const totalAll = totalPairs + totalExisting;

    // ===== ДИНАМИЧЕСКОЕ РАСПРЕДЕЛЕНИЕ В ЗАВИСИМОСТИ ОТ КРУГА =====
    // Вычисляем прогресс турнира
    const progress = currentRound / totalRounds;

    // Базовое распределение
    let strongPercent = 0.35;
    let mediumPercent = 0.35;

    // В поздних кругах смещаем акцент на сильные пары
    if (progress > 0.7) {
      strongPercent = 0.4;
      mediumPercent = 0.35;
    }

    // В самых поздних кругах ещё больше сильных
    if (progress > 0.9) {
      strongPercent = 0.45;
      mediumPercent = 0.35;
    }

    // Ранние круги - более равномерное распределение
    if (progress <= 0.3) {
      strongPercent = 0.33;
      mediumPercent = 0.33;
    }

    // Вычисляем целевое количество пар для каждой арены
    let targetStrong = Math.floor(totalAll * strongPercent);
    let targetMedium = Math.floor(totalAll * mediumPercent);
    let targetWeak = totalAll - targetStrong - targetMedium;

    // Гарантируем минимум 1 пару на арену (если есть хотя бы 3 пары)
    const minPerArena = Math.min(1, Math.floor(totalAll / 3));
    targetStrong = Math.max(targetStrong, minPerArena);
    targetMedium = Math.max(targetMedium, minPerArena);
    targetWeak = Math.max(targetWeak, minPerArena);

    // Если сумма превышает totalAll, корректируем (уменьшаем слабую арену)
    let totalTarget = targetStrong + targetMedium + targetWeak;
    if (totalTarget > totalAll) {
      const excess = totalTarget - totalAll;
      targetWeak = Math.max(minPerArena, targetWeak - excess);

      totalTarget = targetStrong + targetMedium + targetWeak;
      if (totalTarget > totalAll) {
        const excess2 = totalTarget - totalAll;
        targetMedium = Math.max(minPerArena, targetMedium - excess2);

        totalTarget = targetStrong + targetMedium + targetWeak;
        if (totalTarget > totalAll) {
          const excess3 = totalTarget - totalAll;
          targetStrong = Math.max(minPerArena, targetStrong - excess3);
        }
      }
    }

    // Сколько нужно добавить в каждую арену
    let neededStrong = Math.max(0, targetStrong - existingCounts[0]);
    let neededMedium = Math.max(0, targetMedium - existingCounts[1]);

    // Распределяем пары по аренам
    let index = 0;

    // Арена 0 (сильная)
    while (neededStrong > 0 && index < sorted.length) {
      arenas[0].push(sorted[index]);
      index++;
      neededStrong--;
    }

    // Арена 1 (средняя)
    while (neededMedium > 0 && index < sorted.length) {
      arenas[1].push(sorted[index]);
      index++;
      neededMedium--;
    }

    // Арена 2 (слабая) - все оставшиеся
    while (index < sorted.length) {
      arenas[2].push(sorted[index]);
      index++;
    }
  }

  // 4. Финальная проверка: все арены должны быть заполнены
  const emptyArenas = arenas
    .map((a, i) => (a.length === 0 ? i : -1))
    .filter((i) => i >= 0);

  if (emptyArenas.length > 0) {
    // Находим арену с максимальным количеством пар
    let maxCount = 0;
    let maxArena = 0;
    for (let i = 0; i < arenas.length; i++) {
      if (arenas[i].length > maxCount) {
        maxCount = arenas[i].length;
        maxArena = i;
      }
    }

    // Перемещаем пары в пустые арены
    for (const emptyArena of emptyArenas) {
      if (arenas[maxArena].length > 1) {
        const pair = arenas[maxArena].pop()!;
        arenas[emptyArena].push(pair);
      }
    }
  }

  return arenas;
}

/**
 * Обновление арены у участников после распределения
 */
function updateParticipantsArena(
  participants: ParticipantType[],
  arenaPairs: [ParticipantType, ParticipantType][][],
): void {
  // Создаём маппинг игрок -> арена
  const playerArenaMap = new Map<string, number>();

  for (let arenaIndex = 0; arenaIndex < arenaPairs.length; arenaIndex++) {
    const pairs = arenaPairs[arenaIndex];
    for (const pair of pairs) {
      for (const player of pair) {
        if (player.name !== "—") {
          playerArenaMap.set(player.id, arenaIndex + 1);
        }
      }
    }
  }

  // Обновляем арену у участников
  for (const participant of participants) {
    const arena = playerArenaMap.get(participant.id);
    if (arena !== undefined) {
      participant.arena = arena;
    }
  }
}

/**
 * Сортировка участников по критериям швейцарской системы
 */
function sortParticipantsBySwissCriteria(
  participantsArr: ParticipantType[],
): ParticipantType[] {
  return [...participantsArr].sort((a, b) => {
    // 1. Главный критерий - ПОБЕДЫ (по убыванию)
    if (b.wins !== a.wins) return b.wins - a.wins;

    // 2. При равенстве побед - Buchholz (кто играл с более сильными)
    if (b.buchholz !== a.buchholz) return b.buchholz - a.buchholz;

    // 3. Затем - меньше поражений
    if (a.losses !== b.losses) return a.losses - b.losses;

    // 4. Затем - больше технических очков
    if (b.scores !== a.scores) return b.scores - a.scores;

    // 5. Если всё равно - случайно
    return Math.random() - 0.5;
  });
}

/**
 * Группировка по победам
 */
function groupByWins(participantsArr: ParticipantType[]): ParticipantType[][] {
  const groups: ParticipantType[][] = [];
  const winsMap = new Map<number, ParticipantType[]>();

  participantsArr.forEach((p) => {
    if (!winsMap.has(p.wins)) {
      winsMap.set(p.wins, []);
    }
    winsMap.get(p.wins)!.push(p);
  });

  const sortedWins = Array.from(winsMap.keys()).sort((a, b) => b - a);

  for (const wins of sortedWins) {
    groups.push(winsMap.get(wins)!);
  }

  return groups;
}

/**
 * Генерация пар из групп с учётом Buchholz
 */
function generatePairsFromGroups(
  groups: ParticipantType[][],
): [ParticipantType, ParticipantType][] {
  const localPairs: [ParticipantType, ParticipantType][] = [];
  const used = new Set<string>();

  const groupsQueue = [...groups];

  while (groupsQueue.length > 0) {
    const currentGroup = groupsQueue.shift()!;

    const sortedGroup = [...currentGroup].sort((a, b) => {
      return (b.buchholz || 0) - (a.buchholz || 0);
    });

    const unpairedFromGroup: ParticipantType[] = [];

    for (let i = 0; i < sortedGroup.length; i++) {
      const player = sortedGroup[i];

      if (used.has(player.id)) continue;

      let opponent = findBestOpponent(player, sortedGroup, i, used);

      if (opponent) {
        const [first, second] = determinePairOrder(player, opponent);
        localPairs.push([first, second]);
        used.add(player.id);
        used.add(opponent.id);
      } else {
        unpairedFromGroup.push(player);
      }
    }

    if (unpairedFromGroup.length > 0) {
      const remainingGroups = groupsQueue.filter((g) => g.length > 0);

      for (const player of unpairedFromGroup) {
        if (used.has(player.id)) continue;

        const opponent = findOpponentInNearbyGroups(
          player,
          remainingGroups,
          used,
        );

        if (opponent) {
          const [first, second] = determinePairOrder(player, opponent);
          localPairs.push([first, second]);
          used.add(player.id);
          used.add(opponent.id);
        } else {
          // Если совсем нет соперника - даём бай
          localPairs.push([
            player,
            {
              ...fighterDefault,
              arena: player?.arena,
            },
          ]);
          used.add(player.id);
        }
      }
    }
  }

  return localPairs;
}

/**
 * Поиск лучшего соперника в группе
 */
function findBestOpponent(
  player: ParticipantType,
  group: ParticipantType[],
  startIndex: number,
  used: Set<string>,
): ParticipantType | null {
  const candidates: ParticipantType[] = [];

  for (let j = startIndex + 1; j < group.length; j++) {
    const candidate = group[j];

    if (used.has(candidate.id)) continue;
    if (haveTheyPlayed(player, candidate)) continue;
    if (Math.abs(player.buchholz - candidate.buchholz) > 3) continue;

    // Если у игроков уже есть арены, предпочитаем соперников с той же арены
    if (player.arena !== undefined && candidate.arena !== undefined) {
      // Не строгое требование, а предпочтение
      // Можно добавить вес в сортировку
    }

    candidates.push(candidate);
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    // Сначала по близости Buchholz
    const diffA = Math.abs(player.buchholz - a.buchholz);
    const diffB = Math.abs(player.buchholz - b.buchholz);

    // Если разница в Buchholz одинаковая, предпочитаем ту же арену
    if (diffA === diffB) {
      const sameArenaA = player.arena === a.arena ? 0 : 1;
      const sameArenaB = player.arena === b.arena ? 0 : 1;
      return sameArenaA - sameArenaB;
    }

    return diffA - diffB;
  });

  return candidates[0];
}

/**
 * Поиск соперника в соседних группах
 */
function findOpponentInNearbyGroups(
  player: ParticipantType,
  groups: ParticipantType[][],
  used: Set<string>,
): ParticipantType | null {
  const playerWins = player.wins;
  const candidates: ParticipantType[] = [];

  for (const group of groups) {
    if (group.length === 0) continue;

    const groupWins = group[0].wins;
    const winDiff = Math.abs(groupWins - playerWins);

    if (winDiff > 1) continue;

    for (const candidate of group) {
      if (used.has(candidate.id)) continue;
      if (haveTheyPlayed(player, candidate)) continue;
      if (Math.abs(player.buchholz - candidate.buchholz) > 5) continue;

      candidates.push(candidate);
    }
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    // Сначала по близости Buchholz
    const diffA = Math.abs(player.buchholz - a.buchholz);
    const diffB = Math.abs(player.buchholz - b.buchholz);

    // Если разница в Buchholz одинаковая, предпочитаем ту же арену
    if (diffA === diffB) {
      const sameArenaA = player.arena === a.arena ? 0 : 1;
      const sameArenaB = player.arena === b.arena ? 0 : 1;
      return sameArenaA - sameArenaB;
    }

    return diffA - diffB;
  });

  return candidates[0];
}

/**
 * Определение порядка в паре
 */
function determinePairOrder(
  a: ParticipantType,
  b: ParticipantType,
): [ParticipantType, ParticipantType] {
  return (a.buchholz || 0) >= (b.buchholz || 0) ? [a, b] : [b, a];
}

/**
 * Проверка, играли ли участники друг с другом
 */
function haveTheyPlayed(
  player1: ParticipantType,
  player2: ParticipantType,
): boolean {
  return (
    player1.opponents?.includes(player2.id) ||
    player2.opponents?.includes(player1.id)
  );
}

/**
 * Сортировка пар (баи в конец)
 */
function sortPairsWithByes(
  pairs: [ParticipantType, ParticipantType][],
): [ParticipantType, ParticipantType][] {
  return [...pairs].sort((a, b) => {
    const aHasBye = a[1]?.name === "—" || a[0]?.name === "—";
    const bHasBye = b[1]?.name === "—" || b[0]?.name === "—";

    if (aHasBye === bHasBye) return 0;
    return aHasBye ? 1 : -1;
  });
}

/**
 * Рандомно выбирает 2 разные команды, которые ещё не играли друг с другом
 * @param teams - массив команд
 * @param poolDuels - массив пула дуэлей (каждый элемент - массив пар [ParticipantType, ParticipantType])
 * @returns [команда1, команда2] или null, если все пары уже сыграны
 */
export function getRandomTwoTeams(
  teams: TeamType[],
  poolDuels: [ParticipantType, ParticipantType][][],
): [TeamType, TeamType] | null {
  // 1. Проверяем, что есть хотя бы 2 команды
  if (!teams || teams.length < 2) {
    return null;
  }

  // 2. Собираем все пары команд, которые уже сыграли
  const playedPairs = new Set<string>();
  const matchCount = new Map<number, number>();
  const getPairKey = (team1Id: number, team2Id: number) =>
    [team1Id, team2Id].sort((a, b) => a - b).join("-");

  // Инициализируем счётчики матчей для всех команд
  teams.forEach((team) => {
    matchCount.set(team.id, 0);
  });

  poolDuels.forEach((matchPairs) => {
    // В каждом матче может быть несколько боёв (для триатлона - 3 боя)
    let team1Id: number | null = null;
    let team2Id: number | null = null;

    matchPairs.forEach((pair) => {
      const fencer1 = pair[0];
      const fencer2 = pair[1];

      // Находим команды по участникам
      const team1 = teams.find((t) => t.members.includes(fencer1.id));
      const team2 = teams.find((t) => t.members.includes(fencer2.id));

      if (team1 && team2) {
        if (team1Id === null) team1Id = team1.id;
        if (team2Id === null) team2Id = team2.id;
      }
    });

    if (team1Id !== null && team2Id !== null) {
      const pairKey = getPairKey(team1Id, team2Id);
      playedPairs.add(pairKey);

      // Обновляем счётчики матчей
      matchCount.set(team1Id, (matchCount.get(team1Id) || 0) + 1);
      matchCount.set(team2Id, (matchCount.get(team2Id) || 0) + 1);
    }
  });

  // 3. Проверяем, не сыграны ли все пары
  const totalPossiblePairs = (teams.length * (teams.length - 1)) / 2;
  if (playedPairs.size >= totalPossiblePairs) {
    return null;
  }

  // 4. Собираем все возможные пары, которые ещё не играли
  const availablePairs: [TeamType, TeamType][] = [];

  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const team1 = teams[i];
      const team2 = teams[j];

      if (team1.id === team2.id) continue;

      const pairKey = getPairKey(team1.id, team2.id);
      const isPlayed = playedPairs.has(pairKey);

      if (!isPlayed) {
        availablePairs.push([team1, team2]);
      }
    }
  }

  if (availablePairs.length === 0) {
    return null;
  }

  // 5. Находим команды с НАИМЕНЬШИМ количеством матчей
  let minCount = Infinity;
  const minTeams: TeamType[] = [];

  for (const team of teams) {
    const count = matchCount.get(team.id) || 0;
    if (count < minCount) {
      minCount = count;
      minTeams.length = 0;
      minTeams.push(team);
    } else if (count === minCount) {
      minTeams.push(team);
    }
  }

  let selectedPair: [TeamType, TeamType] | null = null;

  // 6. Если есть хотя бы 2 команды с минимальным количеством матчей
  if (minTeams.length >= 2) {
    const shuffled = [...minTeams];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    for (let i = 0; i < shuffled.length; i++) {
      for (let j = i + 1; j < shuffled.length; j++) {
        if (shuffled[i].id === shuffled[j].id) continue;

        const pairKey = getPairKey(shuffled[i].id, shuffled[j].id);

        if (!playedPairs.has(pairKey)) {
          selectedPair = [shuffled[i], shuffled[j]];
          break;
        }
      }
      if (selectedPair) break;
    }
  }

  // 7. Если не нашли среди минимальных, используем балансировку
  if (!selectedPair) {
    const sorted = [...availablePairs].sort((a, b) => {
      const aCount =
        (matchCount.get(a[0].id) || 0) + (matchCount.get(a[1].id) || 0);
      const bCount =
        (matchCount.get(b[0].id) || 0) + (matchCount.get(b[1].id) || 0);
      return aCount - bCount;
    });

    const minTotal =
      (matchCount.get(sorted[0][0].id) || 0) +
      (matchCount.get(sorted[0][1].id) || 0);

    const candidates = sorted.filter((pair) => {
      const total =
        (matchCount.get(pair[0].id) || 0) + (matchCount.get(pair[1].id) || 0);
      return total === minTotal;
    });

    const shuffled = [...candidates];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    for (const pair of shuffled) {
      if (pair[0].id === pair[1].id) continue;

      const pairKey = getPairKey(pair[0].id, pair[1].id);

      if (!playedPairs.has(pairKey)) {
        selectedPair = pair;
        break;
      }
    }
  }

  if (!selectedPair) {
    return null;
  }

  if (selectedPair[0].id === selectedPair[1].id) {
    return null;
  }

  return selectedPair;
}
