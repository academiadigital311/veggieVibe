import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import esCommon from "./locales/es/common.json";
import enCommon from "./locales/en/common.json";
import esRecipes from "./locales/es/recipes.json";
import enRecipes from "./locales/en/recipes.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: { common: esCommon, recipes: esRecipes },
      en: { common: enCommon, recipes: enRecipes },
    },
    fallbackLng: "es",
    defaultNS: "common",
    ns: ["common", "recipes"],
    supportedLngs: ["es", "en"],
    load: "languageOnly",
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

export default i18n;
