"use client";

import { Bricolage_Grotesque } from "next/font/google";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { X, Loader2 } from "lucide-react";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

/* Survey-style dial: 60 ticks, a longer one every 5th. */
const TICKS = Array.from({ length: 60 }, (_, i) => ({
  angle: i * 6,
  major: i % 5 === 0,
}));
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap",
});

function Dial({ fast }: { fast: boolean }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 select-none"
    >
      {/* Outer ring: ticks, rotates clockwise */}
      <svg
        viewBox="0 0 200 200"
        className={`absolute inset-0 h-full w-full text-slate-500 motion-reduce:animate-none ${
          fast
            ? "animate-[spin_3s_linear_infinite]"
            : "animate-[spin_60s_linear_infinite]"
        }`}
        style={{ transition: "opacity 0.3s" }}
      >
        <circle
          cx="100"
          cy="100"
          r="94"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.75"
          opacity="0.6"
        />
        {TICKS.map(({ angle, major }) => (
          <line
            key={angle}
            x1="100"
            y1="6"
            x2="100"
            y2={major ? 20 : 13}
            stroke="currentColor"
            strokeWidth={major ? 1.4 : 0.8}
            opacity={major ? 0.9 : 0.55}
            transform={`rotate(${angle} 100 100)`}
          />
        ))}
        {/* single amber marker so the rotation reads */}
        <circle cx="100" cy="6" r="3.2" fill="#f59e0b" />
      </svg>

      {/* Inner ring: dashed, rotates the other way */}
      <svg
        viewBox="0 0 200 200"
        className={`absolute inset-0 h-full w-full text-slate-600 motion-reduce:animate-none ${
          fast
            ? "animate-[spin_4s_linear_infinite_reverse]"
            : "animate-[spin_90s_linear_infinite_reverse]"
        }`}
      >
        <circle
          cx="100"
          cy="100"
          r="66"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.9"
          strokeDasharray="2 5"
        />
        <circle
          cx="100"
          cy="100"
          r="44"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.75"
          opacity="0.7"
        />
      </svg>

      {/* Static crosshair */}
      <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full text-slate-500">
        <path
          d="M100 78v44M78 100h44"
          stroke="currentColor"
          strokeWidth="0.9"
          opacity="0.7"
        />
        <circle cx="100" cy="100" r="2" fill="#f59e0b" />
      </svg>
    </div>
  );
}

export default function LoginModal({ open, onClose }: LoginModalProps) {
  // State lives in the inner component, so it resets itself when closed
  if (!open) return null;
  return <LoginModalContent onClose={onClose} />;
}

function LoginModalContent({ onClose }: { onClose: () => void }) {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const googleBtnRef = useRef<HTMLButtonElement>(null);

  // Entrance transition
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Lock page scroll and focus the main action
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    googleBtnRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  // Close on Escape (not while signing in)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [loading, onClose]);

  const handleGoogleLogin = async () => {
    try {
      setError("");
      setLoading(true);
      await signIn("google", {
        callbackUrl: "/dashboard",
      });
    } catch {
      setError("Sign-in didn't go through. Check your connection and try again.");
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-title"
      aria-describedby="login-description"
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-200 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={() => {
          if (!loading) onClose();
        }}
      />

      {/* Modal */}
      <div
        className={`relative z-10 w-full max-w-[26rem] overflow-hidden rounded-xl bg-white shadow-2xl shadow-black/40 transition-all duration-200 ease-out ${
          visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        {/* Header */}
        <div className="relative overflow-hidden bg-slate-900 px-8 pb-9 pt-8">
          <Dial fast={loading} />

          <button
            onClick={onClose}
            disabled={loading}
            className="absolute right-3 top-3 z-20 rounded-md p-2 text-slate-400 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          <div className="relative z-10">
            <span className={`${display.className} text-2xl font-extrabold tracking-tight text-white`}>
              Infra Guard
            </span>

            <h2
              id="login-title"
              className="mt-10 max-w-[15rem] text-[1.7rem] font-semibold leading-[1.15] tracking-tight text-white"
            >
              Sign in to your dashboard
            </h2>

            <p
              id="login-description"
              className="mt-3 max-w-[16rem] text-sm leading-6 text-slate-400"
            >
              Use your Google account to open your infrastructure data.
            </p>
          </div>
        </div>

        {/* Login */}
        <div className="px-8 pb-7 pt-7">
          {error && (
            <div
              role="alert"
              className="mb-4 rounded-lg border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              {error}
            </div>
          )}

          <button
            ref={googleBtnRef}
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 active:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin text-slate-500" />
                Connecting to Google…
              </>
            ) : (
              <>
                {/* Google logo */}
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fill="#4285F4"
                    d="M21.35 12.23c0-.79-.07-1.55-.23-2.27H12v4.3h5.23a4.47 4.47 0 0 1-1.94 2.93v2.44h3.14c1.84-1.69 2.92-4.18 2.92-7.4Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 21.6c2.63 0 4.84-.87 6.45-2.36l-3.14-2.44c-.87.58-1.98.93-3.31.93-2.54 0-4.69-1.72-5.46-4.03H3.3v2.52A9.74 9.74 0 0 0 12 21.6Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M6.54 13.7A5.85 5.85 0 0 1 6.23 12c0-.59.11-1.17.31-1.7V7.78H3.3A9.74 9.74 0 0 0 2.27 12c0 1.57.38 3.05 1.03 4.22l3.24-2.52Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 6.27c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.3 14.63 2.4 12 2.4a9.74 9.74 0 0 0-8.7 5.38l3.24 2.52C7.31 7.99 9.46 6.27 12 6.27Z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}