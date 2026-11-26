import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./colorblind.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Holiday Deal Finder",
  description: "Search, score and compare holiday deals from your Google Sheet.",
};

// Runs before first paint so the saved theme and palette don't flash.
const preferenceScript = `(function(){try{var t=localStorage.getItem('hdf.theme');t=t?JSON.parse(t):'system';var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);var c=localStorage.getItem('hdf.cb');document.documentElement.dataset.cb=c==='true'?'on':'off';}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} data-cb="off">
      <head>
        <script dangerouslySetInnerHTML={{ __html: preferenceScript }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
