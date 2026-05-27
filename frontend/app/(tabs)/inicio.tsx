// HOME (Inicio) — overview of the casino: balance, streak, quick actions, active state.

import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome5 } from "@expo/vector-icons";

import { CasinoClosedBanner } from "@/src/components/CasinoClosedBanner";
import { CoinBadge } from "@/src/components/CoinBadge";
import { MarqueeLights } from "@/src/components/MarqueeLights";
import { PaperBackground } from "@/src/components/PaperBackground";
import { SignTitle } from "@/src/components/SignTitle";
import { VintageButton } from "@/src/components/VintageButton";
import { VintageCard } from "@/src/components/VintageCard";
import { useSounds } from "@/src/hooks/use-sounds";
import { useGameStore } from "@/src/store/game-store";
import { colors, fonts, inkBorder, radii } from "@/src/theme";

const ROULETTE = require("../../assets/images/roulette-wheel.png");

export default function InicioScreen() {
  const router = useRouter();
  const { state, isCasinoClosed, casinoClosedRemainingSec } = useGameStore();
  const { play } = useSounds();
  const [, force] = useState(0);

  // Re-render every second to update the closed-banner timer.
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const closed = isCasinoClosed();
  const remaining = casinoClosedRemainingSec();

  return (
    <PaperBackground>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <SignTitle title="STUDY CASINO" subtitle="EST. 1932" testID="home-title" />

          {/* Balance + Streak */}
          <View style={styles.row}>
            <VintageCard style={styles.statCard} testID="balance-card">
              <Text style={styles.statLabel}>FICHAS</Text>
              <CoinBadge amount={state.coins} size={36} testID="home-balance" />
            </VintageCard>

            <VintageCard style={styles.statCard} testID="streak-card">
              <Text style={styles.statLabel}>RACHA</Text>
              <View style={styles.streakRow}>
                <Text style={styles.streakFlame}>🔥</Text>
                <Text style={styles.streakNum} testID="streak-count">
                  {state.streak}
                </Text>
              </View>
              <Text style={styles.streakHint}>{state.streak === 1 ? "día" : "días"}</Text>
            </VintageCard>
          </View>

          {closed && <CasinoClosedBanner remainingSec={remaining} />}

          {/* Main action: study */}
          <VintageCard tint={colors.cream} style={styles.heroCard}>
            <View style={styles.heroLights}>
              <MarqueeLights count={16} size={8} speed={1400} />
            </View>
            <Text style={styles.heroEyebrow}>¡APUESTA TU TIEMPO!</Text>
            <Text style={styles.heroTitle}>¿Listo para ganar?</Text>
            <Text style={styles.heroBody}>
              Estudia para ganar fichas y desbloquear tus premios.
            </Text>
            <VintageButton
              label="EMPEZAR ESTUDIO"
              variant="red"
              size="lg"
              onPress={() => {
                play("lever");
                router.push("/(tabs)/estudio");
              }}
              testID="start-study-button"
              style={styles.heroBtn}
            />
            <View style={styles.heroLightsBottom}>
              <MarqueeLights count={16} size={8} speed={1400} />
            </View>
          </VintageCard>

          {/* Quick actions */}
          <View style={styles.quickRow}>
            <View style={styles.quickCol}>
              <VintageCard style={styles.quickCard} testID="quick-spin">
                <Image source={ROULETTE} style={styles.quickIcon} />
                <Text style={styles.quickLabel}>GIRO RÁPIDO</Text>
                <VintageButton
                  label="Tragamonedas"
                  variant="gold"
                  size="sm"
                  onPress={() => {
                    play("click");
                    router.push("/(tabs)/casino");
                  }}
                  testID="quick-spin-button"
                  style={{ marginTop: 6 }}
                />
              </VintageCard>
            </View>
            <View style={styles.quickCol}>
              <VintageCard style={styles.quickCard}>
                <FontAwesome5 name="random" size={42} color={colors.vintageRed} solid />
                <Text style={styles.quickLabel}>RULETA DE TEMAS</Text>
                <VintageButton
                  label="Girar"
                  variant="wood"
                  size="sm"
                  onPress={() => {
                    play("click");
                    router.push("/(tabs)/ruleta");
                  }}
                  testID="quick-roulette-button"
                  style={{ marginTop: 6 }}
                />
              </VintageCard>
            </View>
          </View>

          {/* Active rewards (recently used) */}
          <VintageCard style={styles.section}>
            <Text style={styles.sectionTitle}>🎟️ Premios activos</Text>
            {(() => {
              const now = Date.now();
              const active = state.rewards.filter(
                (r) => r.lastUsedAt && now - r.lastUsedAt < r.cooldownMin * 60 * 1000,
              );
              if (active.length === 0) {
                return (
                  <Text style={styles.empty}>
                    Aún no has cobrado premios hoy. Estudia y desbloquéalos.
                  </Text>
                );
              }
              return active.map((r) => {
                const remaining = Math.max(
                  0,
                  Math.ceil((r.cooldownMin * 60 * 1000 - (now - (r.lastUsedAt ?? 0))) / 60000),
                );
                return (
                  <View key={r.id} style={styles.activeRow}>
                    <Text style={styles.activeIcon}>{r.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.activeName}>{r.name}</Text>
                      <Text style={styles.activeMeta}>
                        En cooldown · {remaining} min restantes
                      </Text>
                    </View>
                  </View>
                );
              });
            })()}
          </VintageCard>

          {/* Stats footer */}
          <VintageCard style={styles.section} tint={colors.paperHighlight}>
            <Text style={styles.sectionTitle}>📜 Pergamino del jugador</Text>
            <View style={styles.statsGrid}>
              <Stat label="Minutos estudiados" value={state.stats.totalStudyMinutes} />
              <Stat label="Sesiones completadas" value={state.stats.sessionsCompleted} />
              <Stat label="Sesiones falladas" value={state.stats.sessionsFailed} />
              <Stat label="Giros del casino" value={state.stats.totalSpins} />
              <Stat label="Jackpots" value={state.stats.totalJackpots} />
              <Stat label="Premios cobrados" value={state.stats.rewardsRedeemed} />
            </View>
          </VintageCard>
        </ScrollView>
      </SafeAreaView>
    </PaperBackground>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statBox}>
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
  row: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
  },
  statLabel: {
    fontFamily: fonts.subheading,
    fontSize: 12,
    color: colors.inkSoft,
    letterSpacing: 2,
    marginBottom: 6,
  },
  streakRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  streakFlame: {
    fontSize: 28,
  },
  streakNum: {
    fontFamily: fonts.numbers,
    fontSize: 28,
    color: colors.ink,
  },
  streakHint: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkSoft,
    marginTop: 2,
  },
  heroCard: {
    padding: 18,
    alignItems: "center",
  },
  heroLights: {
    width: "100%",
    paddingVertical: 4,
    marginBottom: 6,
  },
  heroLightsBottom: {
    width: "100%",
    paddingVertical: 4,
    marginTop: 10,
  },
  heroEyebrow: {
    fontFamily: fonts.subheading,
    fontSize: 12,
    color: colors.vintageRed,
    letterSpacing: 3,
  },
  heroTitle: {
    fontFamily: fonts.heading,
    fontSize: 26,
    color: colors.ink,
    marginTop: 4,
    letterSpacing: 1,
    textAlign: "center",
  },
  heroBody: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkSoft,
    textAlign: "center",
    marginTop: 6,
    paddingHorizontal: 12,
  },
  heroBtn: {
    marginTop: 14,
    minWidth: "80%",
  },
  quickRow: {
    flexDirection: "row",
    gap: 12,
  },
  quickCol: { flex: 1 },
  quickCard: {
    alignItems: "center",
    paddingVertical: 14,
    minHeight: 160,
    justifyContent: "space-between",
  },
  quickIcon: {
    width: 56,
    height: 56,
    resizeMode: "contain",
  },
  quickLabel: {
    fontFamily: fonts.subheading,
    fontSize: 12,
    color: colors.ink,
    letterSpacing: 2,
    marginTop: 6,
    textAlign: "center",
  },
  section: {
    paddingVertical: 14,
  },
  sectionTitle: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: colors.ink,
    marginBottom: 8,
    letterSpacing: 1,
  },
  empty: {
    fontFamily: fonts.body,
    color: colors.inkSoft,
    fontStyle: "italic",
    fontSize: 13,
  },
  activeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(44,30,22,0.15)",
  },
  activeIcon: {
    fontSize: 28,
  },
  activeName: {
    fontFamily: fonts.subheading,
    fontSize: 15,
    color: colors.ink,
    letterSpacing: 1,
  },
  activeMeta: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkSoft,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
  },
  statBox: {
    ...inkBorder(2),
    backgroundColor: colors.paperPrimary,
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
    color: colors.inkSoft,
    textAlign: "center",
    marginTop: 2,
  },
});
