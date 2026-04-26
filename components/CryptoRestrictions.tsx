import { Colors, Fonts } from "@/constants";
import { languageAtom } from "@/store";
import { useAtom } from "jotai";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, View } from "react-native";

interface RestrictedCountry {
  names: {
    ru: string;
    en: string;
    zh: string;
  };
  languageGroup: string[];
}

const restrictedCountries: RestrictedCountry[] = [
  {
    names: { ru: "Алжир", en: "Algeria", zh: "阿尔及利亚" },
    languageGroup: ["en"],
  },
  {
    names: { ru: "Бангладеш", en: "Bangladesh", zh: "孟加拉国" },
    languageGroup: ["en"],
  },
  {
    names: { ru: "Боливия", en: "Bolivia", zh: "玻利维亚" },
    languageGroup: ["en"],
  },
  { names: { ru: "Китай", en: "China", zh: "中国" }, languageGroup: ["zh"] },
  { names: { ru: "Египет", en: "Egypt", zh: "埃及" }, languageGroup: ["en"] },
  {
    names: { ru: "Индонезия", en: "Indonesia", zh: "印度尼西亚" },
    languageGroup: ["en"],
  },
  { names: { ru: "Ирак", en: "Iraq", zh: "伊拉克" }, languageGroup: ["en"] },
  {
    names: { ru: "Марокко", en: "Morocco", zh: "摩洛哥" },
    languageGroup: ["en"],
  },
  { names: { ru: "Непал", en: "Nepal", zh: "尼泊尔" }, languageGroup: ["en"] },
  { names: { ru: "Катар", en: "Qatar", zh: "卡塔尔" }, languageGroup: ["en"] },
  {
    names: { ru: "Саудовская Аравия", en: "Saudi Arabia", zh: "沙特阿拉伯" },
    languageGroup: ["en"],
  },
  {
    names: { ru: "Тунис", en: "Tunisia", zh: "突尼斯" },
    languageGroup: ["en"],
  },
  {
    names: { ru: "Турция", en: "Turkey", zh: "土耳其" },
    languageGroup: ["en"],
  },
  {
    names: { ru: "Вьетнам", en: "Vietnam", zh: "越南" },
    languageGroup: ["en"],
  },
  {
    names: { ru: "Нигерия", en: "Nigeria", zh: "尼日利亚" },
    languageGroup: ["en"],
  },
  {
    names: { ru: "Колумбия", en: "Colombia", zh: "哥伦比亚" },
    languageGroup: ["en"],
  },
  {
    names: {
      ru: "Доминиканская Республика",
      en: "Dominican Republic",
      zh: "多米尼加共和国",
    },
    languageGroup: ["en"],
  },
  { names: { ru: "Гана", en: "Ghana", zh: "加纳" }, languageGroup: ["en"] },
  {
    names: { ru: "Лесото", en: "Lesotho", zh: "莱索托" },
    languageGroup: ["en"],
  },
  {
    names: { ru: "Ливан", en: "Lebanon", zh: "黎巴嫩" },
    languageGroup: ["en"],
  },
  {
    names: { ru: "Северная Македония", en: "North Macedonia", zh: "北马其顿" },
    languageGroup: ["en"],
  },
  { names: { ru: "Самоа", en: "Samoa", zh: "萨摩亚" }, languageGroup: ["en"] },
  {
    names: { ru: "Шри-Ланка", en: "Sri Lanka", zh: "斯里兰卡" },
    languageGroup: ["en"],
  },
  {
    names: { ru: "Россия", en: "Russia", zh: "俄罗斯" },
    languageGroup: ["ru"],
  },
];

export default function CryptoRestrictions() {
  const { t } = useTranslation();
  const [lang] = useAtom(languageAtom);

  const getCountryName = (country: RestrictedCountry) => {
    return (
      country.names[lang as keyof typeof country.names] || country.names.en
    );
  };

  const shouldHighlight = (country: RestrictedCountry) => {
    return country.languageGroup.includes(lang);
  };

  return (
    <View style={styles.container}>
      <View style={styles.quoteBlock}>
        <Text style={styles.quoteIcon}>“</Text>
        <View style={styles.quoteContent}>
          <Text style={styles.quoteText}>{t("cryptoRestrictions")}</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.countriesList}
          >
            {restrictedCountries.map((country, index) => (
              <View
                key={country.names.en}
                style={[
                  styles.countryItem,
                  shouldHighlight(country) && styles.countryItemHighlighted,
                ]}
              >
                <Text
                  style={[
                    styles.countryName,
                    shouldHighlight(country) && styles.countryNameHighlighted,
                  ]}
                >
                  {getCountryName(country)}
                </Text>
              </View>
            ))}
          </ScrollView>

          <Text style={styles.quoteFooter}>
            {t("infoCurrent", { year: 2026 })}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  quoteBlock: {
    position: "relative",
    backgroundColor: `rgba(${Colors.accentRgb}, 0.05)`,
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent,
    borderRadius: 12,
    padding: 24,
    marginBottom: 15,
    shadowColor: Colors.bg,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quoteIcon: {
    position: "absolute",
    top: 16,
    left: 16,
    fontSize: 48,
    fontFamily: Fonts.bold,
    color: Colors.accent,
    opacity: 0.3,
  },
  quoteContent: {
    position: "relative",
    zIndex: 1,
  },
  quoteText: {
    fontSize: 16,
    lineHeight: 26,
    color: Colors.fg,
    marginBottom: 20,
    paddingLeft: 20,
  },
  countriesList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingVertical: 20,
  },
  countryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: `rgba(${Colors.accentRgb}, 0.1)`,
  },
  countryItemHighlighted: {
    backgroundColor: `rgba(${Colors.accentRgb}, 0.15)`,
    borderColor: Colors.accent,
    position: "relative",
    overflow: "hidden",
  },
  countryName: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.fg,
  },
  countryNameHighlighted: {
    color: Colors.accent,
    fontWeight: "600",
  },
  quoteFooter: {
    fontSize: 12,
    fontStyle: "italic",
    color: Colors.placeholder,
    marginTop: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: `rgba(${Colors.accentRgb}, 0.1)`,
  },
});
