import type { MetadataRoute } from "next";
import { identity as site } from "@/src/content";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: site.url, lastModified: new Date(), changeFrequency: "monthly", priority: 1 }];
}
