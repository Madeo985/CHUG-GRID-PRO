import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Carta del Futuro",
    short_name: "Futuro",
    description: "Una carta predittiva da 0,20 EUR con mantra vincente.",
    start_url: "/carta-futuro",
    display: "standalone",
    background_color: "#07100f",
    theme_color: "#07100f",
    orientation: "portrait",
    categories: ["entertainment", "lifestyle"],
    lang: "it"
  };
}
