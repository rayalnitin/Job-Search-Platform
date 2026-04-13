import API from "./axios";

const CACHE_TTL_MS = 5000;
const responseCache = new Map();
const inFlightRequests = new Map();

const getCachedRequest = (cacheKey, requestFactory) => {
  const cached = responseCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return Promise.resolve(cached.value);
  }

  const inFlight = inFlightRequests.get(cacheKey);
  if (inFlight) {
    return inFlight;
  }

  const request = requestFactory()
    .then((response) => {
      responseCache.set(cacheKey, {
        value: response,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });
      return response;
    })
    .finally(() => {
      inFlightRequests.delete(cacheKey);
    });

  inFlightRequests.set(cacheKey, request);
  return request;
};

export const invalidateConnectionsCache = () => {
  responseCache.clear();
  inFlightRequests.clear();
};

export const sendConnectionRequest = (receiverIdentifier) =>
  API.post(
    "/connections/request",
    receiverIdentifier.includes("@")
      ? { receiverEmail: receiverIdentifier.trim().toLowerCase() }
      : { receiverId: receiverIdentifier.trim() }
  ).then((response) => {
    invalidateConnectionsCache();
    return response;
  });

export const getConnections = () =>
  getCachedRequest("/connections", () => API.get("/connections"));

export const getPendingConnections = () =>
  getCachedRequest("/connections/pending", () => API.get("/connections/pending"));

export const getConnectionGraph = () =>
  getCachedRequest("/connections/graph", () => API.get("/connections/graph"));

export const acceptConnectionRequest = (id) =>
  API.patch(`/connections/${id}/accept`).then((response) => {
    invalidateConnectionsCache();
    return response;
  });

export const rejectConnectionRequest = (id) =>
  API.patch(`/connections/${id}/reject`).then((response) => {
    invalidateConnectionsCache();
    return response;
  });

export const removeConnection = (id) =>
  API.delete(`/connections/${id}`).then((response) => {
    invalidateConnectionsCache();
    return response;
  });
