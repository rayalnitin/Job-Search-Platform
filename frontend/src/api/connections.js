import API from "./axios";

export const sendConnectionRequest = (receiverId) =>
  API.post("/connections/request", { receiverId });

export const getConnections = () => API.get("/connections");

export const getPendingConnections = () => API.get("/connections/pending");

export const getConnectionGraph = () => API.get("/connections/graph");

export const acceptConnectionRequest = (id) =>
  API.patch(`/connections/${id}/accept`);

export const rejectConnectionRequest = (id) =>
  API.patch(`/connections/${id}/reject`);

export const removeConnection = (id) => API.delete(`/connections/${id}`);
