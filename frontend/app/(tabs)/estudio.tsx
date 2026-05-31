/**
 * =============================================================================
 * estudio.tsx - PANTALLA DE SESIÓN DE ESTUDIO (POMODORO VINTAGE)
 * =============================================================================
 * 
 * Pantalla principal de estudio con temporizador Pomodoro, selección de temas
 * y sistema de recompensas por completar sesiones.
 * 
 * CARACTERÍSTICAS:
 * - Temporizador Pomodoro configurable (5-60 minutos)
 * - Selección manual de tema o ruleta aleatoria
 * - Multiplicador de dificultad (más dificultad = más fichas)
 * - Detección de abandono de app (si sales de la app, pierdes)
 * - Notificaciones push durante la sesión
 * - Mascota con reacciones según el progreso
 * - Animación de lluvia de monedas al completar
 * 
 * ESTADOS DE LA SESIÓN (SessionState):
 * - "idle": Sin sesión activa, listo para empezar
 * - "running": Sesión en curso, el temporizador corre
 * - "paused": Sesión pausada (ojo: pausar mucho puede fallar)
 * - "finished": Sesión completada exitosamente
 * - "failed": Sesión fallida (saliste de la app)
 * 
 * MODOS DE SELECCIÓN DE TEMA (TopicMode):
 * - "manual": Eliges el tema tú mismo
 * - "roulette": La ruleta elige un tema aleatorio
 * 
 * SISTEMA DE RECOMPENSAS:
 * - Fichas base según duración (5min = 5 fichas, etc.)
 * - Multiplicador por dificultad (Fácil x0.5, Normal x1, Difícil x2.2)
 * - Racha de días consecutivos aumenta bonus
 * 
 * PARA MODIFICAR:
 * - Duración mínima/máxima: Busca DEFAULT_DURATION_MIN y los límites
 * - Fichas por minuto: Modifica la fórmula en completeSession()
 * - Multiplicadores: Cambia DIFFICULTY_MULTIPLIER en types.ts
 * =============================================================================
 */

// -----------------------------------------------------------------------------
// IMPORTS
// -----------------------------------------------------------------------------
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";              // Vibración del dispositivo
import { FontAwesome5 } from "@expo/vector-icons";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";                     // Animaciones fluidas

// Componentes personalizados
import { CasinoMascot } from "@/src/components/CasinoMascot";
import { CoinBadge } from "@/src/components/CoinBadge";
import { CoinShower } from "@/src/components/CoinShower";      // Lluvia de monedas
import { MarqueeLights } from "@/src/components/MarqueeLights";
import { PaperBackground } from "@/src/components/PaperBackground";
import { SignTitle } from "@/src/components/SignTitle";
import { SunburstRays } from "@/src/components/SunburstRays";
import { VintageButton } from "@/src/components/VintageButton";
import { VintageCard } from "@/src/components/VintageCard";

// Notificaciones push
import {
  clearSessionNotifications,
  requestNotificationPermission,
  showFailNotification,
  showSuccessNotification,
  startSessionNotification,
} from "@/src/hooks/notifications";

import { useSounds } from "@/src/hooks/use-sounds";

// Bloqueador de apps (experimental)
import {
  isBlockerAvailable,
  startBlockingSession,
  stopBlockingSession,
  getNativeRemainingTime,
  isNativeTimerRunning,
} from "@/src/hooks/use-blocker";

import { useGameStore } from "@/src/store/game-store";
import {
  DIFFICULTY_EMOJI,
  DIFFICULTY_LABEL,
  DIFFICULTY_MULTIPLIER,
  Mastery,
} from "@/src/store/types";
import { cartoonShadow, colors, fonts, goldBorder, inkBorder, radii } from "@/src/theme";

// -----------------------------------------------------------------------------
// TIPOS
// -----------------------------------------------------------------------------
type SessionState = "idle" | "running" | "paused" | "finished" | "failed";
type TopicMode = "manual" | "roulette";

// -----------------------------------------------------------------------------
// IMÁGENES Y ASSETS
// -----------------------------------------------------------------------------
const WHEEL_IMG = require("../../assets/images/ruleta-elegir.png");    // Rueda de ruleta
const RACHA_ICON = require("../../assets/images/racha-icon.png");        // Icono de racha
const MASCOT_ESTUDIO = require("../../assets/images/mascot-estudio.png"); // Mascota estudiando

