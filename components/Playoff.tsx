import { useRouter } from "expo-router";
import { useAtom } from "jotai";
import { HardDriveUpload, Save } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import Button from "@/components/ui/Button";
import { Colors, Fonts } from "@/constants";
import {
  currentNominationIdAtom,
  currentTournamentAtom,
  currentWeaponIdAtom,
  doubleHitsAtom,
  historyAtom,
  playoffAtom,
  playoffIndexAtom,
  playoffMatchIndexAtom,
  playoffTriathlonAtom,
  protests1Atom,
  protests2Atom,
  score1Atom,
  score2Atom,
  teamCountAtom,
  virtualPairIndexAtom,
  virtualPoolIndexAtom,
  warnings1Atom,
  warnings2Atom,
} from "@/store";
import {
  ParticipantPlayoffType,
  ParticipantType,
  PodiumType,
  TeamPlayOffType,
  TournamentMatchType,
} from "@/typings";
import { processTournament } from "@/utils/api";
import { exportExcel } from "@/utils/exportExcel";
import {
  changeValueInStateArray,
  createMatches,
  getMatchesFromDuels,
} from "@/utils/helpers";
import { convertTriathlonToParticipantPairs } from "@/utils/matchesHandlers";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import SelectPair from "./ui/SelectPair";

interface PlayoffProps {
  isTriathlon?: boolean;
}

