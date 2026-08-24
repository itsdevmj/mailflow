"use client";

import { ArrowRight, LoaderCircle, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Brand } from "@/components/brand";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      router.push("/");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand"><Brand /></div>
        <div className="login-icon"><LockKeyhole size={22} /></div>
        <h1>Welcome back</h1>
        <p>Sign in to access your private mailbox.</p>
        <form onSubmit={login}>
          <label>Email<input name="email" type="email" autoComplete="email" required /></label>
          <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" disabled={loading}>
            {loading ? <LoaderCircle className="spin" size={18} /> : <><span>Sign in</span><ArrowRight size={18} /></>}
          </button>
        </form>
      </section>
    </main>
  );
}
