import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enTranslations from "../locales/en.json" assert { type: "json" };
import swTranslations from "../locales/sw.json" assert { type: "json" };

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      sw: { translation: swTranslations }
    },
    fallbackLng: "en",
    interpolation: {
      escapeValue: false // react already safes from xss
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"]
    }
  });

export default i18n;
