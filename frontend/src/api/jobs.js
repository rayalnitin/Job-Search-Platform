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

export const invalidateJobsCache = () => {
  responseCache.clear();
  inFlightRequests.clear();
};

export const getJobs = (params) =>
  getCachedRequest(`jobs:${JSON.stringify(params || {})}`, () =>
    API.get("/jobs", { params })
  );

export const getJobById = (id) =>
  getCachedRequest(`job:${id}`, () => API.get(`/jobs/${id}`));