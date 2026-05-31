/**
 * =============================================================================
 * _layout.tsx - CONFIGURACIÓN DE LA BARRA DE NAVEGACIÓN (TABS)
 * =============================================================================
 * 
 * Este archivo controla la barra de navegación inferior de la aplicación.
 * Define las pestañas (tabs) y sus iconos personalizados.
 * 
 * SECCIONES:
 * 1. Imports y dependencias
 * 2. Carga de iconos de navegación
 * 3. Componentes de iconos y etiquetas
 * 4. Configuración de las pestañas
 * 5. Estilos de la barra de navegación
 * 
 * PARA MODIFICAR:
 * - Añadir nueva pestaña: Duplicar un <Tabs.Screen> y cambiar name/icon/label
 * - Cambiar icono: Modificar la ruta del require() correspondiente
 * - Cambiar estilos: Editar la sección "styles" al final del archivo
 * =============================================================================
 */

// -----------------------------------------------------------------------------
// IMPORTS - Librerías y componentes necesarios
// -----------------------------------------------------------------------------
import { Tabs } from "expo-router";           // Sistema de navegación por pestañas
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";  // Componentes básicos de React Native

import { cartoonShadow, colors, fonts, goldBorder } from "@/src/theme";  // Tema personalizado de la app

// -----------------------------------------------------------------------------
// ICONOS DE NAVEGACIÓN - Imágenes para cada pestaña
// -----------------------------------------------------------------------------
// NOTA: Para cambiar un icono, reemplaza el archivo PNG correspondiente
// en la carpeta assets/images/ o cambia la ruta aquí
const NAV_HOME = require("../../assets/images/nav-home.png");       // Icono de Inicio
const NAV_ESTUDIO = require("../../assets/images/nav-icon-estudio.png"); // Icono de Estudio
const NAV_TEMAS = require("../../assets/images/nav-icon-temas.png");     // Icono de Temas
const NAV_CASINO = require("../../assets/images/nav-casino.png");   // Icono de Casino
const NAV_PREMIOS = require("../../assets/images/nav-premios.png"); // Icono de Premios
const NAV_AJUSTES = require("../../assets/images/nav-ajustes.png"); // Icono de Ajustes

// -----------------------------------------------------------------------------
// TIPOS - Definiciones de tipos para TypeScript
// -----------------------------------------------------------------------------
type TabIconProps = { 
  source: any;      // Fuente de la imagen del icono
  focused: boolean; // true si esta pestaña está activa
};

// -----------------------------------------------------------------------------
// COMPONENTE: TabIcon - Renderiza el icono de cada pestaña
// -----------------------------------------------------------------------------
// PARA MODIFICAR TAMAÑO DE ICONOS: Edita iconImage y iconImageFocused en styles
function TabIcon({ source, focused }: TabIconProps) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconFocused]}>
      <Image 
        source={source} 
        style={[styles.iconImage, focused && styles.iconImageFocused]} 
        resizeMode="contain"  // Mantiene la proporción del icono
      />
    </View>
  );
}

