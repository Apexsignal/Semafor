"use client";

import { useState, type FormEvent } from "react";

type Status = "idle" | "loading" | "done" | "error";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? "Něco se pokazilo, zkus to prosím znovu.");
        setStatus("error");
        return;
      }
      setStatus("done");
    } catch {
      setErrorMsg("Něco se pokazilo, zkus to prosím znovu.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <p className="flex items-center gap-2 text-sm font-medium text-mozek-good">
        <span>✅</span> Jsi na seznamu. Ozveme se, až spustíme plný přístup.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-start">
      <div className="flex-1">
        <input
          type="email"
          required
          placeholder="tvuj@email.cz"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input w-full sm:min-w-[240px]"
          disabled={status === "loading"}
        />
        {status === "error" && <p className="mt-1 text-xs text-mozek-bad">{errorMsg}</p>}
      </div>
      <button type="submit" className="btn shrink-0 whitespace-nowrap" disabled={status === "loading"}>
        {status === "loading" ? "Odesílám…" : "Chci vědět, až to spustíme"}
      </button>
    </form>
  );
}
