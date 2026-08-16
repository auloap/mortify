import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Mono } from "next/font/google";
import "./globals.css";

const serif = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
});

const mono = DM_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Mortify",
  description: "A daily rhythm of thanks, the Word, obedience — and honest war on sin.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4efe4" },
    { media: "(prefers-color-scheme: dark)", color: "#181310" },
  ],
};

// Sets the theme before first paint: Telegram's colorScheme wins, the OS
// preference is the fallback outside Telegram.
const themeInit = `(function(){try{
var tg=window.Telegram&&window.Telegram.WebApp;
var dark=tg&&tg.colorScheme?tg.colorScheme==="dark":matchMedia("(prefers-color-scheme: dark)").matches;
document.documentElement.dataset.theme=dark?"night":"day";
}catch(e){document.documentElement.dataset.theme="day";}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${mono.variable} h-full`} suppressHydrationWarning>
      <head>
        {/* Must be a plain blocking script: window.Telegram.WebApp.initData has to
            exist before React hydrates, or the first API calls go out unauthenticated. */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="https://telegram.org/js/telegram-web-app.js" />
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="h-full">{children}</body>
    </html>
  );
}
