import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { Colors, Fonts } from '@/constants';

interface ButtonProps {
  title?: string;
  children?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  stroke?: boolean;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export default function Button({
  title,
  children,
  onPress,
  style = {},
  textStyle = {},
  stroke = false,
  disabled = false,
  loading = false,
  fullWidth = false,
  size = 'medium',
}: ButtonProps) {
  const getSizeStyles = (): ViewStyle => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: 8,
          paddingHorizontal: 16,
          minWidth: 80,
        };
      case 'large':
        return {
          paddingVertical: 16,
          paddingHorizontal: 24,
          minWidth: 120,
        };
      default:
        return {
          paddingVertical: 14,
          paddingHorizontal: 20,
          minWidth: 100,
        };
    }
  };

  const getTextSize = (): number => {
    switch (size) {
      case 'small':
        return 14;
      case 'large':
        return 18;
      default:
        return 16;
    }
  };

  const buttonStyles = [
    styles.button,
    getSizeStyles(),
    stroke ? styles.stroke : styles.solid,
    disabled && styles.disabled,
    fullWidth && styles.fullWidth,
    style,
  ];

  const textStyles = [
    styles.text,
    stroke ? styles.strokeText : styles.solidText,
    { fontSize: getTextSize() },
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={stroke ? Colors.accent : Colors.fg} />
      ) : (
        <>
          {children}
          {title && !children && <Text style={textStyles}>{title}</Text>}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  solid: {
    backgroundColor: Colors.accent,
  },
  stroke: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  disabled: {
    opacity: 0.5,
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontFamily: Fonts.semiBold,
    textAlign: 'center',
  },
  solidText: {
    color: Colors.fg,
  },
  strokeText: {
    color: Colors.fg,
  },
  disabledText: {
    opacity: 0.5,
  },
});