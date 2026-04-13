import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { resendRegistrationOtp, verifyOtp } from "../../api/auth";
import OtpVirtualKeyboard from "../../components/OtpVirtualKeyboard";

export default function VerifyOTP() {
  const navigate = useNavigate();

  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [resending, setResending] = useState(false);
  const pendingRegistration = (() => {
    try {
      return JSON.parse(localStorage.getItem("pendingRegistration") || "null");
    } catch {
      return null;
    }
  })();
  const email = pendingRegistration?.email || localStorage.getItem("email");

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setMessage("Enter the 6-digit code using the virtual keypad.");
      return;
    }

    try {
      if (!pendingRegistration) {
        setMessage("Registration details not found. Please sign up again.");
        return;
      }

      setMessage("");
      await verifyOtp({
        ...pendingRegistration,
        code: otp,
      });

      localStorage.removeItem("pendingRegistration");
      localStorage.removeItem("email");
      localStorage.removeItem("selectedRole");

      setMessage("Verification successful.");
      navigate("/");
    } catch (err) {
      console.log("ERROR:", err.response?.data);
      setMessage(err?.response?.data?.message || "Invalid OTP");
    }
  };

  const handleResend = async () => {
    if (!email) {
      setMessage("Email not found. Please register again.");
      return;
    }

    try {
      setResending(true);
      setMessage("");
      const res = await resendRegistrationOtp({ email });
      setMessage(res?.data?.message || "A new OTP has been sent to your email.");
    } catch (err) {
      console.log("ERROR:", err.response?.data);
      setMessage(err?.response?.data?.message || "Unable to resend OTP.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 relative overflow-hidden px-6">

      {/* Background glow */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-200 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-purple-200 rounded-full blur-3xl"></div>

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

        {/* LEFT INFO */}
        <div className="hidden lg:block space-y-6">
          <h2 className="text-3xl font-bold text-blue-600">
            GuardianAuth
          </h2>

          <p className="text-gray-600">
            One more step to complete your sign up.
          </p>

          <div className="bg-white p-5 rounded-xl shadow">
            Enter the 6-digit code sent to your email.
          </div>
        </div>

        {/* OTP CARD */}
        <div className="bg-white p-8 rounded-xl shadow-lg relative">

          <h2 className="text-2xl font-bold mb-2">
            Verify your email
          </h2>

          <p className="text-gray-500 mb-6 text-sm">
            Enter the 6-digit code sent to your email.
          </p>

          {message && (
            <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              {message}
            </div>
          )}

          <OtpVirtualKeyboard
            value={otp}
            onChange={setOtp}
            title="Verify your email"
            hint="Use the virtual keypad to enter the 6-digit verification code sent to your email."
            submitLabel="Confirm Code"
            onSubmit={handleVerify}
          />

          {/* TIMER */}
          <p className="text-sm text-gray-500 mt-4 text-center">
            Expires in <span className="font-bold text-blue-600">00:59</span>
          </p>

          {/* RESEND */}
          <p className="text-sm text-center mt-2 text-gray-400">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="font-semibold text-blue-600 hover:text-blue-700 disabled:cursor-not-allowed disabled:text-blue-300"
            >
              {resending ? "Resending OTP..." : "Resend OTP"}
            </button>
          </p>

        </div>
      </div>
    </div>
  );
}