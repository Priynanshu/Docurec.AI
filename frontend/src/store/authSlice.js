// ─── Auth Redux Slice ─────────────────────────────────────────────────────────
// Manages: user info, single JWT token, login state
// Token is saved to localStorage so user stays logged in after page refresh

import { createSlice } from '@reduxjs/toolkit';

// Key used to save auth data in localStorage
const STORAGE_KEY = 'docurec_auth';

// Load saved auth from localStorage on app start
const loadFromStorage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    // If JSON is corrupted, clear it
    localStorage.removeItem(STORAGE_KEY);
  }
  return null;
};

// Save auth to localStorage — called on login/register
const saveToStorage = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Could not save auth to localStorage:', e);
  }
};

// Clear auth from localStorage — called on logout
const clearStorage = () => {
  localStorage.removeItem(STORAGE_KEY);
};

// Load saved state (if any) when Redux initializes
const saved = loadFromStorage();

const initialState = {
  user:            saved?.user  || null,
  token:           saved?.token || null,       // single JWT token
  isAuthenticated: !!saved?.token,             // true if we have a token
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {

    // Call this after login OR register — saves everything
    setAuth: (state, action) => {
      const { user, token } = action.payload;
      state.user            = user;
      state.token           = token;
      state.isAuthenticated = true;
      saveToStorage({ user, token }); // persist to localStorage
    },

    // Update just user info (e.g. after profile edit)
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      // Also update localStorage so it stays in sync
      const saved = loadFromStorage();
      if (saved) saveToStorage({ ...saved, user: state.user });
    },

    // Call this on logout — clears everything
    logout: (state) => {
      state.user            = null;
      state.token           = null;
      state.isAuthenticated = false;
      clearStorage();
    },
  },
});

export const { setAuth, updateUser, logout } = authSlice.actions;
export default authSlice.reducer;
