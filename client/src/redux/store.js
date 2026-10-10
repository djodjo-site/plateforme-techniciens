// client/src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';

import authReducer from './slices/authSlice.js';
import notificationsReducer from './slices/notificationsSlice.js';
import messagesReducer from './slices/messagesSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    notifications: notificationsReducer,
    messages: messagesReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['socket/connect', 'socket/disconnect']
      }
    })
});

export default store;