import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8080/api/tasks",
});

// ✅ THIS IS THE IMPORTANT PART
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");

  console.log("TOKEN BEING SENT:", token); // 👈 DEBUG

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  return req;
});

export const createTask = (data) => API.post("/", data);
export const getTasks = () => API.get("/");
export const getRecommendation = () => API.get("/recommendation");
export const updateTask = (id, data) => API.put(`/${id}`, data);
