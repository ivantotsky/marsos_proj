// store/authSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";

// Thunk: fetch the current user from the sessionUser API
export const fetchSessionUser = createAsyncThunk(
  "auth/fetchSessionUser",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/sessionUser");
      const { user } = await res.json();
      return user; // either { uid, email } or null
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// Thunk: login → swap ID token for session cookie → refetch sessionUser
export const login = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { dispatch, rejectWithValue }) => {
    try {
      const auth = getAuth();
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await cred.user.getIdToken();

      await fetch("/api/sessionLogin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      await dispatch(fetchSessionUser());
      return { success: true };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// Thunk: logout → clear client SDK → clear session cookie → refetch sessionUser
export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { dispatch }) => {
    const auth = getAuth();
    await firebaseSignOut(auth);

    await fetch("/api/sessionLogout", { method: "POST" });
    await dispatch(fetchSessionUser());
  }
);

const slice = createSlice({
  name: "auth",
  initialState: {
    user: null, // { uid, email } or null
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetchSessionUser
      .addCase(fetchSessionUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSessionUser.fulfilled, (state, { payload }) => {
        state.user = payload;
        state.loading = false;
      })
      .addCase(fetchSessionUser.rejected, (state, { payload }) => {
        state.error = payload;
        state.loading = false;
      })

      // login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(login.rejected, (state, { payload }) => {
        state.error = payload;
        state.loading = false;
      })

      // logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
      });
  },
});

export default slice.reducer;
