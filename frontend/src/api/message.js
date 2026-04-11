import API from "./axios";

export const getInbox = () =>
  API.get("/messages");

export const getConversation = (userId) =>
  API.get(`/messages/${userId}`);

export const sendMessage = (data) =>
  API.post("/messages", data);