

import axios, {
  AxiosInstance,
  AxiosResponse,
  AxiosError,
  AxiosRequestConfig,
} from "axios";
import { API_URL } from "../config";
import { setAuthToken } from "../utils/auth";
import { store } from "../store";
import { setAuthData, resetAuth } from "../store/slices/authSlice";
import { getAuthHeaders } from "../utils/getAuthHeaders";

// Interface for API error response
interface ApiError {
  message: string;
}

// Interface for API response
interface ApiResponse<T> {
  data: T;
  status: number;
}

// Interface for refresh token response
interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

// Configure Axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Request interceptor to add auth headers
api.interceptors.request.use(
  (config) => {
    config.headers = {
      ...config.headers,
      ...getAuthHeaders(),
    };
    console.log("API Request Headers:", config.headers);
    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    // Skip token refresh for /auth/login endpoint
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== "/auth/login"
    ) {
      originalRequest._retry = true;

      try {
        const state = store.getState();
        const refreshToken = state.auth.refreshToken;
        if (!refreshToken) {
          store.dispatch(resetAuth());
          return Promise.reject(new Error("No refresh token available"));
        }

        const response = await axios.post<RefreshTokenResponse>(
          `${API_URL}auth/refresh`,
          {
            refreshToken,
          }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        // Update tokens in Redux
        apiService.setToken(accessToken, newRefreshToken);

        store.dispatch(
          setAuthData({
            accessToken,
            refreshToken: newRefreshToken,
            user: store.getState().auth.user!,
          })
        );

        // Update the original request with new headers
        originalRequest.headers = {
          ...originalRequest.headers,
          ...getAuthHeaders(),
        };

        // Retry the original request
        return api(originalRequest);
      } catch {
        store.dispatch(resetAuth());
        return Promise.reject(
          new Error("Session expired. Please log in again.")
        );
      }
    }

    const errorMessage = error.response?.data?.message || "Request failed";
    return Promise.reject(new Error(errorMessage));
  }
);

const apiService = {
  async get<T>(url: string, params?: object): Promise<ApiResponse<T>> {
    try {
      const response = await api.get<T>(url, { params });
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error("An unknown error occurred");
    }
  },

  async post<T>(url: string, data: object): Promise<ApiResponse<T>> {
    try {
      const response = await api.post<T>(url, data);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error("An unknown error occurred");
    }
  },

  async put<T>(url: string, data: object): Promise<ApiResponse<T>> {
    try {
      const response = await api.put<T>(url, data);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error("An unknown error occurred");
    }
  },

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    try {
      const response = await api.delete<T>(url);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error("An unknown error occurred");
    }
  },

  setToken(accessToken: string | null, refreshToken?: string | null) {
    setAuthToken(accessToken);
    // Tokens are now managed in Redux store via setAuthData action
    // No localStorage operations
  },
};

export default apiService;