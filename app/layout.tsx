import type { Metadata, Viewport } from "next";
import { Lexend, Sansation, Courier_Prime } from "next/font/google";
import { Toaster } from "@/components/ui/Toaster";
import { siteUrl } from "@/lib/seo";
import "./globals.css";

const lexend = Lexend({ subsets: ["latin"], variable: "--font-lexend", display: "swap" });
const sansation = Sansation({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-sansation",
  display: "swap",
  adjustFontFallback: false,
  fallback: ["system-ui", "sans-serif"],
});
const courier = Courier_Prime({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-courier", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "HHES Kenya", template: "%s · HHES Kenya" },
  description: "Order quarterly lesson books from Home Health Education Service Kenya.",
  applicationName: "HHES Kenya",
  openGraph: { siteName: "HHES Kenya", type: "website", locale: "en_KE" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#0a67a8" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${lexend.variable} ${sansation.variable} ${courier.variable}`}>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}