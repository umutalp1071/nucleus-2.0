import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nucleus 2.0 — AI Venture Studio",
  description: "Build your own AI venture studio. $50/month. Zero equity loss.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Blocking, not an effect -- runs before paint so every page (not
            just the dashboard, where the toggle lives) respects the stored
            theme with no flash and no dependency on ThemeToggle being mounted. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(localStorage.getItem('nucleus:theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}",
          }}
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}