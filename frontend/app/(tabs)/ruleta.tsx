// TOPIC ROULETTE — smart wheel that prioritizes topics by importance, mastery & freshness.
// Supports category filtering, manual mastery editing, and a study history view.

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";

import { CasinoClosedBanner } from "@/src/components/CasinoClosedBanner";
import { CasinoMascot } from "@/src/components/CasinoMascot";
import { CoinBadge } from "@/src/components/CoinBadge";
import { MarqueeLights } from "@/src/components/MarqueeLights";
import { PaperBackground } from "@/src/components/PaperBackground";
import { SignTitle } from "@/src/components/SignTitle";
import { VintageButton } from "@/src/components/VintageButton";
import { useSounds } from "@/src/hooks/use-sounds";
import { useGameStore } from "@/src/store/game-store";
import {
  Mastery,
  MASTERY_COLOR,
  MASTERY_EMOJI,
  MASTERY_LABEL,
  Topic,
} from "@/src/store/types";
import { cartoonShadow, colors, fonts, goldBorder, inkBorder, radii } from "@/src/theme";

const WHEEL = require("../../assets/images/roulette-wheel.png");

function formatLastStudied(ts?: number): string {
  if (!ts) return "Nunca";
  const min = Math.floor((Date.now() - ts) / 60000);
  if (min < 1) return "Hace un instante";
  if (min < 60) return `Hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Hace ${h} h`;
  const d = Math.floor(h / 24);
  return `Hace ${d}d`;
}

