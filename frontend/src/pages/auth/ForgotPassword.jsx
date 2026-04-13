import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { forgotPassword, resetPassword } from "../../api/auth";
import OtpVirtualKeyboard from "../../components/OtpVirtualKeyboard";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState("request");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async () => {
    if (!email.trim()) {
      setMessage("Enter your email first.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      await forgotPassword({ email: email.trim() });
      localStorage.setItem("resetEmail", email.trim());
      setStep("reset");
      setMessage("OTP sent to your email. Use the virtual keypad to enter it below.");
    } catch (err) {
      console.log(err);
      setMessage(err?.response?.data?.message || "Failed to request password reset OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (otp.length !== 6) {
      setMessage("Enter the 6-digit OTP first.");
      return;
    }

    if (newPassword.length < 8) {
      setMessage("Password must be at least 8 characters long.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      await resetPassword({
        email: email.trim(),
        code: otp,
        newPassword,
      });
      setMessage("Password reset successfully. You can sign in now.");
      navigate("/");
    } catch (err) {
      console.log(err);
      setMessage(err?.response?.data?.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl grid-cols-1 items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">
            Account Recovery
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">
            Reset your password with email-delivered OTPs.
          </h1>
          <p className="max-w-xl text-lg text-slate-600">
            The reset code is delivered by email and entered with the virtual keypad for safer entry on shared or public screens.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Step 1</p>
              <p className="mt-2 font-semibold text-slate-900">Request email OTP</p>
              <p className="mt-1 text-sm text-slate-500">We send the code to your inbox.</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Step 2</p>
              <p className="mt-2 font-semibold text-slate-900">Use virtual keypad</p>
              <p className="mt-1 text-sm text-slate-500">Enter the code without typing it directly.</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                Password Reset
              </p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">{step === "request" ? "Send OTP" : "Verify OTP"}</h2>
            </div>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
            >
              Back to Login
            </button>
          </div>

          {message && (
            <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              {message}
            </div>
          )}

          {step === "request" ? (
            <div className="space-y-4">
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email address"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleRequestOtp}
                disabled={loading}
                className="w-full rounded-2xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {loading ? "Sending..." : "Send Reset OTP"}
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email address"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />

              <OtpVirtualKeyboard
                value={otp}
                onChange={setOtp}
                title="Enter reset OTP"
                hint="Use the virtual keypad to enter the 6-digit reset code sent to your email."
                submitLabel={loading ? "Resetting..." : "Reset Password"}
                onSubmit={handleResetPassword}
                disabled={loading}
              />

              <div className="space-y-3">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="New password"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={loading}
                  className="w-full rounded-2xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {loading ? "Resetting..." : "Complete Reset"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}