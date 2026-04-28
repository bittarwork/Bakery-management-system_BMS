// Root layout: applies RTL direction, Arabic font, and Sonner toaster
import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "نظام إدارة المخبز — BMS",
  description: "نظام إدارة وتوزيع منتجات المخبز",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${cairo.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background font-sans">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
