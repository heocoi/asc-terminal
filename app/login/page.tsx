"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError("ACCESS DENIED");
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-4">
        <div className="border border-term-border">
          <div className="flex items-center gap-2 border-b border-term-border px-3 py-1.5">
            <span className="bg-neon-green px-1.5 py-0.5 text-[10px] font-bold uppercase text-black">
              ASC
            </span>
            <span className="text-[10px] uppercase tracking-widest text-term-dim">
              Terminal Auth
            </span>
          </div>
          <div className="px-3 py-4">
            <label className="mb-1 block text-[10px] uppercase tracking-wider text-term-dim">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-term-border bg-term-bg px-2 py-1.5 text-sm text-neon-green caret-neon-green outline-none focus:border-neon-green"
              autoFocus
              placeholder=">"
            />
            {error && (
              <p className="mt-2 text-[10px] text-neon-red">{error}</p>
            )}
          </div>
          <div className="border-t border-term-border px-3 py-2">
            <button
              type="submit"
              className="w-full border border-neon-green py-1 text-[10px] uppercase tracking-widest text-neon-green transition-colors hover:bg-neon-green hover:text-black"
            >
              Authenticate
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
