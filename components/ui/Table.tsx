import { Colors, Fonts } from "@/constants";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

interface TableProps {
  data: (string | number | React.ReactNode)[][];
  titles: string[];
  customRenderers?: Record<
    number,
    (value: any, rowIndex: number) => React.ReactNode
  >;
}

export default function Table({
  data,
  titles,
  customRenderers = {},
}: TableProps) {
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Нет данных</Text>
      </View>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={true}>
      <View style={styles.table}>
        {/* Header */}
        <View style={styles.headerRow}>
          {titles.map((title, idx) => (
            <View
              key={`header-${idx}`}
              style={[styles.cell, styles.headerCell]}
            >
              <Text style={styles.headerText}>{title}</Text>
            </View>
          ))}
        </View>

        {/* Body */}
        {data.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.row}>
            {row.map((cell, colIndex) => (
              <View key={`cell-${rowIndex}-${colIndex}`} style={styles.cell}>
                {customRenderers[colIndex] ? (
                  customRenderers[colIndex](cell, rowIndex)
                ) : (
                  <Text style={styles.cellText}>
                    {typeof cell === "string" || typeof cell === "number"
                      ? String(cell)
                      : ""}
                  </Text>
                )}
              </View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  table: {
    backgroundColor: Colors.accentTransparent,
    borderRadius: 12,
    overflow: "hidden",
    minWidth: "100%",
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
  cell: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    minWidth: 120,
    justifyContent: "center",
  },
  headerCell: {
    borderRightWidth: 1,
    borderRightColor: Colors.bg,
  },
  headerText: {
    color: Colors.bg,
    fontSize: 14,
    fontFamily: Fonts.bold,
    textAlign: "center",
  },
  cellText: {
    color: Colors.fg,
    fontSize: 14,
    textAlign: "center",
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    color: Colors.placeholder,
    fontSize: 16,
  },
});
