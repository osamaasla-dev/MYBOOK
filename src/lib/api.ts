import { AxiosRequestConfig, AxiosResponse } from "axios";
import axios from "@/lib/axios";

// Standardized response shape from server
type ApiResponse<T> = {
  success: boolean;
  data: T;
  message: string;
};

// Single interface: always return { data, message }
export async function apiGetR<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<{ data: T; message: string }> {
  const res: AxiosResponse<ApiResponse<T>> = await axios.get(url, config);
  const payload = res.data;
  if (payload?.success) return { data: payload.data, message: payload.message };
  throw new Error(payload?.message || "Request failed");
}

export async function apiPostR<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<{ data: T; message: string }> {
  const res: AxiosResponse<ApiResponse<T>> = await axios.post(url, data, config);
  const payload = res.data;
  if (payload?.success) return { data: payload.data, message: payload.message };
  throw new Error(payload?.message || "Request failed");
}

export async function apiPutR<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<{ data: T; message: string }> {
  const res: AxiosResponse<ApiResponse<T>> = await axios.put(url, data, config);
  const payload = res.data;
  if (payload?.success) return { data: payload.data, message: payload.message };
  throw new Error(payload?.message || "Request failed");
}

export async function apiPatchR<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<{ data: T; message: string }> {
  const res: AxiosResponse<ApiResponse<T>> = await axios.patch(url, data, config);
  const payload = res.data;
  if (payload?.success) return { data: payload.data, message: payload.message };
  throw new Error(payload?.message || "Request failed");
}

export async function apiDeleteR<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<{ data: T; message: string }> {
  const res: AxiosResponse<ApiResponse<T>> = await axios.delete(url, config);
  const payload = res.data;
  if (payload?.success) return { data: payload.data, message: payload.message };
  throw new Error(payload?.message || "Request failed");
}
