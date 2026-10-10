// client/src/redux/slices/messagesSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  conversations: [],
  messagesActifs: [],
  nonLus: 0,
  loading: false
};

const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    setConversations: (state, action) => {
      state.conversations = action.payload;
    },
    setMessagesActifs: (state, action) => {
      state.messagesActifs = action.payload;
    },
    ajouterMessage: (state, action) => {
      state.messagesActifs.push(action.payload);
    },
    setNonLus: (state, action) => {
      state.nonLus = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    }
  }
});

export const {
  setConversations,
  setMessagesActifs,
  ajouterMessage,
  setNonLus,
  setLoading
} = messagesSlice.actions;

export default messagesSlice.reducer;