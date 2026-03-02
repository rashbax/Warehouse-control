import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Склад — Учёт остатков",
  description: "Система учёта складских остатков",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased" suppressHydrationWarning>{children}</body>
    </html>
  );
}
