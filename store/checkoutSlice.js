import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { db } from "@/firebase/config";
import {
  setDoc,
  doc,
  serverTimestamp,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import axios from "axios";
import { clearSupplierCart } from "@/store/cartThunks";

// ─── ASYNC THUNKS ────────────────────────────────────

// 1️⃣ Create HyperPay checkout
export const createHyperpayCheckout = createAsyncThunk(
  "checkout/createHyperpayCheckout",
  async ({ amount, form }, { rejectWithValue }) => {
    try {
      const res = await fetch(
        `${
          process.env.NEXT_PUBLIC_HYPERPAY_URL || "https://marsos.com.sa/api3"
        }/api/create-checkout`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount,
            email: form.email || form.phone || "buyer@example.com",
            name: `${form.firstName} ${form.lastName}`.trim(),
            street: form.addresses[0]?.formatted || "",
            city: form.addresses[0]?.city || form.city,
            state: form.addresses[0]?.state || form.state,
            country: form.country || "SA",
            postcode: form.addresses[0]?.zip || form.zip,
          }),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { checkoutId } = await res.json();
      return checkoutId;
    } catch (err) {
      return rejectWithValue(err.message || String(err));
    }
  }
);

// 2️⃣ Verify HyperPay payment
export const verifyHyperpayPayment = createAsyncThunk(
  "checkout/verifyHyperpayPayment",
  async (
    { resourcePath, cartItems, form, supplierId, userId },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const { data } = await axios.post(
        `${
          process.env.NEXT_PUBLIC_HYPERPAY_URL || "https://marsos.com.sa/api3"
        }/api/verify-payment`,
        { resourcePath }
      );
      if (!data.success) throw new Error(data.error || "Verification failed");

      const orderId = data.transactionId;
      await setDoc(doc(db, "orders", orderId), {
        orderId,
        method: "hyperpay",
        amount: data.amount,
        paymentType: data.paymentType,
        cardBrand: data.cardBrand,
        customer: {
          name: data.customerName,
          email: data.customerEmail,
          addresses: form.addresses,
        },
        items: cartItems,
        billing: data.billing,
        createdAt: serverTimestamp(),
        status: "completed",
      });

      dispatch(slice.actions.resetCheckout());
      if (userId) dispatch(clearSupplierCart({ userId, supplierId }));
      return orderId;
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : String(err));
    }
  }
);

