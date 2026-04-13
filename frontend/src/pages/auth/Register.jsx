import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../../api/auth";

const allowedEmailDomains = [
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.in",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "proton.me",
  "protonmail.com",
];

const passwordPolicy = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setMessage("");
  };

  const setBanner = (text, type = "error") => {
    setMessage(text);
    setMessageType(type);
  };

  const isAllowedEmail = (value) => {
    const email = value.trim().toLowerCase();
    const parts = email.split("@");

    if (parts.length !== 2) {
      return false;
    }

    return allowedEmailDomains.includes(parts[1]);
  };

  const getErrorMessage = (err) => {
    const message = err?.response?.data?.message;
    if (Array.isArray(message)) {
      return message[0];
    }

    return message || err?.response?.data?.error || err?.message || "Registration failed";
  };

  const handleRegister = async () => {
    if (!form.name.trim()) {
      setBanner("Enter your full name.");
      return;
    }

    if (!form.email.trim()) {
      setBanner("Enter your email address.");
      return;
    }

    if (!isAllowedEmail(form.email)) {
      setBanner("Use a valid email like @gmail.com, @yahoo.com, @outlook.com, or similar supported email domains.");
      return;
    }

    if (!passwordPolicy.test(form.password)) {
      setBanner("Password must be at least 8 characters and include 1 uppercase letter and 1 special character.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
      };

      await registerUser(payload);

      localStorage.setItem("pendingRegistration", JSON.stringify(payload));
      localStorage.setItem("email", form.email);
      localStorage.setItem("selectedRole", form.role);

      setBanner("OTP sent to your email. Complete verification below to create your account.", "success");
      setTimeout(() => navigate("/verify"), 900);
    } catch (err) {
      console.log(err.response?.data);
      setBanner(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-5%] w-[30rem] h-[30rem] bg-blue-200 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[25rem] h-[25rem] bg-purple-200 rounded-full blur-[100px]" />

      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-10 z-10">
        <div className="hidden lg:flex flex-col justify-center">
          <h1 className="text-4xl font-bold mb-4">
            Your professional future,
            <span className="text-blue-600"> secured.</span>
          </h1>

          <p className="text-gray-600 mb-6">
            Join a secure professional network with verified users and trusted companies.
          </p>

          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl shadow">Secure Identity Protection</div>
            <div className="bg-white p-4 rounded-xl shadow">Access Elite Opportunities</div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-center">Create Account</h2>

          {message && (
            <div
              className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
                messageType === "success"
                  ? "border-green-100 bg-green-50 text-green-700"
                  : "border-red-100 bg-red-50 text-red-700"
              }`}
            >
              {message}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              type="button"
              onClick={() => setForm({ ...form, role: "user" })}
              className={`p-3 rounded-xl border ${form.role === "user" ? "bg-blue-100 border-blue-500" : ""}`}
            >
              Job Seeker
            </button>

            <button
              type="button"
              onClick={() => setForm({ ...form, role: "recruiter" })}
              className={`p-3 rounded-xl border ${form.role === "recruiter" ? "bg-blue-100 border-blue-500" : ""}`}
            >
              Recruiter
            </button>
          </div>

          <input
            name="name"
            placeholder="Full Name"
            onChange={handleChange}
            className="w-full p-3 mb-3 border rounded-xl"
          />

          <input
            name="email"
            type="email"
            placeholder="Email (gmail, yahoo, outlook, etc.)"
            onChange={handleChange}
            className="w-full p-3 mb-3 border rounded-xl"
          />

          <input
            type="password"
            name="password"
            placeholder="Password (8+ chars, 1 uppercase, 1 special char)"
            onChange={handleChange}
            className="w-full p-4 border rounded-xl mb-4"
          />

          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl hover:scale-[1.02] transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Sending OTP..." : "Create Account →"}
          </button>

          <p className="text-center mt-4 text-sm">
            Already have an account?{" "}
            <span onClick={() => navigate("/")} className="text-blue-600 cursor-pointer">
              Login
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
