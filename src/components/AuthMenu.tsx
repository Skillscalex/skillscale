"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronDown,
  Loader2,
  LogIn,
  LogOut,
  Mail,
  MessageCircle,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { useAuth } from "./AuthProvider";

function displayName(user: ReturnType<typeof useAuth>["user"]) {
  if (!user) return "";
  return (
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.user_metadata?.user_name ||
    user.email ||
    "Skillscale user"
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "S";
}

export function AuthMenu() {
  const auth = useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const name = useMemo(() => displayName(auth.user), [auth.user]);

  async function startOAuth(provider: "google" | "github" | "discord") {
    setPending(provider);
    await auth.signInWithOAuth(provider);
    setPending(null);
  }

  async function submitEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending("email");
    try {
      await auth.signInWithEmail(email);
      setEmailSent(true);
    } catch {
      setEmailSent(false);
    } finally {
      setPending(null);
    }
  }

  if (auth.loading) {
    return (
      <button className="p-2 rounded-lg bg-[#1e1e2e] text-[#8b8ba7]" aria-label="Loading account">
        <Loader2 size={18} className="animate-spin" />
      </button>
    );
  }

  if (auth.user) {
    return (
      <div className="relative">
        <button
          onClick={() => setOpen((value) => !value)}
          className="flex items-center gap-2 rounded-xl border border-[#2e2e4e] bg-[#1e1e2e] px-2.5 py-2 text-sm text-[#f8f8ff] hover:border-[#177CB0] transition-colors"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#177CB0] text-xs font-bold text-white">
            {initials(name)}
          </span>
          <span className="hidden max-w-28 truncate lg:block">{name}</span>
          <ChevronDown size={14} className="text-[#8b8ba7]" />
        </button>
        {open && (
          <div className="absolute right-0 mt-2 w-72 overflow-hidden rounded-xl border border-[#1e1e2e] bg-[#0e0e16] shadow-2xl">
            <div className="border-b border-[#1e1e2e] p-3">
              <div className="flex items-center gap-2 text-[#f8f8ff]">
                <ShieldCheck size={16} className="text-[#00B0BA]" />
                <span className="text-sm font-semibold">Signed in</span>
              </div>
              <p className="mt-1 truncate text-xs text-[#8b8ba7]">{auth.user.email}</p>
            </div>
            <div className="p-2">
              <Link
                href="/profile/me"
                onClick={() => setOpen(false)}
                className="flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm text-[#8b8ba7] hover:bg-[#1e1e2e] hover:text-[#f8f8ff]"
              >
                <User size={15} />
                Profile
              </Link>
              <button
                onClick={() => auth.signOut()}
                className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm text-[#8b8ba7] hover:bg-[#1e1e2e] hover:text-[#f8f8ff]"
              >
                <LogOut size={15} />
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-xl border border-[#2e2e4e] bg-[#1e1e2e] px-3 py-2 text-sm font-medium text-[#f8f8ff] hover:border-[#177CB0] transition-colors"
      >
        <LogIn size={15} />
        <span className="hidden sm:inline">Sign in</span>
      </button>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
          <button className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} aria-label="Close sign in" />
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[#1e1e2e] bg-[#0e0e16] shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#1e1e2e] p-5">
              <div>
                <div className="flex items-center gap-2 text-[#f8f8ff]">
                  <ShieldCheck size={18} className="text-[#00B0BA]" />
                  <h2 className="text-lg font-bold">Sign in to Skillscale</h2>
                </div>
                <p className="mt-1 text-sm text-[#8b8ba7]">Use one secure account across marketplace, vault, and studio.</p>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-lg p-2 text-[#8b8ba7] hover:bg-[#1e1e2e] hover:text-[#f8f8ff]" aria-label="Close sign in">
                <X size={17} />
              </button>
            </div>
            <div className="space-y-3 p-5">
              {!auth.configured && (
                <div className="rounded-xl border border-[#0065A240] bg-[#0065A210] p-3 text-xs text-[#8b8ba7]">
                  Supabase Auth needs `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
                </div>
              )}
              <button
                onClick={() => startOAuth("google")}
                disabled={!auth.configured || pending !== null}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#177CB0] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#065279] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pending === "google" ? <Loader2 size={17} className="animate-spin" /> : <span className="text-base font-bold">G</span>}
                Continue with Google
              </button>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => startOAuth("github")}
                  disabled={!auth.configured || pending !== null}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#2e2e4e] px-3 text-sm text-[#f8f8ff] hover:border-[#177CB0] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {pending === "github" ? <Loader2 size={16} className="animate-spin" /> : <span className="text-sm font-bold">GH</span>}
                  GitHub
                </button>
                <button
                  onClick={() => startOAuth("discord")}
                  disabled={!auth.configured || pending !== null}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#2e2e4e] px-3 text-sm text-[#f8f8ff] hover:border-[#177CB0] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {pending === "discord" ? <Loader2 size={16} className="animate-spin" /> : <MessageCircle size={16} />}
                  Discord
                </button>
              </div>
              <div className="flex items-center gap-3 py-1">
                <div className="h-px flex-1 bg-[#1e1e2e]" />
                <span className="text-xs text-[#8b8ba7]">or</span>
                <div className="h-px flex-1 bg-[#1e1e2e]" />
              </div>
              <form onSubmit={submitEmail} className="space-y-3">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-[#8b8ba7]">Email</span>
                  <div className="flex min-h-11 items-center gap-2 rounded-xl border border-[#1e1e2e] bg-[#12121a] px-3 focus-within:border-[#177CB0]">
                    <Mail size={15} className="text-[#8b8ba7]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        setEmailSent(false);
                      }}
                      placeholder="you@example.com"
                      className="min-w-0 flex-1 bg-transparent text-sm text-[#f8f8ff] outline-none placeholder:text-[#4a4a5a]"
                    />
                  </div>
                </label>
                <button
                  type="submit"
                  disabled={!auth.configured || pending !== null || !email}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#2e2e4e] px-4 text-sm font-medium text-[#f8f8ff] hover:border-[#177CB0] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {pending === "email" ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                  Send magic link
                </button>
              </form>
              {emailSent && (
                <div className="flex items-center gap-2 rounded-xl border border-[#00d97e30] bg-[#00d97e10] p-3 text-xs text-[#00d97e]">
                  <CheckCircle2 size={15} />
                  Check your inbox for the sign-in link.
                </div>
              )}
              {auth.error && (
                <div className="rounded-xl border border-[#ff4d4d30] bg-[#ff4d4d10] p-3 text-xs text-[#ff4d4d]">
                  {auth.error}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
