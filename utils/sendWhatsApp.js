// src/utils/sendWhatsApp.js
import axios from "axios";

export const sendWhatsApp = async (phoneNumber, message) => {
  try {
    const response = await axios.post(
      "http://localhost:5004/api/send-whatsapp",
      {
        to: phoneNumber,
        message,
      }
    );
    console.log("✅ WhatsApp sent:", response.data);
  } catch (error) {
    console.error(
      "❌ Failed to send WhatsApp:",
      error.response?.data || error.message
    );
  }
};
