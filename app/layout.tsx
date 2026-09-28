import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "TwinOps Enterprise — Autonomous Workplace Digital Twins",
  description:
    "Ambient AI digital twins that live directly in Microsoft Teams, Slack, GitHub, and enterprise episodic memory.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-[#eaf0f6] text-slate-800 antialiased selection:bg-indigo-500/20`}
      >
        {children}
      </body>
    </html>
  );
}
