// ─── Redux Store Setup ────────────────────────────────────────────────────────
// Combines all slices into one store

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import uiReducer from './uiSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,   // auth.user, auth.isAuthenticated, auth.token
    ui: uiReducer,       // ui.sidebarCollapsed
  },
});

export default store;
