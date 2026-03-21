import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "めしログ",
    short_name: "めしログ",
    description:
      "毎日の食事をサクッと記録。カロリー・PFC・食費をまるごと管理。",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#FFFFFF",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
