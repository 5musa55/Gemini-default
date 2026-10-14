import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Studentský bazar | Inzerce pro studenty",
  description:
    "Bazar učebnic, skript, elektroniky a vybavení na kolej pro studenty vysokých a středních škol.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="cs" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900 font-sans dark:bg-zinc-950 dark:text-zinc-100">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-zinc-200 bg-white py-8 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            <div className="mx-auto max-w-7xl px-4">
              <p className="font-medium text-zinc-700 dark:text-zinc-300">
                🎓 Studentský bazar — inzerce učebnic a vybavení
              </p>
              <p className="mt-1">
                Postaveno na Next.js (App Router) a Supabase
              </p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
