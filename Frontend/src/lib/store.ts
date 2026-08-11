import { create } from "zustand";

type SearchMode = "stay" | "eat" | "tour" | "delivery";

type MarketplaceState = {
  mode: SearchMode;
  setMode: (mode: SearchMode) => void;
};

export const useMarketplaceStore = create<MarketplaceState>((set) => ({
  mode: "stay",
  setMode: (mode) => set({ mode }),
}));
