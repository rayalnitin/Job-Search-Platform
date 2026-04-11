import API from "./axios";

export const getJobs = (params) =>
  API.get("/jobs", { params });

export const getJobById = (id) =>
  API.get(`/jobs/${id}`);