import { Colors, Fonts } from "@/constants";
import React from "react";
import { StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";

interface SectionProps {
  title?: string;
  children: React.ReactNode;
  row?: boolean;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  contentStyle?: ViewStyle;
}

export default function Section({
  title,
  children,
  row = false,
  style,
  titleStyle,
  contentStyle,
}: SectionProps) {
  return (
    <View style={[styles.section, style]}>
      {title && <Text style={[styles.sectionTitle, titleStyle]}>{title}</Text>}
      <View
        style={[row ? styles.sectionRow : styles.sectionContent, contentStyle]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    gap: 8,
  },
  sectionTitle: {
    color: Colors.fg,
    fontSize: 18,
    marginBottom: 12,
    fontFamily: Fonts.bold,
    lineHeight: 24,
  },
  sectionContent: {
    gap: 8,
    flexDirection: "column",
  },
  sectionRow: {
    gap: 8,
    flexDirection: "row",
    flexWrap: "wrap",
  },
});
