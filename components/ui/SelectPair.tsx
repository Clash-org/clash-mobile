// components/ui/SelectPair.tsx
import { Colors, Fonts } from "@/constants";
import { isGroupBattleAtom } from "@/store";
import { ParticipantType } from "@/typings";
import { getName } from "@/utils/helpers";
import { useAtomValue } from "jotai";
import { GripVertical, Trash2 } from "lucide-react-native";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  ScrollView,
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
}: SelectPairProps) {
  const { t } = useTranslation();
  const isGroupBattle = useAtomValue(isGroupBattleAtom);
  const [dragging, setDragging] = useState(false);

  const handleDeletePair = (
    pair: [ParticipantType, ParticipantType],
    originalIdx: number,
  ) => {
    Alert.alert(
      t("confirmDelete") || "Удалить пару",
      t("deletePairConfirm") || "Вы уверены, что хотите удалить эту пару?",
      [
        { text: t("cancel") || "Отмена", style: "cancel" },
        {
          text: t("delete") || "Удалить",
          style: "destructive",
          onPress: () => {
            const buf = [...fighterPairs];
            buf[poolIndex] = buf[poolIndex].filter((_, i) => i !== originalIdx);
            onPairsReordered?.(buf);
            setPools?.(buf);
            onDeletePair?.(pair[0].id, pair[1].id);
          },
        },
      ],
    );
  };

  const handleDragEnd = ({
    data,
  }: {
    data: [ParticipantType, ParticipantType][];
  }) => {
    setDragging(false);
    const newPairs = [...fighterPairs];
    newPairs[poolIndex] = data;
    onPairsReordered?.(newPairs);
    setPools?.(newPairs);
  };

  // Режим без ручного управления (простой список кнопок)
  if (!manualMode) {
    if (!fighterPairs[poolIndex]?.[0]?.[0]) {
      return null;
    }

    return (
      <Section title={`${t("pairs")}: ${t("pool")} ${poolIndex + 1}`}>
        <ScrollView style={styles.listContainer}>
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
        </ScrollView>
      </Section>
    );
  }

  // Режим ручного управления с drag-and-drop
  if (!fighterPairs[poolIndex]?.[0]?.[0]) {
    return null;
  }

  const currentPairs = fighterPairs[poolIndex].filter(
    (pair) =>
      !(deleteEmptyPairs && (pair[0].name === "—" || pair[1].name === "—")),
  );

  const renderItem = ({
    item,
    drag,
    isActive: isDragging,
    getIndex,
  }: RenderItemParams<[ParticipantType, ParticipantType]>) => {
    const index = getIndex() || 0;
    const isCurrentActive = currentPairIndex === index;

    return (
      <ScaleDecorator>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => !dragging && selectPair(index)}
          style={[styles.dragItem, isCurrentActive && styles.dragItemActive]}
        >
          <View style={styles.dragItemContent}>
            <View style={styles.dragHandle}>
              <GripVertical size={20} color={Colors.placeholder} />
            </View>

            <View style={styles.participantsContainer}>
              <TouchableOpacity
                onLongPress={drag}
                delayLongPress={150}
                style={[
                  styles.participantBox,
                  styles.redParticipantBox,
                  isDragging && styles.dragItemDragging,
                ]}
              >
                <Text style={styles.participantName} numberOfLines={1}>
                  {getName(item[0].name)}
                </Text>
              </TouchableOpacity>

              <Text style={styles.vsText}>VS</Text>

              <TouchableOpacity
                onLongPress={drag}
                delayLongPress={150}
                style={[
                  styles.participantBox,
                  styles.blueParticipantBox,
                  isDragging && styles.dragItemDragging,
                ]}
              >
                <Text style={styles.participantName} numberOfLines={1}>
                  {getName(item[1].name)}
                </Text>
              </TouchableOpacity>
            </View>

            {onDeletePair && onPairsReordered && setPools && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeletePair(item, index)}
              >
                <Trash2 size={20} color={Colors.placeholder} />
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

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

        <DraggableFlatList
          data={currentPairs}
          renderItem={renderItem}
          keyExtractor={(_, index) => index.toString()}
          onDragBegin={() => setDragging(true)}
          onDragEnd={handleDragEnd}
          activationDistance={5}
          dragHitSlop={{ left: 0, right: 0, top: 0, bottom: 0 }}
          containerStyle={styles.dragListContainer}
        />
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
    maxHeight: 500,
  },
  dragItem: {
    backgroundColor: Colors.accentTransparent,
    borderRadius: 12,
    marginBottom: 12,
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
  dragItemContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  dragHandle: {
    padding: 8,
    marginRight: 8,
  },
  participantsContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  participantBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.bg,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  redParticipantBox: {
    borderLeftWidth: 3,
    borderLeftColor: "#E33515",
  },
  blueParticipantBox: {
    borderLeftWidth: 3,
    borderLeftColor: "#3B82F6",
  },
  participantName: {
    flex: 1,
    color: Colors.fg,
    fontFamily: Fonts.medium,
    fontSize: 14,
  },
  vsText: {
    paddingHorizontal: 8,
    fontFamily: Fonts.bold,
    fontSize: 12,
    color: Colors.accent,
    textTransform: "uppercase",
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
});
