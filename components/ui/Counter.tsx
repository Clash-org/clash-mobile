import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Platform,
  Animated,
} from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import { Colors, Fonts } from '@/constants';

interface CounterProps {
  label: string;
  value: number;
  onInc: (value: number) => void;
  onDec: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  valueStyle?: TextStyle;
  disabled?: boolean;
  longPressDelay?: number;
  longPressInterval?: number;
}

export default function Counter({
  label,
  value,
  onInc,
  onDec,
  min = 0,
  max = Infinity,
  step = 1,
  style,
  labelStyle,
  valueStyle,
  disabled = false,
  longPressDelay = 500,
  longPressInterval = 100,
}: CounterProps) {
  const [isLongPressingInc, setIsLongPressingInc] = useState(false);
  const [isLongPressingDec, setIsLongPressingDec] = useState(false);
  const longPressTimeout = useRef<NodeJS.Timeout>();
  const intervalTimeout = useRef<NodeJS.Timeout>();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const isMin = value <= min;
  const isMax = value >= max;

  const animateButton = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 0.95,
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

  const inc = () => {
    if (value + step <= max && !disabled) {
      animateButton();
      onInc(value + step);
    }
  };

  const dec = () => {
    if (value - step >= min && !disabled) {
      animateButton();
      onDec(value - step);
    }
  };

  const startLongPressInc = () => {
    if (isMax || disabled) return;

    longPressTimeout.current = setTimeout(() => {
      setIsLongPressingInc(true);
      inc();

      intervalTimeout.current = setInterval(() => {
        if (value + step <= max && !disabled) {
          onInc(value + step);
        } else {
          stopLongPress();
        }
      }, longPressInterval);
    }, longPressDelay);
  };

  const startLongPressDec = () => {
    if (isMin || disabled) return;

    longPressTimeout.current = setTimeout(() => {
      setIsLongPressingDec(true);
      dec();

      intervalTimeout.current = setInterval(() => {
        if (value - step >= min && !disabled) {
          onDec(value - step);
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
    setIsLongPressingInc(false);
    setIsLongPressingDec(false);
  };

  useEffect(() => {
    return () => {
      stopLongPress();
    };
  }, []);

  return (
    <View style={[styles.wrap, style]}>
      <Text style={[styles.counterLabel, labelStyle]}>{label}</Text>
      <View style={styles.counterRow}>
        <TouchableOpacity
          style={[
            styles.counterButton,
            (isMin || disabled) && styles.disabled,
            isLongPressingDec && styles.longPressing,
          ]}
          onPress={dec}
          onPressIn={startLongPressDec}
          onPressOut={stopLongPress}
          disabled={isMin || disabled}
          activeOpacity={0.7}
          accessibilityLabel={`Уменьшить ${label}`}
          accessibilityRole="button"
        >
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Minus
              size={20}
              color={(isMin || disabled) ? Colors.placeholder : Colors.fg}
            />
          </Animated.View>
        </TouchableOpacity>

        <Text style={[styles.counterValue, valueStyle]}>{value}</Text>

        <TouchableOpacity
          style={[
            styles.counterButton,
            (isMax || disabled) && styles.disabled,
            isLongPressingInc && styles.longPressing,
          ]}
          onPress={inc}
          onPressIn={startLongPressInc}
          onPressOut={stopLongPress}
          disabled={isMax || disabled}
          activeOpacity={0.7}
          accessibilityLabel={`Увеличить ${label}`}
          accessibilityRole="button"
        >
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Plus
              size={20}
              color={(isMax || disabled) ? Colors.placeholder : Colors.fg}
            />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    marginVertical: 6,
    gap: 6,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
    paddingHorizontal: 12,
    gap: 8,
  },
  counterLabel: {
    color: Colors.fg,
    fontSize: 14,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    minWidth: 70,
  },
  counterValue: {
    color: Colors.fg,
    fontSize: 18,
    marginHorizontal: 8,
    minWidth: 24,
    textAlign: 'center',
    fontFamily: Fonts.regular,
    ...Platform.select({
      ios: {
        fontVariant: ['tabular-nums'],
      },
      android: {
        includeFontPadding: false,
      },
      default: {
        fontFeatureSettings: '"tnum"',
      },
    }),
  },
  counterButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: Colors.surface,
  },
  longPressing: {
    backgroundColor: Colors.accent,
  },
  disabled: {
    opacity: 0.5,
  },
});