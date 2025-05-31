// lib/getLocalizedField.js
export const getLocalizedField = (field, language = "en", fallback = "") => {
  if (!field) return fallback;

  if (typeof field === "string") return field;

  if (typeof field === "object" && field !== null) {
    return field[language] || field["en"] || fallback;
  }

  return fallback;
};
