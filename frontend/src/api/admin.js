import API from "./axios";

export const getUsers = () => API.get("/admin/users");

export const getUserById = (id) => API.get(`/admin/users/${id}`);

export const suspendUser = (id) => API.patch(`/admin/users/${id}/suspend`);

export const unsuspendUser = (id) => API.patch(`/admin/users/${id}/unsuspend`);

export const deleteUser = (id) => API.delete(`/admin/users/${id}`);

export const getAuditLogs = () => API.get("/admin/logs");

export const verifyAuditLogs = () => API.get("/admin/logs/verify");

export const getBlockchain = () => API.get("/admin/blockchain");

export const mineBlockchain = () => API.post("/admin/blockchain/mine");

export const verifyBlockchain = () => API.get("/admin/blockchain/verify");

export const repairBlockchain = () => API.post("/admin/blockchain/repair");
