import type { Metadata } from "next";
import Link from "next/link";
import { Playfair_Display } from "next/font/google";
import { getSupabaseAuthClient } from "@/lib/supabase";
import "./globals.css";

// Elegant wordmark for the header logo only — everything else on the site
// stays on the default sans-serif stack. Distinguishes the header brand
// mark from the plain bold "BRAIN ENGINE" page heading below it.
const logoFont = Playfair_Display({ subsets: ["latin"], weight: "600", style: "italic" });

export const metadata: Metadata = {
  title: "BRAIN ENGINE — AI Innovation Engine",
  description: "Autonomní AI agent, který denně hledá zahraniční trendy a mění je v podnikatelské příležitosti pro Evropu.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = getSupabaseAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="cs">
      <body className="min-h-screen bg-mozek-bg text-mozek-text antialiased">
        <header className="sticky top-0 z-40 border-b border-mozek-border bg-mozek-bg/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <Link href="/" className="flex items-center gap-1.5 tracking-tight">
              <span className="text-2xl leading-none">🧠</span>
              <span className={`${logoFont.className} text-2xl leading-none text-mozek-accent`}>Brain</span>
              <span className="hidden text-sm font-normal text-mozek-muted sm:inline">
                AI Innovation Engine
              </span>
            </Link>
            <nav className="flex min-w-0 items-center gap-1 overflow-x-auto text-sm">
              <Link href="/" className="btn shrink-0 whitespace-nowrap">Dashboard</Link>
              <Link href="/filtr" className="btn shrink-0 whitespace-nowrap">Filtr</Link>
              <Link href="/moje" className="btn shrink-0 whitespace-nowrap">
                <span className="sm:hidden">Moje</span>
                <span className="hidden sm:inline">Moje nápady</span>
              </Link>
              {user ? (
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className="hidden max-w-[160px] truncate text-xs text-mozek-muted sm:inline"
                    title={user.email ?? undefined}
                  >
                    {user.email}
                  </span>
                  <form action="/api/auth/logout" method="POST">
                    <button type="submit" className="btn shrink-0 whitespace-nowrap">Odhlásit</button>
                  </form>
                </div>
              ) : (
                <Link href="/prihlaseni" className="btn shrink-0 whitespace-nowrap">
                  <span className="sm:hidden">Účet</span>
                  <span className="hidden sm:inline">Přihlásit se</span>
                </Link>
              )}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
        <footer className="mx-auto max-w-7xl px-4 py-8 text-center text-xs text-mozek-muted sm:px-6">
          BRAIN ENGINE běží autonomně na cronu — nové nápady se objevují bez zásahu.
        </footer>
      </body>
    </html>
  );
}
