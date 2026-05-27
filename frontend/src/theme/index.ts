// Vintage 1930s clown-casino theme tokens — dark Jackpot Academy palette.

export const colors = {
  // Backgrounds
  bgDark: "#0E0A07",
  bgDarker: "#070504",
  bgPanel: "#1A130C",
  bgPanelLight: "#241B11",
  // Paper / cream
  cream: "#EFE4C9",
  paperHighlight: "#F5ECD2",
  paperPrimary: "#E8D9B6",
  paperSecondary: "#F1E3C8",
  // Inks (text on light)
  ink: "#1A1106",
  inkSoft: "#4A382A",
  // Brand accents
  vintageRed: "#B8332E",
  vintageRedDark: "#7E1E1A",
  vintageGreen: "#4F6D3A",
  vintageGreenDark: "#33491E",
  vintagePurple: "#5C3D6E",
  vintagePurpleDark: "#3B2548",
  antiqueGold: "#C99A3C",
  antiqueGoldDark: "#8F6D24",
  brass: "#B08D57",
  brassDark: "#76582C",
  mutedYellow: "#D9B569",
  // Mascot palette
  clownGreen: "#5A7C3E",
  clownRed: "#B8332E",
  clownPurple: "#5C3D6E",
  clownFace: "#F4ECD8",
  // Rarity hues (dark theme)
  common: "#A0876B",
  rare: "#4E7AA8",
  epic: "#7A4DA0",
  legendary: "#D4A93F",
  successGreen: "#5F8C3A",
  warningAmber: "#C8842B",
  // Legacy aliases (keep existing components working)
  wornWood: "#5C3A21",
  wornWoodDark: "#3D2614",
};

export const fonts = {
  heading: "Rye_400Regular",
  subheading: "Limelight_400Regular",
  numbers: "Bungee_400Regular",
  body: "IMFellEnglishSC_400Regular",
};

export const radii = {
  sm: 6,
  md: 12,
  lg: 18,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const cartoonShadow = (offset = 4, color = "#000000") => ({
  shadowColor: color,
  shadowOffset: { width: offset, height: offset },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 6,
});

export const goldBorder = (width = 2) => ({
  borderWidth: width,
  borderColor: colors.antiqueGold,
});

export const inkBorder = (width = 3) => ({
  borderWidth: width,
  borderColor: colors.ink,
});

export const rarityColor = (rarity: string) => {
  switch (rarity) {
    case "raro":
      return colors.rare;
    case "epico":
      return colors.epic;
    case "legendario":
      return colors.legendary;
    default:
      return colors.common;
  }
};

export const rarityLabel = (rarity: string) => {
  switch (rarity) {
    case "raro":
      return "Raro";
    case "epico":
      return "Épico";
    case "legendario":
      return "Legendario";
    default:
      return "Común";
  }
};
