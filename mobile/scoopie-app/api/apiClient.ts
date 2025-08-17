import axios from "axios";

const apiClient = axios.create({
  baseURL: "https://scoopie.manishdashsharma.site/api",
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODhkYTY0ZWM1YWQ5ZWZlNTIxYmQyYjYiLCJpYXQiOjE3NTUzNzczNTUsImV4cCI6MTc1NTk4MjE1NX0.BInoKBGe46qXq2-5XE4dk8a_L8haHCAs7YmHH_lcZOE"
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;