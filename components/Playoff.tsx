// components/Playoff/index.tsx
import { useRouter } from "expo-router";
import { useAtom } from "jotai";
import { HardDriveUpload, Save } from "lucide-react-native";
import React, { useEffect, useState } from "react";
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
  protests1Atom,
  protests2Atom,
  score1Atom,
  score2Atom,
  warnings1Atom,
  warnings2Atom,
} from "@/store";
import { ParticipantPlayoffType, TournamentMatchType } from "@/typings";
import { processTournament } from "@/utils/api";
import { exportExcel } from "@/utils/exportExcel";
import { createMatches, getMatchesFromDuels } from "@/utils/helpers";
import Toast from "react-native-toast-message";

interface PlayoffProps {
  onTournamentComplete?: (winner: ParticipantPlayoffType) => void;
}

export default function Playoff({ onTournamentComplete }: PlayoffProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [currentTournament] = useAtom(currentTournamentAtom);
  const [currentWeaponId] = useAtom(currentWeaponIdAtom);
  const [currentNominationId] = useAtom(currentNominationIdAtom);
  const [playoff, setPlayoff] = useAtom(playoffAtom);
  const [winners, setWinners] = useState<{ [key: string]: number }>({});
  const [champion, setChampion] = useState<ParticipantPlayoffType | null>(null);
  const [, setPlayoffIndex] = useAtom(playoffIndexAtom);
  const [, setPlayoffMatchIndex] = useAtom(playoffMatchIndexAtom);
  const [, setDoubleHits] = useAtom(doubleHitsAtom);
  const [, setProtests1] = useAtom(protests1Atom);
  const [, setProtests2] = useAtom(protests2Atom);
  const [, setWarnings1] = useAtom(warnings1Atom);
  const [, setWarnings2] = useAtom(warnings2Atom);
  const [, setScore1] = useAtom(score1Atom);
  const [, setScore2] = useAtom(score2Atom);
  const [, setHistory] = useAtom(historyAtom);
  const [podium, setPodium] = useState<{
    first: ParticipantPlayoffType | null;
    second: ParticipantPlayoffType | null;
    third: ParticipantPlayoffType | null;
    fourth: ParticipantPlayoffType | null;
  }>({
    first: null,
    second: null,
    third: null,
    fourth: null,
  });

  const saveOnServer = async () => {
    if (currentTournament && currentNominationId && currentWeaponId) {
      const matches: TournamentMatchType[] = getMatchesFromDuels(
        playoff,
        undefined,
        "playoff",
      );
      await createMatches(
        currentTournament.id,
        currentWeaponId,
        currentNominationId,
        matches,
      );

      const res = await processTournament(
        currentTournament.id,
        currentWeaponId,
        currentNominationId,
        [
          String(podium.first?.id),
          String(podium.second?.id),
          String(podium.third?.id),
        ],
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
    const currentRoundIndex = playoff.length - 1;
    const currentRound = playoff[currentRoundIndex];
    const nextRoundPairs: ParticipantPlayoffType[][] = [];

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

          nextRoundPairs.push([
            { ...winner1, scores: 0, wins: 0 },
            { ...winner2, scores: 0, wins: 0 },
          ]);
        }
      }
    } else if (currentPairsCount === 2) {
      const hadPreviousTwoPairs =
        playoff.length >= 2 && playoff[currentRoundIndex - 1]?.length === 2;

      if (!hadPreviousTwoPairs) {
        const finalists: ParticipantPlayoffType[] = [];
        const thirdPlaceContenders: ParticipantPlayoffType[] = [];

        for (let i = 0; i < currentRound.length; i++) {
          const match = currentRound[i];
          const winnerIndex = winners[`${currentRoundIndex}-${i}`];
          const loserIndex = winnerIndex === 0 ? 1 : 0;

          finalists.push({ ...match[winnerIndex], scores: 0, wins: 0 });
          thirdPlaceContenders.push({
            ...match[loserIndex],
            scores: 0,
            wins: 0,
          });
        }

        if (finalists.length === 2) {
          nextRoundPairs.push([finalists[0], finalists[1]]);
        }
        if (thirdPlaceContenders.length === 2) {
          nextRoundPairs.push([
            thirdPlaceContenders[0],
            thirdPlaceContenders[1],
          ]);
        }
      } else {
        return;
      }
    }

    if (nextRoundPairs.length > 0) {
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

      if (onTournamentComplete) {
        onTournamentComplete(champion);
      }
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

      if (onTournamentComplete) {
        onTournamentComplete(champion);
      }
    }
  }, [winners, playoff, onTournamentComplete]);

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
    router.push("/fight");
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Подиум победителей */}
      {podium.first && (
        <View style={styles.podium}>
          <Text style={styles.podiumTitle}>🏆 {t("finalPlaces")} 🏆</Text>
          <View style={styles.podiumContainer}>
            <View style={[styles.podiumItem, styles.firstPlace]}>
              <Text style={styles.podiumPlace}>🥇</Text>
              <Text style={styles.podiumName}>{podium.first.name}</Text>
            </View>

            <View style={styles.podiumItem}>
              <Text style={styles.podiumPlace}>🥈</Text>
              <Text style={styles.podiumName}>
                {podium.second?.name || "—"}
              </Text>
            </View>

            {podium.third && (
              <View style={styles.podiumItem}>
                <Text style={styles.podiumPlace}>🥉</Text>
                <Text style={styles.podiumName}>{podium.third.name}</Text>
              </View>
            )}

            {podium.fourth && (
              <View style={styles.podiumItem}>
                <Text style={styles.podiumPlace}>4</Text>
                <Text style={styles.podiumName}>{podium.fourth.name}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Сетка турнира */}
      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <View style={styles.bracket}>
          {playoff.map((round, roundIndex) => {
            const matchesCount = round.length;
            const totalRounds = playoff.length;
            const isLastRound = roundIndex === totalRounds - 1;
            const hadPreviousTwoPairs =
              roundIndex > 0 && playoff[roundIndex - 1]?.length === 2;

            let roundTitle = "";
            if (matchesCount === 4) {
              roundTitle = `1/${Math.pow(2, playoff.length - roundIndex)} ${t("final")}`;
            } else if (matchesCount === 2) {
              if (isLastRound && hadPreviousTwoPairs) {
                roundTitle = t("finalAndThirdPlace");
              } else {
                roundTitle = t("semifinal");
              }
            } else if (matchesCount === 1) {
              roundTitle = t("final");
            } else {
              roundTitle = `1/${Math.pow(2, playoff.length - roundIndex)} ${t("final")}`;
            }

            const isFinalRound = isLastRound && hadPreviousTwoPairs;

            return (
              <View key={roundIndex} style={styles.roundColumn}>
                <Text style={styles.roundTitle}>{roundTitle}</Text>

                <View style={styles.matchesContainer}>
                  {round.map((match, matchIndex) => {
                    const isThirdPlaceMatch = isFinalRound && matchIndex === 1;
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
                          style={styles.matchCard}
                          onPress={() => goToFight(roundIndex, matchIndex)}
                          activeOpacity={0.8}
                        >
                          {(isFinalMatch || isThirdPlaceMatch) && (
                            <View style={styles.matchBadge}>
                              <Text style={styles.matchBadgeText}>
                                {isFinalMatch
                                  ? `🏆 ${t("final")}`
                                  : `🥉 ${t("matchThirdPlace")}`}
                              </Text>
                            </View>
                          )}

                          {/* Первый боец */}
                          <TouchableOpacity
                            style={[
                              styles.fighterRow,
                              winnerIndex === 0 && styles.winnerRow,
                            ]}
                            onPress={(e) => {
                              e.stopPropagation();
                              handleFighterClick(roundIndex, matchIndex, 0);
                            }}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.fighterName} numberOfLines={1}>
                              {fighter1.name}
                            </Text>
                            <Text style={styles.fighterScore}>
                              {fighter1.scores}
                            </Text>
                          </TouchableOpacity>

                          <Text style={styles.vsDivider}>VS</Text>

                          {/* Второй боец */}
                          <TouchableOpacity
                            style={[
                              styles.fighterRow,
                              winnerIndex === 1 && styles.winnerRow,
                            ]}
                            onPress={(e) => {
                              e.stopPropagation();
                              handleFighterClick(roundIndex, matchIndex, 1);
                            }}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.fighterName} numberOfLines={1}>
                              {fighter2.name}
                            </Text>
                            <Text style={styles.fighterScore}>
                              {fighter2.scores}
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
        onPress={() => exportExcel(playoff, `${t("playoff")}.xlsx`, true)}
        style={styles.fullButton}
      >
        <Save size={20} color={Colors.fg} />
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  // Подиум
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
  // Сетка
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
  winnerRowText: {
    color: Colors.fg,
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
});
