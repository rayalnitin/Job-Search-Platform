import API from "./axios";

export const uploadResume = (formData) =>
  API.post("/resume/upload", formData);

export const getResumes = () =>
  API.get("/resume");

export const deleteResume = (id) =>
  API.delete(`/resume/${id}`);

export const setActiveResume = (id) =>
  API.patch(`/resume/set-active/${id}`);

export const requestResumeDownloadOtp = (id) =>
  API.post(`/resume/request-download-otp/${id}`);

export const downloadResume = (id, otpCode) =>
  API.post(`/resume/download/${id}`, { otpCode }, { responseType: "blob" });
