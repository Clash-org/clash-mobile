import { LangType } from "@/typings";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { resources } from "./resources";

const LANGUAGE_KEY = "language";

// Получение сохраненного языка
export const getStoredLanguage = async (): Promise<LangType | null> => {
  try {
    const language = await AsyncStorage.getItem(LANGUAGE_KEY);
    return language as LangType | null;
  } catch (error) {
    console.error("Error getting language:", error);
    return null;
  }
};

// Сохранение языка
export const setStoredLanguage = async (language: LangType) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, language);
  } catch (error) {
    console.error("Error saving language:", error);
  }
};

// Получение языка устройства
export const getDeviceLanguage = (): LangType => {
  const locale = Localization.getLocales()[0];
  const languageCode = locale.languageCode;

  if (languageCode === "ru") return "ru";
  if (languageCode === "zh") return "zh";
  return "en"; // default to English
};

// Инициализация i18n
export const initI18n = async (setLang: (lang: LangType) => void) => {
  let initialLanguage: LangType = "en";

  // Пытаемся получить сохраненный язык
  const storedLanguage = await getStoredLanguage();

  if (storedLanguage && storedLanguage in resources) {
    initialLanguage = storedLanguage;
  } else {
    // Используем язык устройства
    initialLanguage = getDeviceLanguage();
  }

  setLang(initialLanguage);

  await i18n.use(initReactI18next).init({
    resources,
    lng: initialLanguage,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });

  return i18n;
};

// Смена языка
export const changeLanguage = async (language: LangType) => {
  await setStoredLanguage(language);
  await i18n.changeLanguage(language);
};

export default i18n;
