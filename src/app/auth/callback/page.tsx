"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

export default function AuthCallbackPage() {
  const auth = useAuth();
  const [ready, setReady] = useState(false);
  const nextPath = useMemo(() => {
    if (typeof window === "undefined") return "/";
    const value = new URLSearchParams(window.location.search).get("next") || "/";
    return value.startsWith("/") ? value : "/";
  }, []);

  useEffect(() => {
    if (!auth.loading) {
      const timer = window.setTimeout(() => setReady(true), 500);
      return () => window.clearTimeout(timer);
    }
  }, [auth.loading]);

  useEffect(() => {
    if (ready && auth.user) window.location.replace(nextPath);
  }, [auth.user, nextPath, ready]);

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-[#1e1e2e] bg-[#0e0e16] p-6 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#177CB020] text-[#00B0BA]">
          {auth.user ? <CheckCircle2 size={24} /> : <ShieldCheck size={24} />}
        </div>
        <h1 className="text-xl font-bold text-[#f8f8ff]">
          {auth.user ? "Signed in" : "Finishing sign in"}
        </h1>
        <p className="mt-2 text-sm text-[#8b8ba7]">
          {auth.user ? "Redirecting you back to Skillscale." : "Your secure session is being prepared."}
        </p>
        {!auth.user && (
          <Loader2 size={22} className="mx-auto mt-5 animate-spin text-[#177CB0]" />
        )}
        {auth.error && (
          <div className="mt-5 rounded-xl border border-[#ff4d4d30] bg-[#ff4d4d10] p-3 text-sm text-[#ff4d4d]">
            {auth.error}
          </div>
        )}
        <Link href="/" className="mt-5 inline-flex min-h-10 items-center justify-center rounded-xl border border-[#2e2e4e] px-4 text-sm text-[#f8f8ff] hover:border-[#177CB0]">
          Back to home
        </Link>
      </div>
    </div>
  );
}
