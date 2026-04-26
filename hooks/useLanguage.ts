import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { languageAtom } from '@/store';
import { changeLanguage, getStoredLanguage, initI18n } from '@/i18n';
import { LanguageCode } from '@/i18n/resources';

export const useLanguage = () => {
  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useAtom(languageAtom);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      await initI18n();
      const storedLang = await getStoredLanguage();
      if (storedLang) {
        setLanguage(storedLang);
      } else {
        setLanguage(i18n.language as LanguageCode);
      }
      setIsReady(true);
    };

    init();
  }, []);

  const changeLanguageHandler = async (newLanguage: LanguageCode) => {
    await changeLanguage(newLanguage);
    setLanguage(newLanguage);
  };

  return {
    t,
    language,
    changeLanguage: changeLanguageHandler,
    isReady,
  };
};