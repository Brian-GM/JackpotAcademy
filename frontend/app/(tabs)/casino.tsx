// CASINO — vintage slot machine with weighted reels, near-miss psychology, and jackpot reveals.

import { useCallback, useEffect, useRef, useState } from "react";
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
  withSequence,
  withSpring,
  withTiming,
  withRepeat,
} from "react-native-reanimated";

import { CasinoClosedBanner } from "@/src/components/CasinoClosedBanner";
import { CoinBadge } from "@/src/components/CoinBadge";
import { PaperBackground } from "@/src/components/PaperBackground";
import { SignTitle } from "@/src/components/SignTitle";
import { VintageButton } from "@/src/components/VintageButton";
import { VintageCard } from "@/src/components/VintageCard";
import { useGameStore } from "@/src/store/game-store";
import { cartoonShadow, colors, fonts, inkBorder, radii } from "@/src/theme";

type SymbolDef = { symbol: string; weight: number; payout: number; name: string };

const SYMBOLS: SymbolDef[] = [
  { symbol: "🍒", weight: 30, payout: 5, name: "CEREZA" },
  { symbol: "🍋", weight: 25, payout: 7, name: "LIMÓN" },
  { symbol: "🔔", weight: 20, payout: 10, name: "CAMPANA" },
  { symbol: "🍀", weight: 15, payout: 15, name: "TRÉBOL" },
  { symbol: "⭐", weight: 7, payout: 25, name: "ESTRELLA" },
  { symbol: "💎", weight: 2, payout: 50, name: "DIAMANTE" },
  { symbol: "7️⃣", weight: 1, payout: 100, name: "JACKPOT" },
];

const TOTAL_WEIGHT = SYMBOLS.reduce((s, x) => s + x.weight, 0);

function pickWeighted(): SymbolDef {
  let r = Math.random() * TOTAL_WEIGHT;
  for (const s of SYMBOLS) {
    r -= s.weight;
    if (r <= 0) return s;
  }
  return SYMBOLS[0];
}

function nearMiss(symbol: SymbolDef): SymbolDef {
  // Return adjacent symbol by rarity for that "almost!" feel
  const idx = SYMBOLS.findIndex((s) => s.symbol === symbol.symbol);
  return SYMBOLS[Math.max(0, idx - 1)];
}

type Reel = { current: string; spinning: boolean };

function Reel({ symbol, spinning }: { symbol: string; spinning: boolean }) {
  const [displayed, setDisplayed] = useState(symbol);
  const rotate = useSharedValue(0);

  useEffect(() => {
    if (spinning) {
      // cycle random symbols while spinning
      const id = setInterval(() => {
        setDisplayed(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].symbol);
      }, 80);
      rotate.value = withRepeat(withTiming(360, { duration: 600 }), -1, false);
      return () => {
        clearInterval(id);
        rotate.value = 0;
      };
    }
    setDisplayed(symbol);
    rotate.value = withSpring(0, { damping: 6, stiffness: 200 });
  }, [spinning, symbol, rotate]);

  const animStyle = useAnimatedStyle(() => ({
    transform: spinning ? [{ translateY: (rotate.value % 60) - 30 }] : [{ translateY: 0 }],
  }));

  return (
    <View style={styles.reelOuter}>
      <View style={styles.reelInner}>
        <Animated.Text style={[styles.symbol, animStyle]}>{displayed}</Animated.Text>
      </View>
    </View>
  );
}

