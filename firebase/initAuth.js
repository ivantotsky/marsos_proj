import { setPersistence, browserLocalPersistence } from "firebase/auth";
import { auth } from "./config";

export const initAuthPersistence = async () => {
  try {
    await setPersistence(auth, browserLocalPersistence);
    console.log("Persistence set to localStorage");
  } catch (error) {
    console.error("Failed to set persistence:", error);
  }
};
