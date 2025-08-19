import axios from "axios";

const apiClient = axios.create({
  baseURL: "https://scoopie.manishdashsharma.site/api",
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODhlNDBhN2M1YWQ5ZWZlNTIxYmQyYzAiLCJpYXQiOjE3NTU2MzUyMDksImV4cCI6MTc1NjI0MDAwOX0.O-59Tr5hdYdhw4geEbMXcuuToUDCYKM41h6vO18tge8"
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;