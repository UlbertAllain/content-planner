import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Nexty Content Planner", template: "%s · Nexty Content Planner" },
  description: "Sistem internal divisi Media untuk merencanakan dan mengelola konten beberapa perusahaan dalam satu kalender bersama.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
