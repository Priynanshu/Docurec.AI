



import { createSlice } from '@reduxjs/toolkit';


const STORAGE_KEY = 'docurec_auth';


const loadFromStorage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {

    localStorage.removeItem(STORAGE_KEY);
  }
  return null;
};


const saveToStorage = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Could not save auth to localStorage:', e);
  }
};


const clearStorage = () => {
  localStorage.removeItem(STORAGE_KEY);
};


const saved = loadFromStorage();

const initialState = {
  user:            saved?.user  || null,
  token:           saved?.token || null,
  isAuthenticated: !!saved?.token,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {


    setAuth: (state, action) => {
      const { user, token } = action.payload;
      state.user            = user;
      state.token           = token;
      state.isAuthenticated = true;
      saveToStorage({ user, token });
    },


    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };

      const saved = loadFromStorage();
      if (saved) saveToStorage({ ...saved, user: state.user });
    },


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
