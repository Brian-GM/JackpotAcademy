import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";
import * as NavigationBar from "expo-navigation-bar";

import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import { useVintageFonts } from "@/src/hooks/use-vintage-fonts";
import { GameStoreProvider } from "@/src/store/game-store";
import { useBackgroundMusic } from "@/src/hooks/use-background-music";

// Keep the native splash visible from cold start until icon fonts register.
// Required because @expo/vector-icons' componentDidMount fallback fires
// Font.loadAsync against a broken vendor path if any <Icon> mounts before
// the family is registered — which throws on Android Expo Go.
SplashScreen.preventAutoHideAsync();

// Función para configurar modo inmersivo en Android
async function setupImmersiveMode() {
  if (Platform.OS === "android") {
    try {
      // Ocultar la barra de navegación del sistema
      await NavigationBar.setVisibilityAsync("hidden");
      // Configurar comportamiento: se muestra al hacer swipe desde el borde
      await NavigationBar.setBehaviorAsync("overlay-swipe");
      // Hacer la barra translúcida cuando aparece
      await NavigationBar.setBackgroundColorAsync("#00000000");
    } catch (error) {
      // Silenciar error en caso de que no esté disponible
      console.log("NavigationBar setup skipped:", error);
    }
  }
}

// Componente interno que maneja la música de fondo
function AppContent() {
  // Inicializa la música de fondo automáticamente
  useBackgroundMusic();
  
  // Configurar modo inmersivo
  useEffect(() => {
    setupImmersiveMode();
  }, []);
  
  return (
    <>
      <StatusBar style="light" hidden={false} translucent backgroundColor="transparent" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

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
      <AppContent />
    </GameStoreProvider>
  );
}
