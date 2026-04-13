import API from "./axios";

export const getInbox = () => API.get("/messages");

export const getConversation = (userId) => API.get(`/messages/${userId}`);

export const sendMessage = (data) => API.post("/messages", data);

export const getGroups = () => API.get("/messages/groups");

export const createGroup = (data) => API.post("/messages/groups", data);

export const getGroupConversation = (groupId) =>
  API.get(`/messages/groups/${groupId}`);

export const sendGroupMessage = (groupId, data) =>
  API.post(`/messages/groups/${groupId}/send`, data);

export const addGroupParticipant = (groupId, userId) =>
  API.post(`/messages/groups/${groupId}/participants`, { userId });

export const removeGroupParticipant = (groupId, userId) =>
  API.delete(`/messages/groups/${groupId}/participants/${userId}`);

export const registerE2eePublicKey = (publicKey) =>
  API.post("/messages/e2ee/keys", { publicKey });

export const getE2eePublicKey = (userId) =>
  API.get(`/messages/e2ee/keys/${userId}`);

export const getE2eeInbox = () => API.get("/messages/e2ee");

export const sendE2eeMessage = (data) => API.post("/messages/e2ee", data);

export const getE2eeConversation = (userId) =>
  API.get(`/messages/e2ee/${userId}`);