export default function CasinoScreen() {
  const { state, spendCoins, addCoins, recordSpin, isCasinoClosed, casinoClosedRemainingSec } =
    useGameStore();
  const [reels, setReels] = useState<string[]>([
    SYMBOLS[0].symbol,
    SYMBOLS[0].symbol,
    SYMBOLS[0].symbol,
  ]);
  const [spinning, setSpinning] = useState<boolean[]>([false, false, false]);
  const [lastResult, setLastResult] = useState<{
    win: number;
    jackpot: boolean;
    matches: number;
    name?: string;
  } | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [, force] = useState(0);
  const spinningRef = useRef(false);

  // re-render every second to update banner timer
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const closed = isCasinoClosed();
  const remaining = casinoClosedRemainingSec();

  const computeOutcome = useCallback(() => {
    // Decide if jackpot occurs at all
    const jackpotProb = state.settings.jackpotProbability;
    const isJackpot = Math.random() < jackpotProb;
    if (isJackpot) {
      const j = SYMBOLS[SYMBOLS.length - 1];
      return { reels: [j.symbol, j.symbol, j.symbol], match: j, count: 3 };
    }

    // Roll for normal/triple match (rare for big symbols)
    const isTriple = Math.random() < 0.05;
    if (isTriple) {
      const winner = pickWeighted();
      // avoid jackpot from this path
      const safeWinner = winner.symbol === "7️⃣" ? SYMBOLS[5] : winner;
      return {
        reels: [safeWinner.symbol, safeWinner.symbol, safeWinner.symbol],
        match: safeWinner,
        count: 3,
      };
    }

    // Near-miss occasionally for tension (two matching with 3rd close)
    const nearMissRoll = Math.random() < 0.18;
    if (nearMissRoll) {
      const winner = pickWeighted();
      const adj = nearMiss(winner);
      return {
        reels: [winner.symbol, winner.symbol, adj.symbol],
        match: winner,
        count: 2,
      };
    }

    // Standard: 3 random independent symbols
    const r1 = pickWeighted().symbol;
    const r2 = pickWeighted().symbol;
    const r3 = pickWeighted().symbol;
    let count = 1;
    if (r1 === r2 && r2 === r3) count = 3;
    else if (r1 === r2 || r2 === r3) count = 2;
    return {
      reels: [r1, r2, r3],
      match: SYMBOLS.find((s) => s.symbol === r2) ?? SYMBOLS[0],
      count,
    };
  }, [state.settings.jackpotProbability]);

  const spin = useCallback(() => {
    if (spinningRef.current) return;
    if (closed) return;
    const cost = state.settings.slotSpinCost;
    if (!spendCoins(cost)) return;
    spinningRef.current = true;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {
      // best-effort
    }
    const outcome = computeOutcome();
    setSpinning([true, true, true]);
    setReels(outcome.reels);

    // stop reels staggered
    const stopAt = [1200, 1700, 2300];
    stopAt.forEach((ms, i) => {
      setTimeout(() => {
        setSpinning((s) => s.map((v, idx) => (idx === i ? false : v)));
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch {
          // ignore
        }
      }, ms);
    });

    setTimeout(() => {
      spinningRef.current = false;
      // payout
      let win = 0;
      const m = outcome.match;
      const isJackpot = outcome.count === 3 && m.symbol === "7️⃣";
      if (outcome.count === 3) {
        win = m.payout;
      } else if (outcome.count === 2) {
        win = 3;
      }
      if (win > 0) addCoins(win);
      recordSpin(isJackpot);
      setLastResult({ win, jackpot: isJackpot, matches: outcome.count, name: m.name });
      setShowResult(true);
      try {
        if (isJackpot) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // ignore
      }
    }, 2500);
  }, [addCoins, closed, computeOutcome, recordSpin, spendCoins, state.settings.slotSpinCost]);

  return (
    <PaperBackground>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <SignTitle title="CASINO DE LA SUERTE" subtitle="Tragamonedas" />

          <View style={styles.topRow}>
            <CoinBadge amount={state.coins} size={28} />
            <View style={styles.costPill}>
              <Text style={styles.costPillText}>
                Costo por giro: {state.settings.slotSpinCost} 🪙
              </Text>
            </View>
          </View>

          {closed && <CasinoClosedBanner remainingSec={remaining} />}

          {/* Slot machine cabinet */}
          <View style={styles.cabinet}>
            <View style={styles.cabinetTop}>
              <Text style={styles.cabinetTitle}>★ JACKPOT ★</Text>
            </View>
            <View style={styles.reels}>
              {reels.map((s, i) => (
                <Reel key={i} symbol={s} spinning={spinning[i]} />
              ))}
            </View>
            <View style={styles.cabinetBottom}>
              <Text style={styles.payline}>━━━━━━━━━━━━━━━</Text>
            </View>
          </View>

          {/* Spin lever / button */}
          <Pressable
            disabled={closed || spinningRef.current}
            onPress={spin}
            style={styles.lever}
            testID="spin-slot-button"
          >
            <View style={styles.leverInner}>
              <Text style={styles.leverText}>
                {spinningRef.current ? "GIRANDO..." : closed ? "CERRADO" : "¡TIRA LA PALANCA!"}
              </Text>
            </View>
          </Pressable>

          {/* Payout table */}
          <VintageCard style={styles.section}>
            <Text style={styles.sectionTitle}>💰 Tabla de pagos</Text>
            {SYMBOLS.map((s) => (
              <View key={s.symbol} style={styles.payRow}>
                <Text style={styles.paySymbol}>
                  {s.symbol} {s.symbol} {s.symbol}
                </Text>
                <Text style={styles.payText}>
                  {s.name} → {s.payout} 🪙
                </Text>
              </View>
            ))}
            <Text style={styles.payNote}>2 iguales → 3 🪙 · Probabilidad jackpot ajustable</Text>
          </VintageCard>
        </ScrollView>
      </SafeAreaView>

      <ResultModal
        visible={showResult}
        result={lastResult}
        onClose={() => setShowResult(false)}
        spinCost={state.settings.slotSpinCost}
      />
    </PaperBackground>
  );
}

