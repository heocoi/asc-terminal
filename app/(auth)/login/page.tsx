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
      setError("Incorrect password");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm">
      <div className="rounded-lg border border-border bg-surface p-6">
        <h1 className="text-lg font-semibold">Orchard</h1>
        <p className="mt-1 text-sm text-text-tertiary">
          Enter your password to continue
        </p>

        <div className="mt-5">
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-accent"
            autoFocus
          />
          {error && (
            <p className="mt-2 text-sm text-danger">{error}</p>
          )}
        </div>

        <button
          type="submit"
          className="mt-4 w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-bg transition-colors hover:bg-accent-muted"
        >
          Sign in
        </button>
      </div>
    </form>
  );
}
