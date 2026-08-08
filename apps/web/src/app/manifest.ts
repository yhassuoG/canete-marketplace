import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cañete Marketplace",
    short_name: "Cañete",
    description: "Marketplace turístico y gastronómico multiempresa",
    start_url: "/",
    display: "standalone",
    background_color: "#f8f4ea",
    theme_color: "#083d77",
    orientation: "portrait",
    categories: ["travel", "food", "lifestyle"],
  };
}
