import { Colors, Fonts } from "@/constants";
import { Check, ChevronDown, X } from "lucide-react-native";
import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    FlatList,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";

export interface SelectOption<T> {
  value: T;
  label: string;
}

interface SelectProps<T> {
  options: SelectOption<T>[];
  value?: T | T[];
  inputValue?: string;
  setValue: (value: any) => void;
  setInputValue?: (value: string) => void;
  placeholder?: string;
  error?: boolean;
  fit?: boolean;
  disabled?: boolean;
  multiple?: boolean;
  maxSelected?: number;
  required?: boolean;
  style?: ViewStyle;
  triggerStyle?: ViewStyle;
  dropdownStyle?: ViewStyle;
  optionStyle?: ViewStyle;
  optionTextStyle?: TextStyle;
}

export default function Select<T>({
  options,
  value,
  inputValue,
  setValue,
  setInputValue,
  placeholder = "Выберите...",
  error = false,
  fit = false,
  disabled = false,
  multiple = false,
  maxSelected,
  style,
  triggerStyle,
  dropdownStyle,
  optionStyle,
  optionTextStyle,
}: SelectProps<T>) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const inputRef = useRef<TextInput>(null);

  // Нормализация value в зависимости от режима
  const selectedValues = multiple
    ? Array.isArray(value)
      ? value
      : []
    : value !== undefined
      ? [value]
      : [];

  const selectedOptions = options.filter((opt) =>
    selectedValues.includes(opt.value),
  );

  // Фильтрация опций по поиску
  const filteredOptions = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (multiple ? true : !selectedValues.includes(opt.value)),
  );

  const handleSelectOption = (option: SelectOption<T>) => {
    if (multiple) {
      let newValues: T[];
      if (selectedValues.includes(option.value)) {
        newValues = selectedValues.filter((v) => v !== option.value);
      } else {
        if (maxSelected && selectedValues.length >= maxSelected) {
          return;
        }
        newValues = [...selectedValues, option.value];
      }
      setValue(newValues);
      setSearchTerm("");
    } else {
      setValue(option.value);
      setInputValue?.(option.label);
      setIsOpen(false);
      setSearchTerm("");
    }
  };

  const handleRemoveOption = (optionValue: T) => {
    if (!multiple) return;
    const newValues = selectedValues.filter((v) => v !== optionValue);
    setValue(newValues);
  };

  const handleClearAll = () => {
    if (!multiple) return;
    setValue([]);
  };

  const getDisplayText = (): string => {
    if (multiple) {
      return selectedOptions.length > 0
        ? `${selectedOptions.length} выбрано`
        : placeholder;
    }
    if (setInputValue !== undefined && inputValue) {
      return inputValue;
    }
    return selectedOptions[0]?.label || placeholder;
  };

  const renderSelectedTags = () => {
    if (!multiple || selectedOptions.length === 0) return null;

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tagsContainer}
        contentContainerStyle={styles.tagsContent}
      >
        {selectedOptions.map((option) => (
          <View key={String(option.value)} style={styles.tag}>
            <Text style={styles.tagText} numberOfLines={1}>
              {option.label}
            </Text>
            {!disabled && (
              <TouchableOpacity
                onPress={() => handleRemoveOption(option.value)}
                style={styles.tagRemove}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={12} color={Colors.fg} />
              </TouchableOpacity>
            )}
          </View>
        ))}
        {maxSelected && selectedValues.length >= maxSelected && (
          <View style={styles.tagLimit}>
            <Text style={styles.tagLimitText}>Лимит: {maxSelected}</Text>
          </View>
        )}
        {selectedValues.length > 0 && !disabled && (
          <TouchableOpacity onPress={handleClearAll} style={styles.clearAll}>
            <X size={14} color={Colors.placeholder} />
          </TouchableOpacity>
        )}
      </ScrollView>
    );
  };

  const renderOption = ({ item: option }: { item: SelectOption<T> }) => {
    const isSelected = selectedValues.includes(option.value);

    return (
      <TouchableOpacity
        style={[
          styles.option,
          isSelected && styles.optionSelected,
          optionStyle,
        ]}
        onPress={() => handleSelectOption(option)}
        activeOpacity={0.7}
      >
        {multiple && (
          <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
            {isSelected && <Check size={12} color={Colors.fg} />}
          </View>
        )}
        <Text
          style={[
            styles.optionLabel,
            isSelected && styles.optionLabelSelected,
            optionTextStyle,
          ]}
        >
          {option.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.wrapper, fit && styles.wrapperFit, style]}>
      {multiple && renderSelectedTags()}

      <TouchableOpacity
        style={[
          styles.trigger,
          error && styles.triggerError,
          disabled && styles.triggerDisabled,
          isOpen && styles.triggerOpen,
          triggerStyle,
        ]}
        onPress={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <TextInput
          ref={inputRef}
          style={[styles.input, multiple && styles.inputMultiple]}
          value={isOpen ? searchTerm : getDisplayText()}
          onChangeText={setSearchTerm}
          onFocus={() => !disabled && setIsOpen(true)}
          placeholder={selectedOptions.length === 0 ? placeholder : ""}
          placeholderTextColor={Colors.placeholder}
          editable={!disabled}
          pointerEvents={disabled ? "none" : "auto"}
        />
        <ChevronDown
          size={20}
          color={isOpen ? Colors.accent : Colors.placeholder}
          style={[styles.icon, isOpen && styles.iconOpen]}
        />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={[styles.dropdown, dropdownStyle]}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>
                {multiple ? "Выберите опции" : "Выберите опцию"}
              </Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <X size={20} color={Colors.placeholder} />
              </TouchableOpacity>
            </View>

            {filteredOptions.length > 0 ? (
              <FlatList
                data={filteredOptions}
                renderItem={renderOption}
                keyExtractor={(item) => String(item.value)}
                showsVerticalScrollIndicator
                style={styles.optionsList}
              />
            ) : (
              <View style={styles.noOptions}>
                <Text style={styles.noOptionsText}>
                  {t("noMatches") || "Ничего не найдено"}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
    width: "100%",
  },
  wrapperFit: {
    width: "auto",
  },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "transparent",
    minHeight: 44,
    paddingHorizontal: 12,
  },
  triggerOpen: {
    borderColor: Colors.accent,
  },
  triggerError: {
    borderColor: "#FF4444",
  },
  triggerDisabled: {
    opacity: 0.6,
  },
  input: {
    flex: 1,
    color: Colors.fg,
    fontSize: 16,
    fontFamily: Fonts.regular,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    paddingHorizontal: 0,
  },
  inputMultiple: {
    paddingVertical: 8,
  },
  icon: {
    marginLeft: 8,
    transition: "transform 0.2s ease",
  },
  iconOpen: {
    transform: [{ rotate: "180deg" }],
  },
  tagsContainer: {
    marginBottom: 8,
  },
  tagsContent: {
    flexDirection: "row",
    gap: 6,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.accent,
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 6,
    gap: 4,
  },
  tagText: {
    color: Colors.fg,
    fontSize: 12,
    fontFamily: Fonts.medium,
  },
  tagRemove: {
    padding: 2,
  },
  tagLimit: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 6,
  },
  tagLimitText: {
    color: Colors.placeholder,
    fontSize: 12,
    fontFamily: Fonts.regular,
  },
  clearAll: {
    padding: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  dropdown: {
    backgroundColor: Colors.surface2,
    borderRadius: 12,
    width: "90%",
    maxWidth: 400,
    maxHeight: "80%",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  dropdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.accentTransparent,
  },
  dropdownTitle: {
    color: Colors.fg,
    fontSize: 16,
    fontFamily: Fonts.bold,
  },
  optionsList: {
    maxHeight: 300,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  optionSelected: {
    backgroundColor: Colors.accentTransparent,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: Colors.accent,
  },
  optionLabel: {
    flex: 1,
    color: Colors.fg,
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  optionLabelSelected: {
    color: Colors.accent,
    fontFamily: Fonts.medium,
  },
  noOptions: {
    padding: 32,
    alignItems: "center",
  },
  noOptionsText: {
    color: Colors.placeholder,
    fontSize: 14,
    fontFamily: Fonts.regular,
    textAlign: "center",
  },
});
