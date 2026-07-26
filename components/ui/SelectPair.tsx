import { Colors, Fonts } from "@/constants";
import {
  currentTeamsIndexesAtom,
  isGroupBattleAtom,
  triathlonWeaponsAtom,
} from "@/store";
import { ParticipantType, TeamPlayOffType, TeamType } from "@/typings";
import { getName, teamSelect } from "@/utils/helpers";
import { useAtom } from "jotai";
import { Trash2 } from "lucide-react-native";
import React, {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  ScrollView as RNScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Button from "../ui/Button";
import Section from "../ui/Section";
import ModalWindow from "./ModalWindow";
import Select from "./Select";

type SelectPairProps = {
  poolIndex: number;
  fighterPairs: [ParticipantType, ParticipantType][][];
  currentPairIndex: number;
  selectPair: (idx: number) => void;
  deleteEmptyPairs?: boolean;
  manualMode?: boolean;
  onPairsReordered?: (newPairs: [ParticipantType, ParticipantType][][]) => void;
  onDeletePair?: (id1: string, id2: string) => void;
  setPools?: React.Dispatch<
    React.SetStateAction<[ParticipantType, ParticipantType][][]>
  >;
  onDragStateChange?: (isDragging: boolean) => void;
  participants?: ParticipantType[][];
  teams?: TeamType[][] | TeamPlayOffType[][];
};

type DraggableParticipant = {
  participant: ParticipantType;
  id: string;
  pairIndex: number;
  position: "left" | "right";
};

export default function SelectPair({
  fighterPairs,
  poolIndex,
  currentPairIndex,
  selectPair,
  deleteEmptyPairs = false,
  manualMode = false,
  onPairsReordered,
  onDeletePair,
  setPools,
  onDragStateChange,
  participants,
  teams,
}: SelectPairProps) {
  const { t } = useTranslation();
  const [isGroupBattle] = useAtom(isGroupBattleAtom);
  const isTriathlon = teams !== undefined;
  const isSwiss = fighterPairs[poolIndex]?.[0]?.[0]?.arena !== undefined;
  const [triathlonWeapons] = useAtom(triathlonWeaponsAtom);
  const [currentTeamsIndexes, setCurrentTeamsIndexes] = useAtom(
    currentTeamsIndexesAtom,
  );
  const [dragging, setDragging] = useState(false);
  const [isDelete, setIsDelete] = useState<boolean[]>([]);
  const listRef = useRef(null);
  const isTeamsType = (teamsArr: any): teamsArr is TeamType[][] =>
    teamsArr?.[poolIndex]?.[0]?.deactive !== undefined;

  useEffect(() => {
    setIsDelete(new Array(fighterPairs[poolIndex]?.length || 0).fill(false));
  }, [fighterPairs, poolIndex]);

  function getRandomTeamsPair(teams: TeamType[]): [TeamType, TeamType] | null {
    // 1. Проверяем, что есть хотя бы 2 команды
    if (!teams || teams.length < 2) {
      return null;
    }

    // 2. Перемешиваем команды
    const shuffled = [...teams];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // 3. Берём первые две команды
    const [team1, team2] = shuffled;

    // 4. Проверяем, что это разные команды
    if (team1.id === team2.id) {
      return getRandomTeamsPair(teams);
    }

    return [team1, team2];
  }

  const handleDeletePair = (
    pair: [ParticipantType, ParticipantType],
    originalIdx: number,
  ) => {
    setIsDelete((state) => {
      const buf = [...state];
      buf[originalIdx] = false;
      return buf;
    });

    const buf = [...fighterPairs];
    buf[poolIndex] = buf[poolIndex].filter((_, i) => i !== originalIdx);
    onPairsReordered?.(buf);
    setPools?.(buf);
    if (onDeletePair) {
      onDeletePair(pair[0].id, pair[1].id);
    }
  };

  // Преобразуем пары в плоский список только когда данные меняются
  const draggableData = useMemo(() => {
    const result: DraggableParticipant[] = [];
    const pairs = fighterPairs[poolIndex];

    if (!pairs || !Array.isArray(pairs)) return result;

    pairs.forEach((pair, pairIdx) => {
      if (!pair || !Array.isArray(pair) || pair.length < 2) return;

      const participant1 = pair[0];
      const participant2 = pair[1];

      if (!participant1 || !participant2) return;

      if (
        deleteEmptyPairs &&
        (participant1.name === "—" || participant2.name === "—")
      ) {
        return;
      }

      result.push({
        participant: participant1,
        id: `${pairIdx}-0-${participant1.id || pairIdx}`,
        pairIndex: pairIdx,
        position: "left",
      });
      result.push({
        participant: participant2,
        id: `${pairIdx}-1-${participant2.id || pairIdx}`,
        pairIndex: pairIdx,
        position: "right",
      });
    });
    return result;
  }, [fighterPairs, poolIndex, deleteEmptyPairs]);

  const handleDragBegin = useCallback(() => {
    setDragging(true);
    onDragStateChange?.(true);
  }, [onDragStateChange]);

  const handleDragEnd = useCallback(
    ({ data }: { data: DraggableParticipant[] }) => {
      setDragging(false);
      onDragStateChange?.(false);

      // Создаем массив пар на основе нового порядка
      const newPairs: [ParticipantType, ParticipantType][] = [];

      for (let i = 0; i < data.length; i += 2) {
        const left = data[i]?.participant || { id: "", name: "—" };
        const right = data[i + 1]?.participant || { id: "", name: "—" };
        newPairs.push([{ ...left, weapon: right?.weapon }, right]);
      }

      // Проверяем, изменились ли данные
      const currentPairs = fighterPairs[poolIndex];
      const hasChanged =
        JSON.stringify(currentPairs) !== JSON.stringify(newPairs);

      if (hasChanged) {
        const buf = [...fighterPairs];
        buf[poolIndex] = newPairs;
        onPairsReordered?.(buf);
        setPools?.(buf);
      }
    },
    [fighterPairs, poolIndex, onPairsReordered, setPools, onDragStateChange],
  );

  const handleTeamSelect = teamSelect(
    isTriathlon && isTeamsType(teams) ? teams[poolIndex] : [],
    currentTeamsIndexes[poolIndex],
    participants,
    poolIndex,
    setCurrentTeamsIndexes,
    onPairsReordered!,
  );

  const Arena = ({
    fighter,
    idx,
  }: {
    fighter: ParticipantType;
    idx: number;
  }) => {
    const prevFighter = fighterPairs[poolIndex][idx - 1];
    const isFighterFirst = fighterPairs[poolIndex][idx][1].id !== fighter.id;
    const ArenaData = () => (
      <Text style={styles.arena}>
        {t("arena")} {fighter.arena}
      </Text>
    );

    return (
      isSwiss && (
        <>
          {idx === 0 && isFighterFirst && <ArenaData />}
          {prevFighter &&
            prevFighter[0].arena !== fighter.arena &&
            isFighterFirst && <ArenaData />}
        </>
      )
    );
  };

  // Создаем данные для FlatList с иконками удаления
  const deleteData = useMemo(() => {
    const result: { pairIndex: number; firstIdxSwissSeparator: number }[] = [];
    if (!fighterPairs[poolIndex]) return result;

    fighterPairs[poolIndex].forEach((_, pairIdx) => {
      if (
        deleteEmptyPairs &&
        (fighterPairs[poolIndex][pairIdx][0].name === "—" ||
          fighterPairs[poolIndex][pairIdx][1].name === "—")
      ) {
        return;
      }
      result.push({
        pairIndex: pairIdx,
        firstIdxSwissSeparator: fighterPairs[poolIndex].length / 3,
      });
    });
    return result;
  }, [fighterPairs, poolIndex, deleteEmptyPairs]);

  const renderItem = useCallback(
    ({
      item,
      drag,
      isActive: isDragging,
      getIndex,
    }: RenderItemParams<DraggableParticipant>) => {
      const index = getIndex() || 0;
      const isCurrentActive = currentPairIndex === Math.floor(index / 2);
      const isLeft = item.position === "left";
      const pairNumber = Math.floor(index / 2);

      return (
        <>
          <Arena fighter={item.participant} idx={item.pairIndex} />
          <ScaleDecorator>
            <TouchableOpacity
              onLongPress={drag}
              delayLongPress={150}
              activeOpacity={0.7}
              onPress={() => {
                if (!dragging) {
                  selectPair(Math.floor(index / 2));
                }
              }}
              style={[
                styles.dragItem,
                isCurrentActive && styles.dragItemActive,
                isDragging && styles.dragItemDragging,
                isLeft ? styles.leftParticipant : styles.rightParticipant,
              ]}
            >
              <View style={styles.dragItemContent}>
                <View style={styles.participantInfo}>
                  <Text style={styles.participantName} numberOfLines={1}>
                    {getName(item.participant.name)}
                  </Text>
                  {item.participant?.weapon ? (
                    <Text style={styles.pairIndexText}>
                      {item.participant?.weapon}
                    </Text>
                  ) : null}
                  <View
                    style={[
                      styles.positionIndicator,
                      isLeft ? styles.redIndicator : styles.blueIndicator,
                    ]}
                  />
                </View>
                <Text style={styles.pairIndexText}>
                  {t("pair")} {pairNumber + 1}
                </Text>
              </View>
            </TouchableOpacity>
          </ScaleDecorator>
        </>
      );
    },
    [currentPairIndex, dragging, selectPair],
  );

  const renderDeleteItem = useCallback(
    ({
      item,
    }: {
      item: { pairIndex: number; firstIdxSwissSeparator: number };
    }) => {
      const pairNumber = item.pairIndex;
      const idxSwissSeparators = [
        item.firstIdxSwissSeparator,
        item.firstIdxSwissSeparator * 2,
      ];
      return (
        <View
          style={{
            height: 100,
            justifyContent: "center",
            alignSelf: "flex-end",
            marginTop:
              isSwiss &&
              (pairNumber === 0 || idxSwissSeparators.includes(item.pairIndex))
                ? 50
                : 0,
          }}
        >
          {onDeletePair && onPairsReordered && setPools && (
            <>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => {
                  setIsDelete((state) => {
                    const buf = [...state];
                    buf[pairNumber] = true;
                    return buf;
                  });
                }}
              >
                <Trash2 size={25} color={Colors.placeholder} />
              </TouchableOpacity>
              <ModalWindow
                title={t("realyDelete")}
                isOpen={isDelete[pairNumber] || false}
                onClose={() => {
                  setIsDelete((state) => {
                    const buf = [...state];
                    buf[pairNumber] = false;
                    return buf;
                  });
                }}
              >
                <Button
                  onPress={() => {
                    const pair = fighterPairs[poolIndex]?.[pairNumber];
                    if (pair) {
                      handleDeletePair(pair, pairNumber);
                    }
                  }}
                >
                  <Trash2 color={Colors.fg} size={20} />
                </Button>
              </ModalWindow>
            </>
          )}
        </View>
      );
    },
    [
      currentPairIndex,
      isDelete,
      fighterPairs,
      poolIndex,
      onDeletePair,
      onPairsReordered,
      setPools,
      handleDeletePair,
      t,
    ],
  );

  // Режим без ручного управления
  if (!manualMode) {
    if (!fighterPairs[poolIndex]?.[0]?.[0]) {
      return null;
    }

    return (
      <Section title={`${t("pairs")}: ${t("pool")} ${poolIndex + 1}`}>
        <RNScrollView style={styles.listContainer}>
          {fighterPairs[poolIndex]
            .sort(
              isSwiss
                ? (pairA, pairB) => {
                    return pairA[0].arena! - pairB[0].arena!;
                  }
                : undefined,
            )
            .map((pair, idx) => {
              if (
                deleteEmptyPairs &&
                (pair[0].name === "—" || pair[1].name === "—")
              ) {
                return null;
              }
              const isActive = currentPairIndex === idx;
              return (
                <Fragment key={`${idx}-${pair[0].id}-${pair[1].id}`}>
                  <Arena fighter={pair[0]} idx={idx} />
                  <Button
                    title={`${getName(pair[0].name)} VS ${getName(pair[1].name)}`}
                    onPress={() => selectPair(idx)}
                    style={[
                      styles.pairButton,
                      isActive && styles.pairButtonActive,
                    ]}
                  />
                </Fragment>
              );
            })}
        </RNScrollView>
      </Section>
    );
  }

  if (!fighterPairs[poolIndex]?.[0]?.[0]) {
    return null;
  }

  return (
    <Section title={`${t("pairs")}: ${t("pool")} ${poolIndex + 1}`}>
      <GestureHandlerRootView>
        {isGroupBattle && (
          <View style={styles.teams}>
            <Text style={[styles.teamText, styles.redTeam]}>
              {t("redTeam")}
            </Text>
            <Text style={[styles.teamText, styles.blueTeam]}>
              {t("blueTeam")}
            </Text>
          </View>
        )}

        {isTriathlon && (
          <>
            {isTeamsType(teams) && (
              <>
                <Button
                  title={t("randomTeamSelection")}
                  style={{ marginBottom: 20 }}
                  onPress={() => {
                    const twoTeams = getRandomTeamsPair(teams[poolIndex]);
                    if (!twoTeams) return;
                    handleTeamSelect(
                      twoTeams[0].id,
                      "red",
                      undefined,
                      twoTeams[1].id,
                    );
                  }}
                />
                <View style={{ ...styles.teams, gap: 20 }}>
                  {teams[poolIndex] &&
                    (["red", "blue"] as const).map((team) => (
                      <Select
                        key={team}
                        options={teams[poolIndex].map((t) => ({
                          label: t.name,
                          value: t.id,
                        }))}
                        hiddenOptions={teams[poolIndex]
                          .filter(
                            (t, idx) =>
                              t.deactive ||
                              idx === currentTeamsIndexes[poolIndex]?.redTeam ||
                              idx === currentTeamsIndexes[poolIndex]?.blueTeam,
                          )
                          .map((t) => t.id)}
                        placeholder={t("team")}
                        value={
                          team === "red"
                            ? teams[poolIndex][
                                currentTeamsIndexes[poolIndex]?.redTeam
                              ]?.id
                            : teams[poolIndex][
                                currentTeamsIndexes[poolIndex]?.blueTeam
                              ]?.id
                        }
                        setValue={(id) => handleTeamSelect(id, team)}
                        style={{ flex: 1 }}
                      />
                    ))}
                </View>
              </>
            )}
            <Select
              style={{ marginBottom: 20 }}
              options={triathlonWeapons.map((weapon) => ({
                label: weapon,
                value: weapon,
              }))}
              value={fighterPairs[poolIndex]?.[currentPairIndex]?.[0]?.weapon}
              setValue={(weapon) => {
                const buf = [...fighterPairs];
                buf[poolIndex] = buf[poolIndex].map((pair, idx) => {
                  if (currentPairIndex === idx) {
                    const newFirstFighter = { ...pair[0], weapon };
                    const newSecondFighter = { ...pair[1], weapon };
                    return [newFirstFighter, newSecondFighter];
                  } else {
                    return pair;
                  }
                });
                onPairsReordered?.(buf);
              }}
            />
          </>
        )}

        <View style={styles.container}>
          {/* Левая колонка - DraggableFlatList с именами */}
          <View style={styles.leftColumn}>
            <DraggableFlatList
              ref={listRef}
              data={draggableData}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              onDragBegin={handleDragBegin}
              onDragEnd={handleDragEnd}
              activationDistance={5}
              autoscrollSpeed={100}
              animationConfig={{
                duration: 150,
              }}
              scrollEnabled={false}
              dragHitSlop={{ left: 50, right: 50, top: 50, bottom: 50 }}
              contentContainerStyle={{
                flex: 1,
                gap: 10,
              }}
              simultaneousHandlers={[]}
              showsVerticalScrollIndicator={false}
            />
          </View>

          {/* Правая колонка - FlatList с иконками удаления */}
          <View style={styles.rightColumn}>
            <FlatList
              data={deleteData}
              renderItem={renderDeleteItem}
              keyExtractor={(item) => `delete-${item.pairIndex}`}
              scrollEnabled={false}
              contentContainerStyle={{
                flex: 1,
                justifyContent: "space-between",
              }}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </GestureHandlerRootView>
    </Section>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    maxHeight: 400,
  },
  pairButton: {
    marginBottom: 8,
    backgroundColor: Colors.accentTransparent,
  },
  pairButtonActive: {
    backgroundColor: Colors.accent,
  },
  teams: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  teamText: {
    fontSize: 16,
    fontFamily: Fonts.bold,
  },
  redTeam: {
    color: "#E33515",
  },
  blueTeam: {
    color: "#3B82F6",
  },
  container: {
    flexDirection: "row",
  },
  leftColumn: {
    flex: 1,
  },
  rightColumn: {
    width: 50,
    justifyContent: "center",
  },
  dragItem: {
    backgroundColor: Colors.accentTransparent,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
    overflow: "hidden",
  },
  dragItemActive: {
    borderColor: Colors.accent,
  },
  dragItemDragging: {
    opacity: 0.8,
    shadowColor: Colors.bg,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    transform: [{ scale: 1.02 }],
  },
  leftParticipant: {
    borderLeftWidth: 3,
    borderLeftColor: "#E33515",
  },
  rightParticipant: {
    borderLeftWidth: 3,
    borderLeftColor: "#3B82F6",
  },
  dragItemContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
  },
  participantInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  participantName: {
    flex: 1,
    color: Colors.fg,
    fontFamily: Fonts.medium,
    fontSize: 16,
  },
  positionIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
  },
  redIndicator: {
    backgroundColor: "#E33515",
  },
  blueIndicator: {
    backgroundColor: "#3B82F6",
  },
  pairIndexText: {
    color: Colors.placeholder,
    fontSize: 12,
    fontFamily: Fonts.regular,
    marginLeft: 8,
  },
  deleteButton: {
    padding: 8,
  },
  arena: {
    alignSelf: "center",
    fontFamily: Fonts.bold,
    color: Colors.accent,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.accentTransparent,
    borderRadius: 8,
    marginBottom: 8,
  },
});
