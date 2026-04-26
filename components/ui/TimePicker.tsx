import { Colors, Fonts } from "@/constants";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";

interface TimePickerProps {
  value: number; // время в секундах
  onChange: (seconds: number) => void;
  min?: number; // минимальное время в секундах
  max?: number; // максимальное время в секундах
  step?: number; // шаг изменения в секундах
  disabled?: boolean;
  style?: ViewStyle;
}

export default function TimePicker({
  value,
  onChange,
  min = 0,
  max = 3600, // 1 час по умолчанию
  step = 1,
  disabled = false,
  style,
}: TimePickerProps) {
  const [isFocused, setIsFocused] = useState(false);
  const minutesInputRef = useRef<TextInput>(null);
  const secondsInputRef = useRef<TextInput>(null);

  // Преобразование секунд в минуты и секунды
  const getTimeParts = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return { minutes: mins, seconds: secs };
  };

  const { minutes, seconds } = getTimeParts(value);
  const [minutesValue, setMinutesValue] = useState(minutes.toString());
  const [secondsValue, setSecondsValue] = useState(
    seconds.toString().padStart(2, "0"),
  );

  // Синхронизация с внешним value
  useEffect(() => {
    if (!isFocused) {
      const { minutes: mins, seconds: secs } = getTimeParts(value);
      setMinutesValue(mins.toString());
      setSecondsValue(secs.toString().padStart(2, "0"));
    }
  }, [value, isFocused]);

  // Обновление общего значения
  const updateTotalValue = (mins: number, secs: number) => {
    const totalSeconds = mins * 60 + secs;
    const clampedValue = Math.min(Math.max(totalSeconds, min), max);
    onChange(clampedValue);
  };

  // Обработчики для минут
  const handleMinutesChange = (text: string) => {
    if ((text === "" || /^\d*$/.test(text)) && Number(text) < 60) {
      setMinutesValue(text);
    }
  };

  const handleMinutesBlur = () => {
    let numericValue = parseInt(minutesValue, 10) || 0;
    const maxMinutes = Math.floor(max / 60);
    numericValue = Math.min(Math.max(numericValue, 0), maxMinutes);

    setMinutesValue(numericValue.toString());
    updateTotalValue(numericValue, parseInt(secondsValue, 10));
    setIsFocused(false);
  };

  const incrementMinutes = () => {
    if (disabled) return;
    const currentMins = parseInt(minutesValue, 10) || 0;
    const newMins = Math.min(currentMins + 1, Math.floor(max / 60));
    if (newMins < 60) {
      setMinutesValue(newMins.toString());
      updateTotalValue(newMins, parseInt(secondsValue, 10));
    }
  };

  const decrementMinutes = () => {
    if (disabled) return;
    const currentMins = parseInt(minutesValue, 10) || 0;
    const newMins = Math.max(currentMins - 1, 0);
    setMinutesValue(newMins.toString());
    updateTotalValue(newMins, parseInt(secondsValue, 10));
  };

  // Обработчики для секунд
  const handleSecondsChange = (text: string) => {
    if (text === "" || /^\d*$/.test(text)) {
      setSecondsValue(text);
    }
  };

  const handleSecondsBlur = () => {
    let numericValue = parseInt(secondsValue, 10) || 0;
    numericValue = Math.min(Math.max(numericValue, 0), 59);

    setSecondsValue(numericValue.toString().padStart(2, "0"));
    updateTotalValue(parseInt(minutesValue, 10), numericValue);
    setIsFocused(false);
  };

  const incrementSeconds = () => {
    if (disabled) return;
    const currentSecs = parseInt(secondsValue, 10) || 0;
    let newSecs = currentSecs + step;
    let carryOverMins = 0;

    if (newSecs >= 60) {
      carryOverMins = Math.floor(newSecs / 60);
      if (Number(minutesValue) === 59) return;
      newSecs = newSecs % 60;
    }

    const currentMins = parseInt(minutesValue, 10) || 0;
    const totalMins = currentMins + carryOverMins;
    const maxMinutes = Math.floor(max / 60);

    if (totalMins <= maxMinutes) {
      setSecondsValue(newSecs.toString().padStart(2, "0"));
      setMinutesValue(totalMins.toString());
      updateTotalValue(totalMins, newSecs);
    }
  };

  const decrementSeconds = () => {
    if (disabled) return;
    const currentSecs = parseInt(secondsValue, 10) || 0;
    let newSecs = currentSecs - step;
    let borrowMins = 0;

    if (newSecs < 0) {
      borrowMins = Math.ceil(Math.abs(newSecs) / 60);
      newSecs = 60 - (Math.abs(newSecs) % 60);
      if (newSecs === 60) newSecs = 0;
    }

    const currentMins = parseInt(minutesValue, 10) || 0;
    const totalMins = Math.max(currentMins - borrowMins, 0);

    setSecondsValue(newSecs.toString().padStart(2, "0"));
    setMinutesValue(totalMins.toString());
    updateTotalValue(totalMins, newSecs);
  };

  const handleFocus = () => setIsFocused(true);

  return (
    <View style={[styles.container, disabled && styles.disabled, style]}>
      {/* Минуты */}
      <View style={styles.timePart}>
        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.button}
            onPress={incrementMinutes}
            disabled={disabled}
            activeOpacity={0.7}
          >
            <ChevronUp size={14} color={Colors.surface} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={decrementMinutes}
            disabled={disabled}
            activeOpacity={0.7}
          >
            <ChevronDown size={14} color={Colors.surface} />
          </TouchableOpacity>
        </View>
        <TextInput
          ref={minutesInputRef}
          style={styles.input}
          value={minutesValue}
          onChangeText={handleMinutesChange}
          onBlur={handleMinutesBlur}
          onFocus={handleFocus}
          keyboardType="numeric"
          editable={!disabled}
          textAlign="center"
        />
      </View>

      <Text style={styles.separator}>:</Text>

      {/* Секунды */}
      <View style={styles.timePart}>
        <TextInput
          ref={secondsInputRef}
          style={styles.input}
          value={secondsValue}
          onChangeText={handleSecondsChange}
          onBlur={handleSecondsBlur}
          onFocus={handleFocus}
          keyboardType="numeric"
          editable={!disabled}
          textAlign="center"
        />
        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.button}
            onPress={incrementSeconds}
            disabled={disabled}
            activeOpacity={0.7}
          >
            <ChevronUp size={14} color={Colors.surface} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={decrementSeconds}
            disabled={disabled}
            activeOpacity={0.7}
          >
            <ChevronDown size={14} color={Colors.surface} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.fg,
    borderRadius: 6,
    backgroundColor: Colors.accent,
    width: "auto",
  },
  timePart: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  input: {
    width: 40,
    textAlign: "center",
    backgroundColor: "transparent",
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: Colors.fg,
    paddingVertical: Platform.OS === "ios" ? 8 : 4,
    paddingHorizontal: 4,
  },
  buttons: {
    flexDirection: "column",
    gap: 1,
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    width: 20,
    height: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 2,
  },
  separator: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: Colors.fg,
  },
  disabled: {
    opacity: 0.6,
  },
});
