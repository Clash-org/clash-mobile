import { useAtom } from "jotai";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import Button from "@/components/ui/Button";
import Counter from "@/components/ui/Counter";
import ModalWindow from "@/components/ui/ModalWindow";
import SelectPair from "@/components/ui/SelectPair";
import VideoRecorder from "@/components/ui/VideoRecorder";
import { Colors, Fonts } from "@/constants";
import useBellSound from "@/hooks/useBellSound";
import {
  currentPairIndexAtom,
  currentPoolIndexAtom,
  doubleHitsAtom,
  fighterPairsAtom,
  fightTimeAtom,
  historyAtom,
  hitZonesAtom,
  isGroupBattleAtom,
  isPoolEndAtom,
  isRecordVideoTimerStartAtom,
  isReverseSidesAtom,
  isRunningAtom,
  playoffAtom,
  playoffIndexAtom,
  playoffMatchIndexAtom,
  playoffTriathlonAtom,
  protests1Atom,
  protests2Atom,
  score1Atom,
  score2Atom,
  virtualPairIndexAtom,
  virtualPoolIndexAtom,
  warnings1Atom,
  warnings2Atom,
} from "@/store";
import { ParticipantType } from "@/typings";
import {
  changeValueInStateArray,
  formatTime,
  truncateFullName,
} from "@/utils/helpers";
import { incWin } from "@/utils/incWin";
import {
  ChevronsRight,
  Eye,
  EyeClosed,
  History,
  Medal,
  Minus,
  Pause,
  Play,
  Plus,
  RefreshCw,
  UsersRound,
} from "lucide-react-native";
import Toast from "react-native-toast-message";

