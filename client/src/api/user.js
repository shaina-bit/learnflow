import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8080/api",
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

export const getProfile = () => API.get("/auth/profile");
export const updateGoal = (dailyGoal) => API.put("/auth/goal", { dailyGoal });
