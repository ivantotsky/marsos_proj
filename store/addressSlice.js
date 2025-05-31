// store/addressSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { db } from "@/firebase/config";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

// Helper: convert Firestore Timestamp or Date to ISO string, leave strings as-is
function toIsoString(maybeTs) {
  if (maybeTs instanceof Timestamp) {
    return maybeTs.toDate().toISOString();
  }
  if (maybeTs instanceof Date) {
    return maybeTs.toISOString();
  }
  return maybeTs;
}

// 1️⃣ Fetch saved addresses
export const fetchSavedAddresses = createAsyncThunk(
  "address/fetchSaved",
  async (userId) => {
    const snap = await getDocs(collection(db, "users", userId, "addresses"));
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        formatted: data.formatted,
        lat: data.lat,
        lng: data.lng,
        alias: data.alias,
        createdAt: toIsoString(data.createdAt),
      };
    });
  }
);

// 2️⃣ Save a new address
export const saveAddress = createAsyncThunk(
  "address/save",
  async ({ userId, address, alias }) => {
    // ① Ensure parent "users/{userId}" doc exists (merge=true keeps other fields)
    await setDoc(
      doc(db, "users", userId),
      { lastAddressSavedAt: serverTimestamp() },
      { merge: true }
    );

    // ② Add into sub-collection
    const ref = await addDoc(collection(db, "users", userId, "addresses"), {
      ...address,
      alias,
      createdAt: serverTimestamp(),
    });

    // ③ Return for redux state
    return {
      id: ref.id,
      ...address,
      alias,
      createdAt: new Date().toISOString(), // normalize immediately for UI
    };
  }
);

// 3️⃣ Delete an address
export const deleteAddress = createAsyncThunk(
  "address/delete",
  async ({ userId, addressId }) => {
    await deleteDoc(doc(db, "users", userId, "addresses", addressId));
    return addressId;
  }
);

const addressSlice = createSlice({
  name: "address",
  initialState: { list: [], loading: false },
  reducers: {},
  extraReducers: (builder) =>
    builder
      .addCase(fetchSavedAddresses.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSavedAddresses.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchSavedAddresses.rejected, (state) => {
        state.loading = false;
      })
      .addCase(saveAddress.fulfilled, (state, action) => {
        state.list.push(action.payload);
      })
      .addCase(deleteAddress.fulfilled, (state, action) => {
        state.list = state.list.filter((addr) => addr.id !== action.payload);
      }),
});

export default addressSlice.reducer;
