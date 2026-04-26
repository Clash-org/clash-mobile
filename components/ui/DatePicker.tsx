import { Colors, Fonts } from "@/constants";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react-native";
import React, { useState } from "react";
import {
  Dimensions,
  Modal,
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import Button from "./Button";

const { width: screenWidth } = Dimensions.get("window");

interface DatePickerProps {
  value?: Date;
  dateEnd?: Date;
  onChange?: (date: Date | undefined, dateEnd?: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
  disabled?: boolean;
  rangeMode?: boolean;
  locale?: string;
}

export default function DatePicker({
  value,
  dateEnd,
  onChange,
  minDate,
  maxDate,
  placeholder = "Выберите дату",
  disabled = false,
  rangeMode = false,
  locale = "ru",
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value || new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(value || null);
  const [selectedDateEnd, setSelectedDateEnd] = useState<Date | null>(
    dateEnd || null,
  );
  const [selectingEnd, setSelectingEnd] = useState(false);

  const months = [
    "Январь",
    "Февраль",
    "Март",
    "Апрель",
    "Май",
    "Июнь",
    "Июль",
    "Август",
    "Сентябрь",
    "Октябрь",
    "Ноябрь",
    "Декабрь",
  ];

  const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return firstDay === 0 ? 6 : firstDay - 1;
  };

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );
  };

  const isDateInRange = (date: Date): boolean => {
    if (!rangeMode) return false;
    if (!selectedDate || !selectedDateEnd) return false;
    const start = new Date(selectedDate);
    const end = new Date(selectedDateEnd);
    return date >= start && date <= end;
  };

  const isDateRangeStart = (date: Date): boolean => {
    if (!rangeMode || !selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const isDateRangeEnd = (date: Date): boolean => {
    if (!rangeMode || !selectedDateEnd) return false;
    return date.toDateString() === selectedDateEnd.toDateString();
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day,
    );

    if (minDate && newDate < minDate) return;
    if (maxDate && newDate > maxDate) return;

    if (rangeMode) {
      if (!selectingEnd || !selectedDate) {
        setSelectedDate(newDate);
        setSelectedDateEnd(null);
        setSelectingEnd(true);
        onChange?.(newDate, undefined);
      } else {
        let start = selectedDate;
        let end = newDate;
        if (end < start) {
          [start, end] = [end, start];
        }
        setSelectedDate(start);
        setSelectedDateEnd(end);
        setSelectingEnd(false);
        onChange?.(start, end);
        setIsOpen(false);
      }
    } else {
      setSelectedDate(newDate);
      onChange?.(newDate, undefined);
      setIsOpen(false);
    }
  };

  const isDateDisabled = (day: number) => {
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day,
    );
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const getRangeDisplayText = (): string => {
    if (!rangeMode) {
      return selectedDate ? formatDate(selectedDate) : placeholder;
    }
    if (selectedDate && selectedDateEnd) {
      return `${formatDate(selectedDate)} - ${formatDate(selectedDateEnd)}`;
    }
    if (selectedDate && !selectedDateEnd) {
      return `${formatDate(selectedDate)} - ...`;
    }
    return placeholder;
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.emptyDay} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day,
      );
      const isSelected =
        !rangeMode &&
        selectedDate &&
        selectedDate.getDate() === day &&
        selectedDate.getMonth() === currentMonth.getMonth() &&
        selectedDate.getFullYear() === currentMonth.getFullYear();
      const isToday =
        new Date().getDate() === day &&
        new Date().getMonth() === currentMonth.getMonth() &&
        new Date().getFullYear() === currentMonth.getFullYear();
      const isRangeStart = isDateRangeStart(currentDate);
      const isRangeEnd = isDateRangeEnd(currentDate);
      const isInRange = isDateInRange(currentDate);
      const isRangePreview =
        rangeMode &&
        selectedDate &&
        !selectedDateEnd &&
        !selectingEnd &&
        currentDate > selectedDate;
      const disabled = isDateDisabled(day);

      let dayStyle: StyleProp<ViewStyle>[] = [styles.day];
      if (isSelected) dayStyle.push(styles.selectedDay);
      if (isToday) dayStyle.push(styles.today);
      if (disabled) dayStyle.push(styles.disabledDay);
      if (rangeMode) dayStyle.push(styles.rangeDay);
      if (isRangeStart) dayStyle.push(styles.rangeStart);
      if (isRangeEnd) dayStyle.push(styles.rangeEnd);
      if (isInRange) dayStyle.push(styles.rangeInRange);
      if (isRangePreview) dayStyle.push(styles.rangePreview);

      days.push(
        <TouchableOpacity
          key={day}
          style={dayStyle}
          onPress={() => !disabled && handleDateSelect(day)}
          disabled={disabled}
        >
          <Text style={styles.dayText}>{day}</Text>
        </TouchableOpacity>,
      );
    }

    return days;
  };

  const handleResetRange = () => {
    setSelectedDate(null);
    setSelectedDateEnd(null);
    setSelectingEnd(false);
    onChange?.(undefined, undefined);
  };

  const handleTodayPress = () => {
    const today = new Date();
    setCurrentMonth(today);
    handleDateSelect(today.getDate());
  };

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={[styles.input, disabled && styles.disabled]}
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
      >
        <Calendar size={18} color={Colors.placeholder} />
        <Text style={styles.value}>{getRangeDisplayText()}</Text>
        {rangeMode && (selectedDate || selectedDateEnd) && (
          <TouchableOpacity
            onPress={handleResetRange}
            style={styles.clearButton}
          >
            <X size={16} color={Colors.placeholder} />
          </TouchableOpacity>
        )}
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
          <View style={styles.dropdown}>
            <View style={styles.header}>
              <TouchableOpacity
                onPress={handlePrevMonth}
                style={styles.monthNav}
              >
                <ChevronLeft size={20} color={Colors.fg} />
              </TouchableOpacity>
              <Text style={styles.monthYear}>
                {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </Text>
              <TouchableOpacity
                onPress={handleNextMonth}
                style={styles.monthNav}
              >
                <ChevronRight size={20} color={Colors.fg} />
              </TouchableOpacity>
            </View>

            <View style={styles.weekDays}>
              {weekDays.map((day) => (
                <Text key={day} style={styles.weekDay}>
                  {day}
                </Text>
              ))}
            </View>

            <View style={styles.days}>{renderCalendar()}</View>

            <View style={styles.footer}>
              {rangeMode && selectingEnd && selectedDate && (
                <Text style={styles.rangeHint}>Выберите конечную дату</Text>
              )}
              <View style={styles.footerButtons}>
                <Button
                  title="Сегодня"
                  onPress={handleTodayPress}
                  stroke
                  size="small"
                />
                {rangeMode && (selectedDate || selectedDateEnd) && (
                  <Button
                    title="Очистить"
                    onPress={handleResetRange}
                    stroke
                    size="small"
                  />
                )}
                <Button
                  title="Закрыть"
                  onPress={() => setIsOpen(false)}
                  stroke
                  size="small"
                />
              </View>
            </View>
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
  input: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.surface2,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  disabled: {
    opacity: 0.6,
  },
  value: {
    flex: 1,
    color: Colors.fg,
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  clearButton: {
    padding: 4,
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
    borderWidth: 1,
    borderColor: Colors.accent,
    padding: 16,
    width: screenWidth - 32,
    maxWidth: 400,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  monthNav: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.accentTransparent,
  },
  monthYear: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: Colors.fg,
  },
  weekDays: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    color: Colors.placeholder,
    paddingVertical: 8,
    fontFamily: Fonts.medium,
  },
  days: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  day: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
    borderRadius: 6,
  },
  dayText: {
    fontSize: 14,
    color: Colors.fg,
    fontFamily: Fonts.regular,
  },
  selectedDay: {
    backgroundColor: Colors.accent,
  },
  today: {
    borderColor: Colors.accent,
  },
  disabledDay: {
    opacity: 0.3,
  },
  emptyDay: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
  },
  rangeDay: {},
  rangeStart: {
    backgroundColor: Colors.accent,
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },
  rangeEnd: {
    backgroundColor: Colors.accent,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },
  rangeInRange: {
    backgroundColor: Colors.accentTransparent,
    borderRadius: 0,
  },
  rangePreview: {
    backgroundColor: "rgba(253, 80, 3, 0.15)",
    borderRadius: 0,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: Colors.accentTransparent,
    paddingTop: 16,
  },
  rangeHint: {
    textAlign: "center",
    fontSize: 12,
    color: Colors.accent,
    fontFamily: Fonts.medium,
    marginBottom: 12,
  },
  footerButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
});
