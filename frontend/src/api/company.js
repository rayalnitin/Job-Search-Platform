import API from "./axios";

export const getCompanies = () => API.get("/companies");

export const getCompany = (id) => API.get(`/companies/${id}`);

export const createCompany = (data) => API.post("/companies", data);

export const updateCompany = (id, data) => API.patch(`/companies/${id}`, data);

export const createJob = (companyId, data) =>
  API.post(`/companies/${companyId}/jobs`, data);

export const updateJob = (jobId, data) => API.patch(`/jobs/${jobId}`, data);

export const deleteJob = (jobId) => API.delete(`/jobs/${jobId}`);