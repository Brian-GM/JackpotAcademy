// Vintage 1930s casino theme tokens used across the app.
// Ink outline used for borders / shadows. Sepia/cream for paper. Antique gold + vintage red for accents.

export const colors = {
  paperPrimary: "#E6D5B8",
  paperSecondary: "#F4EBD9",
  paperHighlight: "#FCF8F2",
  ink: "#2C1E16",
  inkSoft: "#4A3424",
  vintageRed: "#A62C2B",
  vintageRedDark: "#7A1C1B",
  antiqueGold: "#D4AF37",
  antiqueGoldDark: "#A8852A",
  mutedYellow: "#E8C37D",
  wornWood: "#5C3A21",
  wornWoodDark: "#3D2614",
  brass: "#B08D57",
  brassDark: "#76582C",
  cream: "#F1E3C8",
  // rarity hues
  common: "#8C7A5C",
  rare: "#3F6E8E",
  epic: "#7A3C9A",
  legendary: "#D4AF37",
  successGreen: "#5B7A3A",
  warningAmber: "#C77F2B",
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

// Hard cartoon shadow (no blur). Pop-out 2D look.
export const cartoonShadow = (offset = 4, color = colors.ink) => ({
  shadowColor: color,
  shadowOffset: { width: offset, height: offset },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 6,
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
