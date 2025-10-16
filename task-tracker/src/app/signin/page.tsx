"use client";
import { signIn } from "next-auth/react";
export default function SignInPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <div className="rounded-2xl p-6 border border-white/10 bg-white/5 backdrop-blur">
        <h1 className="text-xl font-semibold mb-4">Sign in</h1>
        <button onClick={() => signIn("google")} className="inline-flex items-center gap-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2">
          Continue with Google
        </button>
      </div>
    </main>
  );
}
