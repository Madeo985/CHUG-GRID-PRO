import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Carta del Futuro",
  description: "Una carta predittiva da 0,20 EUR con mantra vincente, pensata per iPhone.",
  appleWebApp: {
    capable: true,
    title: "Carta Futuro",
    statusBarStyle: "black-translucent"
  },
  openGraph: {
    title: "Carta del Futuro",
    description: "Fai una domanda, sblocca una carta e ricevi un mantra vincente.",
    type: "website"
  }
};

export default function FutureCardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
