import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "MOZEK — AI Innovation Engine",
  description: "Autonomní AI agent, který denně hledá zahraniční trendy a mění je v podnikatelské příležitosti pro Evropu.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body className="min-h-screen bg-mozek-bg text-mozek-text antialiased">
        <header className="sticky top-0 z-40 border-b border-mozek-border bg-mozek-bg/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
              <span>🧠</span>
              <span>MOZEK</span>
              <span className="hidden text-sm font-normal text-mozek-muted sm:inline">
                AI Innovation Engine
              </span>
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <Link href="/" className="btn">Dashboard</Link>
              <Link href="/filtr" className="btn">Filtr</Link>
              <Link href="/moje" className="btn">Moje nápady</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
        <footer className="mx-auto max-w-7xl px-4 py-8 text-center text-xs text-mozek-muted sm:px-6">
          MOZEK běží autonomně na cronu — nové nápady se objevují bez zásahu.
        </footer>
      </body>
    </html>
  );
}
