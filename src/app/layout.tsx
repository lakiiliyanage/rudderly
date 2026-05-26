import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HashTokenHandler from "@/components/auth/HashTokenHandler";
import { createClient } from "@/lib/supabase/server";
import { Analytics } from "@vercel/analytics/react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AgentForge — Build AI Agents Without Code",
  description: "The visual, no-code builder for non-developers. Create, configure, and share AI agents in minutes.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-950">
          <HashTokenHandler />
          <Navbar initialLoggedIn={!!user} />
          <main className="flex-1 pt-4">
            {children}
          </main>
          <Footer />
          <Analytics />
        </body>
    </html>
  );
}