export default function RuletaScreen() {
  const {
    state,
    spendCoins,
    markTopicStudied,
    toggleTopic,
    toggleCategory,
    setTopicMastery,
    computeTopicPriority,
    isCasinoClosed,
    casinoClosedRemainingSec,
  } = useGameStore();
  const { play } = useSounds();

  const rotation = useSharedValue(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [section, setSection] = useState<"ruleta" | "historial">("ruleta");
  const [, force] = useState(0);

  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const closed = isCasinoClosed();
  const remaining = casinoClosedRemainingSec();

  // Unique categories from topics
  const categories = useMemo(() => {
    const set = new Set<string>();
    state.topics.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set).sort();
  }, [state.topics]);

  const disabledCats = state.settings.disabledCategories ?? [];

  // Roulette pool: enabled topic + category enabled
  const pool = useMemo(
    () =>
      state.topics.filter(
        (t) => t.enabled && (!t.category || !disabledCats.includes(t.category)),
      ),
    [state.topics, disabledCats],
  );

  // Compute smart priority for each topic + total
  const poolWithPriority = useMemo(() => {
    const items = pool.map((t) => ({ topic: t, priority: computeTopicPriority(t) }));
    const total = items.reduce((s, x) => s + x.priority, 0);
    return { items, total };
  }, [pool, computeTopicPriority]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const showResult = (name: string) => {
    setResult(name);
    setSpinning(false);
    play("bell");
    setTimeout(() => play("win"), 250);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // ignore
    }
  };

  const spin = () => {
    if (spinning) return;
    if (closed) return;
    if (pool.length === 0) return;
    if (!spendCoins(state.settings.rouletteSpinCost)) return;

    // Smart weighted random — pick based on computed priority
    let r = Math.random() * poolWithPriority.total;
    let chosen = poolWithPriority.items[0]?.topic ?? pool[0];
    for (const item of poolWithPriority.items) {
      r -= item.priority;
      if (r <= 0) {
        chosen = item.topic;
        break;
      }
    }

    setSpinning(true);
    setResult(null);
    play("lever");
    setTimeout(() => play("spinning", { volume: 0.5 }), 200);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {
      // ignore
    }
    const rotations = 4 + Math.floor(Math.random() * 3);
    const offset = Math.floor(Math.random() * 360);
    const target = rotation.value + rotations * 360 + offset;
    rotation.value = withTiming(
      target,
      { duration: 3500, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(showResult)(chosen.name);
      },
    );
    markTopicStudied(chosen.id);
  };

  // Sorted history (recent first), only studied ones
  const history = useMemo(() => {
    return [...state.topics]
      .filter((t) => t.reviewCount && t.reviewCount > 0)
      .sort((a, b) => (b.lastStudiedAt ?? 0) - (a.lastStudiedAt ?? 0));
  }, [state.topics]);

  return (
    <PaperBackground>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <SignTitle title="RULETA DE TEMAS" subtitle="Inteligencia + suerte" />

          <View style={styles.topRow}>
            <CoinBadge amount={state.coins} size={28} />
            <View style={styles.tabRow}>
              <Pressable
                onPress={() => {
                  play("click");
                  setSection("ruleta");
                }}
                style={[styles.tabBtn, section === "ruleta" && styles.tabBtnActive]}
                testID="tab-roulette"
              >
                <Text style={[styles.tabText, section === "ruleta" && styles.tabTextActive]}>
                  🎯 Ruleta
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  play("click");
                  setSection("historial");
                }}
                style={[styles.tabBtn, section === "historial" && styles.tabBtnActive]}
                testID="tab-history"
              >
                <Text style={[styles.tabText, section === "historial" && styles.tabTextActive]}>
                  📜 Historial
                </Text>
              </Pressable>
            </View>
          </View>

          {closed && <CasinoClosedBanner remainingSec={remaining} />}

          {section === "ruleta" ? (
            <>
              {/* Wheel */}
              <View style={styles.wheelWrap}>
                <View style={styles.pointer}>
                  <Text style={styles.pointerArrow}>▼</Text>
                </View>
                <View style={styles.wheelLightsTop}>
                  <MarqueeLights count={14} size={8} speed={1200} />
                </View>
                <Animated.View style={[styles.wheelImageWrap, animStyle]} testID="topic-roulette-wheel">
                  <Image source={WHEEL} style={styles.wheelImage} />
                </Animated.View>
              </View>

              <VintageButton
                label={
                  spinning
                    ? "GIRANDO..."
                    : closed
                      ? "CASINO CERRADO"
                      : pool.length === 0
                        ? "SIN TEMAS"
                        : "¡GIRAR RULETA!"
                }
                variant="red"
                size="lg"
                onPress={spin}
                icon="random"
                disabled={spinning || closed || pool.length === 0}
                testID="spin-roulette-button"
              />

              <Text style={styles.poolInfo}>
                🎯 {pool.length} temas en el sorteo · Costo {state.settings.rouletteSpinCost} 🪙
              </Text>

              {/* Categories */}
              {categories.length > 0 && (
                <Card title="📁 Categorías">
                  <Text style={styles.helpText}>
                    Activa/desactiva categorías enteras para la ruleta.
                  </Text>
                  <View style={styles.chipGrid}>
                    {categories.map((cat) => {
                      const disabled = disabledCats.includes(cat);
                      const count = state.topics.filter((t) => t.category === cat).length;
                      return (
                        <Pressable
                          key={cat}
                          onPress={() => {
                            play("click");
                            toggleCategory(cat);
                          }}
                          style={[styles.catChip, !disabled && styles.catChipActive]}
                          testID={`category-${cat}`}
                        >
                          <Text style={[styles.catChipText, !disabled && styles.catChipTextActive]}>
                            {disabled ? "○" : "●"} {cat} · {count}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </Card>
              )}

              {/* Topics with priority */}
              <Card title="📚 Temas y prioridad inteligente">
                <Text style={styles.helpText}>
                  Importancia × (1 − dominio) × tiempo desde último repaso
                </Text>
                {poolWithPriority.items
                  .slice()
                  .sort((a, b) => b.priority - a.priority)
                  .map((item) => {
                    const t = item.topic;
                    const pct =
                      poolWithPriority.total > 0
                        ? (item.priority / poolWithPriority.total) * 100
                        : 0;
                    return (
                      <TopicRow
                        key={t.id}
                        topic={t}
                        pct={pct}
                        onToggle={() => toggleTopic(t.id)}
                        onMastery={(m) => setTopicMastery(t.id, m)}
                      />
                    );
                  })}
                {/* Show disabled topics */}
                {state.topics
                  .filter((t) => !t.enabled || (t.category && disabledCats.includes(t.category)))
                  .map((t) => (
                    <Pressable
                      key={t.id}
                      onPress={() => toggleTopic(t.id)}
                      style={[styles.topicRow, { opacity: 0.45 }]}
                      testID={`topic-${t.id}`}
                    >
                      <Text style={styles.topicName}>○ {t.name}</Text>
                      <Text style={styles.helpText}>Excluido</Text>
                    </Pressable>
                  ))}
              </Card>
            </>
          ) : (
            <HistorySection
              history={history}
              all={state.topics}
              onMastery={setTopicMastery}
            />
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Result modal */}
      <Modal visible={!!result} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <CasinoMascot state="cheer" size={130} />
            <Text style={styles.modalEyebrow}>EL DESTINO ELIGIÓ</Text>
            <Text style={styles.modalTitle} testID="roulette-result">
              {result}
            </Text>
            <Text style={styles.modalBody}>¡A estudiar este tema!</Text>
            <VintageButton
              label="ESTUDIAR AHORA"
              variant="red"
              onPress={() => {
                play("click");
                setResult(null);
              }}
              style={{ marginTop: 14, minWidth: 220 }}
              testID="roulette-close"
            />
          </View>
        </View>
      </Modal>
    </PaperBackground>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <View style={styles.cardContent}>{children}</View>
    </View>
  );
}

function TopicRow({
  topic,
  pct,
  onToggle,
  onMastery,
}: {
  topic: Topic;
  pct: number;
  onToggle: () => void;
  onMastery: (m: Mastery) => void;
}) {
  const mastery = (topic.mastery ?? 1) as Mastery;
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.topicRow}>
      <Pressable
        onPress={onToggle}
        style={styles.topicCheckbox}
        testID={`topic-${topic.id}`}
      >
        <Text style={styles.topicCheck}>{topic.enabled ? "✓" : ""}</Text>
      </Pressable>
      <Pressable style={styles.topicMain} onPress={() => setOpen((o) => !o)}>
        <View style={styles.topicTopLine}>
          <Text style={styles.topicName} numberOfLines={1}>
            {topic.name}
          </Text>
          <Text style={styles.topicPct}>{pct.toFixed(0)}%</Text>
        </View>
        <View style={styles.topicMetaLine}>
          <Text style={[styles.topicMastery, { color: MASTERY_COLOR[mastery] }]}>
            {MASTERY_EMOJI[mastery]} {MASTERY_LABEL[mastery]}
          </Text>
          <Text style={styles.topicMeta}>· {formatLastStudied(topic.lastStudiedAt)}</Text>
          {topic.reviewCount ? (
            <Text style={styles.topicMeta}>· ×{topic.reviewCount}</Text>
          ) : null}
        </View>
        <View style={styles.barOuter}>
          <View style={[styles.barFill, { width: `${Math.min(100, pct)}%` }]} />
        </View>
        {open && (
          <View style={styles.masteryRow}>
            <Text style={styles.helpText}>Dominio:</Text>
            {([0, 1, 2, 3] as Mastery[]).map((m) => (
              <Pressable
                key={m}
                onPress={() => onMastery(m)}
                style={[
                  styles.masteryChip,
                  mastery === m && { backgroundColor: MASTERY_COLOR[m] },
                ]}
                testID={`mastery-${topic.id}-${m}`}
              >
                <Text
                  style={[
                    styles.masteryChipText,
                    mastery === m && { color: colors.paperHighlight },
                  ]}
                >
                  {MASTERY_EMOJI[m]} {MASTERY_LABEL[m]}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </Pressable>
    </View>
  );
}

function HistorySection({
  history,
  all,
  onMastery,
}: {
  history: Topic[];
  all: Topic[];
  onMastery: (id: string, m: Mastery) => void;
}) {
  const neverStudied = all.filter((t) => !t.reviewCount);

  return (
    <>
      <Card title="📜 Historial de repasos">
        {history.length === 0 ? (
          <Text style={styles.empty}>
            Aún no has estudiado ningún tema. Empieza una sesión Pomodoro para registrar tu primer
            repaso.
          </Text>
        ) : (
          history.map((t) => (
            <HistoryRow key={t.id} topic={t} onMastery={(m) => onMastery(t.id, m)} />
          ))
        )}
      </Card>

      {neverStudied.length > 0 && (
        <Card title="🆕 Aún sin estudiar">
          {neverStudied.map((t) => (
            <View key={t.id} style={styles.historyRow}>
              <Text style={styles.topicName}>{t.name}</Text>
              <Text style={styles.helpText}>{t.category ?? "—"}</Text>
            </View>
          ))}
        </Card>
      )}
    </>
  );
}

function HistoryRow({ topic, onMastery }: { topic: Topic; onMastery: (m: Mastery) => void }) {
  const mastery = (topic.mastery ?? 1) as Mastery;
  return (
    <View style={styles.historyRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.topicName}>{topic.name}</Text>
        <Text style={styles.helpText}>
          {topic.category ?? "—"} · {formatLastStudied(topic.lastStudiedAt)} · ×
          {topic.reviewCount ?? 0} repasos
        </Text>
        <View style={styles.masteryRowCompact}>
          {([0, 1, 2, 3] as Mastery[]).map((m) => (
            <Pressable
              key={m}
              onPress={() => onMastery(m)}
              style={[
                styles.masteryChipCompact,
                mastery === m && { backgroundColor: MASTERY_COLOR[m] },
              ]}
              testID={`history-mastery-${topic.id}-${m}`}
            >
              <Text style={styles.masteryChipEmoji}>{MASTERY_EMOJI[m]}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 32, gap: 14 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
    flexWrap: "wrap",
    gap: 8,
  },
  tabRow: {
    flexDirection: "row",
    gap: 4,
    ...goldBorder(2),
    borderRadius: radii.pill,
    overflow: "hidden",
    backgroundColor: colors.bgPanel,
  },
  tabBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  tabBtnActive: { backgroundColor: colors.vintageRed },
  tabText: {
    fontFamily: fonts.subheading,
    fontSize: 11,
    color: colors.cream,
    letterSpacing: 1,
  },
  tabTextActive: { color: colors.paperHighlight },
  wheelWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    position: "relative",
  },
  pointer: { position: "absolute", top: -2, zIndex: 10, alignItems: "center" },
  pointerArrow: {
    fontSize: 30,
    color: colors.vintageRed,
    textShadowColor: colors.bgDark,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  wheelLightsTop: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    paddingHorizontal: 30,
  },
  wheelImageWrap: { width: 260, height: 260, ...cartoonShadow(5) },
  wheelImage: { width: 260, height: 260, resizeMode: "contain" },
  poolInfo: {
    fontFamily: fonts.body,
    color: colors.cream,
    textAlign: "center",
    fontSize: 13,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.bgPanel,
    ...goldBorder(2),
    borderRadius: radii.md,
    overflow: "hidden",
    ...cartoonShadow(3),
  },
  cardHeader: {
    backgroundColor: colors.bgPanelLight,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: colors.antiqueGold,
  },
  cardTitle: {
    fontFamily: fonts.heading,
    color: colors.antiqueGold,
    fontSize: 15,
    letterSpacing: 2,
  },
  cardContent: { padding: 12 },
  helpText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: "#A89A7C",
    fontStyle: "italic",
  },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    ...inkBorder(2),
    borderColor: colors.brassDark,
    borderRadius: radii.pill,
    backgroundColor: colors.bgPanelLight,
  },
  catChipActive: { backgroundColor: colors.vintageGreen, borderColor: colors.antiqueGold },
  catChipText: { fontFamily: fonts.subheading, color: "#A89A7C", fontSize: 12, letterSpacing: 1 },
  catChipTextActive: { color: colors.paperHighlight },
  topicRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(201,154,60,0.15)",
  },
  topicCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    ...goldBorder(2),
    backgroundColor: colors.bgDark,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  topicCheck: { color: colors.antiqueGold, fontFamily: fonts.heading, fontSize: 14 },
  topicMain: { flex: 1 },
  topicTopLine: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  topicName: {
    fontFamily: fonts.subheading,
    color: colors.cream,
    fontSize: 15,
    letterSpacing: 1,
    flex: 1,
  },
  topicPct: { fontFamily: fonts.numbers, color: colors.vintageRed, fontSize: 14 },
  topicMetaLine: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2, flexWrap: "wrap" },
  topicMastery: { fontFamily: fonts.subheading, fontSize: 11, letterSpacing: 1 },
  topicMeta: { fontFamily: fonts.body, fontSize: 11, color: "#A89A7C" },
  barOuter: {
    height: 6,
    backgroundColor: colors.bgDark,
    borderRadius: 3,
    marginTop: 4,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.brassDark,
  },
  barFill: {
    height: "100%",
    backgroundColor: colors.vintageRed,
  },
  masteryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    flexWrap: "wrap",
  },
  masteryChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill,
    ...inkBorder(1),
    borderColor: colors.brassDark,
    backgroundColor: colors.bgPanelLight,
  },
  masteryChipText: { fontFamily: fonts.body, color: colors.cream, fontSize: 11 },
  masteryRowCompact: { flexDirection: "row", gap: 6, marginTop: 8 },
  masteryChipCompact: {
    width: 30,
    height: 30,
    borderRadius: 15,
    ...goldBorder(2),
    backgroundColor: colors.bgPanelLight,
    alignItems: "center",
    justifyContent: "center",
  },
  masteryChipEmoji: { fontSize: 14 },
  historyRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(201,154,60,0.15)",
  },
  empty: {
    fontFamily: fonts.body,
    color: "#A89A7C",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 14,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    padding: 22,
    alignItems: "center",
    minWidth: 280,
    backgroundColor: colors.antiqueGold,
    ...goldBorder(3),
    borderColor: colors.bgDark,
    borderRadius: radii.lg,
    ...cartoonShadow(6),
  },
  modalEyebrow: {
    fontFamily: fonts.subheading,
    color: colors.vintageRed,
    letterSpacing: 4,
    fontSize: 12,
    marginTop: 4,
  },
  modalTitle: {
    fontFamily: fonts.heading,
    fontSize: 26,
    color: colors.bgDark,
    marginTop: 6,
    letterSpacing: 1,
    textAlign: "center",
  },
  modalBody: {
    fontFamily: fonts.body,
    color: colors.bgDark,
    marginTop: 4,
    fontStyle: "italic",
  },
});
