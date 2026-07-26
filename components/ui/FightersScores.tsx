import { Colors, Fonts } from "@/constants";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  GestureHandlerRootView,
  LongPressGestureHandler,
  State,
} from "react-native-gesture-handler";
import ModalWindow from "./ModalWindow";

type FightersScoresProps = {
  data: {
    idRed: string;
    nameRed: string;
    scoreRed: number;
    hintRed?: string;
    nameBlue: string;
    idBlue: string;
    scoreBlue: number;
    hintBlue?: string;
  }[];
  withoutLinks?: boolean;
};

export default function FightersScores({
  data,
  withoutLinks = false,
}: FightersScoresProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [fullNameModal, setFullNameModal] = useState<{
    visible: boolean;
    name: string;
  }>({ visible: false, name: "" });

  const goToProfile = (id: string) => {
    router.push(`/profile/${id}`);
  };

  const handleLongPress = (name: string) => {
    setFullNameModal({ visible: true, name });
  };

  const renderItem = ({
    item: d,
    index,
  }: {
    item: (typeof data)[0];
    index: number;
  }) => (
    <GestureHandlerRootView
      style={[styles.row, index === data.length - 1 && styles.lastRow]}
    >
      <LongPressGestureHandler
        onHandlerStateChange={({ nativeEvent }) => {
          if (nativeEvent.state === State.ACTIVE) {
            handleLongPress(d.nameRed);
          }
        }}
        minDurationMs={500}
      >
        <TouchableOpacity
          style={[styles.cell, styles.nameCell]}
          onPress={!withoutLinks ? () => goToProfile(d.idRed) : undefined}
          disabled={withoutLinks}
          activeOpacity={0.7}
        >
          <View style={styles.cellContent}>
            <Text
              style={[
                styles.cellText,
                !withoutLinks && styles.linkText,
                d.scoreRed > d.scoreBlue && styles.winnerText,
              ]}
              numberOfLines={1}
            >
              {d.nameRed}
            </Text>
            {!!d.hintRed && <Text style={styles.hintText}>{d.hintRed}</Text>}
          </View>
        </TouchableOpacity>
      </LongPressGestureHandler>

      <View style={[styles.cell, styles.scoreCell]}>
        <Text
          style={[
            styles.scoreText,
            d.scoreRed > d.scoreBlue && styles.winnerScoreText,
          ]}
        >
          {d.scoreRed}
        </Text>
      </View>

      <View style={[styles.cell, styles.scoreCell]}>
        <Text
          style={[
            styles.scoreText,
            d.scoreBlue > d.scoreRed && styles.winnerScoreText,
          ]}
        >
          {d.scoreBlue}
        </Text>
      </View>

      <LongPressGestureHandler
        onHandlerStateChange={({ nativeEvent }) => {
          if (nativeEvent.state === State.ACTIVE) {
            handleLongPress(d.nameBlue);
          }
        }}
        minDurationMs={500}
      >
        <TouchableOpacity
          style={[styles.cell, styles.nameCell]}
          onPress={!withoutLinks ? () => goToProfile(d.idBlue) : undefined}
          disabled={withoutLinks}
          activeOpacity={0.7}
        >
          <View style={styles.cellContent}>
            <Text
              style={[
                styles.cellText,
                !withoutLinks && styles.linkText,
                d.scoreBlue > d.scoreRed && styles.winnerText,
              ]}
              numberOfLines={1}
            >
              {d.nameBlue}
            </Text>
            {!!d.hintBlue && <Text style={styles.hintText}>{d.hintBlue}</Text>}
          </View>
        </TouchableOpacity>
      </LongPressGestureHandler>
    </GestureHandlerRootView>
  );

  return (
    <View style={styles.container}>
      {/* Заголовки */}
      <View style={styles.headerRow}>
        <View style={[styles.cell, styles.nameCell]}>
          <Text style={styles.headerText}>{t("name")}</Text>
        </View>
        <View style={[styles.cell, styles.scoreCell]}>
          <Text style={styles.headerText}>{t("score")}</Text>
        </View>
        <View style={[styles.cell, styles.scoreCell]}>
          <Text style={styles.headerText}>{t("score")}</Text>
        </View>
        <View style={[styles.cell, styles.nameCell]}>
          <Text style={styles.headerText}>{t("name")}</Text>
        </View>
      </View>

      {/* Данные */}
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(_, index) => index.toString()}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
      />

      {/* Модальное окно с полным именем */}
      <ModalWindow
        isOpen={fullNameModal.visible}
        onClose={() => setFullNameModal({ visible: false, name: "" })}
        showCloseButton={true}
      >
        <View style={styles.modalContent}>
          <Text style={styles.fullNameText}>{fullNameModal.name}</Text>
        </View>
      </ModalWindow>
    </View>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.accentTransparent,
    borderRadius: 16,
    overflow: "hidden",
    width: width - 32,
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: Colors.accent,
    height: 44,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: Colors.accent,
    minHeight: 50,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  cell: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  cellContent: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  nameCell: {
    flex: 3,
    minWidth: 80,
  },
  scoreCell: {
    width: 60,
    flexShrink: 0,
    flexGrow: 0,
  },
  headerText: {
    color: Colors.bg,
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    textAlign: "center",
  },
  hintText: {
    color: Colors.placeholder,
    fontSize: 10,
    marginTop: 1,
  },
  cellText: {
    color: Colors.fg,
    fontSize: 14,
    fontFamily: Fonts.regular,
    textAlign: "center",
  },
  linkText: {
    color: Colors.accent,
    textDecorationLine: "underline",
  },
  winnerText: {
    fontFamily: Fonts.bold,
    color: Colors.fg,
  },
  scoreText: {
    color: Colors.placeholder,
    fontSize: 16,
    fontFamily: Fonts.medium,
    textAlign: "center",
    minWidth: 30,
  },
  winnerScoreText: {
    color: Colors.fg,
    backgroundColor: Colors.accentTransparent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: "hidden",
  },
  modalContent: {
    alignItems: "center",
    paddingVertical: 20,
  },
  fullNameText: {
    color: Colors.fg,
    fontSize: 24,
    fontFamily: Fonts.bold,
    textAlign: "center",
  },
});