// 3️⃣ Create vault registration checkout
export const createRegistrationCheckout = createAsyncThunk(
  "checkout/createRegistration",
  async ({ amount }, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/create-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Vault checkout failed");
      return data.checkoutId;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// 4️⃣ Save vault card token
export const saveCardToken = createAsyncThunk(
  "checkout/saveCardToken",
  async ({ supplierId, token }, { getState, rejectWithValue }) => {
    try {
      let registrationId = token;
      let brand = null;
      let last4 = null;
      if (token.includes("/")) {
        const base = process.env.HYPERPAY_BASE_URL;
        const entityId = process.env.HYPERPAY_ENTITY_ID;
        const access = process.env.HYPERPAY_ACCESS_TOKEN;
        if (!base || !entityId || !access) {
          throw new Error("HyperPay credentials missing");
        }
        const { data } = await axios.get(`${base}${token}`, {
          params: { entityId },
          headers: { Authorization: `Bearer ${access}` },
        });
        registrationId = data.registration?.id || data.id;
        if (!registrationId) throw new Error("Invalid HyperPay response");
        brand = data.paymentBrand || data.card?.issuer?.bank || null;
        last4 = data.card?.last4Digits || null;
      }
      const uid = getState().auth.user.uid;
      await setDoc(doc(db, "users", uid, "cards", registrationId), {
        supplierId,
        registrationId,
        ...(brand && { brand }),
        ...(last4 && { last4 }),
        createdAt: serverTimestamp(),
      });
      return registrationId;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message || String(err));
    }
  }
);

// 5️⃣ Fetch saved registration tokens
export const fetchSavedCards = createAsyncThunk(
  "checkout/fetchSavedCards",
  async ({ supplierId, userId }, { rejectWithValue }) => {
    try {
      const cardsRef = collection(db, "users", userId, "cards");
      const q = query(cardsRef, where("supplierId", "==", supplierId));
      const snap = await getDocs(q);
      return snap.docs.map((d) => {
        const data = d.data();
        const { createdAt, ...serializable } = data;
        return { registrationId: d.id, ...serializable };
      });
    } catch (err) {
      return rejectWithValue(err.message || String(err));
    }
  }
);

// ─── SLICE ────────────────────────────────────────────

const initialForm = {
  addresses: [],
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  suite: "",
  city: "",
  state: "",
  zip: "",
  isGift: false,
  uid: "",
};

const slice = createSlice({
  name: "checkout",
  initialState: {
    form: { ...initialForm },
    savedCards: [],
    selectedCardIndex: null,
    selectedWalletOption: "",
    paymentMethod: "hyperpay",
    loading: false,
    error: null,
    orderId: null,
    hyperpayId: null,
    verifying: false,
    verifyError: null,
    verifiedOrderId: null,
    registrationId: null,
    loadingRegistration: false,
    registrationError: null,
  },
  reducers: {
    updateField(state, { payload: { name, value } }) {
      state.form[name] = value;
    },
    setPaymentMethod(state, { payload }) {
      state.paymentMethod = payload;
      state.selectedCardIndex = null;
      state.selectedWalletOption = "";
    },
    addAddress(state, { payload }) {
      state.form.addresses.push(payload);
    },
    replaceAddress(state, { payload }) {
      if (state.form.addresses.length) state.form.addresses[0] = payload;
      else state.form.addresses.push(payload);
    },
    resetCheckout(state) {
      Object.assign(state, {
        form: { ...initialForm },
        paymentMethod: "hyperpay",
        savedCards: [],
        selectedCardIndex: null,
        selectedWalletOption: "",
        loading: false,
        error: null,
        orderId: null,
        hyperpayId: null,
        verifying: false,
        verifyError: null,
        verifiedOrderId: null,
        registrationId: null,
        loadingRegistration: false,
        registrationError: null,
      });
    },
    selectCardIndex(state, { payload }) {
      state.selectedCardIndex = payload;
    },
    removeSavedCard(state, { payload }) {
      state.savedCards.splice(payload, 1);
      if (state.selectedCardIndex === payload) state.selectedCardIndex = null;
    },
    selectWalletOption(state, { payload }) {
      state.selectedWalletOption = payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // HyperPay
      .addCase(createHyperpayCheckout.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(createHyperpayCheckout.fulfilled, (s, a) => {
        s.loading = false;
        s.hyperpayId = a.payload;
      })
      .addCase(createHyperpayCheckout.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload;
      })

      // Verify HyperPay
      .addCase(verifyHyperpayPayment.pending, (s) => {
        s.verifying = true;
        s.verifyError = null;
        s.verifiedOrderId = null;
      })
      .addCase(verifyHyperpayPayment.fulfilled, (s, a) => {
        s.verifying = false;
        s.verifiedOrderId = a.payload;
      })
      .addCase(verifyHyperpayPayment.rejected, (s, a) => {
        s.verifying = false;
        s.verifyError = a.payload;
      })

      // Registration Vault
      .addCase(createRegistrationCheckout.pending, (s) => {
        s.loadingRegistration = true;
        s.registrationError = null;
      })
      .addCase(createRegistrationCheckout.fulfilled, (s, a) => {
        s.loadingRegistration = false;
        s.registrationId = a.payload;
      })
      .addCase(createRegistrationCheckout.rejected, (s, a) => {
        s.loadingRegistration = false;
        s.registrationError = a.payload;
      })

      // Save Card Token
      .addCase(saveCardToken.pending, (s) => {
        s.loadingRegistration = true;
        s.registrationError = null;
      })
      .addCase(saveCardToken.fulfilled, (s) => {
        s.loadingRegistration = false;
        s.registrationId = null;
      })
      .addCase(saveCardToken.rejected, (s, a) => {
        s.loadingRegistration = false;
        s.registrationError = a.payload;
      })

      // Fetch Saved Cards
      .addCase(fetchSavedCards.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(fetchSavedCards.fulfilled, (s, a) => {
        s.loading = false;
        s.savedCards = a.payload;
      })
      .addCase(fetchSavedCards.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload;
      });
  },
});

export const {
  updateField,
  setPaymentMethod,
  addAddress,
  replaceAddress,
  resetCheckout,
  selectCardIndex,
  removeSavedCard,
  selectWalletOption,
} = slice.actions;

export default slice.reducer;
