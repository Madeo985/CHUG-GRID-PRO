import type { Metadata } from "next";
import type { Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://chuggrid.com"),
  title: {
    default: "CHUG-GRID PRO",
    template: "%s | CHUG-GRID PRO"
  },
  description: "Playable polymetric riff generator and rhythm lab for modern metal guitarists.",
  keywords: [
    "polymeter",
    "riff generator",
    "metal guitar",
    "rhythm sequencer",
    "MIDI export",
    "MusicXML"
  ],
  openGraph: {
    title: "CHUG-GRID PRO",
    description: "Generate, visualize, save, and export polymetric metal guitar riffs.",
    url: "https://chuggrid.com",
    siteName: "CHUG-GRID PRO",
    type: "website"
  },
  twitter: {
    card: "summary",
    title: "CHUG-GRID PRO",
    description: "Playable polymetric riff generator and rhythm lab for modern metal guitarists."
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#07100f"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
