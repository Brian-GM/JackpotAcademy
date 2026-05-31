/**
 * =============================================================================
 * VintageButton.tsx - BOTÓN ESTILO VINTAGE/RETRO CON LUCES DE MARQUESINA
 * =============================================================================
 * 
 * Botón personalizado con estética de casino/arcade vintage.
 * Incluye borde dorado, luces decorativas y animación de presión.
 * 
 * CARACTERÍSTICAS:
 * - Múltiples variantes de color (rojo, verde, morado, dorado, marrón, crema)
 * - Luces decorativas estilo marquesina en los bordes
 * - Animación de "bounce" al presionar
 * - Soporte para iconos (FontAwesome) o imágenes personalizadas
 * - Tres tamaños: pequeño (sm), mediano (md), grande (lg)
 * 
 * USO BÁSICO:
 * <VintageButton 
 *   label="MI BOTÓN" 
 *   variant="red" 
 *   onPress={() => console.log('click')} 
 * />
 * 
 * CON IMAGEN:
 * <VintageButton 
 *   label="ESTUDIAR" 
 *   variant="green" 
 *   imageSource={require('./mi-icono.png')}
 *   onPress={() => ...} 
 * />
 * =============================================================================
 */

// -----------------------------------------------------------------------------
// IMPORTS
// -----------------------------------------------------------------------------
import { Image, ImageSourcePropType, Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { ReactNode, useRef } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from "react-native-reanimated";  // Animaciones fluidas
import { FontAwesome5 } from "@expo/vector-icons";  // Iconos vectoriales

import { cartoonShadow, colors, fonts, goldBorder, radii } from "@/src/theme";

// -----------------------------------------------------------------------------
// TIPOS
// -----------------------------------------------------------------------------
/**
 * Variantes de color disponibles para el botón
 * - red: Rojo vintage (para acciones principales como Casino)
 * - green: Verde vintage (para acciones positivas como Estudiar)
 * - purple: Morado vintage (para categorías como Temas)
 * - gold: Dorado antiguo (para acciones especiales)
 * - brown: Marrón/bronce (para secciones como Premios)
 * - wood: Similar a brown, aspecto de madera
 * - cream: Crema claro (para acciones secundarias como Ajustes)
 */
type Variant = "red" | "green" | "purple" | "gold" | "brown" | "wood" | "cream";

/**
 * Props del componente VintageButton
 */
type Props = {
  label?: string;                    // Texto del botón
  children?: ReactNode;              // Contenido personalizado (en lugar de label)
  onPress?: () => void;              // Función al presionar
  variant?: Variant;                 // Color del botón (default: "red")
  disabled?: boolean;                // Desactivar botón
  size?: "sm" | "md" | "lg";         // Tamaño del botón
  style?: ViewStyle;                 // Estilos adicionales
  testID?: string;                   // ID para pruebas
  icon?: string;                     // Nombre del icono FontAwesome5
  imageSource?: ImageSourcePropType; // Imagen personalizada (tiene prioridad sobre icon)
};

// -----------------------------------------------------------------------------
// CONFIGURACIÓN DE COLORES POR VARIANTE
// -----------------------------------------------------------------------------
// Cada variante define: color de fondo, color del texto, color del badge de icono
const VARIANTS: Record<Variant, { bg: string; text: string; iconBg: string }> = {
  red: { bg: colors.vintageRed, text: colors.paperHighlight, iconBg: colors.vintageRedDark },
  green: { bg: colors.vintageGreen, text: colors.paperHighlight, iconBg: colors.vintageGreenDark },
  purple: { bg: colors.vintagePurple, text: colors.paperHighlight, iconBg: colors.vintagePurpleDark },
  gold: { bg: colors.antiqueGold, text: colors.bgDark, iconBg: colors.antiqueGoldDark },
  brown: { bg: colors.brassDark, text: colors.paperHighlight, iconBg: colors.bgDark },
  wood: { bg: colors.brassDark, text: colors.paperHighlight, iconBg: colors.bgDark },
  cream: { bg: colors.cream, text: colors.ink, iconBg: colors.paperPrimary },
};

// -----------------------------------------------------------------------------
// COMPONENTE: Bulb - Luz decorativa individual
// -----------------------------------------------------------------------------
// Renderiza una pequeña luz/bombilla dorada en el borde del botón
function Bulb({ left, top, size = 4 }: { left?: number | string; top?: number | string; size?: number }) {
  return (
    <View
      style={[
        styles.bulb,
        {
          width: size,
          height: size,
          borderRadius: size / 2,  // Hace la luz circular
          left: left as number,
          top: top as number,
        },
      ]}
    />
  );
}

// =============================================================================
// COMPONENTE PRINCIPAL: VintageButton
// =============================================================================
export function VintageButton({
  label,
  children,
  onPress,
  variant = "red",      // Color por defecto: rojo
  disabled,
  size = "md",          // Tamaño por defecto: mediano
  style,
  testID,
  icon,
  imageSource,
}: Props) {
  // ---------------------------------------------------------------------------
  // ANIMACIÓN
  // ---------------------------------------------------------------------------
  const scale = useSharedValue(1);    // Valor animado para escala
  const lastPress = useRef(0);        // Previene múltiples pulsaciones rápidas
  const palette = VARIANTS[variant];  // Obtiene los colores de la variante

  // Estilo animado que aplica la escala
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  // ---------------------------------------------------------------------------
  // MANEJADOR DE PRESIÓN
  // ---------------------------------------------------------------------------
  const handlePress = () => {
    // Previene doble-tap (mínimo 200ms entre pulsaciones)
    const now = Date.now();
    if (now - lastPress.current < 200) return;
    lastPress.current = now;
    
    // Animación de "bounce" al presionar:
    // 1. Reduce a 92% (encoge)
    // 2. Aumenta a 104% (rebote)
    // 3. Vuelve a 100% (normal)
    scale.value = withSequence(
      withSpring(0.92, { damping: 9, stiffness: 220 }),
      withSpring(1.04, { damping: 6, stiffness: 200 }),
      withSpring(1, { damping: 8, stiffness: 200 }),
    );
    
    onPress?.();  // Ejecuta la función de callback
  };

  // ---------------------------------------------------------------------------
  // CONFIGURACIÓN DE TAMAÑOS
  // ---------------------------------------------------------------------------
  // Padding interno según el tamaño
  const padding =
    size === "lg"
      ? { paddingVertical: 14, paddingHorizontal: 22 }   // Grande
      : size === "sm"
        ? { paddingVertical: 6, paddingHorizontal: 12 }  // Pequeño
        : { paddingVertical: 10, paddingHorizontal: 18 }; // Mediano

  // Tamaño de fuente según el tamaño del botón
  const fontSize = size === "lg" ? 18 : size === "sm" ? 12 : 15;
  
  // Tamaño del icono/imagen según el tamaño del botón
  // PARA CAMBIAR TAMAÑO DE ICONOS: Modifica estos valores
  const iconSize = size === "lg" ? 52 : size === "sm" ? 24 : 36;
  const badgeSize = size === "lg" ? 56 : size === "sm" ? 28 : 40;
  
  // Número de luces en el borde según el tamaño
  const bulbCount = size === "lg" ? 9 : size === "sm" ? 5 : 7;
  
  // Calcula las posiciones de las luces (distribuidas uniformemente)
  const bulbsTop: number[] = [];
  for (let i = 1; i <= bulbCount; i++) {
    bulbsTop.push(i * (100 / (bulbCount + 1)));
  }

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  return (
    <Animated.View style={[animStyle, style]}>
      <Pressable
        testID={testID}
        onPress={disabled ? undefined : handlePress}
        style={({ pressed }) => [
          styles.btn,
          { backgroundColor: palette.bg, opacity: disabled ? 0.4 : 1 },
          pressed && !disabled && styles.pressed,
        ]}
      >
        {/* ================================================================
            LUCES DECORATIVAS - Fila superior
            ================================================================ */}
        {bulbsTop.map((pct, i) => (
          <Bulb key={`t${i}`} left={`${pct}%` as unknown as number} top={-2} />
        ))}
        
        {/* ================================================================
            LUCES DECORATIVAS - Fila inferior
            ================================================================ */}
        {bulbsTop.map((pct, i) => (
          <Bulb key={`b${i}`} left={`${pct}%` as unknown as number} top={undefined} />
        ))}
        <View style={styles.bulbsBottomWrap}>
          {bulbsTop.map((pct, i) => (
            <View
              key={`bb${i}`}
              style={[styles.bulb, { width: 4, height: 4, borderRadius: 2, left: `${pct}%` as unknown as number, bottom: -2 }]}
            />
          ))}
        </View>

        {/* ================================================================
            CONTENIDO INTERIOR - Icono/Imagen + Texto
            ================================================================ */}
        <View style={[styles.innerRow, padding]}>
          {/* Imagen personalizada (tiene prioridad sobre icono FontAwesome) */}
          {!!imageSource && (
            <View style={{ width: badgeSize, height: badgeSize, alignItems: "center", justifyContent: "center" }}>
              <Image source={imageSource} style={{ width: iconSize, height: iconSize }} resizeMode="contain" />
            </View>
          )}
          
          {/* Icono FontAwesome (solo si no hay imagen) */}
          {!!icon && !imageSource && (
            <View style={[styles.iconBadge, { backgroundColor: palette.iconBg, width: badgeSize, height: badgeSize, borderRadius: badgeSize / 2 }]}>
              <FontAwesome5 name={icon} size={iconSize - 8} color={palette.text} solid />
            </View>
          )}
          
          {/* Texto del botón o contenido personalizado */}
          {children ? (
            children
          ) : (
            <Text
              style={[styles.label, { color: palette.text, fontSize }]}
              numberOfLines={1}
            >
              {label}
            </Text>
          )}
          
          {/* Espaciador para balancear el icono (mantiene el texto centrado) */}
          {(!!icon || !!imageSource) && <View style={{ width: badgeSize + 8 }} />}
        </View>
      </Pressable>
    </Animated.View>
  );
}

// =============================================================================
// ESTILOS
// =============================================================================
// PARA MODIFICAR:
// - Borde del botón: Edita goldBorder() en btn
// - Radio de esquinas: Cambia radii.pill a otro valor (radii.sm, radii.md, etc.)
// - Sombra: Modifica cartoonShadow() en btn
// - Color de las luces: Edita backgroundColor en bulb
// =============================================================================
const styles = StyleSheet.create({
  // Contenedor principal del botón
  btn: {
    ...goldBorder(2),           // Borde dorado de 2px
    borderRadius: radii.pill,   // Esquinas muy redondeadas (forma de píldora)
    ...cartoonShadow(3),        // Sombra estilo cartoon
    overflow: "visible",        // Permite que las luces se vean fuera del borde
    position: "relative",
  },
  
  // Estilo cuando el botón está presionado
  pressed: {
    transform: [{ translateY: 1 }],  // Desplaza 1px hacia abajo
  },
  
  // Fila interior que contiene icono + texto
  innerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,  // Espacio entre icono y texto
  },
  
  // Texto/etiqueta del botón
  label: {
    fontFamily: fonts.heading,
    letterSpacing: 1.5,         // Espaciado entre letras
    textAlign: "center",
    flex: 1,
    textShadowColor: "rgba(0,0,0,0.6)",  // Sombra del texto
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },
  
  // Estilo de cada luz/bombilla decorativa
  bulb: {
    position: "absolute",
    backgroundColor: colors.antiqueGold,  // Color dorado
    shadowColor: colors.antiqueGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 3,            // Resplandor alrededor de la luz
    borderWidth: 1,
    borderColor: colors.antiqueGoldDark,
  },
  
  // Contenedor para las luces inferiores
  bulbsBottomWrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  
  // Badge circular para iconos FontAwesome
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
