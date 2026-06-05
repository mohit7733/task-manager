import { configureStore, createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
  name: "auth",
  initialState: { token: localStorage.getItem("token"), user: null },
  reducers: {
    setSession: (state, action) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      localStorage.setItem("token", action.payload.token);
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      localStorage.removeItem("token");
    }
  }
});

const uiSlice = createSlice({
  name: "ui",
  initialState: { darkMode: false, quickNotes: [] },
  reducers: {
    toggleTheme: (state) => {
      state.darkMode = !state.darkMode;
    },
    addQuickNote: (state, action) => {
      state.quickNotes.unshift(action.payload);
      state.quickNotes = state.quickNotes.slice(0, 10);
    }
  }
});

export const { setSession, logout } = authSlice.actions;
export const { toggleTheme, addQuickNote } = uiSlice.actions;

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    ui: uiSlice.reducer
  }
});
