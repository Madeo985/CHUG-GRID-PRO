import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CHUG-GRID PRO",
  description: "Premium rhythm sketchpad for modern metal guitarists",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
