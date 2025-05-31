import axios from "axios";

const API_KEY = "AIzaSyAy6SgEsnoR6OvB5RcLRFkjVXkq1BJWnAA"; // Replace with your actual API key
const TRANSLATE_URL =
  "https://translation.googleapis.com/language/translate/v2";

/**
 * Function to translate text using Google Translate API.
 * @param {string} text - The text to translate.
 * @param {string} targetLang - The target language (e.g., "ar" for Arabic).
 * @returns {Promise<string>} - The translated text.
 */
export const translateText = async (text, targetLang = "ar") => {
  try {
    const response = await axios.post(
      TRANSLATE_URL,
      {
        q: text,
        target: targetLang,
        source: "en",
        format: "text",
      },
      {
        params: { key: API_KEY },
      }
    );

    return response.data.data.translations[0].translatedText;
  } catch (error) {
    console.error("Translation error:", error);
    return text; // Fallback to the original text in case of an error
  }
};
