import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../../api/auth";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "seeker", // UI only (not sent to backend)
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async () => {
    try {
      // ✅ Only send what backend expects
      const payload = {
        email: form.email,
        password: form.password,
      };

      await registerUser(payload);

      localStorage.setItem("email", form.email);
      localStorage.setItem("selectedRole", form.role); // optional

      alert("Registered! Check OTP in terminal");
      navigate("/verify");

    } catch (err) {
      console.log(err.response?.data);
      alert(err.response?.data?.message?.[0] || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 relative overflow-hidden">

      {/* Background glow */}
      <div className="absolute top-[-10%] right-[-5%] w-[30rem] h-[30rem] bg-blue-200 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[25rem] h-[25rem] bg-purple-200 rounded-full blur-[100px]"></div>

      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-10 z-10">

        {/* LEFT SIDE */}
        <div className="hidden lg:flex flex-col justify-center">
          <h1 className="text-4xl font-bold mb-4">
            Your professional future,
            <span className="text-blue-600"> secured.</span>
          </h1>

          <p className="text-gray-600 mb-6">
            Join a secure professional network with verified users and trusted companies.
          </p>

          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl shadow">
              🔐 Secure Identity Protection
            </div>
            <div className="bg-white p-4 rounded-xl shadow">
              💼 Access Elite Opportunities
            </div>
          </div>
        </div>

        {/* RIGHT SIDE FORM */}
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-center">
            Create Account
          </h2>

          {/* Role UI (not sent to backend) */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => setForm({ ...form, role: "seeker" })}
              className={`p-3 rounded-xl border ${
                form.role === "seeker"
                  ? "bg-blue-100 border-blue-500"
                  : ""
              }`}
            >
              Job Seeker
            </button>

            <button
              onClick={() => setForm({ ...form, role: "recruiter" })}
              className={`p-3 rounded-xl border ${
                form.role === "recruiter"
                  ? "bg-blue-100 border-blue-500"
                  : ""
              }`}
            >
              Recruiter
            </button>
          </div>

          {/* Inputs */}
          <input
            name="name"
            placeholder="Full Name"
            onChange={handleChange}
            className="w-full p-3 mb-3 border rounded-xl"
          />

          <input
            name="email"
            placeholder="Email"
            onChange={handleChange}
            className="w-full p-3 mb-3 border rounded-xl"
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            onChange={handleChange}
            className="w-full p-4 border rounded-xl mb-4"
          />

          {/* Button */}
          <button
            onClick={handleRegister}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl hover:scale-[1.02] transition"
          >
            Create Account →
          </button>

          <p className="text-center mt-4 text-sm">
            Already have an account?{" "}
            <span
              onClick={() => navigate("/")}
              className="text-blue-600 cursor-pointer"
            >
              Login
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}