/**
 * =============================================================================
 * _layout.tsx - CONFIGURACIÓN DE LA BARRA DE NAVEGACIÓN (TABS) CON SWIPE
 * =============================================================================
 */

import React, { useRef, useCallback } from "react";
import { Tabs, usePathname, useRouter } from "expo-router";
import { Image, StyleSheet, Text, View, Platform } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  runOnJS 
} from "react-native-reanimated";

import { cartoonShadow, colors, fonts } from "@/src/theme";

// -----------------------------------------------------------------------------
// ICONOS DE NAVEGACIÓN
// -----------------------------------------------------------------------------
const NAV_HOME = require("../../assets/images/nav-home.png");
const NAV_ESTUDIO = require("../../assets/images/nav-icon-estudio.png");
const NAV_TEMAS = require("../../assets/images/nav-icon-temas.png");
const NAV_CASINO = require("../../assets/images/nav-casino.png");
const NAV_PREMIOS = require("../../assets/images/nav-premios.png");
const NAV_AJUSTES = require("../../assets/images/nav-ajustes.png");

// -----------------------------------------------------------------------------
// ORDEN DE TABS PARA SWIPE
// -----------------------------------------------------------------------------
const TAB_ORDER = ["inicio", "estudio", "temas", "casino", "premios", "ajustes"];

// -----------------------------------------------------------------------------
// TIPOS
// -----------------------------------------------------------------------------
type TabIconProps = { 
  source: any;
  focused: boolean;
};

// -----------------------------------------------------------------------------
// COMPONENTE: TabIcon
// -----------------------------------------------------------------------------
function TabIcon({ source, focused }: TabIconProps) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconFocused]}>
      <Image 
        source={source} 
        style={[styles.iconImage, focused && styles.iconImageFocused]} 
        resizeMode="contain"
      />
    </View>
  );
}

// -----------------------------------------------------------------------------
// COMPONENTE: TabLabel
// -----------------------------------------------------------------------------
function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text
      numberOfLines={1}
      style={[styles.label, { color: focused ? colors.antiqueGold : colors.cream }]}
    >
      {label}
    </Text>
  );
}

// -----------------------------------------------------------------------------
// COMPONENTE PRINCIPAL: TabLayout con Swipe Gesture
// -----------------------------------------------------------------------------
export default function TabLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const translateX = useSharedValue(0);
  
  // Obtener índice actual basado en la ruta
  const getCurrentIndex = useCallback(() => {
    const currentTab = pathname.replace("/(tabs)/", "").replace("/", "") || "inicio";
    const index = TAB_ORDER.indexOf(currentTab);
    return index >= 0 ? index : 0;
  }, [pathname]);

  // Navegar a tab por índice
  const navigateToIndex = useCallback((index: number) => {
    if (index >= 0 && index < TAB_ORDER.length) {
      router.replace(`/(tabs)/${TAB_ORDER[index]}` as any);
    }
  }, [router]);

  // Configurar gesto de swipe
  const panGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-10, 10])
    .onUpdate((event) => {
      translateX.value = event.translationX * 0.3;
    })
    .onEnd((event) => {
      const currentIndex = getCurrentIndex();
      const threshold = 50;
      
      if (event.translationX > threshold && currentIndex > 0) {
        // Swipe derecha - ir a tab anterior
        runOnJS(navigateToIndex)(currentIndex - 1);
      } else if (event.translationX < -threshold && currentIndex < TAB_ORDER.length - 1) {
        // Swipe izquierda - ir a tab siguiente
        runOnJS(navigateToIndex)(currentIndex + 1);
      }
      
      translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <GestureHandlerRootView style={styles.container}>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.content, animatedStyle]}>
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarStyle: styles.tabBar,
              tabBarActiveTintColor: colors.antiqueGold,
              tabBarInactiveTintColor: colors.cream,
              tabBarShowLabel: true,
              tabBarItemStyle: styles.tabBarItem,
            }}
          >
            <Tabs.Screen
              name="inicio"
              options={{
                tabBarLabel: ({ focused }) => <TabLabel label="Inicio" focused={focused} />,
                tabBarIcon: ({ focused }) => <TabIcon source={NAV_HOME} focused={focused} />,
              }}
            />
            
            <Tabs.Screen
              name="estudio"
              options={{
                tabBarLabel: ({ focused }) => <TabLabel label="Estudio" focused={focused} />,
                tabBarIcon: ({ focused }) => <TabIcon source={NAV_ESTUDIO} focused={focused} />,
              }}
            />
            
            <Tabs.Screen
              name="temas"
              options={{
                tabBarLabel: ({ focused }) => <TabLabel label="Temas" focused={focused} />,
                tabBarIcon: ({ focused }) => <TabIcon source={NAV_TEMAS} focused={focused} />,
              }}
            />
            
            <Tabs.Screen
              name="casino"
              options={{
                tabBarLabel: ({ focused }) => <TabLabel label="Casino" focused={focused} />,
                tabBarIcon: ({ focused }) => <TabIcon source={NAV_CASINO} focused={focused} />,
              }}
            />
            
            <Tabs.Screen
              name="premios"
              options={{
                tabBarLabel: ({ focused }) => <TabLabel label="Premios" focused={focused} />,
                tabBarIcon: ({ focused }) => <TabIcon source={NAV_PREMIOS} focused={focused} />,
              }}
            />
            
            <Tabs.Screen
              name="ajustes"
              options={{
                tabBarLabel: ({ focused }) => <TabLabel label="Ajustes" focused={focused} />,
                tabBarIcon: ({ focused }) => <TabIcon source={NAV_AJUSTES} focused={focused} />,
              }}
            />
          </Tabs>
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

// =============================================================================
// ESTILOS
// =============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  tabBar: {
    backgroundColor: colors.bgDarker,
    height: 80,
    paddingTop: 4,
    paddingBottom: 6,
    ...cartoonShadow(0),
    borderTopWidth: 2,
    borderTopColor: colors.antiqueGold,
  },
  tabBarItem: {
    minWidth: 50,
    paddingHorizontal: 0,
  },
  iconWrap: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    overflow: "hidden",
  },
  iconFocused: {
    backgroundColor: "transparent",
  },
  iconImage: {
    width: 40,
    height: 40,
  },
  iconImageFocused: {
    width: 46,
    height: 46,
  },
  label: {
    fontFamily: fonts.subheading,
    fontSize: 9,
    letterSpacing: 1,
    marginTop: 2,
  },
});
