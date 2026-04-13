import API from "./axios";

export const getUsers = () => API.get("/admin/users");

export const getUserById = (id) => API.get(`/admin/users/${id}`);

export const suspendUser = (id) => API.patch(`/admin/users/${id}/suspend`);

export const unsuspendUser = (id) => API.patch(`/admin/users/${id}/unsuspend`);

export const deleteUser = (id) => API.delete(`/admin/users/${id}`);

export const getAuditLogs = () => API.get("/admin/logs");

export const verifyAuditLogs = () => API.get("/admin/logs/verify");
