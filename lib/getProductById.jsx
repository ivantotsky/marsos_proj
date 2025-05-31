// lib/getProductById.js
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/config";

export const getProductById = async (id) => {
  try {
    const ref = doc(db, "products", id);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
};
