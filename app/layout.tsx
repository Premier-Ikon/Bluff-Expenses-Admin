import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "./lib/AuthProvider";

export const metadata: Metadata = {
  title: "Bluff US Tour Expenses Admin",
  description: "Review and reimburse Bluff 2026 US Tour expenses.",
  robots: { index: false, follow: false },
  icons: {
    icon: [{ url: "/favicon.ico" }, { url: "/icon.png", type: "image/png" }],
    apple: [{ url: "/apple-icon.png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
