// store/cartThunks.js
import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { removeSupplierItems } from "./cartSlice";

export const clearSupplierCart = createAsyncThunk(
  "cart/clearSupplierCart",
  async ({ userId, supplierId }, { dispatch, rejectWithValue }) => {
    try {
      // 1️⃣ find all that supplier's cart items in Firestore
      const q = query(
        collection(db, "carts", userId, "items"),
        where("supplierId", "==", supplierId)
      );
      const snap = await getDocs(q);

      // 2️⃣ delete each one
      await Promise.all(
        snap.docs.map((d) => deleteDoc(doc(db, "carts", userId, "items", d.id)))
      );

      // 3️⃣ update Redux to drop them
      dispatch(removeSupplierItems(supplierId));
    } catch (err) {
      console.error("Failed to clear supplier cart:", err);
      return rejectWithValue(err.message);
    }
  }
);
