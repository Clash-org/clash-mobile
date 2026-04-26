import { Colors, Fonts } from "@/constants";
import React, { useState } from "react";
import {
  Platform,
  StyleSheet,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";

interface InputTextProps {
  setValue?: ((text: string) => void) | undefined;
  onKeyDown?: ((e: any) => void) | undefined;
  value?: string | undefined;
  placeholder?: string | undefined;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  type?: "text" | "email" | "password" | "number" | "phone";
  multiline?: boolean | undefined;
  rows?: number;
  maxLength?: number;
  disabled?: boolean;
  required?: boolean;
  editable?: boolean;
  autoFocus?: boolean;
  returnKeyType?: "done" | "go" | "next" | "search" | "send";
  onSubmitEditing?: () => void;
}

export default function InputText({
  setValue,
  onKeyDown,
  value,
  placeholder,
  style,
  inputStyle,
  type = "text",
  multiline = false,
  rows = 3,
  disabled = false,
  maxLength,
  required = false,
  editable = true,
  autoFocus = false,
  returnKeyType = "done",
  onSubmitEditing,
}: InputTextProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (text: string) => {
    setValue?.(text);
  };

  const handleKeyPress = (e: any) => {
    if (onKeyDown && e.nativeEvent.key === "Enter") {
      onKeyDown(e);
    }
  };

  const getKeyboardType = (): TextInputProps["keyboardType"] => {
    switch (type) {
      case "email":
        return "email-address";
      case "number":
        return "numeric";
      case "phone":
        return "phone-pad";
      default:
        return "default";
    }
  };

  const getSecureTextEntry = (): boolean => {
    return type === "password";
  };

  const getAutoCapitalize = ():
    | "none"
    | "sentences"
    | "words"
    | "characters" => {
    switch (type) {
      case "email":
        return "none";
      default:
        return "sentences";
    }
  };

  const placeholderText =
    required && placeholder ? `${placeholder} *` : placeholder;

  return (
    <View style={[styles.wrapper, style]}>
      <TextInput
        style={[
          styles.input,
          multiline && styles.textarea,
          isFocused && styles.focused,
          disabled && styles.disabled,
          { minHeight: multiline ? 40 * rows : 40 },
          inputStyle,
        ]}
        value={value}
        onChangeText={handleChange}
        onKeyPress={handleKeyPress}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholderText}
        placeholderTextColor={Colors.placeholder}
        editable={!disabled && editable}
        maxLength={maxLength}
        keyboardType={getKeyboardType()}
        secureTextEntry={getSecureTextEntry()}
        autoCapitalize={getAutoCapitalize()}
        multiline={multiline}
        numberOfLines={multiline ? rows : 1}
        textAlignVertical={multiline ? "top" : "center"}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        autoFocus={autoFocus}
        {...Platform.select({
          ios: {
            autoCorrect: true,
            spellCheck: true,
          },
          android: {
            autoCorrect: false,
          },
        })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
  },
  input: {
    backgroundColor: Colors.surface2,
    color: Colors.fg,
    borderRadius: 8,
    padding: 12,
    fontFamily: Fonts.regular,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "transparent",
    width: "100%",
    ...Platform.select({
      ios: {
        paddingVertical: 12,
      },
      android: {
        paddingVertical: 8,
      },
    }),
  },
  textarea: {
    textAlignVertical: "top",
    paddingTop: 12,
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
  disabled: {
    opacity: 0.6,
  },
});
