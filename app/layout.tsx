import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Shipyard",
  description: "Personal build & deploy dashboard.",
  openGraph: {
    title: "Shipyard",
    description: "Personal build & deploy dashboard.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shipyard",
    description: "Personal build & deploy dashboard.",
  },
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} bg-[#0a0a0a] text-[#e5e5e5] antialiased min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
