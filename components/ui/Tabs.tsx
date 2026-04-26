import { Colors, Fonts } from "@/constants";
import React, { ReactNode } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";

type TabsProps<T> = {
  titles: string[] | ReactNode[];
  tabs: readonly T[];
  activeTab: T;
  setActiveTab: (val: T) => void;
  withoutBottom?: boolean;
  style?: ViewStyle;
  tabStyle?: ViewStyle;
  activeTabStyle?: ViewStyle;
  textStyle?: TextStyle;
  activeTextStyle?: TextStyle;
  scrollable?: boolean;
};

export default function Tabs<T>({
  titles,
  tabs,
  activeTab,
  setActiveTab,
  withoutBottom = false,
  style,
  tabStyle,
  activeTabStyle,
  textStyle,
  activeTextStyle,
  scrollable = false,
}: TabsProps<T>) {
  const Container = scrollable ? ScrollView : View;

  const containerProps = scrollable
    ? {
        horizontal: true,
        showsHorizontalScrollIndicator: false,
        contentContainerStyle: styles.scrollContent,
      }
    : {};

  return (
    <Container
      style={[styles.tabs, withoutBottom && styles.tabsWithoutBottom, style]}
      {...containerProps}
    >
      {tabs.map((tab, i) => {
        const isActive = activeTab === tab;
        const title = titles[i];
        const isStringTitle = typeof title === "string";

        return (
          <TouchableOpacity
            key={i}
            style={[
              styles.tab,
              isActive && styles.activeTab,
              tabStyle,
              isActive && activeTabStyle,
            ]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.7}
          >
            {isStringTitle ? (
              <Text
                style={[
                  styles.tabText,
                  isActive && styles.activeTabText,
                  textStyle,
                  isActive && activeTextStyle,
                ]}
              >
                {title}
              </Text>
            ) : (
              title
            )}
          </TouchableOpacity>
        );
      })}
    </Container>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 16,
    backgroundColor: Colors.accentTransparent,
    padding: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  tabsWithoutBottom: {
    marginBottom: 0,
  },
  scrollContent: {
    flexDirection: "row",
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "transparent",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  activeTab: {
    backgroundColor: Colors.accent,
  },
  tabText: {
    color: Colors.fg,
    fontFamily: Fonts.medium,
    fontSize: 16,
    textAlign: "center",
  },
  activeTabText: {
    color: Colors.fg,
  },
});
