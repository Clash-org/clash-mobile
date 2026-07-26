import { Colors, Fonts } from "@/constants";
import { useAtom } from "jotai";
import { ChartColumn, HardDriveUpload, Save } from "lucide-react-native";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import Playoff from "@/components/Playoff";
import Button from "@/components/ui/Button";
import FightersScores from "@/components/ui/FightersScores";
import ModalWindow from "@/components/ui/ModalWindow";
import Table from "@/components/ui/Table";
import {
  currentNominationIdAtom,
  currentPairIndexAtom,
  currentPoolIdAtom,
  currentPoolIndexAtom,
  currentRoundAtom,
  currentTeamsIndexesAtom,
  currentTournamentAtom,
  currentWeaponIdAtom,
  doubleHitsAtom,
  duelsAtom,
  fighterDefault,
  fighterPairsAtom,
  idsRDAtom,
  isGroupBattleAtom,
  isPoolEndAtom,
  isPoolRatingAtom,
  participantsAtom,
  playoffAtom,
  playoffTriathlonAtom,
  poolCountDeleteAtom,
  protests1Atom,
  protests2Atom,
  rankParticipantsAtom,
  score1Atom,
  score2Atom,
  teamsAtom,
  totalRoundsAtom,
  tournamentSystemAtom,
  warnings1Atom,
  warnings2Atom,
} from "@/store";
import {
  ParticipantType,
  TeamStats,
  TournamentResponse,
  TournamentSystem,
} from "@/typings";
import { processTournament, updatePoolEnd } from "@/utils/api";
import { exportExcel } from "@/utils/exportExcel";
import { generatePairs, getRandomTwoTeams } from "@/utils/generatePairs";
import {
  generatePlayoffPairs,
  getPlayoffTriathlonTeamsPairs,
} from "@/utils/generatePlayoffPairs";
import {
  changeValueInStateArray,
  createMatches,
  getMatchesFromDuels,
  isPoolEndByDuels,
  teamSelect,
  truncate,
} from "@/utils/helpers";
import {
  calculateAllRD,
  getAllInOneParticipants,
  getTeamStatsFromDuels,
  getTopThreeFighters,
  getTriathlonWinnersFromDuels,
  getWinnersRobin,
  getWinnersSwiss,
  isAllTeamsPairsPlayedFromDuels,
} from "@/utils/matchesHandlers";
import Toast from "react-native-toast-message";

const { width } = Dimensions.get("window");

