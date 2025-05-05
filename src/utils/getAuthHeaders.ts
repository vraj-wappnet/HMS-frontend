import { store } from "../store";

interface Headers {
  [key: string]: string;
}

export const getAuthHeaders = (additionalHeaders: Headers = {}): Headers => {
  const state = store.getState();
  const accessToken = state.auth.accessToken;
  console.log("accessToken", accessToken)
  const headers: Headers = {
    "Content-Type": "application/json",
    ...additionalHeaders,
  };
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }
  return headers;
};