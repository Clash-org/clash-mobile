import { Colors, Fonts } from "@/constants";
import React from "react";
import {
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";

type RadioOption<T> = {
  value: T;
  label: string;
  disabled?: boolean;
};

type RadioProps<T> = {
  options: RadioOption<T>[];
  value?: T;
  onChange?: (value: T) => void;
  direction?: "horizontal" | "vertical";
  disabled?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  radioSize?: number;
  dotSize?: number;
};

export default function RadioGroup<T>({
  options,
  value,
  onChange,
  direction = "vertical",
  disabled = false,
  style,
  labelStyle,
  radioSize = 20,
  dotSize = 10,
}: RadioProps<T>) {
  const handleChange = (optionValue: T) => {
    if (disabled) return;
    onChange?.(optionValue);
  };

  return (
    <View
      style={[
        styles.container,
        direction === "horizontal" ? styles.horizontal : styles.vertical,
        style,
      ]}
      accessibilityRole="radiogroup"
    >
      {options.map((option) => {
        const isChecked = value === option.value;
        const isDisabled = (disabled || option.disabled) && !isChecked;

        return (
          <TouchableOpacity
            key={String(option.value)}
            style={[
              styles.radioLabel,
              isChecked && styles.checked,
              isDisabled && styles.optionDisabled,
              direction === "horizontal" && styles.radioLabelHorizontal,
            ]}
            onPress={() => handleChange(option.value)}
            disabled={isDisabled}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.radioCustom,
                {
                  width: radioSize,
                  height: radioSize,
                  borderRadius: radioSize / 2,
                },
                isChecked && styles.radioCustomChecked,
              ]}
            >
              {isChecked && (
                <View
                  style={[
                    styles.radioDot,
                    {
                      width: dotSize,
                      height: dotSize,
                      borderRadius: dotSize / 2,
                    },
                  ]}
                />
              )}
            </View>
            <Text
              style={[
                styles.radioText,
                isChecked && styles.radioTextChecked,
                labelStyle,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  horizontal: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  vertical: {
    flexDirection: "column",
  },
  radioLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: "transparent",
  },
  radioLabelHorizontal: {
    flex: 1,
    minWidth: 100,
  },
  radioCustom: {
    borderWidth: 2,
    borderColor: Colors.placeholder,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.bg,
  },
  radioCustomChecked: {
    borderColor: Colors.fg,
    backgroundColor: Colors.fg,
  },
  radioDot: {
    backgroundColor: Colors.accent,
  },
  radioText: {
    color: Colors.fg,
    fontFamily: Fonts.regular,
    fontSize: 16,
    flex: 1,
  },
  radioTextChecked: {
    color: Colors.fg,
  },
  checked: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  optionDisabled: {
    opacity: 0.5,
  },
});
