// Dark vintage background. Uses a deep brown/black with subtle paper grain overlay.
// Incluye soporte opcional para swipe entre tabs.

import { ImageBackground, StyleSheet, View, ViewStyle, Dimensions, Platform } from "react-native";
import { ReactNode, useCallback } from "react";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { 
  runOnJS, 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring 
} from "react-native-reanimated";
import { useRouter, usePathname } from "expo-router";

import { colors } from "@/src/theme";

const PAPER = require("../../assets/images/worn-paper.png");

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.15;
const VELOCITY_THRESHOLD = 400;

// Orden de las tabs
const TAB_ORDER = [
  "/inicio",
  "/estudio", 
  "/temas",
  "/casino",
  "/premios",
  "/ajustes",
];

type Props = {
  children: ReactNode;
  style?: ViewStyle;
  variant?: "dark" | "paper";
  enableSwipe?: boolean; // Habilitar swipe entre tabs
};

export function PaperBackground({ children, style, variant = "dark", enableSwipe = true }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const translateX = useSharedValue(0);
  
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
  
  const panGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-15, 15])
    .enabled(enableSwipe && Platform.OS !== "web")
    .onUpdate((e) => {
      const currentIndex = getCurrentIndex();
      const canSwipeRight = currentIndex > 0;
      const canSwipeLeft = currentIndex < TAB_ORDER.length - 1;
      
      if (e.translationX > 0 && canSwipeRight) {
        translateX.value = Math.min(e.translationX * 0.2, 40);
      } else if (e.translationX < 0 && canSwipeLeft) {
        translateX.value = Math.max(e.translationX * 0.2, -40);
      }
    })
    .onEnd((e) => {
      const isQuickSwipe = Math.abs(e.velocityX) > VELOCITY_THRESHOLD;
      const isLongSwipe = Math.abs(e.translationX) > SWIPE_THRESHOLD;
      
      if (isQuickSwipe || isLongSwipe) {
        if (e.translationX > 0) {
          runOnJS(navigateToTab)("left");
        } else {
          runOnJS(navigateToTab)("right");
        }
      }
      
      translateX.value = withSpring(0, { damping: 25, stiffness: 400 });
    });
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const renderContent = () => {
    if (variant === "paper") {
      return (
        <ImageBackground
          source={PAPER}
          resizeMode="cover"
          style={[styles.bg, { backgroundColor: colors.paperPrimary }, style]}
          imageStyle={styles.image}
        >
          {children}
        </ImageBackground>
      );
    }
    return (
      <View style={[styles.bg, { backgroundColor: colors.bgDark }, style]}>
        <ImageBackground
          source={PAPER}
          resizeMode="cover"
          style={StyleSheet.absoluteFill}
          imageStyle={{ opacity: 0.06 }}
        />
        {children}
      </View>
    );
  };

  // Si el swipe está habilitado, envolvemos en GestureDetector
  if (enableSwipe && Platform.OS !== "web") {
    return (
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.container, animatedStyle]}>
          {renderContent()}
        </Animated.View>
      </GestureDetector>
    );
  }

  return renderContent();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bg: {
    flex: 1,
  },
  image: {
    opacity: 0.85,
  },
});
