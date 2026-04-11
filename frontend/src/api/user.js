import API from "./axios";

export const getProfile = () =>
  API.get("/users/profile");

export const updateProfile = (data) =>
  API.patch("/users/profile", data);