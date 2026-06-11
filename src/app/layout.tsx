import type { Metadata } from "next";
import { DM_Sans, Syne } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "WriteGuard AI — AI Writing Assistant for Teams & Brands",
    template: "%s | WriteGuard AI",
  },
  description:
    "Write sharper, faster, and more on-brand with AI. Grammar checking, rewrites, tone control, brand voice, and content optimization in one workspace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${syne.variable} h-full`}>
      <body className="min-h-full bg-[var(--background)] font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
