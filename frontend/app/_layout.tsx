import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";

import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import { useVintageFonts } from "@/src/hooks/use-vintage-fonts";
import { GameStoreProvider } from "@/src/store/game-store";

// Keep the native splash visible from cold start until icon fonts register.
// Required because @expo/vector-icons' componentDidMount fallback fires
// Font.loadAsync against a broken vendor path if any <Icon> mounts before
// the family is registered — which throws on Android Expo Go.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [iconLoaded, iconError] = useIconFonts();
  const [vintageLoaded, vintageError] = useVintageFonts();

  const ready = (iconLoaded || iconError) && (vintageLoaded || vintageError);

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  // If the CDN is unreachable we fall through on error rather than wedging
  // the app — icons will tofu, but the app still boots.
  if (!ready) return null;

  return (
    <GameStoreProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </GameStoreProvider>
  );
}
