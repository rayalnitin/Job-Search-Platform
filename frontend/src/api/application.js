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

const invalidateApplicationsCache = () => {
  responseCache.clear();
  inFlightRequests.clear();
};

export const applyJob = (data) =>
  API.post("/applications", data).then((response) => {
    invalidateApplicationsCache();
    return response;
  });

export const getMyApplications = () =>
  getCachedRequest("applications:mine", () => API.get("/applications/mine"));

export const getApplicantsForJob = (jobId) =>
  getCachedRequest(`applications:job:${jobId}`, () =>
    API.get(`/applications/job/${jobId}`)
  );

export const updateApplicationStatus = (id, status) =>
  API.patch(`/applications/${id}/status`, { status }).then((response) => {
    invalidateApplicationsCache();
    return response;
  });
