// HOME — JackpotAcademy style hub with category buttons and mascot greeting.

import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CasinoClosedBanner } from "@/src/components/CasinoClosedBanner";
import { CoinBadge } from "@/src/components/CoinBadge";
import { MarqueeLights } from "@/src/components/MarqueeLights";
import { PaperBackground } from "@/src/components/PaperBackground";
import { VintageButton } from "@/src/components/VintageButton";
import { useSounds } from "@/src/hooks/use-sounds";
import { useGameStore } from "@/src/store/game-store";
import { cartoonShadow, colors, fonts, goldBorder, radii } from "@/src/theme";

// New assets
const LOGO = require("../../assets/images/jackpot-academy-logo.png");
const MASCOT = require("../../assets/images/mascot-inicio.png");
const RACHA_ICON = require("../../assets/images/racha-icon.png");

// Navbar icons for menu buttons
const NAV_ESTUDIO = require("../../assets/images/nav-estudio.png");
const NAV_TEMAS = require("../../assets/images/nav-temas.png");
const NAV_CASINO = require("../../assets/images/nav-casino.png");
const NAV_PREMIOS = require("../../assets/images/nav-premios.png");
const NAV_AJUSTES = require("../../assets/images/nav-ajustes.png");

export default function InicioScreen() {
  const router = useRouter();
  const { state, isCasinoClosed, casinoClosedRemainingSec } = useGameStore();
  const { play } = useSounds();
  const [, force] = useState(0);

  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const closed = isCasinoClosed();
  const remaining = casinoClosedRemainingSec();

  const goTo = (path: "/(tabs)/estudio" | "/(tabs)/casino" | "/(tabs)/ruleta" | "/(tabs)/premios" | "/(tabs)/ajustes" | "/(tabs)/temas") => {
    play("lever");
    router.push(path);
  };

  return (
    <PaperBackground>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Logo Banner */}
          <View style={styles.banner}>
            <View style={styles.bannerLights}>
              <MarqueeLights count={14} size={7} speed={1100} />
            </View>
            <Image source={LOGO} style={styles.logoImage} resizeMode="contain" />
            <View style={styles.bannerLights}>
              <MarqueeLights count={14} size={7} speed={1100} />
            </View>
          </View>

          {/* Coin + streak strip */}
          <View style={styles.statsRow}>
            <View style={styles.statBox} testID="balance-card">
              <Text style={styles.statLabel}>FICHAS</Text>
              <CoinBadge amount={state.coins} size={36} testID="home-balance" />
            </View>
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

          {closed && <CasinoClosedBanner remainingSec={remaining} />}

          {/* Mascot greet */}
          <View style={styles.mascotRow}>
            <Image source={MASCOT} style={styles.mascotImage} resizeMode="contain" />
            <View style={styles.speechBubble}>
              <Text style={styles.speechText}>
                ¡Bienvenido al Casino! Estudia para ganar fichas y prueba suerte en mis máquinas.
              </Text>
            </View>
          </View>

          {/* Main menu — category buttons */}
          <View style={styles.menuStack}>
            <VintageButton
              label="ESTUDIAR"
              variant="green"
              imageSource={NAV_ESTUDIO}
              size="lg"
              onPress={() => goTo("/(tabs)/estudio")}
              testID="start-study-button"
            />
            <VintageButton
              label="MIS TEMAS"
              variant="purple"
              imageSource={NAV_TEMAS}
              size="lg"
              onPress={() => goTo("/(tabs)/temas")}
              testID="quick-temas-button"
            />
            <VintageButton
              label="CASINO"
              variant="red"
              imageSource={NAV_CASINO}
              size="lg"
              onPress={() => goTo("/(tabs)/casino")}
              testID="quick-spin-button"
            />
            <VintageButton
              label="MIS PREMIOS"
              variant="brown"
              imageSource={NAV_PREMIOS}
              size="lg"
              onPress={() => goTo("/(tabs)/premios")}
              testID="quick-premios-button"
            />
            <VintageButton
              label="AJUSTES"
              variant="cream"
              imageSource={NAV_AJUSTES}
              size="md"
              onPress={() => goTo("/(tabs)/ajustes")}
              testID="quick-ajustes-button"
            />
          </View>

          {/* Stats footer - Cartilla del ludópata */}
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

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statBoxMini}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTinyLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 16,
    paddingBottom: 32,
    gap: 14,
  },
  banner: {
    alignItems: "center",
    paddingVertical: 6,
    ...goldBorder(3),
    borderRadius: radii.md,
    backgroundColor: colors.bgPanel,
    ...cartoonShadow(4),
  },
  bannerLights: { width: "90%", paddingVertical: 4 },
  logoImage: {
    width: "85%",
    height: 140,
    marginVertical: 8,
  },
  statsRow: { flexDirection: "row", gap: 12 },
  statBox: {
    flex: 1,
    backgroundColor: colors.bgPanel,
    ...goldBorder(2),
    borderRadius: radii.md,
    alignItems: "center",
    paddingVertical: 12,
    ...cartoonShadow(3),
  },
  statLabel: {
    fontFamily: fonts.subheading,
    fontSize: 12,
    color: colors.antiqueGold,
    letterSpacing: 2,
    marginBottom: 6,
    textShadowColor: colors.bgDark,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  streakRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  rachaImage: { width: 36, height: 36 },
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
  mascotRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  mascotImage: {
    width: 130,
    height: 160,
  },
  speechBubble: {
    flex: 1,
    backgroundColor: colors.cream,
    ...goldBorder(2),
    borderRadius: radii.md,
    padding: 12,
    ...cartoonShadow(3),
  },
  speechText: { fontFamily: fonts.body, color: colors.ink, fontSize: 13, lineHeight: 18 },
  menuStack: { gap: 10 },
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
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statBoxMini: {
    ...goldBorder(2),
    backgroundColor: colors.bgDark,
    borderRadius: radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: "center",
    minWidth: "30%",
    flexGrow: 1,
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
