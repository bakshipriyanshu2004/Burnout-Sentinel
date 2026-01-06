import type { Metadata } from "next";
import { TopNav } from "@/components/TopNav";
import { SathiChat } from "@/components/SathiChat";
import "./globals.css";

// Using Inter/Outfit font via Google Fonts would be ideal if allowed, but strict defaults for now.
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
        <SathiChat />
      </body>
    </html>
  );
}
