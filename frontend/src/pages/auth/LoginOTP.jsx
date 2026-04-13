import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { requestLoginOtp, verifyLoginOtp } from "../../api/auth";
import OtpVirtualKeyboard from "../../components/OtpVirtualKeyboard";

export default function LoginOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialEmail = location.state?.email || localStorage.getItem("pendingLoginEmail") || "";

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(initialEmail ? "verify" : "request");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const routeUser = (user) => {
    localStorage.setItem("token", user.accessToken);
    localStorage.setItem("role", user.user.role);
    localStorage.setItem("user", JSON.stringify(user.user));
    localStorage.removeItem("pendingLoginEmail");

    if (user.user.role === "admin") {
      navigate("/admin");
    } else if (user.user.role === "recruiter") {
      navigate("/recruiter/dashboard");
    } else {
      navigate("/dashboard");
    }
  };

  const handleRequestOtp = async () => {
    if (!email.trim()) {
      setMessage("Enter your email first.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      const res = await requestLoginOtp({ email: email.trim() });
      localStorage.setItem("pendingLoginEmail", email.trim());
      setStep("verify");
      setMessage(res?.data?.message || "OTP sent to your email. Enter it with the virtual keypad below.");
    } catch (err) {
      console.log(err?.response?.data);
      setMessage(err?.response?.data?.message || "Failed to request login OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setMessage("Enter the 6-digit OTP using the virtual keypad.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      const res = await verifyLoginOtp({ email: email.trim(), code: otp });
      routeUser(res.data);
    } catch (err) {
      console.log(err?.response?.data);
      setMessage(err?.response?.data?.message || "Failed to verify OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email.trim()) {
      setMessage("Enter your email first.");
      return;
    }

    try {
      setResending(true);
      setMessage("");
      const res = await requestLoginOtp({ email: email.trim() });
      setMessage(res?.data?.message || "OTP sent to your email again.");
    } catch (err) {
      console.log(err?.response?.data);
      setMessage(err?.response?.data?.message || "Failed to resend login OTP.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 relative overflow-hidden px-6">
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-200 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-purple-200 rounded-full blur-3xl"></div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div className="hidden lg:flex flex-col space-y-6">
          <h1 className="text-4xl font-bold">
            Secure sign in with
            <span className="text-blue-600"> email OTP</span>
          </h1>
          <p className="text-gray-600">
            Use an email-delivered OTP and the virtual keypad for safer authentication on shared devices.
          </p>
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl shadow">One-time code delivered by email</div>
            <div className="bg-white p-4 rounded-xl shadow">Virtual keypad for safer input</div>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg relative">
            <div className="absolute -top-4 -right-4 bg-gray-100 px-3 py-1 rounded-full text-xs">
              🔒 Secure
            </div>

            <h2 className="text-2xl font-bold mb-2">Login with OTP</h2>
            <p className="text-gray-500 text-sm mb-6">
              {step === "request"
                ? "Enter your email to receive a login code."
                : "Enter the 6-digit code sent to your email."}
            </p>

            {message && (
              <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                {message}
              </div>
            )}

            {step === "request" ? (
              <div className="space-y-4">
                <input
                  name="email"
                  type="email"
                  value={email}
                  placeholder="Email"
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />

                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl hover:scale-[1.02] transition disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Sending OTP..." : "Send Login OTP"}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <input
                  name="email"
                  type="email"
                  value={email}
                  placeholder="Email"
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />

                <OtpVirtualKeyboard
                  value={otp}
                  onChange={setOtp}
                  title="Login OTP"
                  hint="Use the virtual keypad to enter the 6-digit code sent to your email."
                  submitLabel="Sign In"
                  onSubmit={handleVerifyOtp}
                  disabled={loading}
                />

                <div className="flex items-center justify-between gap-3 text-sm">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resending}
                    className="font-semibold text-blue-600 hover:text-blue-700 disabled:cursor-not-allowed disabled:text-blue-300"
                  >
                    {resending ? "Resending OTP..." : "Resend OTP"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep("request")}
                    className="font-semibold text-slate-500 hover:text-slate-700"
                  >
                    Change email
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="font-semibold text-slate-500 hover:text-slate-700"
              >
                Back to Login
              </button>
              <button
                type="button"
                onClick={() => navigate("/register")}
                className="font-semibold text-blue-600 hover:text-blue-700"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
