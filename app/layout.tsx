import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "WTTT",
  description: "What's the Treat, Text, Task & Test today?",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <head>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="afterInteractive" />
      </head>
      <body className="h-full" style={{ fontFamily: "'Inter', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
