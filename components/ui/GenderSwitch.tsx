import { Colors } from "@/constants";
import { Gender } from "@/typings";
import { Mars, Venus } from "lucide-react-native";
import React from "react";
import { StyleSheet, TouchableOpacity, View, ViewStyle } from "react-native";

interface GenderSwitchProps {
  gender: Gender;
  setGender:
    | React.Dispatch<React.SetStateAction<Gender>>
    | ((g: Gender) => void);
  style?: ViewStyle;
  disabled?: boolean;
  size?: number;
}

export function GenderSwitch({
  gender,
  setGender,
  style,
  disabled = false,
  size = 28,
}: GenderSwitchProps) {
  const handleGenderChange = (newGender: Gender) => {
    if (!disabled) {
      setGender(newGender);
    }
  };

  const isMale = gender === Gender.MALE;
  const isFemale = gender === Gender.FEMALE;

  return (
    <View style={[styles.genderRow, style]}>
      <TouchableOpacity
        style={[
          styles.genderBtn,
          isMale && styles.genderActive,
          disabled && styles.disabled,
        ]}
        onPress={() => handleGenderChange(Gender.MALE)}
        activeOpacity={0.7}
        accessibilityLabel="Мужской пол"
        accessibilityRole="button"
        accessibilityState={{ selected: isMale, disabled }}
      >
        <Mars size={size} color={isMale ? Colors.fg : Colors.fg} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.genderBtn,
          isFemale && styles.genderActive,
          disabled && styles.disabled,
        ]}
        onPress={() => handleGenderChange(Gender.FEMALE)}
        activeOpacity={0.7}
        accessibilityLabel="Женский пол"
        accessibilityRole="button"
        accessibilityState={{ selected: isFemale, disabled }}
      >
        <Venus size={size} color={isFemale ? Colors.fg : Colors.fg} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  genderRow: {
    flexDirection: "row",
    marginVertical: 8,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  genderBtn: {
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 6,
    backgroundColor: "transparent",
    width: 52,
    height: 52,
  },
  genderActive: {
    backgroundColor: Colors.accent,
  },
  disabled: {
    opacity: 0.5,
  },
});
