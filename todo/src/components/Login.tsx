"use client";

import { signIn } from "next-auth/react";

export default function Login() {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-pink-100 to-yellow-100 px-4 overflow-hidden">
      {/* Colorful background blobs */}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-indigo-300/50 blur-3xl" />
      <div className="absolute top-1/4 -right-40 h-96 w-96 rounded-full bg-pink-300/50 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-yellow-200/50 blur-3xl" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm rounded-[2.5rem] bg-white/95 backdrop-blur-xl border border-white/60 shadow-[0_30px_80px_rgba(0,0,0,0.15)] p-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 via-pink-500 to-amber-500 bg-clip-text text-transparent">
            Welcome Back
          </h1>
          <p className="text-slate-600 mt-3">
            Organize your tasks beautifully ✨
          </p>
        </div>

        {/* Google Login Only */}
        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="w-full flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-500 via-pink-500 to-amber-400 py-4 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition"
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google"
            className="w-5 h-5 bg-white rounded-full p-0.5"
          />
          Continue with Google
        </button>

        <p className="text-center text-xs text-slate-500 mt-8 leading-relaxed">
          By continuing, you agree to our <span className="text-indigo-500 font-medium">Terms</span> & <span className="text-pink-500 font-medium">Privacy Policy</span>
        </p>
      </div>
    </div>
  );
}
