import axios, { AxiosError, AxiosInstance } from "axios";

const instance: AxiosInstance = axios.create({
  baseURL: "/api",
  timeout: 10000, // 10 seconds
});

// ===============================
// 🔹 Response Interceptor - Error handling
// ===============================
instance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    let message = "Something went wrong";
    let status: number | undefined;
    let data: unknown = null;

    if (error.response) {
      status = error.response.status;
      data = error.response.data;

      if (status >= 500) {
        message = "Server error, please try again later";
      } else if (status === 404) {
        message = "Resource not found";
      } else if (status === 401) {
        message = "Unauthorized, please log in";
      } else if (status === 400) {
        message = "Bad request";
      }

      // Use server-provided message if available
      if (data && typeof data === "object" && "message" in data) {
        message = (data as { message: string }).message || message;
      }
    } else if (error.request) {
      message = "No response from server, please check your connection";
    } else {
      message = error.message;
    }

    return Promise.reject({
      message,
      status,
      data,
    });
  }
);

export default instance;
