import API from "./axios";

export const registerUser = (data) =>
  API.post("/auth/register", data);

export const loginUser = (data) =>
  API.post("/auth/login", data);

export const requestLoginOtp = (data) =>
  API.post("/auth/request-login-otp", data);

export const verifyLoginOtp = (data) =>
  API.post("/auth/verify-login-otp", data);

export const verifyOtp = (data) =>
  API.post("/auth/verify-otp", data);

export const resendRegistrationOtp = (data) =>
  API.post("/auth/resend-registration-otp", data);

export const forgotPassword = (data) =>
  API.post("/auth/forgot-password", data);

export const resetPassword = (data) =>
  API.post("/auth/reset-password", data);