// Iconos de nivel de dominio (payaso en diferentes estados)
const DOMINIO_NADA = require("../../assets/images/dominio-nada.png");
const DOMINIO_REGULAR = require("../../assets/images/dominio-regular.png");
const DOMINIO_BIEN = require("../../assets/images/dominio-bien.png");
const DOMINIO_CONTROLADO = require("../../assets/images/dominio-controlado.png");

// Mapa de iconos por nivel de dominio
const DOMINIO_ICONS: Record<Mastery, any> = {
  0: DOMINIO_NADA,       // Nivel 0: Nada dominado
  1: DOMINIO_REGULAR,    // Nivel 1: Regular
  2: DOMINIO_BIEN,       // Nivel 2: Bien
  3: DOMINIO_CONTROLADO, // Nivel 3: Controlado
};

// Etiquetas de texto para cada nivel
const DOMINIO_LABELS: Record<Mastery, string> = {
  0: "Sin dominar",
  1: "Regular",
  2: "Bien",
  3: "¡Controlado!",
};

function formatMMSS(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function EstudioScreen() {
  const {
    state,
    completeStudySession,
    failStudySession,
    spendCoins,
    setCurrentTopic,
    computeTopicPriority,
  } = useGameStore();
  const { play, playFor } = useSounds();

  const [duration, setDuration] = useState(state.settings.pomodoroDuration);
  const [remaining, setRemaining] = useState(state.settings.pomodoroDuration * 60);
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [pauses, setPauses] = useState(0);
  const [highRisk, setHighRisk] = useState(false);
  const [bet, setBet] = useState("5");
  const [showCelebration, setShowCelebration] = useState(false);
  const [topicMode, setTopicMode] = useState<TopicMode>("manual");
  const [spinning, setSpinning] = useState(false);
  const wheelRotation = useSharedValue(0);

  const wheelAnim = useAnimatedStyle(() => ({
    transform: [{ rotate: `${wheelRotation.value}deg` }],
  }));

  const [resultModal, setResultModal] = useState<
    | null
    | {
        kind: "win";
        coinsEarned: number;
        newStreak: number;
        difficultyLabel: string;
        multiplier: number;
      }
    | { kind: "fail"; reason: string }
  >(null);

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bgTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remainingRef = useRef<number>(remaining);
  remainingRef.current = remaining;
  const sessionStateRef = useRef<SessionState>(sessionState);
  sessionStateRef.current = sessionState;

  useEffect(() => {
    if (sessionState === "idle") setRemaining(duration * 60);
  }, [duration, sessionState]);

  const selectedTopic = useMemo(
    () => state.topics.find((t) => t.id === state.currentTopicId) ?? null,
    [state.topics, state.currentTopicId],
  );

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
      clearSessionNotifications();
      stopBlockingSession();
      showFailNotification(reason);
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
    const result = completeStudySession({
      minutes,
      pauses,
      highRiskBet: betValue,
      topicId: state.currentTopicId,
    });
    setSessionState("finished");
    setResultModal({ kind: "win", ...result });
    play("jackpot");
    setTimeout(() => play("coin"), 400);
    setTimeout(() => play("bell", { volume: 0.5 }), 700);
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 3000);
    clearSessionNotifications();
    stopBlockingSession();
    showSuccessNotification(result.coinsEarned);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // best-effort
    }
  }, [
    bet,
    cleanupTimers,
    completeStudySession,
    duration,
    highRisk,
    pauses,
    play,
    state.currentTopicId,
  ]);

  useEffect(() => {
    if (sessionState !== "running") return;
    tickRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
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

  useEffect(() => {
    const sub = AppState.addEventListener("change", (next: AppStateStatus) => {
      if (sessionStateRef.current !== "running") return;
      if (next === "background" || next === "inactive") {
        if (bgTimerRef.current) clearTimeout(bgTimerRef.current);
        bgTimerRef.current = setTimeout(() => {
          handleFail("Saliste de la app durante la sesión");
        }, state.settings.appBlurFailSec * 1000);
      } else if (next === "active") {
        if (bgTimerRef.current) {
          clearTimeout(bgTimerRef.current);
          bgTimerRef.current = null;
        }
        // Sync with native timer when returning to foreground
        if (state.settings.appBlockerEnabled && isNativeTimerRunning()) {
          const nativeRemaining = getNativeRemainingTime();
          if (nativeRemaining > 0) {
            setRemaining(nativeRemaining);
          } else if (nativeRemaining === 0 && remainingRef.current > 5) {
            // Timer finished while in background
            setTimeout(handleComplete, 0);
          }
        }
      }
    });
    return () => sub.remove();
  }, [handleFail, handleComplete, state.settings.appBlurFailSec, state.settings.appBlockerEnabled]);

  const start = async () => {
    if (highRisk) {
      const betValue = Math.max(1, parseInt(bet, 10) || 0);
      if (!spendCoins(betValue)) {
        setResultModal({ kind: "fail", reason: `Necesitas ${betValue} fichas para apostar` });
        return;
      }
    }
    setPauses(0);
    setRemaining(duration * 60);
    setSessionState("running");
    play("lever");
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // best-effort
    }
    // Persistent notification with countdown end-time + scheduled bell at finish
    if (state.settings.notificationsEnabled) {
      const granted = await requestNotificationPermission();
      if (granted) {
        startSessionNotification({
          durationMinutes: duration,
          topicName: selectedTopic?.name ?? null,
        });
      }
    }
    // Native blocker with timer duration
    if (state.settings.appBlockerEnabled) {
      startBlockingSession(duration * 60); // Pass duration in seconds
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
  const diff = selectedTopic?.difficulty ?? 2;
  const expectedBase = Math.floor(duration * state.settings.coinsPerMinute * DIFFICULTY_MULTIPLIER[diff]);

  return (
    <PaperBackground>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <SignTitle title="SALÓN DE ESTUDIO" subtitle="Pomodoro Vintage" />

          {/* Stats Row - Fichas + Racha */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>FICHAS</Text>
              <CoinBadge amount={state.coins} size={32} />
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>RACHA</Text>
              <View style={styles.streakRow}>
                <Image source={RACHA_ICON} style={styles.rachaImage} resizeMode="contain" />
                <Text style={styles.streakNum} testID="study-streak">{state.streak}</Text>
              </View>
              <Text style={styles.streakHint}>{state.streak === 1 ? "día" : "días"}</Text>
            </View>
          </View>

          {/* Idle: mascot with speech */}
          {sessionState === "idle" && (
            <View style={styles.mascotRow}>
              <Image source={MASCOT_ESTUDIO} style={styles.mascotImage} resizeMode="contain" />
              <View style={styles.speechBubble}>
                <Text style={styles.speechText}>
                  ¡Elige un tema y empieza a estudiar! Yo cuidaré el casino mientras tanto.
                </Text>
                <View style={styles.speechTail} />
              </View>
            </View>
          )}

          {/* Topic selector — Manual mode OR Roulette mode */}
          {!isLive && (
            <VintageCard style={styles.section}>
              <View style={styles.modeSwitchRow}>
                <Pressable
                  onPress={() => {
                    play("buttonTap"); // Sonido de tocar botón
                    setTopicMode("manual");
                  }}
                  style={[styles.modeBtn, topicMode === "manual" && styles.modeBtnActive]}
                  testID="mode-manual"
                >
                  <Text
                    style={[
                      styles.modeBtnText,
                      topicMode === "manual" && styles.modeBtnTextActive,
                    ]}
                  >
                    ✔️ Selección manual
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    play("buttonTap"); // Sonido de tocar botón
                    setTopicMode("roulette");
                  }}
                  style={[styles.modeBtn, topicMode === "roulette" && styles.modeBtnActive]}
                  testID="mode-roulette"
                >
                  <Text
                    style={[
                      styles.modeBtnText,
                      topicMode === "roulette" && styles.modeBtnTextActive,
                    ]}
                  >
                    🎲 Ruleta aleatoria
                  </Text>
                </Pressable>
              </View>

              {topicMode === "manual" ? (
                <>
                  <Text style={styles.sectionTitle}>📚 ¿Qué vas a estudiar?</Text>
                  <Text style={styles.sectionSub}>
                    Temas difíciles dan ×{DIFFICULTY_MULTIPLIER[3]} fichas, fáciles ×
                    {DIFFICULTY_MULTIPLIER[1]}.
                  </Text>
                  <View style={styles.topicGrid}>
                    {state.topics
                      .filter((t) => t.enabled)
                      .map((t) => {
                        const active = state.currentTopicId === t.id;
                        const mastery = (t.mastery ?? 1) as Mastery;
                        return (
                          <Pressable
                            key={t.id}
                            onPress={() => {
                              play("buttonTap"); // Sonido de tocar botón
                              setCurrentTopic(t.id);
                            }}
                            style={[styles.topicChip, active && styles.topicChipActive]}
                            testID={`select-topic-${t.id}`}
                          >
                            <View style={styles.topicMasteryIconContainer}>
                              <Image 
                                source={DOMINIO_ICONS[mastery]} 
                                style={styles.topicMasteryIcon} 
                                contentFit="contain"
                              />
                            </View>
                            <View style={styles.topicTextCol}>
                              <Text
                                style={[
                                  styles.topicChipText,
                                  active && styles.topicChipTextActive,
                                ]}
                                numberOfLines={1}
                              >
                                {t.name}
                              </Text>
                              <Text style={styles.topicChipDiff}>
                                {DIFFICULTY_EMOJI[t.difficulty]} {DOMINIO_LABELS[mastery]}
                              </Text>
                            </View>
                          </Pressable>
                        );
                      })}
                  </View>
                </>
              ) : (
                <RouletteSection
                  spinning={spinning}
                  selectedTopic={selectedTopic}
                  onSpin={() => {
                    const disabledCats = state.settings.disabledCategories ?? [];
                    const pool = state.topics.filter(
                      (t) =>
                        t.enabled && (!t.category || !disabledCats.includes(t.category)),
                    );
                    if (pool.length === 0) return;
                    const items = pool.map((t) => ({
                      topic: t,
                      priority: computeTopicPriority(t),
                    }));
                    const total = items.reduce((s, x) => s + x.priority, 0);
                    let r = Math.random() * total;
                    let chosen = items[0].topic;
                    for (const it of items) {
                      r -= it.priority;
                      if (r <= 0) {
                        chosen = it.topic;
                        break;
                      }
                    }
                    setSpinning(true);
                    playFor("ruletaSpin", 3000); // Sonido sincronizado con el giro (3s)
                    try {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    } catch {
                      // ignore
                    }
                    const rotations = 4 + Math.floor(Math.random() * 3);
                    const offset = Math.floor(Math.random() * 360);
                    const target = wheelRotation.value + rotations * 360 + offset;
                    const finish = () => {
                      setCurrentTopic(chosen.id);
                      setSpinning(false);
                      play("bell");
                      try {
                        Haptics.notificationAsync(
                          Haptics.NotificationFeedbackType.Success,
                        );
                      } catch {
                        // ignore
                      }
                    };
                    wheelRotation.value = withTiming(
                      target,
                      { duration: 3000, easing: Easing.out(Easing.cubic) },
                      (finished) => {
                        if (finished) runOnJS(finish)();
                      },
                    );
                  }}
                  wheelAnim={wheelAnim}
                />
              )}

              {selectedTopic ? (
                <Text style={styles.diffRow}>
                  {DIFFICULTY_EMOJI[diff]} {DIFFICULTY_LABEL[diff]} · multiplicador ×
                  {DIFFICULTY_MULTIPLIER[diff].toFixed(1)} · estimado:{" "}
                  <Text style={styles.expectedCoins}>+{expectedBase}🪙</Text>
                </Text>
              ) : (
                <Text style={styles.diffRow}>
                  Sin tema seleccionado · multiplicador ×
                  {DIFFICULTY_MULTIPLIER[2].toFixed(1)} (medio)
                </Text>
              )}
            </VintageCard>
          )}

          {/* Timer card */}
          <VintageCard tint={colors.paperHighlight} style={styles.timerCard}>
            {isLive && (
              <View style={{ width: "100%", marginBottom: 4 }}>
                <MarqueeLights count={14} size={7} speed={1100} />
              </View>
            )}
            <Text style={styles.timerLabel}>TIEMPO RESTANTE</Text>
            <Text
              style={[styles.timer, sessionState === "failed" && { color: colors.vintageRed }]}
              testID="pomodoro-timer"
            >
              {formatMMSS(remaining)}
            </Text>
            {!!selectedTopic && isLive && (
              <Text style={styles.runningTopic}>
                {DIFFICULTY_EMOJI[diff]} {selectedTopic.name}
              </Text>
            )}
            <View style={styles.gaugeOuter}>
              <View style={styles.gaugeTrack}>
                <View style={[styles.gaugeFill, { width: `${Math.max(2, Math.min(100, progress * 100))}%` }]} />
              </View>
              <View style={styles.gaugeShine} pointerEvents="none" />
            </View>
            <View style={styles.metaRow}>
              <View style={styles.metaBox}>
                <Text style={styles.metaValue}>{pauses}</Text>
                <Text style={styles.metaLabel}>Pausas</Text>
              </View>
              <View style={styles.metaBox}>
                <Text style={styles.metaValue}>×{DIFFICULTY_MULTIPLIER[diff].toFixed(1)}</Text>
                <Text style={styles.metaLabel}>Dificultad</Text>
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
              <Text style={styles.sectionTitle}>⏱️ Duración</Text>
              <View style={styles.durationRow}>
                {[15, 25, 50, 90].map((d) => (
                  <Pressable
                    key={d}
                    onPress={() => setDuration(d)}
                    style={[styles.durChip, duration === d && styles.durChipActive]}
                    testID={`duration-${d}`}
                  >
                    <Text
                      style={[styles.durChipText, duration === d && styles.durChipTextActive]}
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
            <VintageCard
              style={styles.section}
              tint={highRisk ? colors.vintageRed : colors.paperSecondary}
            >
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
                Apuesta fichas. Gana {state.settings.highRiskMultiplier}× si completas. Pierdes
                todo si fallas.
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

          {/* Active integrations indicator */}
          {!isLive && (
            <VintageCard style={styles.section} tint={colors.paperHighlight}>
              <View style={styles.intRow}>
                <Text style={styles.intIcon}>🔔</Text>
                <Text style={styles.intText}>
                  {state.settings.notificationsEnabled
                    ? "Notificación persistente activada"
                    : "Notificaciones desactivadas"}
                </Text>
              </View>
              <View style={styles.intRow}>
                <Text style={styles.intIcon}>📵</Text>
                <Text style={styles.intText}>
                  {!isBlockerAvailable
                    ? "Bloqueador de apps: requiere build nativo"
                    : state.settings.appBlockerEnabled
                      ? `Bloqueando ${
                          state.settings.blockerStrictMode
                            ? `whitelist (${state.settings.allowedApps.length})`
                            : `${state.settings.blockedApps.length} apps`
                        }`
                      : "Bloqueador apagado"}
                </Text>
              </View>
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

          {!isLive && (
            <Text style={styles.warning}>
              ⚠️ Si abandonas o sales de la app durante más de {state.settings.appBlurFailSec}s,
              la sesión falla y el casino cierra {state.settings.casinoClosedMin} min.
            </Text>
          )}
        </ScrollView>
      </SafeAreaView>

      <CoinShower active={showCelebration} count={26} variant="coins" />

      <Modal visible={!!resultModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          {resultModal?.kind === "win" && (
            <View style={styles.sunburstLayer} pointerEvents="none">
              <SunburstRays size={520} rayCount={20} speed={5500} />
            </View>
          )}
          <VintageCard
            tint={resultModal?.kind === "win" ? colors.antiqueGold : colors.vintageRedDark}
            style={styles.modalCard}
          >
            <CasinoMascot
              state={resultModal?.kind === "win" ? "cheer" : "sad"}
              size={130}
            />
            {resultModal?.kind === "win" ? (
              <>
                <Text style={styles.modalTitle}>¡JACKPOT DE ESTUDIO!</Text>
                <Text style={styles.modalBody}>+{resultModal.coinsEarned} fichas 🪙</Text>
                <Text style={styles.modalSubBody}>
                  {DIFFICULTY_EMOJI[diff]} {resultModal.difficultyLabel} ×
                  {resultModal.multiplier.toFixed(1)} · Racha {resultModal.newStreak}🔥
                </Text>
                <Text style={styles.modalHint}>
                  Apuesta tus fichas en el casino para ganar premios reales.
                </Text>
              </>
            ) : (
              <>
                <Text style={[styles.modalTitle, { color: colors.cream }]}>CASINO CERRADO</Text>
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

void DIFFICULTY_LABEL;

function RouletteSection({
  spinning,
  selectedTopic,
  onSpin,
  wheelAnim,
}: {
  spinning: boolean;
  selectedTopic: { id: string; name: string; difficulty: number } | null | undefined;
  onSpin: () => void;
  wheelAnim: any;
}) {
  return (
    <View style={styles.rouletteWrap}>
      <Text style={styles.sectionTitle}>🎲 Ruleta aleatoria</Text>
      <Text style={styles.sectionSub}>
        La rueda inteligente prioriza temas más importantes, menos dominados o sin repasar hace
        tiempo.
      </Text>
      <View style={styles.wheelHolder}>
        <Text style={styles.wheelArrow}>▼</Text>
        <Animated.View style={[styles.wheelInner, wheelAnim]}>
          <Image source={WHEEL_IMG} style={styles.wheelImg} />
        </Animated.View>
      </View>
      <VintageButton
        label={spinning ? "GIRANDO..." : selectedTopic ? "GIRAR DE NUEVO" : "¡GIRAR RULETA!"}
        variant="purple"
        icon="random"
        onPress={() => !spinning && onSpin()}
        disabled={spinning}
        testID="spin-roulette-button"
        style={{ marginTop: 6 }}
      />
      {selectedTopic && !spinning && (
        <View style={styles.spinResult}>
          <Text style={styles.spinResultLabel}>El destino eligió:</Text>
          <Text style={styles.spinResultName} testID="roulette-result">
            {selectedTopic.name}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 32, gap: 14 },
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
    fontSize: 26, 
    color: colors.antiqueGold,
    textShadowColor: colors.bgDark,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  streakHint: { 
    fontFamily: fonts.body, 
    fontSize: 10, 
    color: colors.cream, 
    marginTop: 2 
  },
  mascotRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  mascotImage: {
    width: 110,
    height: 130,
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
    lineHeight: 18,
  },
  modeSwitchRow: {
    flexDirection: "row",
    gap: 4,
    ...inkBorder(2),
    borderColor: colors.brassDark,
    borderRadius: radii.pill,
    overflow: "hidden",
    backgroundColor: colors.bgPanelLight,
    marginBottom: 12,
  },
  modeBtn: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  modeBtnActive: { backgroundColor: colors.vintageRed },
  modeBtnText: {
    fontFamily: fonts.subheading,
    color: colors.cream,
    fontSize: 12,
    letterSpacing: 1,
  },
  modeBtnTextActive: { color: colors.paperHighlight },
  rouletteWrap: { alignItems: "center" },
  wheelHolder: {
    width: 220,
    height: 220,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
  },
  wheelArrow: {
    position: "absolute",
    top: -2,
    fontSize: 26,
    color: colors.vintageRed,
    zIndex: 5,
    textShadowColor: colors.bgDark,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  wheelInner: { width: 220, height: 220 },
  wheelImg: { width: 220, height: 220, resizeMode: "contain" },
  spinResult: {
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    ...inkBorder(2),
    borderColor: colors.antiqueGold,
    borderRadius: radii.md,
    backgroundColor: colors.bgPanelLight,
    alignItems: "center",
  },
  spinResultLabel: {
    fontFamily: fonts.subheading,
    fontSize: 11,
    color: colors.antiqueGold,
    letterSpacing: 3,
  },
  spinResultName: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: colors.paperHighlight,
    marginTop: 4,
    letterSpacing: 1,
  },
  speechTail: {
    position: "absolute",
    left: -10,
    top: "50%",
    width: 0,
    height: 0,
    borderTopWidth: 10,
    borderBottomWidth: 10,
    borderRightWidth: 14,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderRightColor: colors.ink,
  },
  timerCard: { alignItems: "center", paddingVertical: 16 },
  timerLabel: {
    fontFamily: fonts.subheading,
    fontSize: 12,
    color: colors.inkSoft,
    letterSpacing: 3,
  },
  timer: {
    fontFamily: fonts.numbers,
    fontSize: 70,
    color: colors.ink,
    letterSpacing: 4,
    marginVertical: 6,
    textShadowColor: colors.antiqueGold,
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 0,
  },
  runningTopic: {
    fontFamily: fonts.subheading,
    color: colors.vintageRed,
    fontSize: 13,
    letterSpacing: 2,
    marginBottom: 6,
  },
  gaugeOuter: {
    width: "100%",
    height: 24,
    backgroundColor: colors.bgDark,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: colors.ink,
    overflow: "hidden",
    marginTop: 10,
    marginBottom: 4,
  },
  gaugeTrack: {
    flex: 1,
    backgroundColor: colors.paperPrimary,
    borderRadius: 9,
    overflow: "hidden",
    margin: 2,
  },
  gaugeFill: { 
    height: "100%",
    backgroundColor: colors.vintageRed,
    borderRadius: 7,
    minWidth: 4,
  },
  gaugeShine: {
    position: "absolute",
    top: 5,
    left: 6,
    right: 6,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.35)",
    borderRadius: 2,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 10,
  },
  metaBox: { alignItems: "center" },
  metaValue: { fontFamily: fonts.numbers, fontSize: 16, color: colors.vintageRed },
  metaLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.inkSoft },
  section: { padding: 14 },
  sectionTitle: {
    fontFamily: fonts.heading,
    fontSize: 16,
    color: colors.ink,
    marginBottom: 6,
    letterSpacing: 1,
  },
  sectionSub: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkSoft,
    fontStyle: "italic",
    marginBottom: 10,
  },
  topicGrid: { flexDirection: "column", gap: 8 },
  topicChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    ...inkBorder(2),
    borderRadius: radii.md,
    backgroundColor: colors.paperHighlight,
    width: "100%",
  },
  topicChipActive: { 
    backgroundColor: colors.antiqueGold,
    borderColor: colors.brassDark,
  },
  topicMasteryIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: colors.paperHighlight,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  topicMasteryIcon: {
    width: 28,
    height: 28,
  },
  topicTextCol: {
    flex: 1,
    gap: 2,
  },
  topicChipDiff: { 
    fontSize: 10, 
    fontFamily: fonts.body,
    color: colors.inkSoft,
  },
  topicChipText: {
    fontFamily: fonts.subheading,
    color: colors.ink,
    fontSize: 14,
    letterSpacing: 0.5,
  },
  topicChipTextActive: { color: colors.ink },
  diffRow: {
    fontFamily: fonts.body,
    color: colors.inkSoft,
    fontSize: 12,
    marginTop: 10,
    textAlign: "center",
  },
  expectedCoins: { color: colors.vintageRed, fontFamily: fonts.numbers, fontSize: 14 },
  durationRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  durChip: {
    ...inkBorder(2),
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.paperHighlight,
  },
  durChipActive: { backgroundColor: colors.vintageRed },
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
  riskHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  riskTitle: {
    fontFamily: fonts.heading,
    fontSize: 16,
    color: colors.ink,
    letterSpacing: 1,
    flex: 1,
  },
  riskBody: { fontFamily: fonts.body, color: colors.inkSoft, marginTop: 6 },
  betRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 },
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
  intRow: { flexDirection: "row", gap: 10, alignItems: "center", paddingVertical: 4 },
  intIcon: { fontSize: 18 },
  intText: { fontFamily: fonts.body, color: colors.ink, fontSize: 13, flex: 1 },
  actions: { flexDirection: "row", gap: 12 },
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
    backgroundColor: "rgba(44,30,22,0.78)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    padding: 20,
    alignItems: "center",
    minWidth: 300,
    ...cartoonShadow(6),
  },
  modalTitle: {
    fontFamily: fonts.heading,
    fontSize: 22,
    color: colors.ink,
    letterSpacing: 2,
    textAlign: "center",
    marginTop: 6,
  },
  modalBody: {
    fontFamily: fonts.subheading,
    fontSize: 18,
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
  modalHint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.ink,
    fontStyle: "italic",
    marginTop: 8,
    textAlign: "center",
    opacity: 0.85,
  },
  sunburstLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
});
