import en from "./locales/en.json";
import ru from "./locales/ru.json";
import zh from "./locales/zh.json";

export const resources = {
  ru: { translation: ru },
  en: { translation: en },
  zh: { translation: zh },
};

export const languages = {
  ru: { name: "Русский", nativeName: "Русский" },
  en: { name: "English", nativeName: "English" },
  zh: { name: "中文", nativeName: "中文" },
} as const;
