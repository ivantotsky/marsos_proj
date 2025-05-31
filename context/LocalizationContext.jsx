"use client";

import { createContext, useContext, useState } from "react";

const LocalizationContext = createContext();

export const LocalizationProvider = ({ children }) => {
  const [selectedCountry, setSelectedCountry] = useState("sa"); // Default Saudi Arabia
  const [language, setLanguage] = useState("en"); // Default English

  return (
    <LocalizationContext.Provider
      value={{ selectedCountry, setSelectedCountry, language, setLanguage }}
    >
      {children}
    </LocalizationContext.Provider>
  );
};

export const useLocalization = () => useContext(LocalizationContext);
