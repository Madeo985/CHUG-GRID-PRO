import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://chuggrid.com",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1
    },
    {
      url: "https://chuggrid.com/free-metal-midi-riff-generator",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9
    }
  ];
}
