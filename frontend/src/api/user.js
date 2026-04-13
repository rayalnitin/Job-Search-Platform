import API from "./axios";
import API_BASE_URL from "../config";

export const getProfile = () => API.get("/users/profile");

export const updateProfile = (data) => API.patch("/users/profile", data);

export const getProfileViewers = () => API.get("/users/profile/viewers");

export const getUserProfileById = (id) => API.get(`/users/profile/${id}`);

export const uploadAvatar = (formData) =>
  API.post("/users/profile/avatar", formData);

export const deleteAvatar = () => API.delete("/users/profile/avatar");

export const getAvatarUrl = (userId) =>
  `${API_BASE_URL}/users/avatar/${userId}`;
