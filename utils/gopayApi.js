import axios from "axios";

const API_PROXY_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:5001/api/create-invoice"
    : "https://marsos.com.sa/api2/api/create-invoice";

export const createInvoice = async (invoiceData) => {
  try {
    const response = await axios.post(API_PROXY_URL, invoiceData);
    return response.data;
  } catch (error) {
    console.error(
      "Error creating invoice:",
      error.response?.data || error.message
    );
    throw error;
  }
};
