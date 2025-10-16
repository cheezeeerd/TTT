import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Mic } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "YYZ Tasks",
  description: "Private voice-powered task tracker",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions as any);
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-dvh bg-gradient-to-br from-slate-950 to-slate-900 text-slate-100`}
      >
        <link rel="manifest" href="/manifest.webmanifest" />
        <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-white/5 border-b border-white/10">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
            <Link href="/" className="font-semibold tracking-tight">YYZ Tasks</Link>
            <nav className="text-sm opacity-80">
              {(session as any)?.user ? (
                <span>Signed in as {(session as any).user.email}</span>
              ) : (
                <Link href="/signin">Sign in</Link>
              )}
            </nav>
          </div>
        </header>
        {children}
        {(session as any)?.user && (
          <Link href="/voice" className="fixed bottom-5 right-5 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/15 border border-white/10 shadow-lg">
            <Mic size={18} />
          </Link>
        )}
      </body>
    </html>
  );
}
