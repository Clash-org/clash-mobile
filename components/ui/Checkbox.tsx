import { Colors, Fonts } from "@/constants";
import React, { ReactNode, useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";

type CommonProps = {
  title: string;
  postfix?: ReactNode;
  className?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
};

type CheckboxPropsMultiple<T> = {
  values: T[];
  value: T;
  setValue: (data: T[]) => void;
  title: string;
  postfix?: ReactNode;
  className?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
} & CommonProps;

type CheckboxPropsSingle = {
  values?: never;
  value: boolean;
  setValue: (data: boolean) => void;
} & CommonProps;

type CheckboxProps<T> = CheckboxPropsMultiple<T> | CheckboxPropsSingle;

export default function Checkbox<T>(props: CheckboxProps<T>) {
  const {
    value,
    setValue,
    title,
    postfix,
    style,
    textStyle,
    disabled = false,
  } = props;
  const values = "values" in props ? props.values : undefined;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const checked = values ? values.includes(value as T) : Boolean(value);

  const animateCheckbox = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 0.8,
        useNativeDriver: true,
        speed: 50,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
      }),
    ]).start();
  };

  const handlePress = () => {
    if (disabled) return;

    animateCheckbox();

    if (values) {
      const newValues = !checked
        ? [...values, value as T]
        : values.filter((id) => id !== value);
      (setValue as (data: T[]) => void)(newValues);
    } else {
      // Режим с boolean
      (setValue as (data: boolean) => void)(!checked);
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.checkboxLabel,
        style,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
      onPress={handlePress}
      disabled={disabled}
    >
      {({ pressed }) => (
        <>
          <Animated.View
            style={[
              styles.checkbox,
              checked && styles.checkboxChecked,
              { transform: [{ scale: scaleAnim }] },
            ]}
          >
            {checked && <View style={styles.checkboxInner} />}
          </Animated.View>
          <View style={styles.textContainer}>
            <Text
              style={[
                styles.title,
                textStyle,
                disabled && styles.disabledText,
                pressed && !disabled && styles.pressedText,
              ]}
            >
              {title}
            </Text>
            {postfix && <View style={styles.postfix}>{postfix}</View>}
          </View>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  checkboxLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 8,
    backgroundColor: Colors.surface2,
    borderRadius: 6,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.accent,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: Colors.accent,
  },
  checkboxInner: {
    width: 10,
    height: 10,
    backgroundColor: Colors.fg,
    borderRadius: 2,
  },
  textContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  title: {
    color: Colors.fg,
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  postfix: {
    marginLeft: "auto",
  },
  pressed: {
    opacity: 0.8,
    transform: [{ translateX: 4 }],
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.5,
  },
  pressedText: {
    opacity: 0.8,
  },
});
