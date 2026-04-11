import API from "./axios";

export const applyJob = (data) =>
  API.post("/applications", data);

export const getMyApplications = () =>
  API.get("/applications/mine");

export const getApplicantsForJob = (jobId) =>
  API.get(`/applications/job/${jobId}`);

export const updateApplicationStatus = (id, status) =>
  API.patch(`/applications/${id}/status`, { status });
