import type { Metadata } from "next";
import Link from "next/link";
import { Playfair_Display } from "next/font/google";
import { getSupabaseAuthClient } from "@/lib/supabase";
import { MobileNav } from "@/components/MobileNav";
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
          <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <Link href="/" className="flex items-center gap-1.5 tracking-tight">
              <span className="text-2xl leading-none">🧠</span>
              <span className={`${logoFont.className} text-2xl leading-none text-mozek-accent`}>Brain</span>
              <span className="hidden text-sm font-normal text-mozek-muted sm:inline">
                AI Innovation Engine
              </span>
            </Link>
            <nav className="hidden items-center gap-1 text-sm sm:flex">
              <Link href="/" className="btn whitespace-nowrap">Dashboard</Link>
              <Link href="/filtr" className="btn whitespace-nowrap">Filtr</Link>
              <Link href="/moje" className="btn whitespace-nowrap">Moje nápady</Link>
              {user ? (
                <div className="flex items-center gap-2">
                  <span
                    className="max-w-[160px] truncate text-xs text-mozek-muted"
                    title={user.email ?? undefined}
                  >
                    {user.email}
                  </span>
                  <form action="/api/auth/logout" method="POST">
                    <button type="submit" className="btn whitespace-nowrap">Odhlásit</button>
                  </form>
                </div>
              ) : (
                <Link href="/prihlaseni" className="btn whitespace-nowrap">Přihlásit se</Link>
              )}
            </nav>
            <MobileNav userEmail={user?.email ?? null} />
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
        <footer className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-4 py-8 text-center text-xs text-mozek-muted sm:px-6">
          <p>BRAIN ENGINE běží autonomně na cronu — nové nápady se objevují bez zásahu.</p>
          <nav className="flex gap-4">
            <Link href="/obchodni-podminky" className="hover:text-mozek-text hover:underline">
              Obchodní podmínky
            </Link>
            <Link href="/ochrana-udaju" className="hover:text-mozek-text hover:underline">
              Ochrana osobních údajů
            </Link>
          </nav>
        </footer>
      </body>
    </html>
  );
}
