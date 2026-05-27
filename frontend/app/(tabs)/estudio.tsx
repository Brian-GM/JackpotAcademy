// POMODORO STUDY SCREEN — vintage timer with high-risk mode and app-blur failure detection.

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AppState,
  AppStateStatus,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { FontAwesome5 } from "@expo/vector-icons";

import { CoinBadge } from "@/src/components/CoinBadge";
import { PaperBackground } from "@/src/components/PaperBackground";
import { SignTitle } from "@/src/components/SignTitle";
import { VintageButton } from "@/src/components/VintageButton";
import { VintageCard } from "@/src/components/VintageCard";
import { useSounds } from "@/src/hooks/use-sounds";
import { useGameStore } from "@/src/store/game-store";
import { cartoonShadow, colors, fonts, inkBorder, radii } from "@/src/theme";

type SessionState = "idle" | "running" | "paused" | "finished" | "failed";

function formatMMSS(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function EstudioScreen() {
  const { state, completeStudySession, failStudySession, spendCoins } = useGameStore();
  const { play } = useSounds();

  const [duration, setDuration] = useState(state.settings.pomodoroDuration);
  const [remaining, setRemaining] = useState(state.settings.pomodoroDuration * 60);
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [pauses, setPauses] = useState(0);

  // high-risk mode
  const [highRisk, setHighRisk] = useState(false);
  const [bet, setBet] = useState("5");

  // result modals
  const [resultModal, setResultModal] = useState<
    | null
    | { kind: "win"; coinsEarned: number; newStreak: number }
    | { kind: "fail"; reason: string }
  >(null);

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bgTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimestampRef = useRef<number>(0);
  const remainingRef = useRef<number>(remaining);
  remainingRef.current = remaining;
  const sessionStateRef = useRef<SessionState>(sessionState);
  sessionStateRef.current = sessionState;

  // sync remaining when duration changes while idle
  useEffect(() => {
    if (sessionState === "idle") setRemaining(duration * 60);
  }, [duration, sessionState]);

  const cleanupTimers = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    if (bgTimerRef.current) {
      clearTimeout(bgTimerRef.current);
      bgTimerRef.current = null;
    }
  }, []);

  const handleFail = useCallback(
    (reason: string) => {
      cleanupTimers();
      const betValue = highRisk ? Math.max(0, parseInt(bet, 10) || 0) : 0;
      failStudySession({ highRiskBet: betValue });
      setSessionState("failed");
      setResultModal({ kind: "fail", reason });
      play("fail");
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {
        // best-effort
      }
    },
    [bet, cleanupTimers, failStudySession, highRisk, play],
  );

  const handleComplete = useCallback(() => {
    cleanupTimers();
    const betValue = highRisk ? Math.max(0, parseInt(bet, 10) || 0) : 0;
    const minutes = duration;
    const { coinsEarned, newStreak } = completeStudySession({
      minutes,
      pauses,
      highRiskBet: betValue,
    });
    setSessionState("finished");
    setResultModal({ kind: "win", coinsEarned, newStreak });
    play("jackpot");
    setTimeout(() => play("coin"), 400);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // best-effort
    }
  }, [bet, cleanupTimers, completeStudySession, duration, highRisk, pauses, play]);

  // tick
  useEffect(() => {
    if (sessionState !== "running") return;
    tickRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          // complete inside effect
          setTimeout(handleComplete, 0);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = null;
    };
  }, [sessionState, handleComplete]);

  // app blur detection
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next: AppStateStatus) => {
      if (sessionStateRef.current !== "running") return;
      if (next === "background" || next === "inactive") {
        // start punishment timer
        if (bgTimerRef.current) clearTimeout(bgTimerRef.current);
        bgTimerRef.current = setTimeout(() => {
          handleFail("Saliste de la app durante la sesión");
        }, state.settings.appBlurFailSec * 1000);
      } else if (next === "active") {
        if (bgTimerRef.current) {
          clearTimeout(bgTimerRef.current);
          bgTimerRef.current = null;
        }
      }
    });
    return () => sub.remove();
  }, [handleFail, state.settings.appBlurFailSec]);

  const start = () => {
    if (highRisk) {
      const betValue = Math.max(1, parseInt(bet, 10) || 0);
      if (!spendCoins(betValue)) {
        setResultModal({ kind: "fail", reason: `Necesitas ${betValue} fichas para apostar` });
        return;
      }
    }
    setPauses(0);
    setRemaining(duration * 60);
    startTimestampRef.current = Date.now();
    setSessionState("running");
    play("lever");
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // best-effort
    }
  };

  const pause = () => {
    if (sessionState !== "running") return;
    if (pauses + 1 > state.settings.maxPauses) {
      handleFail("Demasiadas pausas. La sesión se ha perdido");
      return;
    }
    setPauses((p) => p + 1);
    setSessionState("paused");
    cleanupTimers();
  };

  const resume = () => {
    if (sessionState !== "paused") return;
    setSessionState("running");
  };

  const abandon = () => {
    handleFail("Has abandonado la sesión");
  };

  const dismissResult = () => {
    setResultModal(null);
    setSessionState("idle");
    setRemaining(duration * 60);
    setPauses(0);
  };

  const totalSec = duration * 60;
  const progress = sessionState === "idle" ? 0 : 1 - remaining / totalSec;
  const isLive = sessionState === "running" || sessionState === "paused";

  return (
    <PaperBackground>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <SignTitle title="SALÓN DE ESTUDIO" subtitle="Pomodoro Vintage" />

          {/* Coin balance + streak */}
          <View style={styles.topRow}>
            <CoinBadge amount={state.coins} size={28} />
            <Text style={styles.streakText} testID="study-streak">
              🔥 {state.streak}
            </Text>
          </View>

          {/* Timer card */}
          <VintageCard tint={colors.paperHighlight} style={styles.timerCard}>
            <Text style={styles.timerLabel}>TIEMPO RESTANTE</Text>
            <Text
              style={[styles.timer, sessionState === "failed" && { color: colors.vintageRed }]}
              testID="pomodoro-timer"
            >
              {formatMMSS(remaining)}
            </Text>
            <View style={styles.gaugeOuter}>
              <View style={[styles.gaugeFill, { width: `${Math.min(100, progress * 100)}%` }]} />
              <View style={styles.gaugeShine} pointerEvents="none" />
            </View>
            <Text style={styles.gaugeLabel}>📈 Medidor de presión</Text>
            <View style={styles.metaRow}>
              <View style={styles.metaBox}>
                <Text style={styles.metaValue}>{pauses}</Text>
                <Text style={styles.metaLabel}>Pausas</Text>
              </View>
              <View style={styles.metaBox}>
                <Text style={styles.metaValue}>
                  {duration >= 50 ? "+" + state.settings.longSessionBonus : "—"}
                </Text>
                <Text style={styles.metaLabel}>Bonus larga</Text>
              </View>
              <View style={styles.metaBox}>
                <Text style={styles.metaValue}>
                  {pauses === 0 ? "+" + state.settings.noPauseBonus : "—"}
                </Text>
                <Text style={styles.metaLabel}>Sin pausa</Text>
              </View>
            </View>
          </VintageCard>

          {/* Duration selector */}
          {!isLive && (
            <VintageCard style={styles.section}>
              <Text style={styles.sectionTitle}>⏱️ Duración de la sesión</Text>
              <View style={styles.durationRow}>
                {[15, 25, 50, 90].map((d) => (
                  <Pressable
                    key={d}
                    onPress={() => setDuration(d)}
                    style={[styles.durChip, duration === d && styles.durChipActive]}
                    testID={`duration-${d}`}
                  >
                    <Text
                      style={[
                        styles.durChipText,
                        duration === d && styles.durChipTextActive,
                      ]}
                    >
                      {d}m
                    </Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.customRow}>
                <Text style={styles.bodyText}>Personalizado:</Text>
                <TextInput
                  value={String(duration)}
                  onChangeText={(t) => {
                    const n = Math.max(1, Math.min(180, parseInt(t, 10) || 0));
                    setDuration(n);
                  }}
                  keyboardType="number-pad"
                  style={styles.inputSmall}
                  testID="duration-custom"
                />
                <Text style={styles.bodyText}>min</Text>
              </View>
            </VintageCard>
          )}

          {/* High risk mode */}
          {!isLive && (
            <VintageCard style={styles.section} tint={highRisk ? colors.vintageRed : colors.paperSecondary}>
              <Pressable onPress={() => setHighRisk((h) => !h)} style={styles.riskHeader}>
                <FontAwesome5
                  name={highRisk ? "fire" : "exclamation-triangle"}
                  size={20}
                  color={highRisk ? colors.paperHighlight : colors.vintageRed}
                />
                <Text style={[styles.riskTitle, highRisk && { color: colors.paperHighlight }]}>
                  MODO ALTO RIESGO
                </Text>
                <View style={[styles.toggle, highRisk && styles.toggleOn]}>
                  <View style={[styles.toggleKnob, highRisk && styles.toggleKnobOn]} />
                </View>
              </Pressable>
              <Text style={[styles.riskBody, highRisk && { color: colors.cream }]}>
                Apuesta fichas. Gana {state.settings.highRiskMultiplier}× si completas. Pierdes todo
                si fallas.
              </Text>
              {highRisk && (
                <View style={styles.betRow}>
                  <Text style={[styles.bodyText, { color: colors.paperHighlight }]}>Apuesta:</Text>
                  <TextInput
                    value={bet}
                    onChangeText={setBet}
                    keyboardType="number-pad"
                    style={styles.inputSmall}
                    testID="bet-input"
                  />
                  <Text style={[styles.bodyText, { color: colors.paperHighlight }]}>fichas</Text>
                </View>
              )}
            </VintageCard>
          )}

          {/* Action buttons */}
          <View style={styles.actions}>
            {sessionState === "idle" && (
              <VintageButton
                label="EMPEZAR SESIÓN"
                variant="red"
                size="lg"
                onPress={start}
                testID="start-session-button"
                style={{ flex: 1 }}
              />
            )}
            {sessionState === "running" && (
              <>
                <VintageButton
                  label="PAUSAR"
                  variant="gold"
                  onPress={pause}
                  testID="pause-button"
                  style={{ flex: 1 }}
                />
                <VintageButton
                  label="ABANDONAR"
                  variant="wood"
                  onPress={abandon}
                  testID="fail-study-button"
                  style={{ flex: 1 }}
                />
              </>
            )}
            {sessionState === "paused" && (
              <>
                <VintageButton
                  label="REANUDAR"
                  variant="red"
                  onPress={resume}
                  testID="resume-button"
                  style={{ flex: 1 }}
                />
                <VintageButton
                  label="ABANDONAR"
                  variant="wood"
                  onPress={abandon}
                  style={{ flex: 1 }}
                />
              </>
            )}
          </View>

          <Text style={styles.warning}>
            ⚠️ Si abandonas o sales de la app durante más de{" "}
            {state.settings.appBlurFailSec}s, la sesión falla y el casino cierra{" "}
            {state.settings.casinoClosedMin} min.
          </Text>
        </ScrollView>
      </SafeAreaView>

      {/* Result modal */}
      <Modal visible={!!resultModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <VintageCard
            tint={
              resultModal?.kind === "win" ? colors.antiqueGold : colors.vintageRedDark
            }
            style={styles.modalCard}
          >
            {resultModal?.kind === "win" ? (
              <>
                <Text style={styles.modalEmoji}>🎉</Text>
                <Text style={styles.modalTitle}>¡JACKPOT DE ESTUDIO!</Text>
                <Text style={styles.modalBody}>
                  Ganaste {resultModal.coinsEarned} fichas
                </Text>
                <Text style={styles.modalSubBody}>Racha: {resultModal.newStreak} días 🔥</Text>
              </>
            ) : (
              <>
                <Text style={styles.modalEmoji}>💀</Text>
                <Text style={[styles.modalTitle, { color: colors.cream }]}>
                  CASINO CERRADO
                </Text>
                <Text style={[styles.modalBody, { color: colors.cream }]}>
                  {resultModal?.reason}
                </Text>
                <Text style={[styles.modalSubBody, { color: colors.cream }]}>
                  Racha perdida. Cooldown {state.settings.casinoClosedMin}m activo.
                </Text>
              </>
            )}
            <VintageButton
              label="ENTENDIDO"
              variant={resultModal?.kind === "win" ? "red" : "gold"}
              onPress={dismissResult}
              testID="dismiss-result"
              style={{ marginTop: 14, minWidth: 200 }}
            />
          </VintageCard>
        </View>
      </Modal>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 32, gap: 14 },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  streakText: {
    fontFamily: fonts.numbers,
    fontSize: 18,
    color: colors.ink,
  },
  timerCard: {
    alignItems: "center",
    paddingVertical: 16,
  },
  timerLabel: {
    fontFamily: fonts.subheading,
    fontSize: 12,
    color: colors.inkSoft,
    letterSpacing: 3,
  },
  timer: {
    fontFamily: fonts.numbers,
    fontSize: 72,
    color: colors.ink,
    letterSpacing: 4,
    marginVertical: 6,
    textShadowColor: colors.antiqueGold,
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 0,
  },
  gaugeOuter: {
    width: "100%",
    height: 18,
    ...inkBorder(2),
    backgroundColor: colors.paperPrimary,
    borderRadius: 9,
    overflow: "hidden",
    marginTop: 4,
  },
  gaugeFill: {
    height: "100%",
    backgroundColor: colors.vintageRed,
  },
  gaugeShine: {
    position: "absolute",
    top: 2,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  gaugeLabel: {
    fontFamily: fonts.body,
    color: colors.inkSoft,
    marginTop: 6,
    fontSize: 12,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 10,
  },
  metaBox: { alignItems: "center" },
  metaValue: { fontFamily: fonts.numbers, fontSize: 18, color: colors.vintageRed },
  metaLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.inkSoft },
  section: { padding: 14 },
  sectionTitle: {
    fontFamily: fonts.heading,
    fontSize: 16,
    color: colors.ink,
    marginBottom: 10,
    letterSpacing: 1,
  },
  durationRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  durChip: {
    ...inkBorder(2),
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.paperHighlight,
  },
  durChipActive: {
    backgroundColor: colors.vintageRed,
  },
  durChipText: { fontFamily: fonts.subheading, color: colors.ink, letterSpacing: 1 },
  durChipTextActive: { color: colors.paperHighlight },
  customRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 },
  bodyText: { fontFamily: fonts.body, color: colors.ink, fontSize: 14 },
  inputSmall: {
    ...inkBorder(2),
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.paperHighlight,
    borderRadius: radii.sm,
    minWidth: 70,
    fontFamily: fonts.numbers,
    fontSize: 16,
    color: colors.ink,
    textAlign: "center",
  },
  riskHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  riskTitle: {
    fontFamily: fonts.heading,
    fontSize: 16,
    color: colors.ink,
    letterSpacing: 1,
    flex: 1,
  },
  riskBody: { fontFamily: fonts.body, color: colors.inkSoft, marginTop: 6 },
  betRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.paperPrimary,
    ...inkBorder(2),
    justifyContent: "center",
    padding: 2,
  },
  toggleOn: { backgroundColor: colors.successGreen },
  toggleKnob: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.paperHighlight,
    ...inkBorder(1),
  },
  toggleKnobOn: { alignSelf: "flex-end" },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  warning: {
    fontFamily: fonts.body,
    fontSize: 12,
    fontStyle: "italic",
    color: colors.inkSoft,
    textAlign: "center",
    paddingHorizontal: 14,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(44,30,22,0.7)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    padding: 20,
    alignItems: "center",
    minWidth: 280,
    ...cartoonShadow(6),
  },
  modalEmoji: { fontSize: 64 },
  modalTitle: {
    fontFamily: fonts.heading,
    fontSize: 24,
    color: colors.ink,
    marginTop: 4,
    letterSpacing: 2,
    textAlign: "center",
  },
  modalBody: {
    fontFamily: fonts.subheading,
    fontSize: 16,
    color: colors.ink,
    marginTop: 8,
    letterSpacing: 1,
    textAlign: "center",
  },
  modalSubBody: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: 4,
    textAlign: "center",
  },
});
