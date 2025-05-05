import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import authReducer from "./slices/authSlice";
import appointmentReducer from "./slices/appointmentSlice";
import healthDataReducer from "./slices/healthDataSlice";
import notificationReducer from "./slices/notificationSlice";
import chatbotReducer from "./slices/chatbotSlice";

const persistConfig = {
  key: "root",
  storage,
  // whitelist: ["auth"],
};

const persistedAuthReducer = persistReducer(persistConfig, authReducer);

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    appointments: appointmentReducer,
    healthData: healthDataReducer,
    notifications: notificationReducer,
    chatbot: chatbotReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;