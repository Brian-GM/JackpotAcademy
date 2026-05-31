/**
 * =============================================================================
 * inicio.tsx - PANTALLA DE INICIO / MENÚ PRINCIPAL
 * =============================================================================
 * 
 * Esta es la pantalla principal de la aplicación JackpotAcademy.
 * Muestra el menú de navegación, estadísticas del usuario y la mascota.
 * 
 * SECCIONES DE LA PANTALLA:
 * 1. Banner con logo y luces decorativas
 * 2. Fichas (monedas) y racha de días
 * 3. Mascota con mensaje de bienvenida
 * 4. Botones del menú principal (Estudiar, Temas, Casino, etc.)
 * 5. Estadísticas del usuario (cartilla)
 * 
 * PARA MODIFICAR:
 * - Añadir nuevo botón: Duplicar un VintageButton en menuStack
 * - Cambiar mensaje de mascota: Editar speechText en mascotRow
 * - Cambiar estadísticas: Modificar los componentes Stat en statsGrid
 * =============================================================================
 */

// -----------------------------------------------------------------------------
// IMPORTS - Librerías y componentes necesarios
// -----------------------------------------------------------------------------
import { useRouter } from "expo-router";           // Navegación entre pantallas
import { useEffect, useState } from "react";       // Hooks de React
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";  // Componentes básicos
import { SafeAreaView } from "react-native-safe-area-context";  // Área segura para notch/barra

// Componentes personalizados de la app
import { CasinoClosedBanner } from "@/src/components/CasinoClosedBanner";  // Banner cuando casino está cerrado
import { CoinBadge } from "@/src/components/CoinBadge";        // Muestra las monedas con animación
import { MarqueeLights } from "@/src/components/MarqueeLights"; // Luces decorativas tipo marquesina
import { PaperBackground } from "@/src/components/PaperBackground"; // Fondo con textura de papel
import { VintageButton } from "@/src/components/VintageButton"; // Botones estilo retro/vintage

// Hooks personalizados
import { useSounds } from "@/src/hooks/use-sounds";     // Reproducir efectos de sonido
import { useGameStore } from "@/src/store/game-store"; // Estado global del juego (zustand)

// Estilos del tema
import { cartoonShadow, colors, fonts, goldBorder, radii } from "@/src/theme";

// -----------------------------------------------------------------------------
// IMÁGENES Y ASSETS
// -----------------------------------------------------------------------------
// Logo y mascota principal
const LOGO = require("../../assets/images/jackpot-academy-logo.png");  // Logo de la app
const MASCOT = require("../../assets/images/mascot-inicio.png");       // Imagen de la mascota
const RACHA_ICON = require("../../assets/images/racha-icon.png");      // Icono de racha/fuego

// Iconos para los botones del menú (carpeta menu-icons para versiones limpias)
const NAV_ESTUDIO = require("../../assets/new-assets/menu-icons/estudiar.png");  // Botón Estudiar
const NAV_TEMAS = require("../../assets/new-assets/menu-icons/temas.png");       // Botón Mis Temas
const NAV_CASINO = require("../../assets/new-assets/menu-icons/casino.png");     // Botón Casino
const NAV_PREMIOS = require("../../assets/new-assets/menu-icons/premios.png");   // Botón Mis Premios
const NAV_AJUSTES = require("../../assets/new-assets/menu-icons/ajustes.png");   // Botón Ajustes

