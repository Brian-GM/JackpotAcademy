/**
 * =============================================================================
 * _layout.tsx - CONFIGURACIÓN DE LA BARRA DE NAVEGACIÓN (TABS) CON SWIPE
 * =============================================================================
 * 
 * Este archivo controla la barra de navegación inferior de la aplicación.
 * Define las pestañas (tabs) y sus iconos personalizados.
 * Permite navegar entre pestañas deslizando la pantalla.
 * 
 * =============================================================================
 */

import React, { useRef, useCallback, useState } from "react";
import { Image, StyleSheet, Text, View, TouchableOpacity, Dimensions } from "react-native";
import PagerView from "react-native-pager-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { cartoonShadow, colors, fonts } from "@/src/theme";

// Importar las pantallas directamente
import InicioScreen from "./inicio";
import EstudioScreen from "./estudio";
import TemasScreen from "./temas";
import CasinoScreen from "./casino";
import PremiosScreen from "./premios";
import AjustesScreen from "./ajustes";

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
// CONFIGURACIÓN DE PESTAÑAS
// -----------------------------------------------------------------------------
const TABS = [
  { key: "inicio", label: "Inicio", icon: NAV_HOME, Component: InicioScreen },
  { key: "estudio", label: "Estudio", icon: NAV_ESTUDIO, Component: EstudioScreen },
  { key: "temas", label: "Temas", icon: NAV_TEMAS, Component: TemasScreen },
  { key: "casino", label: "Casino", icon: NAV_CASINO, Component: CasinoScreen },
  { key: "premios", label: "Premios", icon: NAV_PREMIOS, Component: PremiosScreen },
  { key: "ajustes", label: "Ajustes", icon: NAV_AJUSTES, Component: AjustesScreen },
];

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
// COMPONENTE PRINCIPAL: TabLayout con Swipe
// -----------------------------------------------------------------------------
export default function TabLayout() {
  const pagerRef = useRef<PagerView>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const insets = useSafeAreaInsets();

  const onPageSelected = useCallback((e: any) => {
    setCurrentPage(e.nativeEvent.position);
  }, []);

  const goToPage = useCallback((index: number) => {
    pagerRef.current?.setPage(index);
    setCurrentPage(index);
  }, []);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* PagerView para swipe entre pantallas */}
      <PagerView
        ref={pagerRef}
        style={styles.pagerView}
        initialPage={0}
        onPageSelected={onPageSelected}
        overdrag={true}
        offscreenPageLimit={1}
      >
        {TABS.map((tab, index) => (
          <View key={tab.key} style={styles.page}>
            <tab.Component />
          </View>
        ))}
      </PagerView>

      {/* Barra de navegación inferior personalizada */}
      <View style={styles.tabBar}>
        {TABS.map((tab, index) => (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabBarItem}
            onPress={() => goToPage(index)}
            activeOpacity={0.7}
          >
            <TabIcon source={tab.icon} focused={currentPage === index} />
            <TabLabel label={tab.label} focused={currentPage === index} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// =============================================================================
// ESTILOS
// =============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgDark,
  },
  pagerView: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: colors.bgDarker,
    height: 80,
    paddingTop: 4,
    paddingBottom: 6,
    ...cartoonShadow(0),
    borderTopWidth: 2,
    borderTopColor: colors.antiqueGold,
  },
  tabBarItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 50,
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