export default function TournamentGridScreen() {
  const { t } = useTranslation();
  const [isGroupBattle] = useAtom(isGroupBattleAtom);
  const [teams, setTeams] = useAtom(teamsAtom);
  const [currentTeamsIndexes, setCurrentTeamsIndexes] = useAtom(
    currentTeamsIndexesAtom,
  );
  const [participants] = useAtom(participantsAtom);
  const [currentTournament] = useAtom(currentTournamentAtom);
  const [currentWeaponId] = useAtom(currentWeaponIdAtom);
  const [currentNominationId] = useAtom(currentNominationIdAtom);
  const [currentPoolId] = useAtom(currentPoolIdAtom);
  const [poolCountDelete] = useAtom(poolCountDeleteAtom);
  const [isPoolRating] = useAtom(isPoolRatingAtom);
  const [fighterPairs, setFighterPairs] = useAtom(fighterPairsAtom);
  const [tournamentSystem] = useAtom(tournamentSystemAtom);
  const [winners, setWinners] = useState<ParticipantType[]>([]);
  const [, setCurrentPairIndex] = useAtom(currentPairIndexAtom);
  const [currentPoolIndex] = useAtom(currentPoolIndexAtom);
  const [duels, setDuels] = useAtom(duelsAtom);
  const [, setDoubleHits] = useAtom(doubleHitsAtom);
  const [, setProtests1] = useAtom(protests1Atom);
  const [, setProtests2] = useAtom(protests2Atom);
  const [, setWarnings1] = useAtom(warnings1Atom);
  const [, setWarnings2] = useAtom(warnings2Atom);
  const [score1, setScore1] = useAtom(score1Atom);
  const [score2, setScore2] = useAtom(score2Atom);
  const [playoff, setPlayoff] = useAtom(playoffAtom);
  const [playoffTriathlon, setPlayoffTriathlon] = useAtom(playoffTriathlonAtom);
  const [isEnd, setIsEnd] = useAtom(isPoolEndAtom);
  const [showRank, setShowRank] = useState(false);
  const [triathlonStats, setTriathlonStats] = useState<TeamStats[]>();
  const [rank, setRank] = useAtom(rankParticipantsAtom);
  const [idsRD, setIdsRD] = useAtom(idsRDAtom);
  const [currentRound, setCurrentRound] = useAtom(currentRoundAtom);
  const [totalRounds] = useAtom(totalRoundsAtom);
  const [rating, setRating] = useState<TournamentResponse>();
  const [isRatingOpen, setIsRatingOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const isEndAll = !isEnd.includes(false);

  const isRound =
    tournamentSystem === TournamentSystem.HYBRID ||
    tournamentSystem === TournamentSystem.ROBIN ||
    tournamentSystem === TournamentSystem.SWISS;

  const headersRank = [
    t("name"),
    t("win"),
    t("losses"),
    t("draw"),
    t("score"),
    "RD",
    tournamentSystem === TournamentSystem.SWISS ? t("buchholz") : "",
  ].filter(Boolean);

  const headersTriathlonStats = [
    "ID",
    t("win"),
    t("draw"),
    t("score"),
    t("losses"),
    "RD",
    t("matchesCount"),
  ];

  const saveOnServer = async () => {
    if (currentTournament && currentNominationId && currentWeaponId) {
      setLoading(true);
      const matches = getMatchesFromDuels(
        duels[currentPoolIndex],
        currentPoolIndex,
      );
      if (tournamentSystem !== TournamentSystem.HYBRID) {
        const res = await processTournament(
          currentTournament.id,
          currentWeaponId,
          currentNominationId,
          winners.map((w) => w.id),
          matches,
          new Date(currentTournament.date),
        );
        setRating(res);
        if (currentPoolId) {
          await updatePoolEnd(currentPoolId, true);
        }
      } else {
        const isCreate = await createMatches(
          currentTournament.id,
          currentWeaponId,
          currentNominationId,
          matches,
        );
        if (currentPoolId) {
          await updatePoolEnd(currentPoolId, true);
        }
        if (isCreate) {
          Toast.show({
            type: "success",
            text1: t("success"),
            text2: t("saved"),
          });
        }
      }
      setLoading(false);
    }
  };

  const handlePlayoffPress = () => {
    if (tournamentSystem === TournamentSystem.TRIATHLON) {
      const pairs = getPlayoffTriathlonTeamsPairs(duels.flat(), teams.flat());
      setPlayoffTriathlon([pairs]);
    } else {
      setPlayoff(generatePlayoffPairs(duels, poolCountDelete, isPoolRating));
    }
  };

  const endTournament = (endFightersBuchholz?: { [id: string]: number }) => {
    let winnersArr: ParticipantType[] = new Array(3);
    if (tournamentSystem === TournamentSystem.ROBIN) {
      const { winners, ranking } = getWinnersRobin(
        getAllInOneParticipants([
          fighterPairs[currentPoolIndex],
          ...duels[currentPoolIndex],
        ]),
      );
      setRank(ranking);
      winnersArr = winners;
      setIdsRD(
        calculateAllRD([
          ...duels[currentPoolIndex],
          fighterPairs[currentPoolIndex],
        ]),
      );
    } else if (tournamentSystem === TournamentSystem.SWISS) {
      const all = getAllInOneParticipants(
        [fighterPairs[currentPoolIndex], ...duels[currentPoolIndex]],
        endFightersBuchholz,
      );
      const { winners, ranking } = getWinnersSwiss(all);
      setRank(ranking);
      winnersArr = winners;
      setIdsRD(
        calculateAllRD([
          ...duels[currentPoolIndex],
          fighterPairs[currentPoolIndex],
        ]),
      );
    } else if (tournamentSystem === TournamentSystem.OLYMPIC) {
      winnersArr = getTopThreeFighters([
        ...duels[currentPoolIndex],
        fighterPairs[currentPoolIndex],
      ]);
    }

    setFighterPairs((state) =>
      changeValueInStateArray(state, [], currentPoolIndex),
    );
    setWinners(winnersArr);
    setIsEnd((state) => changeValueInStateArray(state, true, currentPoolIndex));
  };

  const genPairs = async () => {
    if (tournamentSystem !== TournamentSystem.TRIATHLON) {
      const newFighters = !isRound
        ? (fighterPairs[currentPoolIndex]
            .map((pair) => {
              if (pair[0]?.name === "—") {
                return pair[1];
              } else if (pair[1]?.name === "—") {
                return pair[0];
              } else {
                return pair[0].wins > pair[1].wins
                  ? { ...pair[0], wins: 0, scores: 0 }
                  : { ...pair[1], wins: 0, scores: 0 };
              }
            })
            .filter(Boolean) as ParticipantType[])
        : fighterPairs[currentPoolIndex]
            .map((pair) => {
              if (tournamentSystem === TournamentSystem.SWISS) {
                const calculateBuchholz = (idx: number) => {
                  const allFighters = getAllInOneParticipants([
                    fighterPairs[currentPoolIndex],
                    ...duels[currentPoolIndex],
                  ]);
                  if (allFighters.length) {
                    return pair[idx].opponents.reduce((sum, opId) => {
                      const opponent = allFighters.find(
                        (fighter) => fighter.id === opId,
                      );
                      return sum + (opponent?.wins || 0);
                    }, 0);
                  }
                  return 0;
                };
                return [
                  {
                    ...pair[0],
                    wins: 0,
                    scores: 0,
                    buchholz: calculateBuchholz(0),
                  },
                  {
                    ...pair[1],
                    wins: 0,
                    scores: 0,
                    buchholz: calculateBuchholz(1),
                  },
                ];
              }
              return [
                { ...pair[0], wins: 0, scores: 0 },
                { ...pair[1], wins: 0, scores: 0 },
              ];
            })
            .flat();

      setDuels((prev) => {
        const buf = JSON.parse(JSON.stringify(prev));
        buf[currentPoolIndex].push(fighterPairs[currentPoolIndex]);
        return buf;
      });

      if (newFighters.length > 1) {
        const newPairs = generatePairs(
          newFighters,
          tournamentSystem,
          currentPoolIndex,
          setFighterPairs,
          setCurrentPairIndex,
          currentRound[currentPoolIndex],
          totalRounds[currentPoolIndex],
        );

        if (tournamentSystem === TournamentSystem.SWISS)
          setCurrentRound((state) => {
            const buf = [...state];
            buf[currentPoolIndex] += 1;
            return buf;
          });

        if (isRound) {
          const pairs = newPairs[currentPoolIndex].flat();
          if (
            pairs.filter((pair) => pair.name === "—").length ===
            pairs.filter((pair) => pair.name !== "—").length
          ) {
            endTournament(
              newFighters.reduce(
                (acc, user) => {
                  acc[user.id] = user.buchholz;
                  return acc;
                },
                {} as { [id: string]: number },
              ),
            );
          }
        }
      } else {
        endTournament();
      }
    } else {
      let copyDuels: [ParticipantType, ParticipantType][][][] = [];
      setDuels((prev) => {
        const buf = JSON.parse(JSON.stringify(prev));
        buf[currentPoolIndex].push([...fighterPairs[currentPoolIndex]]);
        copyDuels = JSON.parse(JSON.stringify(buf));
        return buf;
      });
      const twoTeams = getRandomTwoTeams(
        teams[currentPoolIndex],
        copyDuels[currentPoolIndex],
      );
      if (!twoTeams && teams.flat().length >= 7) {
        const pairsTeamsIds = getPlayoffTriathlonTeamsPairs(
          copyDuels[currentPoolIndex],
          teams[currentPoolIndex],
        );
        const allPlayoffTeamsIds = pairsTeamsIds
          .map((pair) => [pair[0].id, pair[1].id])
          .flat();
        setTeams((state) => {
          const buf = [...state];
          buf[currentPoolIndex] = buf[currentPoolIndex].map((s) => ({
            ...s,
            deactive: !allPlayoffTeamsIds.includes(s.id),
          }));
          return buf;
        });
      } else if (!twoTeams && teams.flat().length < 7) {
        const winners = getTriathlonWinnersFromDuels(
          copyDuels[currentPoolIndex],
          teams[currentPoolIndex],
        );
        const stats = getTeamStatsFromDuels(
          copyDuels[currentPoolIndex],
          teams[currentPoolIndex],
        );

        setTriathlonStats(stats);
        setWinners(winners.map((w) => ({ ...fighterDefault, name: w.name })));
      } else if (twoTeams) {
        const handleTeamSelect = teamSelect(
          teams[currentPoolIndex],
          currentTeamsIndexes[currentPoolIndex],
          participants,
          currentPoolIndex,
          setCurrentTeamsIndexes,
          setFighterPairs,
        );
        handleTeamSelect(twoTeams[0].id, "red", undefined, twoTeams[1].id);
      }

      if (!twoTeams) {
        setFighterPairs((state) =>
          changeValueInStateArray(state, [], currentPoolIndex),
        );
        setIsEnd((state) =>
          changeValueInStateArray(state, true, currentPoolIndex),
        );
      }
    }

    if (!isGroupBattle) {
      setDoubleHits(0);
      setProtests1(0);
      setProtests2(0);
      setWarnings1(0);
      setWarnings2(0);
      setScore1(0);
      setScore2(0);
      setCurrentPairIndex((state) =>
        changeValueInStateArray(state, 0, currentPoolIndex),
      );
    }
  };

  const getDataTable = (data: ParticipantType[][]) => {
    return data.map(([f1, f2]) => ({
      idRed: f1.id,
      nameRed: truncate(f1?.name || "", 20),
      scoreRed: f1.scores,
      hintRed: f1.weapon,
      hintBlue: f2.weapon,
      scoreBlue: f2.scores,
      nameBlue: truncate(f2?.name || "", 20),
      idBlue: f2.id,
    }));
  };

  const getDataRankTable = (data: ParticipantType[]) => {
    return {
      data: data
        .map((f) => [
          truncate(f.name || ""),
          f.wins.toString(),
          f.losses.toString(),
          f.draws.toString(),
          f.scores.toString(),
          idsRD.get(f.id)?.toString() || "",
          tournamentSystem === TournamentSystem.SWISS
            ? f.buchholz.toString()
            : "",
        ])
        .filter(Boolean),
    };
  };

  const getTriathlonDataRankTable = (data: TeamStats[]) => {
    return {
      data: data
        .map((stat) => [
          stat.teamId.toString(),
          stat.wins.toString(),
          stat.draws.toString(),
          stat.scoresFor.toString(),
          stat.scoresAgainst.toString(),
          String(stat.scoresFor - stat.scoresAgainst),
          stat.matchesCount.toString(),
        ])
        .filter((row) => row.some((cell) => cell !== "")),
    };
  };

  const isPoolInProgress =
    tournamentSystem === TournamentSystem.TRIATHLON
      ? !isAllTeamsPairsPlayedFromDuels(
          teams[currentPoolIndex],
          duels[currentPoolIndex],
        )
      : !isPoolEndByDuels(duels, currentPoolIndex);
  const sections = [
    ...(isPoolInProgress &&
    fighterPairs[currentPoolIndex]?.filter((p) => p.length).length
      ? [
          {
            key: "current",
            title: t("currentStage"),
            content: getDataTable(fighterPairs[currentPoolIndex]),
          },
        ]
      : []),
    ...(duels[currentPoolIndex] || []).map((duel, i) => ({
      key: `duel-${i}`,
      title: `${i + 1} ${t("stage")}`,
      content: getDataTable(duel),
    })),
  ];

  if (playoff.length || playoffTriathlon.length) {
    return (
      <Playoff isTriathlon={tournamentSystem === TournamentSystem.TRIATHLON} />
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Кнопка плей-офф */}
      {isEndAll &&
        (tournamentSystem === TournamentSystem.HYBRID ||
          (tournamentSystem === TournamentSystem.TRIATHLON &&
            teams.flat().length >= 7)) && (
          <Button
            title={t("playoff")}
            onPress={handlePlayoffPress}
            style={styles.fullButton}
          />
        )}

      {/* Победители */}
      {!!winners.length &&
        !isGroupBattle &&
        tournamentSystem !== TournamentSystem.HYBRID && (
          <View style={styles.winnersContainer}>
            <View style={styles.winnerCard}>
              <Text style={styles.winnerPlace}>2</Text>
              <Text style={styles.winnerName} numberOfLines={2}>
                {winners[1]?.name}
              </Text>
            </View>
            <View style={styles.firstCard}>
              <Text style={styles.firstPlace}>1</Text>
              <Text style={styles.firstName} numberOfLines={2}>
                {winners[0]?.name}
              </Text>
            </View>
            <View style={styles.winnerCard}>
              <Text style={styles.winnerPlace}>3</Text>
              <Text style={styles.winnerName} numberOfLines={2}>
                {winners[2]?.name}
              </Text>
            </View>
            {tournamentSystem !== TournamentSystem.OLYMPIC && (
              <TouchableOpacity
                style={styles.rankButton}
                onPress={() => setShowRank(true)}
              >
                <ChartColumn size={24} color={Colors.fg} />
              </TouchableOpacity>
            )}
          </View>
        )}

      {/* Победитель группового этапа */}
      {!!winners.length &&
        isGroupBattle &&
        tournamentSystem !== TournamentSystem.HYBRID && (
          <View style={styles.groupWinnerContainer}>
            <Text style={styles.groupWinnerText}>
              🏆 {score1 > score2 ? t("redTeam") : t("blueTeam")} 🏆
            </Text>
          </View>
        )}

      {/* Секции с дуэлями */}
      {sections.map((item, index) => {
        const isFirstStage = index === 0;
        const hasPairs = fighterPairs[currentPoolIndex]?.filter(
          (p) => p.length,
        ).length;
        const isStageEndDisabled =
          fighterPairs[currentPoolIndex]?.filter(
            (pair) => pair[0].name !== "—" && pair[1].name !== "—",
          ).length !==
          fighterPairs[currentPoolIndex]?.filter(
            (pair) =>
              (pair[0].wins || pair[1].wins) &&
              pair[0].name !== "—" &&
              pair[1].name !== "—",
          ).length;

        return (
          <View key={item.key} style={styles.duelWrap}>
            <Text style={styles.duelTitle}>{item.title}</Text>
            <FightersScores data={item.content} withoutLinks />

            {isFirstStage && hasPairs && isPoolInProgress && !isEndAll && (
              <Button
                title={t("stageEnd")}
                onPress={genPairs}
                disabled={isStageEndDisabled}
                style={styles.stageButton}
              />
            )}
          </View>
        );
      })}

      {/* Кнопка экспорта */}
      <Button
        title={t("save")}
        onPress={() =>
          exportExcel(
            duels[currentPoolIndex],
            `${t("pool")} ${currentPoolIndex + 1}.xlsx`,
            undefined,
            tournamentSystem === TournamentSystem.TRIATHLON
              ? teams[currentPoolIndex]
              : undefined,
          )
        }
        disabled={!duels[currentPoolIndex]?.length}
        style={styles.fullButton}
      >
        <Save size={20} color={Colors.fg} />
      </Button>

      {/* Кнопка сохранения на сервер */}
      {!!winners.length &&
        currentTournament &&
        currentNominationId &&
        currentWeaponId && (
          <Button
            title={t("saveToServer")}
            onPress={saveOnServer}
            loading={loading}
            style={[styles.fullButton, styles.marginTop]}
          >
            <HardDriveUpload size={20} color={Colors.fg} />
          </Button>
        )}

      {/* Модальное окно с рангом */}
      <ModalWindow isOpen={showRank} onClose={() => setShowRank(false)}>
        {(() => {
          const content = triathlonStats
            ? getTriathlonDataRankTable(triathlonStats)
            : getDataRankTable(rank);
          return (
            <Table
              data={content.data}
              titles={triathlonStats ? headersTriathlonStats : headersRank}
            />
          );
        })()}
      </ModalWindow>

      {/* Модальное окно с рейтингом */}
      <ModalWindow
        isOpen={isRatingOpen && !!rating}
        onClose={() => setIsRatingOpen(false)}
      >
        <View style={styles.modalContent}>
          {rating && (
            <Table
              titles={[
                t("name"),
                t("matchesCount"),
                t("rankChange"),
                t("newRank"),
                "RD",
                t("ratingChange"),
                t("newRating"),
              ]}
              data={rating.results.map((res) => [
                res.user.username,
                String(res.matchesPlayed),
                String(res.rankChange),
                String(res.newRank),
                String(res.newRd),
                String(res.ratingChange),
                String(res.newRating),
              ])}
            />
          )}
        </View>
      </ModalWindow>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  contentContainer: {
    padding: 16,
    paddingTop: 50,
    paddingBottom: 90,
  },
  fullButton: {
    width: "100%",
    marginBottom: 8,
  },
  marginTop: {
    marginTop: 8,
  },
  winnersContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 30,
    marginBottom: 24,
    marginTop: 10,
    position: "relative",
  },
  winnerCard: {
    alignItems: "center",
    width: 100,
  },
  winnerPlace: {
    color: Colors.fg,
    fontFamily: Fonts.bold,
    marginBottom: 8,
  },
  winnerName: {
    color: Colors.fg,
    textAlign: "center",
    fontFamily: Fonts.regular,
  },
  firstCard: {
    alignItems: "center",
    width: 120,
    marginTop: -30,
  },
  firstPlace: {
    fontSize: 32,
    color: Colors.accent,
    fontFamily: Fonts.bold,
    marginBottom: 8,
  },
  firstName: {
    color: Colors.accent,
    textAlign: "center",
    fontFamily: Fonts.bold,
  },
  rankButton: {
    position: "absolute",
    right: 0,
    padding: 8,
  },
  groupWinnerContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  groupWinnerText: {
    color: Colors.accent,
    textAlign: "center",
    fontFamily: Fonts.bold,
  },
  duelWrap: {
    gap: 10,
    marginBottom: 20,
  },
  duelTitle: {
    color: Colors.fg,
    textAlign: "center",
    marginBottom: 16,
    fontFamily: Fonts.bold,
  },
  stageButton: {
    marginTop: 8,
  },
  modalContent: {
    width: width - 64,
  },
});
