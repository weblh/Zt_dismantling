import axios, { type AxiosRequestConfig } from "axios";
import { message } from "antd";
import { API_BASE_URL } from "@/config/api";

export interface ApiResult<T> {
  code: number;
  message: string;
  data: T;
}

const instance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

instance.interceptors.response.use((response) => {
  const res = response.data as ApiResult<unknown>;
  if (res.code !== 0) {
    message.error(res.message || "请求失败");
    return Promise.reject(new Error(res.message));
  }
  return response;
});

instance.interceptors.response.use(undefined, (error) => {
  if (error.response?.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    if (!window.location.pathname.includes("/login")) {
      const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
      window.location.href = `${base}/login`;
    }
    return Promise.reject(error);
  }
  message.error(error.response?.data?.message || error.message || "网络错误");
  return Promise.reject(error);
});

export default async function request<T>(config: AxiosRequestConfig): Promise<ApiResult<T>> {
  const response = await instance.request<ApiResult<T>>(config);
  return response.data;
}
