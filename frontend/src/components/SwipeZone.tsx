/**
 * SwipeZone - Detecta swipes horizontales desde los bordes de pantalla
 * 
 * Usa GestureDetector de react-native-gesture-handler para detectar
 * gestos horizontales que inician cerca de los bordes de la pantalla.
 */

import React, { ReactNode, useCallback } from "react";
import { Dimensions, Platform, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { useRouter, usePathname } from "expo-router";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const EDGE_WIDTH = 30; // Zona de borde para iniciar swipe (30px desde cada lado)
const SWIPE_THRESHOLD = 80; // Distancia mínima para activar navegación
const VELOCITY_THRESHOLD = 500;

// Orden de las tabs (de izquierda a derecha)
const TAB_ORDER = [
  "/inicio",
  "/estudio", 
  "/temas",
  "/casino",
  "/premios",
  "/ajustes",
];

interface SwipeZoneProps {
  children: ReactNode;
  enabled?: boolean;
}

export function SwipeZone({ children, enabled = true }: SwipeZoneProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  const getCurrentIndex = useCallback(() => {
    const cleanPath = pathname.replace("/(tabs)", "");
    return TAB_ORDER.findIndex(p => p === cleanPath || pathname.endsWith(p.slice(1)));
  }, [pathname]);
  
  const navigateToTab = useCallback((direction: "left" | "right") => {
    const currentIndex = getCurrentIndex();
    if (currentIndex === -1) return;
    
    if (direction === "left" && currentIndex > 0) {
      const prevTab = TAB_ORDER[currentIndex - 1];
      router.push(prevTab as any);
    } else if (direction === "right" && currentIndex < TAB_ORDER.length - 1) {
      const nextTab = TAB_ORDER[currentIndex + 1];
      router.push(nextTab as any);
    }
  }, [getCurrentIndex, router]);

  // Gesto para swipe desde el borde izquierdo (ir a tab anterior)
  const leftEdgeGesture = Gesture.Pan()
    .hitSlop({ left: 0, right: -SCREEN_WIDTH + EDGE_WIDTH, top: 0, bottom: 0 })
    .activeOffsetX([15, 100])
    .failOffsetY([-20, 20])
    .onEnd((e) => {
      if (e.translationX > SWIPE_THRESHOLD || e.velocityX > VELOCITY_THRESHOLD) {
        runOnJS(navigateToTab)("left");
      }
    });

  // Gesto para swipe desde el borde derecho (ir a tab siguiente)
  const rightEdgeGesture = Gesture.Pan()
    .hitSlop({ left: -SCREEN_WIDTH + EDGE_WIDTH, right: 0, top: 0, bottom: 0 })
    .activeOffsetX([-100, -15])
    .failOffsetY([-20, 20])
    .onEnd((e) => {
      if (e.translationX < -SWIPE_THRESHOLD || e.velocityX < -VELOCITY_THRESHOLD) {
        runOnJS(navigateToTab)("right");
      }
    });

  // Combinar ambos gestos
  const combinedGesture = Gesture.Race(leftEdgeGesture, rightEdgeGesture);

  if (!enabled || Platform.OS === "web") {
    return <View style={styles.container}>{children}</View>;
  }

  return (
    <GestureDetector gesture={combinedGesture}>
      <View style={styles.container}>
        {children}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
