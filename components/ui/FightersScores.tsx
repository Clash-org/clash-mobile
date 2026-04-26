import { Colors, Fonts } from "@/constants";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type FightersScoresProps = {
  data: {
    idRed: string;
    nameRed: string;
    scoreRed: number;
    nameBlue: string;
    idBlue: string;
    scoreBlue: number;
  }[];
  withoutLinks?: boolean;
};

export default function FightersScores({
  data,
  withoutLinks = false,
}: FightersScoresProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const goToProfile = (id: string) => {
    router.push(`/profile/${id}`);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={true}
      contentContainerStyle={styles.scrollContainer}
    >
      <View style={styles.container}>
        {/* Заголовки */}
        <View style={styles.headerRow}>
          <View style={[styles.cell, styles.firstCell]}>
            <Text style={styles.headerText}>{t("name")}</Text>
          </View>
          <View style={[styles.cell, styles.scoreCell]}>
            <Text style={styles.headerText}>{t("score")}</Text>
          </View>
          <View style={[styles.cell, styles.scoreCell]}>
            <Text style={styles.headerText}>{t("score")}</Text>
          </View>
          <View style={[styles.cell, styles.lastCell]}>
            <Text style={styles.headerText}>{t("name")}</Text>
          </View>
        </View>

        {/* Данные */}
        {data.map((d, i) => (
          <View
            key={i}
            style={[styles.row, i === data.length - 1 && styles.lastRow]}
          >
            <TouchableOpacity
              style={[styles.cell, styles.firstCell]}
              onPress={!withoutLinks ? () => goToProfile(d.idRed) : undefined}
              disabled={withoutLinks}
              activeOpacity={0.7}
            >
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
            </TouchableOpacity>

            <View
              style={[styles.cell, styles.scoreCell, styles.scoreCellContainer]}
            >
              <Text
                style={[
                  styles.scoreText,
                  d.scoreRed > d.scoreBlue && styles.winnerScoreText,
                ]}
              >
                {d.scoreRed}
              </Text>
            </View>

            <View
              style={[styles.cell, styles.scoreCell, styles.scoreCellContainer]}
            >
              <Text
                style={[
                  styles.scoreText,
                  d.scoreBlue > d.scoreRed && styles.winnerScoreText,
                ]}
              >
                {d.scoreBlue}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.cell, styles.lastCell]}
              onPress={!withoutLinks ? () => goToProfile(d.idBlue) : undefined}
              disabled={withoutLinks}
              activeOpacity={0.7}
            >
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
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    backgroundColor: Colors.accentTransparent,
    borderRadius: 16,
    overflow: "hidden",
    minWidth: width - 32,
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: Colors.accent,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: Colors.accent,
  },
  lastRow: {
    borderBottomWidth: 0, // Убираем линию у последней строки
  },
  cell: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  firstCell: {
    flex: 2,
    borderTopLeftRadius: 16,
  },
  lastCell: {
    flex: 2,
    borderTopRightRadius: 16,
  },
  scoreCell: {
    flex: 1,
    minWidth: 70,
    width: 70, // Фиксированная ширина для ячеек с очками
  },
  scoreCellContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: {
    color: Colors.bg,
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    textAlign: "center",
  },
  cellText: {
    color: Colors.fg,
    fontSize: 14,
    fontFamily: Fonts.regular,
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
    minWidth: 40,
  },
  winnerScoreText: {
    color: Colors.fg,
    backgroundColor: Colors.accentTransparent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: "hidden",
  },
});
