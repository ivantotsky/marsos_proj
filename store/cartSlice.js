import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  setDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/firebase/config";

// fetchCart thunk: convert Timestamp → number
export const fetchCart = createAsyncThunk(
  "cart/fetchCart",
  async (userId, { rejectWithValue, dispatch }) => {
    try {
      const snap = await getDocs(collection(db, "carts", userId, "items"));
      const items = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          createdAt: data.createdAt?.toMillis?.() ?? null,
        };
      });
      dispatch(setCartItems(items));
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const addOrUpdateCartItem = createAsyncThunk(
  "cart/addOrUpdateCartItem",
  async ({ userId, item }, { rejectWithValue }) => {
    try {
      const q = query(
        collection(db, "carts", userId, "items"),
        where("productId", "==", item.productId),
        where("size", "==", item.size || ""),
        where("color", "==", item.color || ""),
        where("deliveryLocation", "==", item.deliveryLocation)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const existing = snap.docs[0];
        const data = existing.data();
        const newQty = data.quantity + item.quantity;
        await updateDoc(doc(db, "carts", userId, "items", existing.id), {
          quantity: newQty,
          subtotal: newQty * item.price,
        });
      } else {
        const itemId = `${item.productId}-${Date.now()}`;
        await setDoc(doc(db, "carts", userId, "items", itemId), {
          ...item,
          buyerId: userId,
          createdAt: serverTimestamp(),
        });
      }
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: [],
    count: 0,
    loading: false,
    error: null,
  },
  reducers: {
    setCartItems(state, action) {
      state.items = action.payload;
      state.count = action.payload.length;
    },
    clearCartItems(state) {
      state.items = [];
      state.count = 0;
    },
    removeSupplierItems(state, action) {
      state.items = state.items.filter(
        (item) => item.supplierId !== action.payload
      );
      state.count = state.items.length;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(fetchCart.fulfilled, (s) => {
        s.loading = false;
      })
      .addCase(fetchCart.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload;
      })
      .addCase(addOrUpdateCartItem.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(addOrUpdateCartItem.fulfilled, (s) => {
        s.loading = false;
      })
      .addCase(addOrUpdateCartItem.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload;
      });
  },
});

export const { setCartItems, clearCartItems, removeSupplierItems } =
  cartSlice.actions;
export default cartSlice.reducer;