export default function Playoff({ isTriathlon = false }: PlayoffProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [currentTournament] = useAtom(currentTournamentAtom);
  const [currentWeaponId] = useAtom(currentWeaponIdAtom);
  const [currentNominationId] = useAtom(currentNominationIdAtom);
  const [teamCount] = useAtom(teamCountAtom);

  const [playoffIndividual, setPlayoffIndividual] = useAtom(playoffAtom);
  const [playoffTriathlon, setPlayoffTriathlon] = useAtom(playoffTriathlonAtom);
  const [virtualPoolIndex, setVirtualPoolIndex] = useAtom(virtualPoolIndexAtom);
  const [virtualPairIndex, setVirtualPairIndex] = useAtom(virtualPairIndexAtom);

  const [winners, setWinners] = useState<{ [key: string]: number }>({});
  const [champion, setChampion] = useState<
    ParticipantPlayoffType | TeamPlayOffType | null
  >(null);
  const [playoffIndex, setPlayoffIndex] = useAtom(playoffIndexAtom);
  const [playoffMatchIndex, setPlayoffMatchIndex] = useAtom(
    playoffMatchIndexAtom,
  );
  const [, setDoubleHits] = useAtom(doubleHitsAtom);
  const [, setProtests1] = useAtom(protests1Atom);
  const [, setProtests2] = useAtom(protests2Atom);
  const [, setWarnings1] = useAtom(warnings1Atom);
  const [, setWarnings2] = useAtom(warnings2Atom);
  const [, setScore1] = useAtom(score1Atom);
  const [, setScore2] = useAtom(score2Atom);
  const [, setHistory] = useAtom(historyAtom);

  const [podium, setPodium] = useState<PodiumType>({
    first: null,
    second: null,
    third: null,
    fourth: null,
  });

  const playoff = useMemo(() => {
    if (isTriathlon) {
      return playoffTriathlon || [];
    }
    return playoffIndividual || [];
  }, [isTriathlon, playoffTriathlon, playoffIndividual]);

  const setPlayoff = useMemo(() => {
    return isTriathlon ? setPlayoffTriathlon : setPlayoffIndividual;
  }, [isTriathlon, setPlayoffTriathlon, setPlayoffIndividual]);

  const triathlonFighterPairs = useMemo(() => {
    if (!isTriathlon || !playoffTriathlon?.length) {
      return [] as [ParticipantType, ParticipantType][][];
    }

    const currentRound = playoffTriathlon[playoffIndex];
    if (!currentRound) {
      return [] as [ParticipantType, ParticipantType][][];
    }

    return currentRound.map((teamsPairs) => {
      const team1 = teamsPairs?.[0];
      const team2 = teamsPairs?.[1];
      const members1 = team1?.members ?? [];
      const members2 = team2?.members ?? [];

      return members1.map((m, idx) => [{ ...m }, { ...members2[idx] }]);
    }) as [ParticipantType, ParticipantType][][];
  }, [isTriathlon, playoffTriathlon, playoffIndex]);

  const triathlonTeams = useMemo(() => {
    if (!isTriathlon || !playoffTriathlon?.length) {
      return [];
    }

    const currentRound = playoffTriathlon[playoffIndex];
    if (!currentRound) {
      return [];
    }

    return currentRound.map((m) => m.flat());
  }, [isTriathlon, playoffTriathlon, playoffIndex]);

  const saveOnServer = async () => {
    if (currentTournament && currentNominationId && currentWeaponId) {
      const matches: TournamentMatchType[] = getMatchesFromDuels(
        playoff as any,
        undefined,
        "playoff",
      );
      await createMatches(
        currentTournament.id,
        currentWeaponId,
        currentNominationId,
        matches,
      );

      const winnerIds =
        isTriathlon && podium.first
          ? [String((podium.first as TeamPlayOffType).id)]
          : [
              String(podium.first?.id),
              String(podium.second?.id),
              String(podium.third?.id),
            ];

      const res = await processTournament(
        currentTournament.id,
        currentWeaponId,
        currentNominationId,
        winnerIds,
        undefined,
        new Date(currentTournament.date),
      );
      if (res) {
        Toast.show({
          type: "success",
          text1: t("success"),
          text2: t("saved"),
        });
      }
    }
  };

  const handleFighterClick = (
    roundIndex: number,
    matchIndex: number,
    fighterIndex: number,
  ) => {
    const key = `${roundIndex}-${matchIndex}`;
    setWinners((prev) => ({
      ...prev,
      [key]: fighterIndex,
    }));
  };

  const generateNextRound = () => {
    const isTeams = (obj: any): obj is TeamPlayOffType =>
      obj?.members !== undefined;
    const currentRoundIndex = playoff.length - 1;
    const currentRound = playoff[currentRoundIndex];
    const nextRoundPairs: any[][] = [];
    const additionalFields = {
      wins: 0,
      scores: 0,
      warnings: 0,
      protests: 0,
      doubleHits: 0,
    };

    const allWinnersDetermined = currentRound.every(
      (_, idx) => winners[`${currentRoundIndex}-${idx}`] !== undefined,
    );

    if (!allWinnersDetermined) return;

    const currentPairsCount = currentRound.length;

    if (currentPairsCount > 2) {
      for (let i = 0; i < currentRound.length; i += 2) {
        if (i + 1 < currentRound.length) {
          const match1 = currentRound[i];
          const match2 = currentRound[i + 1];

          const winner1Index = winners[`${currentRoundIndex}-${i}`];
          const winner2Index = winners[`${currentRoundIndex}-${i + 1}`];

          const winner1 = match1[winner1Index];
          const winner2 = match2[winner2Index];
          let membersFieldFirst = {};
          let membersFieldSecond = {};
          if (isTeams(winner1) && isTeams(winner2)) {
            membersFieldFirst = {
              members: winner1.members.map((m) => ({
                ...m,
                ...additionalFields,
                weapon: "",
              })),
            };
            membersFieldSecond = {
              members: winner2.members.map((m) => ({
                ...m,
                ...additionalFields,
                weapon: "",
              })),
            };
          } else {
            membersFieldFirst = { ...additionalFields };
            membersFieldSecond = { ...additionalFields };
          }

          nextRoundPairs.push([
            { ...winner1, scores: 0, ...membersFieldFirst },
            { ...winner2, scores: 0, ...membersFieldSecond },
          ]);
        }
      }
    } else if (currentPairsCount === 2) {
      const hadPreviousTwoPairs =
        playoff.length >= 2 && playoff[currentRoundIndex - 1]?.length === 2;

      if (!hadPreviousTwoPairs) {
        const finalists: any[] = [];
        const thirdPlaceContenders: any[] = [];

        for (let i = 0; i < currentRound.length; i++) {
          const match = currentRound[i];
          const winnerIndex = winners[`${currentRoundIndex}-${i}`];
          const loserIndex = winnerIndex === 0 ? 1 : 0;

          let membersFieldFirst = {};
          let membersFieldSecond = {};
          if (isTeams(match[winnerIndex]) && isTeams(match[loserIndex])) {
            membersFieldFirst = {
              members: match[winnerIndex].members.map((m) => ({
                ...m,
                ...additionalFields,
                weapon: "",
              })),
            };
            membersFieldSecond = {
              members: match[loserIndex].members.map((m) => ({
                ...m,
                ...additionalFields,
                weapon: "",
              })),
            };
          } else {
            membersFieldFirst = { ...additionalFields };
            membersFieldSecond = { ...additionalFields };
          }

          finalists.push({
            ...match[winnerIndex],
            scores: 0,
            ...membersFieldFirst,
          });
          thirdPlaceContenders.push({
            ...match[loserIndex],
            scores: 0,
            ...membersFieldSecond,
          });
        }

        if (finalists.length === 2) {
          nextRoundPairs.push([{ ...finalists[0] }, { ...finalists[1] }]);
        }
        if (thirdPlaceContenders.length === 2) {
          nextRoundPairs.push([
            { ...thirdPlaceContenders[0] },
            { ...thirdPlaceContenders[1] },
          ]);
        }
      } else {
        return;
      }
    }

    if (nextRoundPairs.length > 0) {
      if (isTriathlon) {
        setVirtualPoolIndex(0);
        setVirtualPairIndex(new Array(nextRoundPairs.length).fill(0));
      }
      setPlayoffIndex((state) => state + 1);
      setPlayoffMatchIndex(0);
      setPlayoff((prev) => [...prev, nextRoundPairs]);
    }
  };

  useEffect(() => {
    const lastRoundIndex = playoff.length - 1;
    const lastRound = playoff[lastRoundIndex];
    if (!lastRound) return;

    const allWinnersDetermined = lastRound.every(
      (_, idx) => winners[`${lastRoundIndex}-${idx}`] !== undefined,
    );

    if (!allWinnersDetermined) return;

    const isFinalRound =
      lastRound.length === 2 &&
      playoff.length >= 2 &&
      playoff[lastRoundIndex - 1]?.length === 2;
    const isSimpleFinal = lastRound.length === 1;

    if (isFinalRound) {
      const finalMatch = lastRound[0];
      const thirdPlaceMatch = lastRound[1];

      const finalWinnerIndex = winners[`${lastRoundIndex}-0`];
      const thirdPlaceWinnerIndex = winners[`${lastRoundIndex}-1`];

      const champion = finalMatch[finalWinnerIndex];
      const secondPlace = finalMatch[finalWinnerIndex === 0 ? 1 : 0];
      const thirdPlace = thirdPlaceMatch[thirdPlaceWinnerIndex];
      const fourthPlace = thirdPlaceMatch[thirdPlaceWinnerIndex === 0 ? 1 : 0];

      setChampion(champion);
      setPodium({
        first: champion,
        second: secondPlace,
        third: thirdPlace,
        fourth: fourthPlace,
      });
    } else if (isSimpleFinal) {
      const finalMatch = lastRound[0];
      const winnerIndex = winners[`${lastRoundIndex}-0`];
      const champion = finalMatch[winnerIndex];
      const secondPlace = finalMatch[winnerIndex === 0 ? 1 : 0];

      setChampion(champion);
      setPodium({
        first: champion,
        second: secondPlace,
        third: null,
        fourth: null,
      });
    }
  }, [winners, playoff]);

  const canGenerateNextRound = () => {
    if (playoff.length === 0 || champion) return false;

    const lastRoundIndex = playoff.length - 1;
    const lastRound = playoff[lastRoundIndex];

    const allWinnersDetermined = lastRound.every(
      (_, idx) => winners[`${lastRoundIndex}-${idx}`] !== undefined,
    );

    if (!allWinnersDetermined) return false;

    const lastRoundPairsCount = lastRound.length;

    if (lastRoundPairsCount === 1) return false;

    if (lastRoundPairsCount === 2) {
      const hadPreviousTwoPairs =
        playoff.length >= 2 && playoff[lastRoundIndex - 1]?.length === 2;
      if (hadPreviousTwoPairs) return false;
      return true;
    }

    return true;
  };

  useEffect(() => {
    playoff.forEach((play, roundIndex) => {
      play.forEach((pair, matchIndex) => {
        if (pair[0].scores !== pair[1].scores) {
          handleFighterClick(
            roundIndex,
            matchIndex,
            pair[0].scores > pair[1].scores ? 0 : 1,
          );
        }
      });
    });
  }, [playoff]);

  const goToFight = (roundIndex: number, matchIndex: number) => {
    setPlayoffIndex(roundIndex);
    setPlayoffMatchIndex(matchIndex);
    setScore1(0);
    setScore2(0);
    setDoubleHits(0);
    setProtests1(0);
    setProtests2(0);
    setWarnings1(0);
    setWarnings2(0);
    setHistory([]);
    if (isTriathlon) {
      setVirtualPoolIndex(matchIndex);
      setVirtualPairIndex((state) => {
        const currentValue =
          state && state[matchIndex] !== undefined ? state[matchIndex] : 0;

        const newState = [...state];
        while (newState.length <= matchIndex) {
          newState.push(0);
        }
        newState[matchIndex] = currentValue;

        return newState;
      });
    }
    router.push("/fight");
  };

  const getDisplayName = (item: any): string => {
    if (isTriathlon) {
      return (
        (item as TeamPlayOffType).name ||
        `${t("team")} ${(item as TeamPlayOffType).id}`
      );
    }
    return (item as ParticipantPlayoffType).name;
  };

  const getItemScores = (item: any): number => {
    return item.scores || 0;
  };

  const participantClick = (roundIdx: number, matchIdx: number) => {
    if (isTriathlon) {
      setPlayoffIndex(roundIdx);
      setPlayoffMatchIndex(matchIdx);
      setVirtualPoolIndex(matchIdx);

      setVirtualPairIndex((state) =>
        changeValueInStateArray(
          state,
          state[matchIdx] ? state[matchIdx] : 0,
          matchIdx,
        ),
      );
    } else handleFighterClick(roundIdx, matchIdx, 0);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Подиум победителей */}
        {podium.first && (
          <View style={styles.podium}>
            <Text style={styles.podiumTitle}>
              {"🏆 " + t("finalPlaces") + " 🏆"}
            </Text>
            <View style={styles.podiumContainer}>
              <View style={[styles.podiumItem, styles.firstPlace]}>
                <Text style={styles.podiumPlace}>🥇</Text>
                <Text style={styles.podiumName}>
                  {getDisplayName(podium.first)}
                </Text>
              </View>

              <View style={styles.podiumItem}>
                <Text style={styles.podiumPlace}>🥈</Text>
                <Text style={styles.podiumName}>
                  {podium.second ? getDisplayName(podium.second) : "—"}
                </Text>
              </View>

              {podium.third && (
                <View style={styles.podiumItem}>
                  <Text style={styles.podiumPlace}>🥉</Text>
                  <Text style={styles.podiumName}>
                    {getDisplayName(podium.third)}
                  </Text>
                </View>
              )}

              {podium.fourth && (
                <View style={styles.podiumItem}>
                  <Text style={styles.podiumPlace}>4</Text>
                  <Text style={styles.podiumName}>
                    {getDisplayName(podium.fourth)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Сетка турнира */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.bracket}>
            {playoff.map((round, roundIndex) => {
              const isPastPair = playoff.length - 1 > roundIndex;
              const matchesCount = round.length;
              const totalRounds = playoff.length;
              const isLastRound = roundIndex === totalRounds - 1;
              const hadPreviousTwoPairs =
                roundIndex > 0 && playoff[roundIndex - 1]?.length === 2;

              let roundTitle = "";
              if (matchesCount === 2) {
                if (isLastRound && hadPreviousTwoPairs) {
                  roundTitle = t("finalAndThirdPlace");
                } else {
                  roundTitle = t("semifinal");
                }
              } else if (matchesCount === 1) {
                roundTitle = t("final");
              } else {
                roundTitle = `1/${matchesCount} ${t("final")}`;
              }

              const isFinalRound = isLastRound && hadPreviousTwoPairs;

              return (
                <View key={roundIndex} style={styles.roundColumn}>
                  <Text style={styles.roundTitle}>{roundTitle}</Text>

                  <View style={styles.matchesContainer}>
                    {round.map((match, matchIndex) => {
                      const isThirdPlaceMatch =
                        isFinalRound && matchIndex === 1;
                      const isFinalMatch = isFinalRound && matchIndex === 0;
                      const [fighter1, fighter2] = match;
                      const winnerKey = `${roundIndex}-${matchIndex}`;
                      const winnerIndex = winners[winnerKey];

                      return (
                        <View
                          key={matchIndex}
                          style={[
                            styles.matchWrapper,
                            isFinalMatch && styles.finalMatchWrapper,
                            isThirdPlaceMatch && styles.thirdPlaceMatchWrapper,
                          ]}
                        >
                          <TouchableOpacity
                            style={[
                              styles.matchCard,
                              playoffIndex === roundIndex &&
                                playoffMatchIndex === matchIndex &&
                                styles.currentCard,
                              isPastPair && {
                                opacity: 0.7,
                              },
                            ]}
                            onPress={() => goToFight(roundIndex, matchIndex)}
                            disabled={isPastPair}
                            activeOpacity={0.8}
                          >
                            {(isFinalMatch || isThirdPlaceMatch) && (
                              <View
                                style={[
                                  styles.matchBadge,
                                  isFinalMatch && { left: "60%" },
                                ]}
                              >
                                <Text style={styles.matchBadgeText}>
                                  {isFinalMatch
                                    ? `🏆 ${t("final")}`
                                    : `🥉 ${t("matchThirdPlace")}`}
                                </Text>
                              </View>
                            )}

                            {/* Первый боец/команда */}
                            <TouchableOpacity
                              style={[
                                styles.fighterRow,
                                winnerIndex === 0 && styles.winnerRow,
                              ]}
                              onPress={(e) => {
                                e.stopPropagation();
                                if (!isPastPair)
                                  participantClick(roundIndex, matchIndex);
                              }}
                              activeOpacity={0.7}
                              disabled={isPastPair}
                            >
                              <Text
                                style={styles.fighterName}
                                numberOfLines={1}
                              >
                                {getDisplayName(fighter1)}
                              </Text>
                              <Text style={styles.fighterScore}>
                                {getItemScores(fighter1)}
                              </Text>
                            </TouchableOpacity>

                            <Text style={styles.vsDivider}>VS</Text>

                            {/* Второй боец/команда */}
                            <TouchableOpacity
                              style={[
                                styles.fighterRow,
                                winnerIndex === 1 && styles.winnerRow,
                              ]}
                              onPress={(e) => {
                                e.stopPropagation();
                                if (!isPastPair)
                                  participantClick(roundIndex, matchIndex);
                              }}
                              activeOpacity={0.7}
                              disabled={isPastPair}
                            >
                              <Text
                                style={styles.fighterName}
                                numberOfLines={1}
                              >
                                {getDisplayName(fighter2)}
                              </Text>
                              <Text style={styles.fighterScore}>
                                {getItemScores(fighter2)}
                              </Text>
                            </TouchableOpacity>
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>

        {isTriathlon && (
          <SelectPair
            poolIndex={virtualPoolIndex}
            currentPairIndex={virtualPairIndex[virtualPoolIndex]}
            selectPair={(idx) =>
              setVirtualPairIndex((state) =>
                changeValueInStateArray(state, idx, virtualPoolIndex),
              )
            }
            fighterPairs={triathlonFighterPairs}
            onPairsReordered={(newPairs) => {
              setPlayoffTriathlon((state) => {
                const buf = JSON.parse(JSON.stringify(state));
                const currentTeamsPair = buf[playoffIndex][playoffMatchIndex];
                const participantsPairs =
                  newPairs[virtualPoolIndex][
                    virtualPairIndex[virtualPoolIndex]
                  ];

                for (const [idx, pair] of [
                  currentTeamsPair,
                  currentTeamsPair,
                ].entries()) {
                  const team = pair[idx];
                  buf[playoffIndex][playoffMatchIndex][idx] = {
                    ...team,
                    members: team.members.map((m) => {
                      if (m.id === participantsPairs[0].id) {
                        return participantsPairs[0];
                      } else if (m.id === participantsPairs[1].id) {
                        return participantsPairs[1];
                      }

                      return m;
                    }),
                  };
                }

                return buf;
              });
            }}
            participants={[
              playoffTriathlon[0]
                .map((teamsPair) =>
                  [teamsPair[0].members, teamsPair[1].members].flat(),
                )
                .flat(),
            ]}
            teams={triathlonTeams}
            manualMode
          />
        )}

        {/* Кнопка следующего раунда */}
        {playoff.length > 0 && !champion && canGenerateNextRound() && (
          <View style={styles.controls}>
            <Button
              title={t("nextRound")}
              onPress={generateNextRound}
              style={styles.fullButton}
            />
          </View>
        )}

        {/* Кнопка сохранения на сервер */}
        {podium.first &&
          currentTournament &&
          currentNominationId &&
          currentWeaponId && (
            <Button
              title={t("saveToServer")}
              onPress={saveOnServer}
              style={styles.fullButton}
            >
              <HardDriveUpload size={20} color={Colors.fg} />
            </Button>
          )}

        {/* Кнопка экспорта */}
        <Button
          title={t("save")}
          onPress={() =>
            exportExcel(
              isTriathlon
                ? convertTriathlonToParticipantPairs(
                    playoffTriathlon,
                    teamCount,
                  )
                : playoffIndividual,
              `${t("playoff")}.xlsx`,
              podium,
              isTriathlon
                ? playoffTriathlon.map((pairs) => pairs.flat()).flat()
                : undefined,
              teamCount,
            )
          }
          style={styles.fullButton}
        >
          <Save size={20} color={Colors.fg} />
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  podium: {
    backgroundColor: `rgba(${Colors.accentRgb}, 0.1)`,
    borderRadius: 12,
    padding: 20,
    margin: 16,
    marginTop: 50,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  podiumTitle: {
    textAlign: "center",
    color: Colors.fg,
    fontFamily: Fonts.bold,
    fontSize: 24,
    marginBottom: 20,
  },
  podiumContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 15,
    flexWrap: "wrap",
  },
  podiumItem: {
    alignItems: "center",
    minWidth: 100,
    padding: 15,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `rgba(${Colors.accentRgb}, 0.1)`,
  },
  firstPlace: {
    transform: [{ scale: 1.05 }],
    borderWidth: 2,
    borderColor: "gold",
  },
  podiumPlace: {
    fontSize: 36,
    marginBottom: 8,
    fontFamily: Fonts.bold,
  },
  podiumName: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: Colors.fg,
    textAlign: "center",
  },
  bracket: {
    flexDirection: "row",
    padding: 20,
    gap: 30,
  },
  roundColumn: {
    minWidth: 260,
  },
  roundTitle: {
    textAlign: "center",
    color: Colors.fg,
    fontFamily: Fonts.bold,
    fontSize: 18,
    marginBottom: 20,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: Colors.accent,
  },
  matchesContainer: {
    gap: 20,
  },
  matchWrapper: {
    width: "100%",
  },
  finalMatchWrapper: {
    borderLeftWidth: 3,
    borderLeftColor: "gold",
  },
  thirdPlaceMatchWrapper: {
    borderLeftWidth: 3,
    borderLeftColor: "#cd7f32",
  },
  matchCard: {
    backgroundColor: `rgba(${Colors.accentRgb}, 0.1)`,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  matchBadge: {
    position: "absolute",
    top: -12,
    left: "50%",
    transform: [{ translateX: -50 }],
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: "gold",
    zIndex: 10,
  },
  matchBadgeText: {
    fontSize: 10,
    fontFamily: Fonts.bold,
    color: "#333",
  },
  fighterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    marginVertical: 4,
  },
  winnerRow: {
    borderColor: Colors.accent,
    borderWidth: 1,
  },
  fighterName: {
    flex: 1,
    fontSize: 14,
    color: Colors.fg,
    marginRight: 8,
  },
  fighterScore: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: Colors.accent,
    backgroundColor: `rgba(${Colors.accentRgb}, 0.1)`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    minWidth: 45,
    textAlign: "center",
  },
  vsDivider: {
    textAlign: "center",
    fontFamily: Fonts.bold,
    fontSize: 12,
    color: Colors.fg,
    opacity: 0.5,
    paddingVertical: 4,
  },
  controls: {
    padding: 16,
  },
  fullButton: {
    marginBottom: 10,
    marginHorizontal: 16,
  },
  currentCard: {
    borderColor: `rgba(${Colors.accentRgb}, 0.5)`,
  },
});
