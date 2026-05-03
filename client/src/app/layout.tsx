import type { Metadata } from "next";
import { TopNav } from "@/components/TopNav";
import "./globals.css";

import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Baal Mantra - Burnout Warning System",
  description: "Monitor student engagement and burnout risks in real-time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} antialiased min-h-screen bg-[#060910]`}
        suppressHydrationWarning
      >
        <TopNav />
        {children}
      </body>
    </html>
  );
}
