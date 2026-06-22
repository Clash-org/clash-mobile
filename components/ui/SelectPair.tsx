import { Colors, Fonts } from "@/constants";
import { isGroupBattleAtom } from "@/store";
import { ParticipantType } from "@/typings";
import { getName } from "@/utils/helpers";
import { useAtomValue } from "jotai";
import { Trash2 } from "lucide-react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
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
};

type DraggableParticipant = {
  participant: ParticipantType;
  id: string;
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
}: SelectPairProps) {
  const { t } = useTranslation();
  const isGroupBattle = useAtomValue(isGroupBattleAtom);
  const [dragging, setDragging] = useState(false);
  const [isDelete, setIsDelete] = useState<boolean[]>([]);
  const listRef = useRef(null);

  useEffect(() => {
    setIsDelete(new Array(fighterPairs[poolIndex]?.length || 0).fill(false));
  }, [fighterPairs, poolIndex]);

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
    if (!fighterPairs[poolIndex]) return result;

    fighterPairs[poolIndex].forEach((pair, pairIdx) => {
      if (deleteEmptyPairs && (pair[0].name === "—" || pair[1].name === "—")) {
        return;
      }
      result.push({
        participant: pair[0],
        id: `${pairIdx}-0-${pair[0].id || pairIdx}`,
      });
      result.push({
        participant: pair[1],
        id: `${pairIdx}-1-${pair[1].id || pairIdx}`,
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
        newPairs.push([left, right]);
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

  // Режим без ручного управления
  if (!manualMode) {
    if (!fighterPairs[poolIndex]?.[0]?.[0]) {
      return null;
    }

    return (
      <Section title={`${t("pairs")}: ${t("pool")} ${poolIndex + 1}`}>
        <RNScrollView style={styles.listContainer}>
          {fighterPairs[poolIndex].map((pair, idx) => {
            if (
              deleteEmptyPairs &&
              (pair[0].name === "—" || pair[1].name === "—")
            ) {
              return null;
            }
            const isActive = currentPairIndex === idx;
            return (
              <Button
                key={idx}
                title={`${getName(pair[0].name)} VS ${getName(pair[1].name)}`}
                onPress={() => selectPair(idx)}
                style={[styles.pairButton, isActive && styles.pairButtonActive]}
              />
            );
          })}
        </RNScrollView>
      </Section>
    );
  }

  if (!fighterPairs[poolIndex]?.[0]?.[0]) {
    return null;
  }

  const renderItem = useCallback(
    ({
      item,
      drag,
      isActive: isDragging,
      getIndex,
    }: RenderItemParams<DraggableParticipant>) => {
      const index = getIndex() || 0;
      const isCurrentActive = currentPairIndex === Math.floor(index / 2);
      const isLeft = index % 2 === 0;
      const pairNumber = Math.floor(index / 2);

      return (
        <ScaleDecorator>
          <View style={styles.itemWrapper}>
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
                !isLeft ? { marginRight: 44 } : {},
              ]}
            >
              <View style={styles.dragItemContent}>
                <View style={styles.participantInfo}>
                  <Text style={styles.participantName} numberOfLines={1}>
                    {getName(item.participant.name)}
                  </Text>
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

            {isLeft && onDeletePair && onPairsReordered && setPools && (
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
        </ScaleDecorator>
      );
    },
    [
      currentPairIndex,
      dragging,
      selectPair,
      t,
      isDelete,
      fighterPairs,
      poolIndex,
      onDeletePair,
      onPairsReordered,
      setPools,
      handleDeletePair,
    ],
  );

  return (
    <Section title={`${t("pairs")}: ${t("pool")} ${poolIndex + 1}`}>
      <GestureHandlerRootView style={{ flex: 1 }}>
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

        <View style={{ flex: 1 }}>
          <DraggableFlatList
            ref={listRef}
            data={draggableData}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            onDragBegin={handleDragBegin}
            onDragEnd={handleDragEnd}
            activationDistance={5}
            containerStyle={styles.dragListContainer}
            autoscrollSpeed={100}
            animationConfig={{
              duration: 150,
            }}
            scrollEnabled={false}
            dragHitSlop={{ left: 50, right: 50, top: 50, bottom: 50 }}
            simultaneousHandlers={[]}
            showsVerticalScrollIndicator={false}
          />
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
  dragListContainer: {
    flex: 1,
    minHeight: 300,
  },
  itemWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  dragItem: {
    flex: 1,
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
    borderRightWidth: 3,
    borderRightColor: "#3B82F6",
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
    marginLeft: 4,
    position: "relative",
    top: 30,
  },
});