function ResultModal({
  visible,
  result,
  onClose,
  spinCost,
}: {
  visible: boolean;
  result: { win: number; jackpot: boolean; matches: number; name?: string } | null;
  onClose: () => void;
  spinCost: number;
}) {
  const scale = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSequence(
        withSpring(1.2, { damping: 5, stiffness: 180 }),
        withSpring(1, { damping: 7, stiffness: 200 }),
      );
    } else {
      scale.value = 0;
    }
  }, [visible, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!result) return null;

  const isJackpot = result.jackpot;
  const isWin = result.win > 0;
  const isNearMiss = !isWin && result.matches === 2;

  let title = "Sin suerte...";
  let emoji = "💨";
  let bg = colors.wornWood;
  let body = `Gastaste ${spinCost} fichas`;

  if (isJackpot) {
    title = "¡¡¡JACKPOT!!!";
    emoji = "🎰";
    bg = colors.antiqueGold;
    body = `¡${result.name}! +${result.win} fichas`;
  } else if (isWin) {
    title = "¡PREMIO!";
    emoji = "💰";
    bg = colors.successGreen;
    body = `${result.name} +${result.win} fichas`;
  } else if (isNearMiss) {
    title = "¡Casi lo logras!";
    emoji = "😤";
    bg = colors.warningAmber;
    body = "Dos iguales... casi premio";
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalBackdrop}>
        <Animated.View style={animStyle}>
          <VintageCard tint={bg} style={styles.modalCard}>
            <Text style={styles.modalEmoji}>{emoji}</Text>
            <Text
              style={[
                styles.modalTitle,
                { color: isJackpot ? colors.ink : colors.paperHighlight },
              ]}
              testID="slot-result-title"
            >
              {title}
            </Text>
            <Text
              style={[
                styles.modalBody,
                { color: isJackpot ? colors.ink : colors.paperHighlight },
              ]}
            >
              {body}
            </Text>
            <VintageButton
              label="OTRA RONDA"
              variant={isJackpot ? "red" : "gold"}
              onPress={onClose}
              testID="close-result"
              style={{ marginTop: 14, minWidth: 200 }}
            />
          </VintageCard>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 32, gap: 14 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  costPill: {
    ...inkBorder(2),
    backgroundColor: colors.cream,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  costPillText: { fontFamily: fonts.body, fontSize: 13, color: colors.ink },
  cabinet: {
    ...inkBorder(4),
    backgroundColor: colors.wornWoodDark,
    borderRadius: radii.lg,
    padding: 12,
    ...cartoonShadow(6),
  },
  cabinetTop: {
    backgroundColor: colors.vintageRed,
    ...inkBorder(2),
    paddingVertical: 6,
    alignItems: "center",
    borderRadius: radii.sm,
    marginBottom: 8,
  },
  cabinetTitle: {
    fontFamily: fonts.heading,
    fontSize: 16,
    color: colors.antiqueGold,
    letterSpacing: 6,
    textShadowColor: colors.ink,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },
  reels: {
    flexDirection: "row",
    backgroundColor: colors.cream,
    ...inkBorder(3),
    borderRadius: radii.sm,
    padding: 6,
    gap: 6,
  },
  reelOuter: {
    flex: 1,
    height: 110,
    backgroundColor: colors.paperHighlight,
    ...inkBorder(2),
    borderRadius: radii.sm,
    overflow: "hidden",
  },
  reelInner: { flex: 1, alignItems: "center", justifyContent: "center" },
  symbol: { fontSize: 70, lineHeight: 78 },
  cabinetBottom: { alignItems: "center", marginTop: 8 },
  payline: { color: colors.antiqueGold, fontFamily: fonts.body, letterSpacing: 1 },
  lever: {
    ...inkBorder(4),
    backgroundColor: colors.antiqueGold,
    paddingVertical: 18,
    borderRadius: radii.lg,
    alignItems: "center",
    ...cartoonShadow(5),
  },
  leverInner: { alignItems: "center" },
  leverText: {
    fontFamily: fonts.heading,
    fontSize: 22,
    color: colors.ink,
    letterSpacing: 2,
  },
  section: { padding: 14 },
  sectionTitle: {
    fontFamily: fonts.heading,
    fontSize: 17,
    color: colors.ink,
    marginBottom: 10,
    letterSpacing: 1,
  },
  payRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(44,30,22,0.15)",
  },
  paySymbol: { fontSize: 22 },
  payText: { fontFamily: fonts.body, color: colors.ink, fontSize: 14 },
  payNote: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkSoft,
    fontStyle: "italic",
    marginTop: 6,
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
    marginTop: 4,
    letterSpacing: 2,
    textAlign: "center",
  },
  modalBody: {
    fontFamily: fonts.subheading,
    fontSize: 16,
    marginTop: 8,
    letterSpacing: 1,
    textAlign: "center",
  },
});

// Suppress unused-import warning for the Image we may use later.
void Image;
