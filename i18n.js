// i18n.js
"use client";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpBackend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";

// Configure i18n with LanguageDetector and cookie caching
i18n
  .use(LanguageDetector) // detect user language via cookie, localStorage, browser
  .use(HttpBackend) // load translation JSON files
  .use(initReactI18next)
  .init({
    fallbackLng: "en", // default language
    supportedLngs: ["en", "ar"],

    detection: {
      order: [
        "cookie",
        "localStorage",
        "navigator",
        "htmlTag",
        "path",
        "subdomain",
      ],
      caches: ["cookie"],
      lookupCookie: "i18next",
      cookieOptions: { path: "/", sameSite: "strict" },
    },

    backend: {
      loadPath: "/locales/{{lng}}/translation.json",
    },

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: false,
    },
  })
  .catch((err) => console.error("i18next init failed:", err));

export default i18n;