// =============================================================================
// COMPONENTE PRINCIPAL: InicioScreen
// =============================================================================
export default function InicioScreen() {
  // ---------------------------------------------------------------------------
  // HOOKS Y ESTADO
  // ---------------------------------------------------------------------------
  const router = useRouter();                    // Para navegar a otras pantallas
  const { state, isCasinoClosed, casinoClosedRemainingSec } = useGameStore();  // Estado del juego
  const { play } = useSounds();                  // Función para reproducir sonidos
  const [, force] = useState(0);                 // Fuerza re-render cada segundo (para contador)

  // Actualiza el componente cada segundo (para el contador del casino cerrado)
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(id);  // Limpia el intervalo al desmontar
  }, []);

  // Verifica si el casino está cerrado y cuánto tiempo queda
  const closed = isCasinoClosed();
  const remaining = casinoClosedRemainingSec();

  // ---------------------------------------------------------------------------
  // FUNCIÓN DE NAVEGACIÓN
  // ---------------------------------------------------------------------------
  // Navega a una pantalla reproduciendo el sonido de "lever" (palanca)
  const goTo = (path: "/(tabs)/estudio" | "/(tabs)/casino" | "/(tabs)/premios" | "/(tabs)/ajustes" | "/(tabs)/temas") => {
    play("lever");      // Reproduce sonido de palanca
    router.push(path);  // Navega a la ruta especificada
  };

  // ---------------------------------------------------------------------------
  // RENDER - Estructura de la pantalla
  // ---------------------------------------------------------------------------
  return (
    <PaperBackground>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          
          {/* ================================================================
              SECCIÓN 1: BANNER CON LOGO
              Muestra el logo de JackpotAcademy con luces decorativas
              ================================================================ */}
          <View style={styles.banner}>
            {/* Luces superiores */}
            <View style={styles.bannerLights}>
              <MarqueeLights count={14} size={7} speed={1100} />
            </View>
            {/* Logo de la aplicación */}
            <Image source={LOGO} style={styles.logoImage} resizeMode="contain" />
            {/* Luces inferiores */}
            <View style={styles.bannerLights}>
              <MarqueeLights count={14} size={7} speed={1100} />
            </View>
          </View>

          {/* ================================================================
              SECCIÓN 2: FICHAS Y RACHA
              Muestra las monedas del usuario y los días de racha consecutiva
              ================================================================ */}
          <View style={styles.statsRow}>
            {/* Caja de FICHAS (monedas) */}
            <View style={styles.statBox} testID="balance-card">
              <Text style={styles.statLabel}>FICHAS</Text>
              <CoinBadge amount={state.coins} size={36} testID="home-balance" />
            </View>
            {/* Caja de RACHA (días consecutivos) */}
            <View style={styles.statBox} testID="streak-card">
              <Text style={styles.statLabel}>RACHA</Text>
              <View style={styles.streakRow}>
                <Image source={RACHA_ICON} style={styles.rachaImage} resizeMode="contain" />
                <Text style={styles.streakNum} testID="streak-count">
                  {state.streak}
                </Text>
              </View>
              <Text style={styles.streakHint}>{state.streak === 1 ? "día" : "días"}</Text>
            </View>
          </View>

          {/* Banner de casino cerrado (solo se muestra si está cerrado) */}
          {closed && <CasinoClosedBanner remainingSec={remaining} />}

          {/* ================================================================
              SECCIÓN 3: MASCOTA CON MENSAJE
              Muestra la mascota del casino con un mensaje de bienvenida
              ================================================================ */}
          <View style={styles.mascotRow}>
            {/* Imagen de la mascota */}
            <Image source={MASCOT} style={styles.mascotImage} resizeMode="contain" />
            {/* Burbuja de diálogo con mensaje */}
            <View style={styles.speechBubble}>
              <Text style={styles.speechText}>
                ¡Bienvenido al Casino! Estudia para ganar fichas y prueba suerte en mis máquinas.
              </Text>
            </View>
          </View>

          {/* ================================================================
              SECCIÓN 4: MENÚ PRINCIPAL - BOTONES DE NAVEGACIÓN
              Botones para acceder a las diferentes secciones de la app
              
              PARA AÑADIR UN NUEVO BOTÓN:
              1. Importa el icono arriba en la sección de imágenes
              2. Copia un VintageButton existente
              3. Cambia: label, variant (color), imageSource, onPress, testID
              
              VARIANTES DE COLOR DISPONIBLES:
              - "green"  → Verde (estudiar)
              - "purple" → Morado (temas)
              - "red"    → Rojo (casino)
              - "brown"  → Marrón (premios)
              - "cream"  → Crema (ajustes)
              ================================================================ */}
          <View style={styles.menuStack}>
            {/* Botón ESTUDIAR - Inicia sesión de estudio */}
            <VintageButton
              label="ESTUDIAR"
              variant="green"
              imageSource={NAV_ESTUDIO}
              size="lg"
              onPress={() => goTo("/(tabs)/estudio")}
              testID="start-study-button"
            />
            {/* Botón MIS TEMAS - Gestionar materias de estudio */}
            <VintageButton
              label="MIS TEMAS"
              variant="purple"
              imageSource={NAV_TEMAS}
              size="lg"
              onPress={() => goTo("/(tabs)/temas")}
              testID="quick-temas-button"
            />
            {/* Botón CASINO - Juegos y apuestas */}
            <VintageButton
              label="CASINO"
              variant="red"
              imageSource={NAV_CASINO}
              size="lg"
              onPress={() => goTo("/(tabs)/casino")}
              testID="quick-spin-button"
            />
            {/* Botón MIS PREMIOS - Ver y canjear recompensas */}
            <VintageButton
              label="MIS PREMIOS"
              variant="brown"
              imageSource={NAV_PREMIOS}
              size="lg"
              onPress={() => goTo("/(tabs)/premios")}
              testID="quick-premios-button"
            />
            {/* Botón AJUSTES - Configuración de la app */}
            <VintageButton
              label="AJUSTES"
              variant="cream"
              imageSource={NAV_AJUSTES}
              size="lg"
              onPress={() => goTo("/(tabs)/ajustes")}
              testID="quick-ajustes-button"
            />
          </View>

          {/* ================================================================
              SECCIÓN 5: ESTADÍSTICAS DEL USUARIO
              Muestra un resumen de la actividad del usuario
              ================================================================ */}
          <View style={styles.statsCard}>
            <Text style={styles.statsCardTitle}>🎰 Cartilla del ludópata</Text>
            <View style={styles.statsGrid}>
              <Stat label="Min estudiados" value={state.stats.totalStudyMinutes} />
              <Stat label="Sesiones ✓" value={state.stats.sessionsCompleted} />
              <Stat label="Sesiones ✗" value={state.stats.sessionsFailed} />
              <Stat label="Giros" value={state.stats.totalSpins} />
              <Stat label="Jackpots" value={state.stats.totalJackpots} />
              <Stat label="Premios" value={state.stats.rewardsRedeemed} />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </PaperBackground>
  );
}

