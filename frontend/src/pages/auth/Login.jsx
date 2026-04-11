import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../../api/auth";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async () => {
  try {
    const res = await loginUser(form);
    console.log("LOGIN RESPONSE:", res.data); // 🔥 debug

    localStorage.setItem("token", res.data.accessToken);
    localStorage.setItem("role", res.data.user.role);
    localStorage.setItem("user", JSON.stringify(res.data.user));

    const role = res.data.user.role;

    if (role === "admin") {
      navigate("/admin");
    } else if (role === "recruiter") {
      navigate("/recruiter/dashboard");
    } else {
      navigate("/dashboard");
    }

  } catch (err) {
    console.log(err);
    alert("Login failed");
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 relative overflow-hidden">

      {/* Background Effects */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-200 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-purple-200 rounded-full blur-3xl"></div>

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center px-6">

        {/* LEFT SIDE (INFO) */}
        <div className="hidden lg:flex flex-col space-y-6">
          <h1 className="text-4xl font-bold">
            Securing the future of
            <span className="text-blue-600"> professional networks</span>
          </h1>

          <p className="text-gray-600">
            Access the world's most secure job marketplace with encrypted communication and privacy-first control.
          </p>

          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl shadow">
              🔐 Encrypted Interactions
            </div>
            <div className="bg-white p-4 rounded-xl shadow">
              👁 Privacy Control
            </div>
          </div>
        </div>

        {/* RIGHT SIDE (FORM) */}
        <div className="flex justify-center">
          <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg relative">

            {/* Badge */}
            <div className="absolute -top-4 -right-4 bg-gray-100 px-3 py-1 rounded-full text-xs">
              🔒 Secure
            </div>

            <h2 className="text-2xl font-bold mb-2">Sign In</h2>
            <p className="text-gray-500 text-sm mb-6">
              Enter your credentials to continue
            </p>

            {/* Email / Mobile */}
            <input
              name="email"
              placeholder="Email or Mobile"
              onChange={handleChange}
              className="w-full p-3 mb-4 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />

            {/* Password */}
            <input
              type="password"
              name="password"
              placeholder="Password"
              onChange={handleChange}
              className="w-full p-3 mb-4 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />

            {/* Remember */}
            <div className="flex items-center gap-2 mb-4">
              <input type="checkbox" />
              <span className="text-sm">Keep me signed in</span>
            </div>

            {/* Login Button */}
            <button
              onClick={handleLogin}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl hover:scale-[1.02] transition"
            >
              Sign In →
            </button>

            {/* OTP Login */}
            <button className="w-full mt-3 py-3 border rounded-xl">
              Login with OTP
            </button>

            {/* Register */}
            <p className="text-center mt-6 text-sm">
              New here?{" "}
              <span
                onClick={() => navigate("/register")}
                className="text-blue-600 cursor-pointer"
              >
                Create Account
              </span>
            </p>

          </div>
        </div>

      </div>
    </div>
  );
}
