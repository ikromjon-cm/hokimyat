import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";

import { Platform } from "react-native";

const HOST = Platform.OS === "android" ? "10.0.2.2" : "localhost";
const API_URL = __DEV__
  ? `http://${HOST}:4000/api/v1`
  : "https://backend-production-d163.up.railway.app/api/v1";

const TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

class ApiService {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: unknown) => void;
    reject: (reason: unknown) => void;
  }> = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.client(originalRequest);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
            if (!refreshToken) {
              throw new Error("No refresh token");
            }

            const response = await axios.post(`${API_URL}/auth/refresh`, {
              refreshToken,
            });

            const { accessToken, refreshToken: newRefreshToken } = response.data;

            await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
            if (newRefreshToken) {
              await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, newRefreshToken);
            }

            this.processQueue(null, accessToken);
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            await SecureStore.deleteItemAsync(TOKEN_KEY);
            await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
            throw refreshError;
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private processQueue(error: unknown, token: string | null) {
    this.failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token);
      }
    });
    this.failedQueue = [];
  }

  get api() {
    return this.client;
  }
}

export const apiService = new ApiService();
export const api = apiService.api;

export async function storeTokens(accessToken: string, refreshToken: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

export async function downloadFile(url: string): Promise<ArrayBuffer> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  const response = await axios.get(`${API_URL}${url}`, {
    responseType: "arraybuffer",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return response.data;
}

export async function postDownload(url: string, data: any): Promise<ArrayBuffer> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  const response = await axios.post(`${API_URL}${url}`, data, {
    responseType: "arraybuffer",
    headers: token ? {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    } : { "Content-Type": "application/json" },
  });
  return response.data;
}
