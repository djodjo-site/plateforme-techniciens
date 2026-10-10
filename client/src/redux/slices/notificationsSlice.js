// client/src/redux/slices/notificationsSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  nonLues: 0,
  loading: false
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setNotifications: (state, action) => {
      state.items = action.payload.notifications || [];
      state.nonLues = action.payload.nonLues || 0;
    },
    ajouterNotification: (state, action) => {
      state.items.unshift(action.payload);
      if (!action.payload.lu) state.nonLues += 1;
    },
    marquerLue: (state, action) => {
      const notif = state.items.find((n) => n._id === action.payload);
      if (notif && !notif.lu) {
        notif.lu = true;
        state.nonLues = Math.max(0, state.nonLues - 1);
      }
    },
    marquerToutesLues: (state) => {
      state.items.forEach((n) => { n.lu = true; });
      state.nonLues = 0;
    },
    supprimerNotification: (state, action) => {
      state.items = state.items.filter((n) => n._id !== action.payload);
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    }
  }
});

export const {
  setNotifications,
  ajouterNotification,
  marquerLue,
  marquerToutesLues,
  supprimerNotification,
  setLoading
} = notificationsSlice.actions;

export default notificationsSlice.reducer;