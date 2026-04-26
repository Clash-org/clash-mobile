import { Colors, Fonts } from "@/constants";
import React from "react";
import {
    Platform,
    Switch as RNSwitch,
    StyleSheet,
    Text,
    TextStyle,
    View,
    ViewStyle,
} from "react-native";

interface SwitchProps {
  title: string;
  value: boolean;
  setValue: (val: boolean) => void;
  fit?: boolean;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  disabled?: boolean;
  trackColor?: { false: string; true: string };
  thumbColor?: string;
}

export default function Switch({
  title,
  value,
  setValue,
  fit = false,
  style,
  titleStyle,
  disabled = false,
  trackColor = { false: "#767577", true: Colors.accent },
  thumbColor = Platform.OS === "ios" ? "#f4f3f4" : "#f4f3f4",
}: SwitchProps) {
  const handleToggle = () => {
    if (!disabled) {
      setValue(!value);
    }
  };

  return (
    <View style={[styles.switchRow, fit && styles.switchRowFit, style]}>
      <Text style={[styles.switchLabel, titleStyle]}>{title}</Text>
      <RNSwitch
        value={value}
        onValueChange={handleToggle}
        disabled={disabled}
        trackColor={trackColor}
        thumbColor={thumbColor}
        ios_backgroundColor={trackColor.false}
        accessibilityLabel={title}
        accessibilityRole="switch"
        style={styles.switch}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    width: "100%",
  },
  switchRowFit: {
    width: "auto",
  },
  switchLabel: {
    flex: 1,
    color: Colors.fg,
    fontFamily: Fonts.regular,
    fontSize: 16,
  },
  switch: {
    transform: Platform.OS === "ios" ? [{ scale: 0.9 }] : [],
  },
});