export default function FightScreen() {
  const { t } = useTranslation();
  const { playSound, stopSound } = useBellSound();
  const [isGroupBattle] = useAtom(isGroupBattleAtom);
  const [isReverseSides] = useAtom(isReverseSidesAtom);
  const [isRecordVideoTimerStart] = useAtom(isRecordVideoTimerStartAtom);
  const [currentPairIndex, setCurrentPairIndex] = useAtom(currentPairIndexAtom);
  const [currentPoolIndex] = useAtom(currentPoolIndexAtom);
  const [virtualPairIndex, setVirtualPairIndex] = useAtom(virtualPairIndexAtom);
  const [virtualPoolIndex] = useAtom(virtualPoolIndexAtom);
  const [isRunning, setIsRunning] = useAtom(isRunningAtom);
  const [hitZones] = useAtom(hitZonesAtom);
  const [fightTime] = useAtom(fightTimeAtom);
  const [doubleHits, setDoubleHits] = useAtom(doubleHitsAtom);
  const [protests1, setProtests1] = useAtom(protests1Atom);
  const [protests2, setProtests2] = useAtom(protests2Atom);
  const [warnings1, setWarnings1] = useAtom(warnings1Atom);
  const [warnings2, setWarnings2] = useAtom(warnings2Atom);
  const [score1, setScore1] = useAtom(score1Atom);
  const [score2, setScore2] = useAtom(score2Atom);
  const [isPoolEnd] = useAtom(isPoolEndAtom);
  const isPlayoff = !isPoolEnd.includes(false);
  const [playoff, setPlayoff] = useAtom(playoffAtom);
  const [playoffTriathlon, setPlayoffTriathlon] = useAtom(playoffTriathlonAtom);
  const [fighterPairs, setFighterPairs] = useAtom(fighterPairsAtom);
  const [history, setHistory] = useAtom(historyAtom);
  const [playoffIndex] = useAtom(playoffIndexAtom);
  const [playoffMatchIndex] = useAtom(playoffMatchIndexAtom);
  const isTriathlon = !!playoffTriathlon.length;

  const [isOpen, setIsOpen] = useState(false);
  const [isHistory, setIsHistory] = useState(false);
  const [timeLeft, setTimeLeft] = useState(fightTime);
  const [isFinished, setIsFinished] = useState(false);
  const [score1Local, setScore1Local] = useState(0);
  const [score2Local, setScore2Local] = useState(0);
  const [isWarningsShow, setIsWarningsShow] = useState(true);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevPairIndexRef = useRef(currentPairIndex);
  const prevVirtualPairIndexRef = useRef(virtualPairIndex);
  const prevScore1Ref = useRef(score1);
  const prevScore2Ref = useRef(score2);
  const teams = isTriathlon
    ? (playoffTriathlon[playoffIndex] ?? []).map((t) => t.flat())
    : undefined;
  const participants = teams
    ? teams?.map((teamArr) => teamArr.map((t) => t.members ?? [])).flat()
    : [];
  const triathlonFighterPairs = (
    isTriathlon
      ? (playoffTriathlon[playoffIndex] ?? []).map(
          (teamsPairs) =>
            teamsPairs?.[0]?.members.map((m, idx) => [
              m,
              teamsPairs?.[1]?.members[idx],
            ]) ?? [],
        )
      : []
  ) as [ParticipantType, ParticipantType][][];

  const getFighterData = () => {
    let name1 = "",
      name2 = "",
      id1 = "",
      id2 = "";

    try {
      if (isPlayoff) {
        if (playoffTriathlon[0].length) {
          const pair = playoffTriathlon[playoffIndex][playoffMatchIndex];
          const pointer = virtualPairIndex[virtualPoolIndex];
          const fighter1 = pair[0].members[pointer];
          const fighter2 = pair[1].members[pointer];
          name1 = fighter1?.name || "";
          name2 = fighter2?.name || "";
          id1 = String(fighter1?.id || "");
          id2 = String(fighter2?.id || "");
        } else if (playoff?.[playoffIndex]?.[playoffMatchIndex]?.[0]) {
          const fighter1 = playoff[playoffIndex][playoffMatchIndex][0];
          const fighter2 = playoff[playoffIndex][playoffMatchIndex][1];
          name1 = fighter1?.name || "";
          name2 = fighter2?.name || "";
          id1 = String(fighter1?.id || "");
          id2 = String(fighter2?.id || "");
        }
      } else {
        const currentIndex = currentPairIndex[currentPoolIndex];
        if (fighterPairs?.[currentPoolIndex]?.[currentIndex]?.[0]) {
          const fighter1 = fighterPairs[currentPoolIndex][currentIndex]?.[0];
          const fighter2 = fighterPairs[currentPoolIndex][currentIndex]?.[1];
          name1 = fighter1?.name || "";
          name2 = fighter2?.name || "";
          id1 = fighter1?.id || "";
          id2 = fighter2?.id || "";
        }
      }
    } catch {}

    return {
      redName: name1,
      blueName: name2,
      fighterId1: id1,
      fighterId2: id2,
    };
  };

  const { redName, blueName, fighterId1, fighterId2 } = getFighterData();
  let nextRedName =
    (isTriathlon
      ? triathlonFighterPairs[virtualPoolIndex]?.[
          virtualPairIndex[virtualPoolIndex] + 1
        ]?.[0]?.name
      : fighterPairs[currentPoolIndex]?.[
          currentPairIndex[currentPoolIndex] + 1
        ]?.[0]?.name) || "";
  let nextBlueName = isTriathlon
    ? triathlonFighterPairs[virtualPoolIndex]?.[
        virtualPairIndex[virtualPoolIndex] + 1
      ]?.[1]?.name
    : fighterPairs[currentPoolIndex]?.[
        currentPairIndex[currentPoolIndex] + 1
      ]?.[1]?.name || "";
  if (nextRedName === "—" || nextBlueName === "—") {
    nextRedName = "";
    nextBlueName = "";
  }

  const fightStop = useCallback(async () => {
    setIsRunning(false);
    const isDraw = score1 === score2;

    const changePlayoffScores = () => {
      if (isTriathlon) {
        setPlayoffTriathlon((state) => {
          const buf = [...state];
          const currentTeamsPair = buf[playoffIndex][playoffMatchIndex];
          for (const [idx, pair] of [
            currentTeamsPair,
            currentTeamsPair,
          ].entries()) {
            const team = pair[idx];
            const newMembers = team.members.map((m) => {
              if (m.id === fighterId1) {
                return {
                  ...m,
                  scores: score1,
                  wins: score1 > score2 ? m.wins + 1 : 0,
                  protests: protests1,
                  warnings: warnings1,
                  doubleHits,
                };
              } else if (m.id === fighterId2) {
                return {
                  ...m,
                  scores: score2,
                  wins: score2 > score1 ? m.wins + 1 : 0,
                  protests: protests2,
                  warnings: warnings2,
                  doubleHits,
                };
              }

              return m;
            });
            buf[playoffIndex][playoffMatchIndex][idx] = {
              ...team,
              members: newMembers,
              scores: newMembers.reduce(
                (sum, fighter) => sum + fighter.scores,
                0,
              ),
            };
          }

          return buf;
        });
      } else {
        setPlayoff((state) => {
          const buf = [...state];
          const [p1, p2] = buf[playoffIndex][playoffMatchIndex];

          buf[playoffIndex][playoffMatchIndex] = [
            {
              ...p1,
              scores: score1,
              wins: score1 > score2 ? 1 : 0,
              differenceWinsLosses: score1 - score2,
              ratioWinsLosses: score1 / score2,
              protests: protests1,
              warnings: warnings1,
              doubleHits,
            },
            {
              ...p2,
              scores: score2,
              wins: score1 < score2 ? 1 : 0,
              differenceWinsLosses: score2 - score1,
              ratioWinsLosses: score2 / score1,
              protests: protests2,
              warnings: warnings2,
              doubleHits,
            },
          ];
          return buf;
        });
      }
    };

    if (!isDraw) {
      if (score1 > score2) {
        if (isPlayoff) {
          changePlayoffScores();
        } else {
          incWin(
            score1,
            fighterId1,
            fighterId2,
            currentPairIndex[currentPoolIndex],
            currentPoolIndex,
            setFighterPairs,
            warnings1,
            protests1,
            doubleHits,
          );
          incWin(
            score2,
            fighterId2,
            fighterId1,
            currentPairIndex[currentPoolIndex],
            currentPoolIndex,
            setFighterPairs,
            warnings2,
            protests2,
            doubleHits,
            true,
          );
        }
      } else {
        if (isPlayoff) {
          changePlayoffScores();
        } else {
          incWin(
            score2,
            fighterId2,
            fighterId1,
            currentPairIndex[currentPoolIndex],
            currentPoolIndex,
            setFighterPairs,
            warnings2,
            protests2,
            doubleHits,
          );
          incWin(
            score1,
            fighterId1,
            fighterId2,
            currentPairIndex[currentPoolIndex],
            currentPoolIndex,
            setFighterPairs,
            warnings1,
            protests1,
            doubleHits,
            true,
          );
        }
      }
    } else {
      if (!isPlayoff) {
        incWin(
          score1,
          fighterId1,
          fighterId2,
          currentPairIndex[currentPoolIndex],
          currentPoolIndex,
          setFighterPairs,
          warnings1,
          protests1,
          doubleHits,
          false,
          1,
        );
        incWin(
          score2,
          fighterId2,
          fighterId1,
          currentPairIndex[currentPoolIndex],
          currentPoolIndex,
          setFighterPairs,
          warnings2,
          protests2,
          doubleHits,
          false,
          1,
        );
      }
    }

    const winnerName =
      score1 > score2
        ? isGroupBattle
          ? t("redTeam")
          : redName
        : isGroupBattle
          ? t("blueTeam")
          : blueName;
    setIsFinished(true);

    Toast.show({
      type: "success",
      text1: isDraw ? t("draw") : `${t("win")}: ${winnerName}`,
    });
  }, [
    score1,
    score2,
    isRunning,
    isPlayoff,
    isGroupBattle,
    redName,
    blueName,
    fighterId1,
    fighterId2,
    currentPairIndex,
    currentPoolIndex,
    setFighterPairs,
    warnings1,
    protests1,
    doubleHits,
    warnings2,
    protests2,
    setPlayoff,
    playoffIndex,
    playoffMatchIndex,
    setIsRunning,
    setIsFinished,
    t,
  ]);

  // Таймер
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((leftTime) => {
          const next = leftTime - 1;

          if (next === 15) {
            Toast.show({
              type: "info",
              text1: t("last15seconds"),
              visibilityTime: 2000,
            });
          }

          if (next === 0) {
            playSound();
            fightStop();
            return fightTime;
          }
          return next;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, fightStop, playSound, fightTime, t]);

  const resetFight = useCallback(() => {
    if (!isGroupBattle) {
      setScore1(0);
      setScore2(0);
      setProtests1(0);
      setProtests2(0);
      setWarnings1(0);
      setWarnings2(0);
      setDoubleHits(0);
    }
    setScore1Local(0);
    setScore2Local(0);
    setTimeLeft(fightTime);
    setIsRunning(false);
    setHistory([]);
    setIsFinished(false);
    stopSound();
  }, [
    isGroupBattle,
    setScore1,
    setScore2,
    setProtests1,
    setProtests2,
    setWarnings1,
    setWarnings2,
    setDoubleHits,
    fightTime,
    setIsRunning,
    setHistory,
    setIsFinished,
    stopSound,
  ]);

  const addPoints = useCallback(
    (
      setter: React.Dispatch<React.SetStateAction<number>>,
      zone: keyof typeof hitZones,
    ) => {
      const p = hitZones[zone];
      setter((s: number) => s + p);
    },
    [hitZones],
  );

  const removePoints = useCallback(
    (setter: React.Dispatch<React.SetStateAction<number>>) => {
      setter((s: number) => s - 1);
    },
    [],
  );

  useEffect(() => {
    // Отменяем предыдущий таймер
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Если счёт изменился
    if (score1 !== prevScore1Ref.current || score2 !== prevScore2Ref.current) {
      prevScore1Ref.current = score1;
      prevScore2Ref.current = score2;

      // Устанавливаем новый таймер с задержкой 500мс
      timeoutRef.current = setTimeout(() => {
        setHistory((prev) => {
          // Проверяем, не было ли уже такой записи (чтобы избежать дублей)
          const lastEntry = prev[prev.length - 1];
          if (lastEntry?.score1 === score1 && lastEntry?.score2 === score2) {
            return prev;
          }
          return [...prev, { score1, score2 }];
        });
      }, 500); // Уменьшил с 3000 до 500
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [score1, score2, setHistory]);

  useEffect(() => {
    setTimeLeft(fightTime);
  }, [fightTime]);

  useEffect(() => {
    if (
      prevPairIndexRef.current[currentPoolIndex] !==
        currentPairIndex[currentPoolIndex] ||
      prevVirtualPairIndexRef.current[virtualPoolIndex] !==
        virtualPairIndex[virtualPoolIndex]
    ) {
      resetFight();
    }
    prevPairIndexRef.current = currentPairIndex;
    prevVirtualPairIndexRef.current = virtualPairIndex;
  }, [
    currentPairIndex,
    currentPoolIndex,
    virtualPairIndex,
    virtualPoolIndex,
    resetFight,
  ]);

  const fighterData = [
    {
      name: redName,
      score: score1,
      setScore: setScore1,
      setLocalScore: isGroupBattle ? setScore1Local : undefined,
      protests: protests1,
      setProtests: setProtests1,
      warnings: warnings1,
      setWarnings: setWarnings1,
      side: "red" as const,
    },
    {
      name: blueName,
      score: score2,
      setScore: setScore2,
      setLocalScore: isGroupBattle ? setScore2Local : undefined,
      protests: protests2,
      setProtests: setProtests2,
      warnings: warnings2,
      setWarnings: setWarnings2,
      side: "blue" as const,
    },
  ];

  return (
    <View style={[styles.container, isReverseSides && styles.reverse]}>
      {isRecordVideoTimerStart && (
        <VideoRecorder
          isRecording={isRunning}
          currentTime={formatTime(timeLeft)}
          setStartRecording={setIsRunning}
        />
      )}
      <TouchableOpacity
        onPress={() => setIsWarningsShow(!isWarningsShow)}
        style={[styles.controlButton, styles.warningsArrow]}
      >
        {isWarningsShow ? (
          <Eye color={Colors.fg} size={25} />
        ) : (
          <EyeClosed color={Colors.fg} size={25} />
        )}
      </TouchableOpacity>
      {fighterData.map((data, i) => (
        <View
          key={i}
          style={[styles.side, data.side === "red" ? styles.red : styles.blue]}
        >
          <Text style={styles.name}>
            {truncateFullName(String(data.name), 19)
              .split(" ")
              .map((line, idx) => (
                <Text key={idx}>
                  {line}
                  {"\n"}
                </Text>
              ))}
          </Text>
          <View style={styles.plusMinusWrap}>
            {isGroupBattle && data.side === "red" ? (
              <Text style={[styles.scoreLocal, { left: 100 }]}>
                {score1Local}
              </Text>
            ) : (
              <></>
            )}
            <Text style={styles.score}>{data.score}</Text>
            {isGroupBattle && data.side === "blue" ? (
              <Text style={[styles.scoreLocal, { left: -30 }]}>
                {score2Local}
              </Text>
            ) : (
              <></>
            )}
          </View>

          {Object.entries(hitZones).map(([zone, pts]) => (
            <TouchableOpacity
              key={`${i}-${zone}`}
              style={styles.zoneBtn}
              onPress={() => {
                addPoints(data.setScore, zone as keyof typeof hitZones);
                if (data.setLocalScore)
                  addPoints(data.setLocalScore, zone as keyof typeof hitZones);
              }}
            >
              <Text style={styles.zoneTxt}>
                {t(zone)} (+{pts})
              </Text>
            </TouchableOpacity>
          ))}

          <View style={styles.plusMinusWrap}>
            <TouchableOpacity
              style={[styles.zoneBtn, styles.zoneBtnZero]}
              onPress={() => {
                removePoints(data.setScore);
                if (data.setLocalScore) removePoints(data.setLocalScore);
              }}
            >
              <Minus size={28} color={Colors.fg} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.zoneBtn, styles.zoneBtnZero]}
              onPress={() => {
                data.setScore((s) => s + 1);
                if (data.setLocalScore) data.setLocalScore((s) => s + 1);
              }}
            >
              <Plus size={28} color={Colors.fg} />
            </TouchableOpacity>
          </View>

          {isWarningsShow && (
            <View style={styles.warnings}>
              <Counter
                label={t("protests")}
                value={data.protests}
                onInc={data.setProtests}
                onDec={data.setProtests}
              />
              <Counter
                label={t("warnings")}
                value={data.warnings}
                onInc={data.setWarnings}
                onDec={data.setWarnings}
              />
            </View>
          )}
        </View>
      ))}

      <View style={styles.bottomBar}>
        {isFinished && nextRedName && nextBlueName && (
          <View style={styles.nextPairButton}>
            <Button
              style={{ minWidth: 60 }}
              onPress={() =>
                isTriathlon
                  ? setVirtualPairIndex((state) =>
                      changeValueInStateArray(
                        state,
                        state[virtualPoolIndex] + 1,
                        virtualPoolIndex,
                      ),
                    )
                  : setCurrentPairIndex((state) => {
                      const buf = [...state];
                      buf[currentPoolIndex] =
                        fighterPairs[currentPoolIndex].length >
                        buf[currentPoolIndex] + 1
                          ? buf[currentPoolIndex] + 1
                          : buf[currentPoolIndex];
                      return buf;
                    })
              }
            >
              <ChevronsRight size={20} color={Colors.fg} />
            </Button>
          </View>
        )}

        <View style={styles.doubleHits}>
          <Counter
            label={t("doubleHits")}
            value={doubleHits}
            onInc={setDoubleHits}
            onDec={setDoubleHits}
          />
        </View>

        <View style={styles.timerWrap}>
          <TouchableOpacity
            style={styles.timerButton}
            onPress={() => setTimeLeft((state) => Math.max(0, state - 1))}
          >
            <Text style={styles.timerButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.timer}>{formatTime(timeLeft)}</Text>
          <TouchableOpacity
            style={styles.timerButton}
            onPress={() => setTimeLeft((state) => state + 10)}
          >
            <Text style={styles.timerButtonText}>+10</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => {
              setIsRunning(false);
              setTimeLeft(fightTime);
            }}
          >
            <RefreshCw size={28} color={Colors.fg} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setIsOpen(true)}
          >
            <UsersRound size={28} color={Colors.fg} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setIsRunning(!isRunning)}
          >
            {isRunning ? (
              <Pause size={28} color={Colors.fg} />
            ) : (
              <Play size={28} color={Colors.fg} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setIsHistory(true)}
          >
            <History size={28} color={Colors.fg} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={fightStop}>
            <Medal size={28} color={Colors.fg} />
          </TouchableOpacity>
        </View>
      </View>

      <ModalWindow isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <SelectPair
          deleteEmptyPairs
          fighterPairs={isTriathlon ? triathlonFighterPairs : fighterPairs}
          poolIndex={isTriathlon ? virtualPoolIndex : currentPoolIndex}
          currentPairIndex={
            isTriathlon
              ? virtualPairIndex[virtualPoolIndex]
              : currentPairIndex[currentPoolIndex]
          }
          selectPair={(idx) =>
            (isTriathlon ? setVirtualPairIndex : setCurrentPairIndex)((state) =>
              changeValueInStateArray(
                state,
                idx,
                isTriathlon ? virtualPoolIndex : currentPoolIndex,
              ),
            )
          }
          participants={participants}
          teams={isTriathlon ? teams : undefined}
        />
      </ModalWindow>

      <ModalWindow isOpen={isHistory} onClose={() => setIsHistory(false)}>
        <ScrollView style={styles.historyContainer}>
          {history.map((his, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.historyItem}
              onPress={() => {
                setScore1(his.score1);
                setScore2(his.score2);
                setIsHistory(false);
              }}
            >
              <Text style={styles.historyIndex}>{idx + 1}.</Text>
              <Text style={styles.historyScore}>
                {his.score1} : {his.score2}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ModalWindow>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: Colors.bg,
  },
  side: {
    flex: 1,
    paddingTop: 40,
    alignItems: "center",
  },
  reverse: {
    flexDirection: "row-reverse",
  },
  red: {
    backgroundColor: "#8B0000",
  },
  blue: {
    backgroundColor: "#00008B",
  },
  name: {
    color: Colors.fg,
    fontSize: 21,
    fontFamily: Fonts.bold,
    textAlign: "center",
    lineHeight: 25,
  },
  score: {
    color: Colors.fg,
    fontSize: 48,
    lineHeight: 55,
    fontFamily: Fonts.bold,
    marginTop: -20,
    width: 100,
    textAlign: "center",
  },
  scoreLocal: {
    color: Colors.fg,
    fontSize: 28,
    fontFamily: Fonts.bold,
    marginTop: -10,
    position: "absolute",
    opacity: 0.5,
  },
  plusMinusWrap: {
    display: "flex",
    flexDirection: "row",
    position: "relative",
    gap: 5,
  },
  zoneBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginVertical: 4,
    minWidth: 120,
    alignItems: "center",
  },
  zoneBtnZero: {
    minWidth: "auto",
    paddingHorizontal: 13,
  },
  zoneTxt: {
    fontFamily: Fonts.regular,
    color: Colors.fg,
    fontSize: 14,
  },
  warnings: {
    justifyContent: "space-around",
    width: "100%",
    marginTop: 0,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 7,
    alignItems: "center",
    backgroundColor: Colors.bg,
  },
  nextPairButton: {
    position: "absolute",
    right: 12,
    top: 30,
  },
  doubleHits: {
    width: "75%",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: -4,
  },
  timerWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  timerButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    minWidth: 50,
    alignItems: "center",
  },
  timerButtonText: {
    fontFamily: Fonts.bold,
    color: Colors.fg,
    fontSize: 14,
  },
  timer: {
    color: Colors.fg,
    fontSize: 36,
    fontFamily: Fonts.bold,
    minWidth: 90,
    textAlign: "center",
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    gap: 15,
    paddingHorizontal: 10,
  },
  controlButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 12,
    minWidth: 60,
    alignItems: "center",
  },
  historyContainer: {
    maxHeight: 300,
    padding: 16,
  },
  historyItem: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.placeholder,
  },
  historyIndex: {
    color: Colors.placeholder,
    width: 30,
  },
  historyScore: {
    color: Colors.fg,
    fontSize: 16,
    fontFamily: Fonts.regular,
  },
  warningsArrow: {
    position: "absolute",
    left: "50%",
    transform: [{ translateX: "-50%" }],
    top: "61.5%",
    zIndex: 10,
    backgroundColor: Colors.surface2,
    minWidth: 50,
  },
});
