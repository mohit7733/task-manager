import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, Calendar } from "lucide-react";
import api from "../api/client";
import { setSession } from "../store/store";
import BrandLogo from "../components/BrandLogo";
import { APP_NAME, APP_TAGLINE, brand } from "../utils/theme";

const previewCards = [
  {
    icon: Calendar,
    title: "Board Meeting — Budget Review",
    time: "Today, 3:00 PM",
    tag: "Upcoming",
  },
  {
    icon: Clock,
    title: "Follow-up: Vendor Contract",
    time: "Due tomorrow",
    tag: "Pending",
  },
  {
    icon: CheckCircle2,
    title: "Approved: Q3 Travel Plan",
    time: "Completed",
    tag: "Done",
  },
];

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
    <div className="flex min-h-screen w-full">
      {/* Left panel — form */}
      <div className="flex w-full flex-col justify-center bg-white px-8 py-12 sm:px-16 lg:w-1/2">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-10 flex items-center gap-2">
            <BrandLogo />
            <span className="text-sm font-medium text-slate-400">{APP_NAME}</span>
          </div>

          <h1 className="text-2xl font-semibold text-slate-900">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-500">{APP_TAGLINE}</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 ${brand.focus}`}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 ${brand.focus}`}
                required
              />
            </div>
            {error && <p className="text-sm text-rose-500">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-60 ${brand.gradient} ${brand.gradientHover}`}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>

      {/* Right panel — animated task preview */}
      <div className={`relative hidden w-1/2 flex-col justify-center overflow-hidden px-16 lg:flex ${brand.gradient}`}>
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10">
          <p className="mb-6 text-sm font-medium uppercase tracking-wide text-white/70">
            Today's Overview
          </p>
          <div className="space-y-3">
            {previewCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 * i, duration: 0.4, ease: "easeOut" }}
                  className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{card.title}</p>
                    <p className="text-xs text-white/60">{card.time}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium text-white/80">
                    {card.tag}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}