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
  isRunningAtom,
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
import { formatTime, truncateFullName } from "@/utils/helpers";
import { incWin } from "@/utils/incWin";
import {
  ChevronsRight,
  History,
  Medal,
  Minus,
  Pause,
  Play,
  RefreshCw,
  UsersRound,
} from "lucide-react-native";
import Toast from "react-native-toast-message";

export default function FightScreen() {
  const { t } = useTranslation();
  const { playSound, stopSound } = useBellSound();
  const [isGroupBattle] = useAtom(isGroupBattleAtom);
  const [currentPairIndex, setCurrentPairIndex] = useAtom(currentPairIndexAtom);
  const [currentPoolIndex] = useAtom(currentPoolIndexAtom);
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
  const [fighterPairs, setFighterPairs] = useAtom(fighterPairsAtom);
  const [history, setHistory] = useAtom(historyAtom);
  const [playoffIndex] = useAtom(playoffIndexAtom);
  const [playoffMatchIndex] = useAtom(playoffMatchIndexAtom);

  const [isOpen, setIsOpen] = useState(false);
  const [isHistory, setIsHistory] = useState(false);
  const [timeLeft, setTimeLeft] = useState(fightTime);
  const [winner, setWinner] = useState("");
  const [isFinished, setIsFinished] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevPairIndexRef = useRef(currentPairIndex);

  const getFighterData = () => {
    let name1 = "",
      name2 = "",
      id1 = "",
      id2 = "";

    try {
      if (isPlayoff) {
        if (playoff?.[playoffIndex]?.[playoffMatchIndex]?.[0]) {
          name1 = playoff[playoffIndex][playoffMatchIndex][0]?.name || "";
          name2 = playoff[playoffIndex][playoffMatchIndex][1]?.name || "";
          id1 = playoff[playoffIndex][playoffMatchIndex][0]?.id || "";
          id2 = playoff[playoffIndex][playoffMatchIndex][1]?.id || "";
        }
      } else {
        const currentIndex = currentPairIndex[currentPoolIndex];
        if (fighterPairs?.[currentPoolIndex]?.[currentIndex]?.[0]) {
          name1 = fighterPairs[currentPoolIndex][currentIndex]?.[0]?.name || "";
          name2 = fighterPairs[currentPoolIndex][currentIndex]?.[1]?.name || "";
          id1 = fighterPairs[currentPoolIndex][currentIndex]?.[0]?.id || "";
          id2 = fighterPairs[currentPoolIndex][currentIndex]?.[1]?.id || "";
        }
      }
    } catch (e) {
      console.error("Ошибка получения данных бойцов:", e);
    }

    return {
      redName: name1,
      blueName: name2,
      fighterId1: id1,
      fighterId2: id2,
    };
  };

  const { redName, blueName, fighterId1, fighterId2 } = getFighterData();
  let nextRedName =
    fighterPairs[currentPoolIndex]?.[
      currentPairIndex[currentPoolIndex] + 1
    ]?.[0]?.name || "";
  let nextBlueName =
    fighterPairs[currentPoolIndex]?.[
      currentPairIndex[currentPoolIndex] + 1
    ]?.[1]?.name || "";
  if (nextRedName === "—" || nextBlueName === "—") {
    nextRedName = "";
    nextBlueName = "";
  }

  const fightStop = async () => {
    setIsRunning(false);
    const isDraw = score1 === score2;

    const changePlayoffScores = () => {
      setPlayoff((state) => {
        const buf = [...state];
        buf[playoffIndex][playoffMatchIndex][0] = {
          ...buf[playoffIndex][playoffMatchIndex][0],
          scores: score1,
          wins: score1 > score2 ? 1 : 0,
          differenceWinsLosses: score1 - score2,
        };
        buf[playoffIndex][playoffMatchIndex][1] = {
          ...buf[playoffIndex][playoffMatchIndex][1],
          scores: score2,
          wins: score1 < score2 ? 1 : 0,
          differenceWinsLosses: score2 - score1,
        };
        return buf;
      });
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
    setWinner(winnerName);
    setIsFinished(true);

    Toast.show({
      type: "success",
      text1: isDraw ? t("draw") : `${t("win")}: ${winnerName}`,
    });
  };

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
  }, [isRunning, timeLeft]);

  const resetFight = () => {
    if (!isGroupBattle) {
      setScore1(0);
      setScore2(0);
      setProtests1(0);
      setProtests2(0);
      setWarnings1(0);
      setWarnings2(0);
    }
    setDoubleHits(0);
    setTimeLeft(fightTime);
    setIsRunning(false);
    setHistory([]);
    setIsFinished(false);
    setWinner("");
    stopSound();
  };

  const addPoints = useCallback(
    (
      setter: React.Dispatch<React.SetStateAction<number>>,
      zone: keyof typeof hitZones,
    ) => {
      const p = hitZones[zone];
      setter((s: number) => s + p);
    },
    [hitZones, isGroupBattle],
  );

  const removePoints = (
    setter: React.Dispatch<React.SetStateAction<number>>,
  ) => {
    setter((s: number) => Math.max(0, s - 1));
  };

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (score1 !== 0 || score2 !== 0) {
      timeoutRef.current = setTimeout(() => {
        setHistory((prev) => [...prev, { score1, score2 }]);
      }, 3000);
    }
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [score1, score2]);

  useEffect(() => {
    setTimeLeft(fightTime);
  }, [fightTime]);

  useEffect(() => {
    if (
      prevPairIndexRef.current[currentPoolIndex] !==
      currentPairIndex[currentPoolIndex]
    ) {
      resetFight();
    }
    prevPairIndexRef.current = currentPairIndex;
  }, [currentPairIndex, currentPoolIndex]);

  const fighterData = [
    {
      name: redName,
      score: score1,
      setScore: setScore1,
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
      protests: protests2,
      setProtests: setProtests2,
      warnings: warnings2,
      setWarnings: setWarnings2,
      side: "blue" as const,
    },
  ];

  return (
    <View style={styles.container}>
      {/* Левая и правая половины */}
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
          <Text style={styles.score}>{data.score}</Text>

          {Object.entries(hitZones).map(([zone, pts]) => (
            <TouchableOpacity
              key={`${i}-${zone}`}
              style={styles.zoneBtn}
              onPress={() =>
                addPoints(data.setScore, zone as keyof typeof hitZones)
              }
            >
              <Text style={styles.zoneTxt}>
                {t(zone)} (+{pts})
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.zoneBtn}
            onPress={() => removePoints(data.setScore)}
          >
            <Minus size={28} color={Colors.fg} />
          </TouchableOpacity>

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
        </View>
      ))}

      {/* Нижняя панель */}
      <View style={styles.bottomBar}>
        {isFinished && nextRedName && nextBlueName && (
          <View style={styles.nextPairButton}>
            <Button
              style={{ minWidth: 60 }}
              onPress={() =>
                setCurrentPairIndex((state) => {
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

      {/* Модальные окна */}
      <ModalWindow isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <SelectPair
          deleteEmptyPairs
          fighterPairs={fighterPairs}
          poolIndex={currentPoolIndex}
          currentPairIndex={currentPairIndex[currentPoolIndex]}
          selectPair={(idx) =>
            setCurrentPairIndex((state) => {
              const buf = [...state];
              buf[currentPoolIndex] = idx;
              return buf;
            })
          }
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
    paddingTop: 55,
    alignItems: "center",
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
    gap: 10,
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
});
