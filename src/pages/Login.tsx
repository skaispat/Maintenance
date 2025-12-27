import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import useAuthStore from "../store/authStore";
import toast from "react-hot-toast";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const loggedInUser = await login(username, password);
    if (loggedInUser) {
      navigate("/", { replace: true });
    } else {
      toast.error("Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-white">
      {/* Left Side - Hero/Brand */}
      <div className="hidden lg:flex w-1/2 bg-primary-dark items-center justify-center relative p-12 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1565008447742-97f6f38c985c?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        <div className="w-full max-w-lg space-y-12 text-center relative z-10">
          <div className="relative">
            <div className="absolute inset-0 bg-white/5 blur-3xl rounded-full transform scale-150 opacity-20"></div>
            <img
              src="/Logo.png"
              alt="Maintenance Pro"
              className="w-full h-auto object-contain max-h-[400px] mx-auto relative drop-shadow-2xl"
            />
          </div>
          <div className="space-y-4">
            <h1 className="text-5xl font-light tracking-tight text-white">
              Maintenance<span className="font-bold text-white">Pro</span>
            </h1>
            <p className="text-red-200 text-lg font-light tracking-wide">
              Operational Excellence System
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-white">
        <div className="w-full max-w-sm space-y-10">
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold tracking-tight text-gray-900">Sign in</h2>
            <p className="text-gray-500 text-sm">Welcome back! Please enter your details.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900 leading-none">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="flex h-12 w-full rounded-lg border border-gray-200 bg-transparent px-4 py-2 text-sm transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 hover:border-gray-300"
                  placeholder="Enter your username"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-900 leading-none">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="flex h-12 w-full rounded-lg border border-gray-200 bg-transparent px-4 py-2 text-sm transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 hover:border-gray-300 pr-10"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 bg-primary text-white hover:bg-primary-dark h-12 w-full shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Sign in
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </form>

          <div className="text-center text-sm text-gray-500 pt-4">
            Powered by{" "}
            <a
              href="https://www.botivate.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary hover:text-primary hover:underline transition-colors"
            >
              Botivate
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;