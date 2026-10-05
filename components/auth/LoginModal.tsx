"use client";

import { signIn } from "next-auth/react";
import { X, ShieldCheck } from "lucide-react";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

export default function LoginModal({
  open,
  onClose,
}: LoginModalProps) {
  if (!open) return null;

  const handleGoogleLogin = async () => {
    await signIn("google", {
      callbackUrl: "/dashboard",
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-[90%] max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="px-8 pb-6 pt-9 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
            <ShieldCheck
              size={30}
              className="text-emerald-600"
            />
          </div>

          <h2 className="text-2xl font-bold text-slate-900">
            Welcome to Infra Build
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Sign in to access your infrastructure
            intelligence dashboard.
          </p>
        </div>

        {/* Login */}
        <div className="px-8 pb-8">
          <button
            onClick={handleGoogleLogin}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:shadow-md"
          >
            {/* Google logo */}
            <svg
              width="20"
              height="20"
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
          </button>

          <p className="mt-5 text-center text-xs leading-5 text-slate-400">
            By continuing, you agree to our terms of
            service and privacy policy.
          </p>
        </div>
      </div>
    </div>
  );
}