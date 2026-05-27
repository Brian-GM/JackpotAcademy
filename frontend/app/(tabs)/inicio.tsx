// HOME — Jackpot Academy style hub with category buttons and mascot greeting.

import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CasinoClosedBanner } from "@/src/components/CasinoClosedBanner";
import { CasinoMascot } from "@/src/components/CasinoMascot";
import { CoinBadge } from "@/src/components/CoinBadge";
import { MarqueeLights } from "@/src/components/MarqueeLights";
import { PaperBackground } from "@/src/components/PaperBackground";
import { VintageButton } from "@/src/components/VintageButton";
import { useSounds } from "@/src/hooks/use-sounds";
import { useGameStore } from "@/src/store/game-store";
import { cartoonShadow, colors, fonts, goldBorder, radii } from "@/src/theme";

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

  const goTo = (path: "/(tabs)/estudio" | "/(tabs)/casino" | "/(tabs)/ruleta" | "/(tabs)/premios" | "/(tabs)/ajustes") => {
    play("lever");
    router.push(path);
  };

  return (
    <PaperBackground>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Banner with title + lights */}
          <View style={styles.banner}>
            <View style={styles.bannerLights}>
              <MarqueeLights count={14} size={7} speed={1100} />
            </View>
            <Text style={styles.bannerTitle} numberOfLines={1} adjustsFontSizeToFit>
              STUDY CASINO
            </Text>
            <Text style={styles.bannerSubtitle}>· APRENDE · GANA · ESTUDIA ·</Text>
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
                <Text style={styles.streakFlame}>🔥</Text>
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
            <CasinoMascot state="wave" size={130} />
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
              icon="book"
              size="lg"
              onPress={() => goTo("/(tabs)/estudio")}
              testID="start-study-button"
            />
            <VintageButton
              label="RULETA DE TEMAS"
              variant="purple"
              icon="random"
              size="lg"
              onPress={() => goTo("/(tabs)/ruleta")}
              testID="quick-roulette-button"
            />
            <VintageButton
              label="JUGAR · TRAGAMONEDAS"
              variant="red"
              icon="dice"
              size="lg"
              onPress={() => goTo("/(tabs)/casino")}
              testID="quick-spin-button"
            />
            <VintageButton
              label="MIS PREMIOS"
              variant="brown"
              icon="gift"
              size="lg"
              onPress={() => goTo("/(tabs)/premios")}
              testID="quick-premios-button"
            />
            <VintageButton
              label="AJUSTES"
              variant="cream"
              icon="cog"
              size="md"
              onPress={() => goTo("/(tabs)/ajustes")}
              testID="quick-ajustes-button"
            />
          </View>

          {/* Stats footer */}
          <View style={styles.statsCard}>
            <Text style={styles.statsCardTitle}>📜 Pergamino del jugador</Text>
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
  bannerTitle: {
    fontFamily: fonts.heading,
    fontSize: 34,
    color: colors.antiqueGold,
    letterSpacing: 4,
    marginTop: 4,
    textShadowColor: colors.vintageRedDark,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  bannerSubtitle: {
    fontFamily: fonts.subheading,
    fontSize: 12,
    color: colors.cream,
    letterSpacing: 4,
    marginTop: 2,
    marginBottom: 4,
  },
  statsRow: { flexDirection: "row", gap: 12 },
  statBox: {
    flex: 1,
    backgroundColor: colors.cream,
    ...goldBorder(2),
    borderRadius: radii.md,
    alignItems: "center",
    paddingVertical: 12,
    ...cartoonShadow(3),
  },
  statLabel: {
    fontFamily: fonts.subheading,
    fontSize: 12,
    color: colors.inkSoft,
    letterSpacing: 2,
    marginBottom: 6,
  },
  streakRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  streakFlame: { fontSize: 28 },
  streakNum: { fontFamily: fonts.numbers, fontSize: 28, color: colors.ink },
  streakHint: { fontFamily: fonts.body, fontSize: 11, color: colors.inkSoft, marginTop: 2 },
  mascotRow: { flexDirection: "row", alignItems: "center", gap: 10 },
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
