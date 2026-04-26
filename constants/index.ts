export const langLabels: Record<string, string> = {
  en: "en-US",
  ru: "ru-RU",
  zh: "zh-CN",
};

export const Colors = {
  accent: "#FD5003",
  accentTransparent: "#FD500333",
  bg: "#000000",
  fg: "#FFFFFF",
  surface: "#221D1A",
  surface2: "#222222",
  placeholder: "#FFFFFF80",
  accentRgb: "253, 80, 3",
} as const;

export const Fonts = {
  regular: "OnestRegular",
  medium: "OnestMedium",
  semiBold: "OnestSemiBold",
  bold: "OnestBold",
} as const;

export const PAGE_SIZE = 10;

export const NATIVE_CURRENCIES: Record<
  number,
  { symbol: string; network: string }
> = {
  1: { symbol: "ETH", network: "Ethereum" },
  137: { symbol: "MATIC", network: "Polygon" },
  56: { symbol: "BNB", network: "BNB Smart Chain" },
  43114: { symbol: "AVAX", network: "Avalanche" },
  10: { symbol: "ETH", network: "Optimism" },
  42161: { symbol: "ETH", network: "Arbitrum" },
  250: { symbol: "FTM", network: "Fantom" },
  8453: { symbol: "ETH", network: "Base" },
};
