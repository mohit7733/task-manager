import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../api/client";
import { setSession } from "../store/store";
import BrandLogo from "../components/BrandLogo";
import { APP_NAME, APP_TAGLINE, brand } from "../utils/theme";

export default function LoginPage() {
  const [email, setEmail] = useState("pa@coo.com");
  const [password, setPassword] = useState("pa123456");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/auth/login", { email, password });
      dispatch(setSession(data));
      navigate("/");
    } catch {
      setError("Invalid email or password. Run backend seed: npm run seed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur-xl"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandLogo dark />
          <p className="mt-3 text-sm text-indigo-200">{APP_TAGLINE}</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-indigo-200">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-indigo-300/60 ${brand.focus}`}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-indigo-200">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-indigo-300/60 ${brand.focus}`}
              required
            />
          </div>
          {error && <p className="text-sm text-rose-300">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-lg py-2.5 text-sm font-semibold disabled:opacity-60 ${brand.gradient} ${brand.gradientHover}`}
          >
            {loading ? "Signing in…" : `Sign in to ${APP_NAME}`}
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-indigo-300/80">Demo: pa@coo.com / pa123456</p>
      </motion.div>
    </div>
  );
}
