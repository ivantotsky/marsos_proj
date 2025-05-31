// lib/fetchProduct.js
"use server"; // <-- ✅ declare as server action

import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/config";

export async function fetchProduct(id) {
  if (!id) return null;

  const docRef = doc(db, "products", id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  const data = docSnap.data();

  return {
    id,
    ...data,
    createdAt: data.createdAt?.toMillis?.() || null,
    updatedAt: data.updatedAt?.toMillis?.() || null,
  };
}
