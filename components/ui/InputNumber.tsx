import { Colors, Fonts } from "@/constants";
import { Minus, Plus } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
    Platform,
    StyleSheet,
    TextInput,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";

interface InputNumberProps {
  value: number;
  setValue: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  size?: "small" | "medium" | "large";
  required?: boolean;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  longPressDelay?: number;
  longPressInterval?: number;
}

export default function InputNumber({
  value,
  setValue,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  className = "",
  placeholder = "0",
  size = "medium",
  required = false,
  style,
  inputStyle,
  longPressDelay = 500,
  longPressInterval = 100,
}: InputNumberProps) {
  const [inputValue, setInputValue] = useState(value.toString());
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const longPressTimeout = useRef<NodeJS.Timeout | null>(null);
  const intervalTimeout = useRef<NodeJS.Timeout | null>(null);
  const isLongPressing = useRef(false);

  // Синхронизация с внешним value
  useEffect(() => {
    if (!isFocused) {
      setInputValue(value.toString());
    }
  }, [value, isFocused]);

  useEffect(() => {
    return () => {
      if (longPressTimeout.current) clearTimeout(longPressTimeout.current);
      if (intervalTimeout.current) clearInterval(intervalTimeout.current);
    };
  }, []);

  const handleInputChange = (text: string) => {
    if (text === "" || /^-?\d*$/.test(text)) {
      setInputValue(text);
    }
  };

  const handleInputBlur = () => {
    setIsFocused(false);

    let numericValue = parseInt(inputValue, 10);

    if (isNaN(numericValue)) {
      numericValue = min;
    }

    const clampedValue = Math.min(Math.max(numericValue, min), max);
    setInputValue(clampedValue.toString());
    setValue(clampedValue);
  };

  const handleInputFocus = () => {
    setIsFocused(true);
  };

  const increment = () => {
    if (!disabled) {
      const newValue = Math.min(value + step, max);
      setInputValue(newValue.toString());
      setValue(newValue);
    }
  };

  const decrement = () => {
    if (!disabled) {
      const newValue = Math.max(value - step, min);
      setInputValue(newValue.toString());
      setValue(newValue);
    }
  };

  const startLongPressInc = () => {
    if (value >= max || disabled) return;

    longPressTimeout.current = setTimeout(() => {
      isLongPressing.current = true;
      increment();

      intervalTimeout.current = setInterval(() => {
        if (value + step <= max && !disabled) {
          setValue(Math.min(value + step, max));
        } else {
          stopLongPress();
        }
      }, longPressInterval);
    }, longPressDelay);
  };

  const startLongPressDec = () => {
    if (value <= min || disabled) return;

    longPressTimeout.current = setTimeout(() => {
      isLongPressing.current = true;
      decrement();

      intervalTimeout.current = setInterval(() => {
        if (value - step >= min && !disabled) {
          setValue(Math.max(value - step, min));
        } else {
          stopLongPress();
        }
      }, longPressInterval);
    }, longPressDelay);
  };

  const stopLongPress = () => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
    }
    if (intervalTimeout.current) {
      clearInterval(intervalTimeout.current);
    }
    isLongPressing.current = false;
  };

  const getSizeStyles = (): ViewStyle => {
    switch (size) {
      case "small":
        return { height: 32 };
      case "large":
        return { height: 48 };
      default:
        return { height: 40 };
    }
  };

  const getButtonSize = (): number => {
    switch (size) {
      case "small":
        return 28;
      case "large":
        return 44;
      default:
        return 36;
    }
  };

  const getIconSize = (): number => {
    switch (size) {
      case "small":
        return 14;
      case "large":
        return 18;
      default:
        return 16;
    }
  };

  const getInputWidth = (): number => {
    switch (size) {
      case "small":
        return 50;
      case "large":
        return 70;
      default:
        return 60;
    }
  };

  const getFontSize = (): number => {
    switch (size) {
      case "small":
        return 14;
      case "large":
        return 18;
      default:
        return 16;
    }
  };

  const buttonSize = getButtonSize();
  const iconSize = getIconSize();
  const inputWidth = getInputWidth();
  const fontSize = getFontSize();

  const isMinDisabled = disabled || value <= min;
  const isMaxDisabled = disabled || value >= max;

  return (
    <View
      style={[
        styles.container,
        getSizeStyles(),
        disabled && styles.disabled,
        isFocused && styles.focused,
        style,
      ]}
    >
      <TouchableOpacity
        style={[
          styles.button,
          { width: buttonSize },
          isMinDisabled && styles.buttonDisabled,
        ]}
        onPress={decrement}
        onPressIn={startLongPressDec}
        onPressOut={stopLongPress}
        disabled={isMinDisabled}
        activeOpacity={0.7}
        accessibilityLabel="Уменьшить"
      >
        <Minus
          size={iconSize}
          color={isMinDisabled ? Colors.placeholder : Colors.fg}
        />
      </TouchableOpacity>

      <TextInput
        ref={inputRef}
        style={[
          styles.input,
          {
            width: inputWidth,
            fontSize: fontSize,
          },
          inputStyle,
          disabled && styles.inputDisabled,
        ]}
        value={inputValue}
        onChangeText={handleInputChange}
        onBlur={handleInputBlur}
        onFocus={handleInputFocus}
        editable={!disabled}
        keyboardType="numeric"
        placeholder={required ? `${placeholder} *` : placeholder}
        placeholderTextColor={Colors.placeholder}
        textAlign="center"
        accessibilityLabel="Числовое значение"
      />

      <TouchableOpacity
        style={[
          styles.button,
          { width: buttonSize },
          isMaxDisabled && styles.buttonDisabled,
        ]}
        onPress={increment}
        onPressIn={startLongPressInc}
        onPressOut={stopLongPress}
        disabled={isMaxDisabled}
        activeOpacity={0.7}
        accessibilityLabel="Увеличить"
      >
        <Plus
          size={iconSize}
          color={isMaxDisabled ? Colors.placeholder : Colors.fg}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: Colors.surface2,
    borderRadius: 6,
    backgroundColor: Colors.surface,
    overflow: "hidden",
  },
  focused: {
    borderColor: Colors.accent,
    ...Platform.select({
      ios: {
        shadowColor: Colors.accent,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    backgroundColor: "transparent",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  input: {
    height: "100%",
    backgroundColor: "transparent",
    color: Colors.fg,
    paddingHorizontal: 8,
    fontFamily: Fonts.regular,
    textAlign: "center",
    ...Platform.select({
      ios: {
        paddingVertical: 0,
      },
    }),
  },
  inputDisabled: {
    opacity: 0.6,
  },
  disabled: {
    opacity: 0.6,
  },
});
