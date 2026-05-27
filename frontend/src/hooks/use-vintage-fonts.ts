// Hook to load all 4 vintage Google Fonts used across the casino.

import { useFonts } from "expo-font";
import { Rye_400Regular } from "@expo-google-fonts/rye";
import { Limelight_400Regular } from "@expo-google-fonts/limelight";
import { Bungee_400Regular } from "@expo-google-fonts/bungee";
import { IMFellEnglishSC_400Regular } from "@expo-google-fonts/im-fell-english-sc";

export function useVintageFonts() {
  return useFonts({
    Rye_400Regular,
    Limelight_400Regular,
    Bungee_400Regular,
    IMFellEnglishSC_400Regular,
  });
}