// -----------------------------------------------------------------------------
// COMPONENTE: TabLabel - Renderiza el texto debajo de cada icono
// -----------------------------------------------------------------------------
// PARA MODIFICAR TEXTO: Cambia el prop "label" en cada Tabs.Screen
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
// COMPONENTE PRINCIPAL: TabLayout - Configuración de todas las pestañas
// -----------------------------------------------------------------------------
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,                    // Oculta el header superior
        tabBarStyle: styles.tabBar,            // Estilo de la barra de navegación
        tabBarActiveTintColor: colors.antiqueGold,   // Color cuando está activo
        tabBarInactiveTintColor: colors.cream,       // Color cuando está inactivo
        tabBarShowLabel: true,                 // Muestra las etiquetas de texto
        tabBarItemStyle: styles.tabBarItem,    // Estilo de cada item individual
      }}
    >
      {/* =====================================================================
          PESTAÑA 1: INICIO - Pantalla principal de la app
          Archivo: app/(tabs)/inicio.tsx
          ===================================================================== */}
      <Tabs.Screen
        name="inicio"
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label="Inicio" focused={focused} />,
          tabBarIcon: ({ focused }) => (
            <TabIcon source={NAV_HOME} focused={focused} />
          ),
        }}
      />
      
      {/* =====================================================================
          PESTAÑA 2: ESTUDIO - Sesiones de estudio con tarjetas
          Archivo: app/(tabs)/estudio.tsx
          ===================================================================== */}
      <Tabs.Screen
        name="estudio"
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label="Estudio" focused={focused} />,
          tabBarIcon: ({ focused }) => (
            <TabIcon source={NAV_ESTUDIO} focused={focused} />
          ),
        }}
      />
      
      {/* =====================================================================
          PESTAÑA 3: TEMAS - Gestión de temas/materias de estudio
          Archivo: app/(tabs)/temas.tsx
          ===================================================================== */}
      <Tabs.Screen
        name="temas"
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label="Temas" focused={focused} />,
          tabBarIcon: ({ focused }) => (
            <TabIcon source={NAV_TEMAS} focused={focused} />
          ),
        }}
      />
      
      {/* =====================================================================
          PESTAÑA 4: CASINO - Mini-juegos para ganar premios
          Archivo: app/(tabs)/casino.tsx
          ===================================================================== */}
      <Tabs.Screen
        name="casino"
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label="Casino" focused={focused} />,
          tabBarIcon: ({ focused }) => (
            <TabIcon source={NAV_CASINO} focused={focused} />
          ),
        }}
      />
      
      {/* =====================================================================
          PESTAÑA 5: PREMIOS - Catálogo de recompensas canjeables
          Archivo: app/(tabs)/premios.tsx
          ===================================================================== */}
      <Tabs.Screen
        name="premios"
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label="Premios" focused={focused} />,
          tabBarIcon: ({ focused }) => (
            <TabIcon source={NAV_PREMIOS} focused={focused} />
          ),
        }}
      />
      
      {/* =====================================================================
          PESTAÑA 6: AJUSTES - Configuración de la aplicación
          Archivo: app/(tabs)/ajustes.tsx
          ===================================================================== */}
      <Tabs.Screen
        name="ajustes"
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label="Ajustes" focused={focused} />,
          tabBarIcon: ({ focused }) => (
            <TabIcon source={NAV_AJUSTES} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

// =============================================================================
// ESTILOS DE LA BARRA DE NAVEGACIÓN
// =============================================================================
// PARA MODIFICAR:
// - Altura de la barra: Cambia "height" en tabBar
// - Tamaño de iconos: Cambia "width" y "height" en iconImage
// - Tamaño de texto: Cambia "fontSize" en label
// - Colores: Usa los colores del tema (colors.xxx) o valores hexadecimales
// =============================================================================
const styles = StyleSheet.create({
  // Contenedor principal de la barra de navegación
  tabBar: {
    backgroundColor: colors.bgDarker,  // Color de fondo oscuro
    height: 80,                         // Altura total de la barra
    paddingTop: 4,                      // Espacio superior interno
    paddingBottom: 6,                   // Espacio inferior interno
    ...cartoonShadow(0),                // Sombra estilo cartoon
    borderTopWidth: 2,                  // Grosor del borde superior
    borderTopColor: colors.antiqueGold, // Color dorado del borde
  },
  
  // Estilo de cada item/pestaña individual
  tabBarItem: {
    minWidth: 50,        // Ancho mínimo de cada pestaña
    paddingHorizontal: 0, // Sin padding horizontal extra
  },
  
  // Contenedor del icono (círculo alrededor del icono)
  iconWrap: {
    width: 44,               // Ancho del contenedor
    height: 44,              // Alto del contenedor
    alignItems: "center",    // Centra el icono horizontalmente
    justifyContent: "center", // Centra el icono verticalmente
    borderRadius: 22,        // Hace el contenedor circular (mitad del ancho)
    overflow: "hidden",      // Oculta cualquier parte del icono que sobresalga
  },
  
  // Estilo adicional cuando la pestaña está seleccionada
  iconFocused: {
    backgroundColor: "transparent", // Fondo transparente cuando está activo
  },
  
  // Imagen del icono (tamaño normal)
  iconImage: {
    width: 40,   // Ancho del icono
    height: 40,  // Alto del icono
  },
  
  // Imagen del icono cuando está seleccionado (un poco más grande)
  iconImageFocused: {
    width: 46,   // Ancho del icono cuando está activo
    height: 46,  // Alto del icono cuando está activo
  },
  
  // Texto/etiqueta debajo del icono
  label: {
    fontFamily: fonts.subheading, // Fuente personalizada
    fontSize: 9,                   // Tamaño pequeño del texto
    letterSpacing: 1,              // Espaciado entre letras
    marginTop: 2,                  // Margen superior
  },
});