// =============================================================================
// COMPONENTE: Stat - Muestra una estadística individual
// =============================================================================
// Usado en la sección de "Cartilla del ludópata" para mostrar cada estadística
function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statBoxMini}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTinyLabel}>{label}</Text>
    </View>
  );
}

// =============================================================================
// ESTILOS DE LA PANTALLA
// =============================================================================
// PARA MODIFICAR:
// - Espaciado general: Edita "padding" y "gap" en scroll
// - Tamaño del logo: Edita "height" en logoImage
// - Tamaño de la mascota: Edita "width" y "height" en mascotImage
// - Colores: Usa los colores del tema (colors.xxx)
// =============================================================================
const styles = StyleSheet.create({
  // Contenedor principal con scroll
  scroll: {
    padding: 16,       // Espaciado interno de toda la pantalla
    paddingBottom: 32, // Espacio extra abajo para scroll
    gap: 14,           // Espacio entre cada sección
  },
  
  // ---------------------------------------------------------------------------
  // ESTILOS DEL BANNER (logo)
  // ---------------------------------------------------------------------------
  banner: {
    alignItems: "center",
    paddingVertical: 6,
    ...goldBorder(3),                    // Borde dorado de 3px
    borderRadius: radii.md,              // Esquinas redondeadas
    backgroundColor: colors.bgPanel,     // Color de fondo del panel
    ...cartoonShadow(4),                 // Sombra estilo cartoon
  },
  bannerLights: { 
    width: "90%", 
    paddingVertical: 4 
  },
  logoImage: {
    width: "85%",     // Ancho del logo (85% del contenedor)
    height: 140,      // Alto del logo
    marginVertical: 8,
  },
  
  // ---------------------------------------------------------------------------
  // ESTILOS DE FICHAS Y RACHA
  // ---------------------------------------------------------------------------
  statsRow: { 
    flexDirection: "row", // Coloca los elementos en fila horizontal
    gap: 12               // Espacio entre las cajas
  },
  statBox: {
    flex: 1,                             // Ocupa espacio igual
    backgroundColor: colors.bgPanel,
    ...goldBorder(2),
    borderRadius: radii.md,
    alignItems: "center",                // Centra el contenido
    paddingVertical: 12,
    ...cartoonShadow(3),
  },
  statLabel: {
    fontFamily: fonts.subheading,
    fontSize: 12,
    color: colors.antiqueGold,
    letterSpacing: 2,                    // Espaciado entre letras
    marginBottom: 6,
    textShadowColor: colors.bgDark,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  streakRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 6 
  },
  rachaImage: { 
    width: 36, 
    height: 36 
  },
  streakNum: { 
    fontFamily: fonts.numbers, 
    fontSize: 28, 
    color: colors.antiqueGold,
    textShadowColor: colors.bgDark,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  streakHint: { 
    fontFamily: fonts.body, 
    fontSize: 11, 
    color: colors.cream, 
    marginTop: 2 
  },
  
  // ---------------------------------------------------------------------------
  // ESTILOS DE LA MASCOTA
  // ---------------------------------------------------------------------------
  mascotRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 10 
  },
  mascotImage: {
    width: 130,   // Ancho de la mascota
    height: 160,  // Alto de la mascota
  },
  speechBubble: {
    flex: 1,
    backgroundColor: colors.cream,
    ...goldBorder(2),
    borderRadius: radii.md,
    padding: 12,
    ...cartoonShadow(3),
  },
  speechText: { 
    fontFamily: fonts.body, 
    color: colors.ink, 
    fontSize: 13, 
    lineHeight: 18 
  },
  
  // ---------------------------------------------------------------------------
  // ESTILOS DEL MENÚ
  // ---------------------------------------------------------------------------
  menuStack: { 
    gap: 10  // Espacio entre cada botón del menú
  },
  
  // ---------------------------------------------------------------------------
  // ESTILOS DE LA CARTILLA DE ESTADÍSTICAS
  // ---------------------------------------------------------------------------
  statsCard: {
    backgroundColor: colors.bgPanel,
    ...goldBorder(2),
    borderRadius: radii.md,
    padding: 12,
    ...cartoonShadow(3),
  },
  statsCardTitle: {
    fontFamily: fonts.heading,
    color: colors.antiqueGold,
    fontSize: 15,
    letterSpacing: 1,
    marginBottom: 8,
  },
  statsGrid: { 
    flexDirection: "row", 
    flexWrap: "wrap",   // Permite que los elementos pasen a la siguiente línea
    gap: 8 
  },
  statBoxMini: {
    ...goldBorder(2),
    backgroundColor: colors.bgDark,
    borderRadius: radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: "center",
    minWidth: "30%",   // Mínimo 30% del ancho (3 por fila)
    flexGrow: 1,       // Crece para llenar el espacio disponible
  },
  statValue: {
    fontFamily: fonts.numbers,
    fontSize: 18,
    color: colors.vintageRed,
    letterSpacing: 1,
  },
  statTinyLabel: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.cream,
    textAlign: "center",
    marginTop: 2,
  },
});
