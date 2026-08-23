"use client";

import Link from "next/link";
import { useState } from "react";

export function MobileNav({ userEmail }: { userEmail: string | null }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn"
        aria-label={open ? "Zavřít menu" : "Otevřít menu"}
        aria-expanded={open}
      >
        {open ? "✕" : "☰"}
      </button>
      {open && (
        <div className="absolute inset-x-0 top-full z-50 border-b border-mozek-border bg-mozek-bg p-3 shadow-xl">
          <div className="flex flex-col gap-1.5">
            <Link href="/" onClick={close} className="btn w-full justify-start">Dashboard</Link>
            <Link href="/filtr" onClick={close} className="btn w-full justify-start">Filtr</Link>
            <Link href="/moje" onClick={close} className="btn w-full justify-start">Moje nápady</Link>
            {userEmail ? (
              <>
                <Link href="/ucet" onClick={close} className="btn w-full justify-start">
                  <span className="truncate">{userEmail}</span>
                </Link>
                <form action="/api/auth/logout" method="POST">
                  <button type="submit" className="btn w-full justify-start">Odhlásit</button>
                </form>
              </>
            ) : (
              <Link href="/prihlaseni" onClick={close} className="btn w-full justify-start">Přihlásit se</Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
