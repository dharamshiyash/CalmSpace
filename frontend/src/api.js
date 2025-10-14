import axios from "axios";

const API = axios.create({
  baseURL: "https://calmspace-backend-b00s.onrender.com/api",
  withCredentials: true, // needed for session cookies
});

// Auth
export const registerUser = (data) => API.post("/auth/register", data);
export const verifyOTP = (data) => API.post("/auth/verify", data);
export const loginUser = (data) => API.post("/auth/login", data);
export const getProtectedData = () => API.get("/auth/protected"); // returns logged-in user
export const updateProfile = (data) => API.put("/auth/profile", data);
export const deleteProfile = () => API.delete("/auth/profile");
export const logoutUser = () => API.post("/auth/logout");

// Journal
export const listJournal = () => API.get("/journal");
export const getJournalSummary = () => API.get("/journal/summary");
export const createJournal = (data) => API.post("/journal", data);
export const updateJournal = (id, data) => API.put(`/journal/${id}`, data);
export const deleteJournal = (id) => API.delete(`/journal/${id}`);

// Emotion prediction
export const predictEmotion = (data) => API.post("/emotion", data);
export const getEmotionSupport = (data) => API.post("/emotion/support", data);

// Profile image operations
export const uploadProfileImage = (formData) => API.post("/profile/image", formData, {
  headers: { "Content-Type": "multipart/form-data" },
});
export const removeProfileImage = () => API.delete("/profile/image");
