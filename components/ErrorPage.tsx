import { Colors, Fonts } from "@/constants";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

type ErrorPageProps = {
  style?: object;
  message?: string;
};

export default function ErrorPage({ style, message }: ErrorPageProps) {
  const { t } = useTranslation();
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{message || t("registerFirst")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.bg,
    padding: 20,
  },
  title: {
    fontSize: 20,
    color: Colors.accent,
    textAlign: "center",
    fontFamily: Fonts.bold,
  },
});
