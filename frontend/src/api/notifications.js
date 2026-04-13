import API from "./axios";

export const getNotifications = (since) =>
  API.get("/notifications", {
    params: since ? { since } : {},
  });