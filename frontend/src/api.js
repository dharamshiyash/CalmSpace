import axios from "axios";

const API = axios.create({
  baseURL: "https://calmspace-backend-b00s.onrender.com", // backend base URL
  withCredentials: true, // allow cookies
});

export const registerUser = (data) => API.post("/auth/register", data);
export const verifyOTP = (data) => API.post("/auth/verify", data);
export const loginUser = (data) => API.post("/auth/login", data);
export const getProtectedData = () => API.get("/auth/protected");
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
  headers: {
    "Content-Type": "multipart/form-data",
  },
});
export const removeProfileImage = () => API.delete("/profile/image");

// Google OAuth operations (disabled)
// export const checkUserExists = (email) => API.post("/auth/check-user", { email });
// export const googleSignIn = () => {
//   window.location.href = "http://localhost:5001/api/auth/google";
// };
