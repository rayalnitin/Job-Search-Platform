import API from "./axios";
import { invalidateJobsCache } from "./jobs";

export const getCompanies = () => API.get("/companies");

export const getCompany = (id) => API.get(`/companies/${id}`);

export const createCompany = (data) => API.post("/companies", data);

export const updateCompany = (id, data) =>
  API.patch(`/companies/${id}`, data).then((response) => {
    invalidateJobsCache();
    return response;
  });

export const createJob = (companyId, data) =>
  API.post(`/companies/${companyId}/jobs`, data).then((response) => {
    invalidateJobsCache();
    return response;
  });

export const updateJob = (jobId, data) =>
  API.patch(`/jobs/${jobId}`, data).then((response) => {
    invalidateJobsCache();
    return response;
  });

export const deleteJob = (jobId) =>
  API.delete(`/jobs/${jobId}`).then((response) => {
    invalidateJobsCache();
    return response;
  });