import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import { verifyOtp } from "../../api/auth";

export default function VerifyOTP() {
  const navigate = useNavigate();

  const [otp, setOtp] = useState(Array(6).fill(""));
  const inputs = useRef([]);

  const handleChange = (value, index) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // move to next input
    if (value && index < 5) {
      inputs.current[index + 1].focus();
    }
  };

  const handleVerify = async () => {
    const finalOtp = otp.join("");
    const email = localStorage.getItem("email");
    console.log("Sending:", { email, code: finalOtp }); // debug

    try {
      await verifyOtp({
  email,
  code: finalOtp,
});

      alert("Verification successful");
      navigate("/");
    } catch {
      console.log("ERROR:", err.response?.data);
      alert("Invalid OTP");
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
            One more step to secure your professional identity.
          </p>

          <div className="bg-white p-5 rounded-xl shadow">
            Enter the 6-digit code sent to your email/mobile.
          </div>
        </div>

        {/* OTP CARD */}
        <div className="bg-white p-8 rounded-xl shadow-lg relative">

          <h2 className="text-2xl font-bold mb-2">
            Verify your identity
          </h2>

          <p className="text-gray-500 mb-6 text-sm">
            Enter the 6-digit code
          </p>

          {/* OTP BOXES */}
          <div className="flex justify-between gap-2 mb-6">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputs.current[i] = el)}
                value={digit}
                onChange={(e) =>
                  handleChange(e.target.value, i)
                }
                maxLength="1"
                className="w-12 h-14 text-center text-xl font-bold border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            ))}
          </div>

          {/* BUTTON */}
          <button
            onClick={handleVerify}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl hover:scale-[1.02] transition"
          >
            Confirm Code →
          </button>

          {/* TIMER */}
          <p className="text-sm text-gray-500 mt-4 text-center">
            Expires in <span className="font-bold text-blue-600">00:59</span>
          </p>

          {/* RESEND */}
          <p className="text-sm text-center mt-2 text-gray-400">
            Resend OTP (soon)
          </p>

        </div>
      </div>
    </div>
  );
}