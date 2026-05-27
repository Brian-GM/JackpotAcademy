// CASINO — slot machine + reward boxes with vintage lights and dopamine animations.

import { useCallback, useEffect, useRef, useState } from "react";
import {
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
import { CoinShower } from "@/src/components/CoinShower";
import { MarqueeLights } from "@/src/components/MarqueeLights";
import { PaperBackground } from "@/src/components/PaperBackground";
import { SignTitle } from "@/src/components/SignTitle";
import { SunburstRays } from "@/src/components/SunburstRays";
import { VintageButton } from "@/src/components/VintageButton";
import { VintageCard } from "@/src/components/VintageCard";
import { useSounds } from "@/src/hooks/use-sounds";
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
  const idx = SYMBOLS.findIndex((s) => s.symbol === symbol.symbol);
  return SYMBOLS[Math.max(0, idx - 1)];
}

// Reward box payout table — boxes pay coins with weighted rarity distribution.
type BoxTier = "bronce" | "plata" | "oro";
const BOX_TIERS: Record<
  BoxTier,
  {
    name: string;
    emoji: string;
    color: string;
    payouts: { coins: number; weight: number; rarity: string; emoji: string; label: string }[];
  }
> = {
  bronce: {
    name: "Caja de Bronce",
    emoji: "📦",
    color: "#8C6239",
    payouts: [
      { coins: 5, weight: 40, rarity: "comun", emoji: "🪙", label: "Cinco fichas" },
      { coins: 12, weight: 30, rarity: "comun", emoji: "💰", label: "Bolsa pequeña" },
      { coins: 25, weight: 18, rarity: "raro", emoji: "💎", label: "Diamante menor" },
      { coins: 50, weight: 10, rarity: "epico", emoji: "🏆", label: "Trofeo de plata" },
      { coins: 150, weight: 2, rarity: "legendario", emoji: "👑", label: "¡Corona dorada!" },
    ],
  },
  plata: {
    name: "Caja de Plata",
    emoji: "🎁",
    color: "#9C9CB3",
    payouts: [
      { coins: 20, weight: 35, rarity: "comun", emoji: "💰", label: "Bolsa de monedas" },
      { coins: 45, weight: 30, rarity: "raro", emoji: "💎", label: "Gema brillante" },
      { coins: 80, weight: 20, rarity: "epico", emoji: "🏆", label: "Trofeo de oro" },
      { coins: 200, weight: 10, rarity: "epico", emoji: "💍", label: "Anillo del jefe" },
      { coins: 500, weight: 5, rarity: "legendario", emoji: "👑", label: "¡Tesoro real!" },
    ],
  },
  oro: {
    name: "Caja de Oro",
    emoji: "🏆",
    color: "#D4AF37",
    payouts: [
      { coins: 60, weight: 35, rarity: "raro", emoji: "💎", label: "Diamante real" },
      { coins: 120, weight: 30, rarity: "epico", emoji: "🏆", label: "Trofeo dorado" },
      { coins: 250, weight: 20, rarity: "epico", emoji: "💍", label: "Anillo legendario" },
      { coins: 500, weight: 10, rarity: "legendario", emoji: "👑", label: "Corona imperial" },
      { coins: 1500, weight: 5, rarity: "legendario", emoji: "🌟", label: "¡EL GRAN PREMIO!" },
    ],
  },
};

function pickBoxPayout(tier: BoxTier) {
  const t = BOX_TIERS[tier];
  const total = t.payouts.reduce((s, p) => s + p.weight, 0);
  let r = Math.random() * total;
  for (const p of t.payouts) {
    r -= p.weight;
    if (r <= 0) return p;
  }
  return t.payouts[0];
}

function Reel({ symbol, spinning }: { symbol: string; spinning: boolean }) {
  const [displayed, setDisplayed] = useState(symbol);
  const rotate = useSharedValue(0);

  useEffect(() => {
    if (spinning) {
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

type Mode = "slot" | "boxes";

export default function CasinoScreen() {
  const { state, spendCoins, addCoins, recordSpin, isCasinoClosed, casinoClosedRemainingSec } =
    useGameStore();
  const { play } = useSounds();
  const [mode, setMode] = useState<Mode>("slot");
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
  const [showShower, setShowShower] = useState(false);
  const [, force] = useState(0);
  const spinningRef = useRef(false);

  // Reward box state
  const [openingBox, setOpeningBox] = useState<BoxTier | null>(null);
  const [boxResult, setBoxResult] = useState<{
    tier: BoxTier;
    payout: ReturnType<typeof pickBoxPayout>;
  } | null>(null);

  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const closed = isCasinoClosed();
  const remaining = casinoClosedRemainingSec();

  const computeOutcome = useCallback(() => {
    const jackpotProb = state.settings.jackpotProbability;
    const isJackpot = Math.random() < jackpotProb;
    if (isJackpot) {
      const j = SYMBOLS[SYMBOLS.length - 1];
      return { reels: [j.symbol, j.symbol, j.symbol], match: j, count: 3 };
    }
    const isTriple = Math.random() < 0.05;
    if (isTriple) {
      const winner = pickWeighted();
      const safeWinner = winner.symbol === "7️⃣" ? SYMBOLS[5] : winner;
      return {
        reels: [safeWinner.symbol, safeWinner.symbol, safeWinner.symbol],
        match: safeWinner,
        count: 3,
      };
    }
    const nearMissRoll = Math.random() < 0.18;
    if (nearMissRoll) {
      const winner = pickWeighted();
      const adj = nearMiss(winner);
      return { reels: [winner.symbol, winner.symbol, adj.symbol], match: winner, count: 2 };
    }
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
    play("lever");
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {
      // ignore
    }
    setTimeout(() => play("spinning", { volume: 0.6 }), 200);
    const outcome = computeOutcome();
    setSpinning([true, true, true]);
    setReels(outcome.reels);

    const stopAt = [1200, 1700, 2300];
    stopAt.forEach((ms, i) => {
      setTimeout(() => {
        setSpinning((s) => s.map((v, idx) => (idx === i ? false : v)));
        play("tick");
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch {
          // ignore
        }
      }, ms);
    });

    setTimeout(() => {
      spinningRef.current = false;
      let win = 0;
      const m = outcome.match;
      const isJackpot = outcome.count === 3 && m.symbol === "7️⃣";
      if (outcome.count === 3) win = m.payout;
      else if (outcome.count === 2) win = 3;
      if (win > 0) addCoins(win);
      recordSpin(isJackpot);
      setLastResult({ win, jackpot: isJackpot, matches: outcome.count, name: m.name });
      setShowResult(true);
      if (isJackpot) {
        play("jackpot");
        setShowShower(true);
        setTimeout(() => setShowShower(false), 2200);
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {
          // ignore
        }
      } else if (win > 0) {
        play("win");
        play("coin");
      } else {
        play("fail", { volume: 0.5 });
      }
    }, 2500);
  }, [
    addCoins,
    closed,
    computeOutcome,
    play,
    recordSpin,
    spendCoins,
    state.settings.slotSpinCost,
  ]);

  const openBox = useCallback(
    (tier: BoxTier) => {
      if (closed) return;
      const cost =
        tier === "bronce"
          ? state.settings.bronzeBoxCost
          : tier === "plata"
            ? state.settings.silverBoxCost
            : state.settings.goldBoxCost;
      if (!spendCoins(cost)) return;
      play("lever");
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch {
        // ignore
      }
      setOpeningBox(tier);
      // suspense delay then reveal
      setTimeout(() => {
        const payout = pickBoxPayout(tier);
        addCoins(payout.coins);
        recordSpin(payout.rarity === "legendario");
        setBoxResult({ tier, payout });
        setOpeningBox(null);
        play("box_open");
        if (payout.rarity === "legendario") {
          play("jackpot");
          setShowShower(true);
          setTimeout(() => setShowShower(false), 2400);
        } else {
          play("coin");
          play("bell", { volume: 0.5 });
        }
      }, 1800);
    },
    [
      addCoins,
      closed,
      play,
      recordSpin,
      spendCoins,
      state.settings.bronzeBoxCost,
      state.settings.goldBoxCost,
      state.settings.silverBoxCost,
    ],
  );

  return (
    <PaperBackground>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <SignTitle title="CASINO DE LA SUERTE" subtitle="¡Apuesta tus fichas!" />

          <View style={styles.topRow}>
            <CoinBadge amount={state.coins} size={28} />
            <View style={styles.modeRow}>
              <Pressable
                onPress={() => {
                  play("click");
                  setMode("slot");
                }}
                style={[styles.modeBtn, mode === "slot" && styles.modeBtnActive]}
                testID="mode-slot"
              >
                <Text style={[styles.modeText, mode === "slot" && styles.modeTextActive]}>
                  🎰 Tragamonedas
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  play("click");
                  setMode("boxes");
                }}
                style={[styles.modeBtn, mode === "boxes" && styles.modeBtnActive]}
                testID="mode-boxes"
              >
                <Text style={[styles.modeText, mode === "boxes" && styles.modeTextActive]}>
                  📦 Cajas
                </Text>
              </Pressable>
            </View>
          </View>

          {closed && <CasinoClosedBanner remainingSec={remaining} />}

          {mode === "slot" ? (
            <>
              {/* Slot machine cabinet w/ marquee */}
              <View style={styles.cabinet}>
                <View style={styles.cabinetMarquee}>
                  <MarqueeLights count={14} size={9} speed={1100} />
                </View>
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
                <View style={styles.cabinetMarqueeBottom}>
                  <MarqueeLights count={14} size={9} speed={1100} />
                </View>
              </View>

              <View style={styles.costRow}>
                <Text style={styles.costRowText}>Costo por giro</Text>
                <Text style={styles.costRowValue}>{state.settings.slotSpinCost} 🪙</Text>
              </View>

              <Pressable
                disabled={closed || spinningRef.current || state.coins < state.settings.slotSpinCost}
                onPress={spin}
                style={[
                  styles.lever,
                  (closed || spinningRef.current || state.coins < state.settings.slotSpinCost) && {
                    opacity: 0.5,
                  },
                ]}
                testID="spin-slot-button"
              >
                <View style={styles.leverInner}>
                  <Text style={styles.leverText}>
                    {spinningRef.current
                      ? "GIRANDO..."
                      : closed
                        ? "CERRADO"
                        : state.coins < state.settings.slotSpinCost
                          ? "FICHAS INSUFICIENTES"
                          : "¡TIRA LA PALANCA!"}
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
                <Text style={styles.payNote}>
                  2 iguales → 3 🪙 · Probabilidad jackpot ajustable
                </Text>
              </VintageCard>
            </>
          ) : (
            <BoxesSection
              state={state}
              closed={closed}
              onOpen={openBox}
            />
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Coin shower / confetti layer for jackpots */}
      <CoinShower active={showShower} count={28} variant="coins" />

      <SlotResultModal
        visible={showResult}
        result={lastResult}
        onClose={() => {
          play("click");
          setShowResult(false);
        }}
        spinCost={state.settings.slotSpinCost}
      />

      <BoxOpeningModal tier={openingBox} />
      <BoxResultModal
        result={boxResult}
        onClose={() => {
          play("click");
          setBoxResult(null);
        }}
      />
    </PaperBackground>
  );
}

function BoxesSection({
  state,
  closed,
  onOpen,
}: {
  state: ReturnType<typeof useGameStore>["state"];
  closed: boolean;
  onOpen: (tier: BoxTier) => void;
}) {
  const costs: Record<BoxTier, number> = {
    bronce: state.settings.bronzeBoxCost,
    plata: state.settings.silverBoxCost,
    oro: state.settings.goldBoxCost,
  };
  return (
    <>
      <Text style={styles.boxesTagline}>
        ✨ Abre cajas misteriosas y gana fichas con rarezas crecientes ✨
      </Text>
      {(Object.keys(BOX_TIERS) as BoxTier[]).map((tier) => {
        const t = BOX_TIERS[tier];
        const cost = costs[tier];
        const canAfford = state.coins >= cost;
        const max = t.payouts[t.payouts.length - 1].coins;
        return (
          <BoxCard
            key={tier}
            tier={tier}
            name={t.name}
            emoji={t.emoji}
            color={t.color}
            cost={cost}
            maxCoins={max}
            disabled={!canAfford || closed}
            onOpen={() => onOpen(tier)}
          />
        );
      })}
    </>
  );
}

function BoxCard({
  tier,
  name,
  emoji,
  color,
  cost,
  maxCoins,
  disabled,
  onOpen,
}: {
  tier: BoxTier;
  name: string;
  emoji: string;
  color: string;
  cost: number;
  maxCoins: number;
  disabled: boolean;
  onOpen: () => void;
}) {
  const wobble = useSharedValue(0);

  useEffect(() => {
    wobble.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 700 }),
        withTiming(3, { duration: 700 }),
        withTiming(0, { duration: 300 }),
        withTiming(0, { duration: 1500 }), // pause
      ),
      -1,
      false,
    );
  }, [wobble]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${wobble.value}deg` }, { scale: 1 + Math.abs(wobble.value) * 0.005 }],
  }));

  return (
    <VintageCard tint={colors.paperHighlight} style={styles.boxCard} testID={`box-${tier}`}>
      <View style={styles.boxRow}>
        <Animated.View style={[styles.boxIconWrap, { borderColor: color }, animStyle]}>
          <Text style={styles.boxEmoji}>{emoji}</Text>
        </Animated.View>
        <View style={{ flex: 1 }}>
          <Text style={styles.boxName}>{name}</Text>
          <Text style={styles.boxRange}>Hasta {maxCoins} 🪙</Text>
          <Text style={styles.boxCost}>Costo: {cost} 🪙</Text>
        </View>
      </View>
      <VintageButton
        label={disabled ? "INSUFICIENTE" : "ABRIR CAJA"}
        variant="red"
        disabled={disabled}
        onPress={onOpen}
        testID={`open-${tier}`}
        style={{ marginTop: 10 }}
      />
    </VintageCard>
  );
}

function BoxOpeningModal({ tier }: { tier: BoxTier | null }) {
  const wobble = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!tier) return;
    wobble.value = withRepeat(
      withSequence(
        withTiming(-15, { duration: 80 }),
        withTiming(15, { duration: 80 }),
      ),
      -1,
      true,
    );
    scale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 200 }),
        withTiming(0.9, { duration: 200 }),
      ),
      -1,
      true,
    );
  }, [tier, wobble, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${wobble.value}deg` }, { scale: scale.value }],
  }));

  if (!tier) return null;
  const t = BOX_TIERS[tier];

  return (
    <Modal visible={!!tier} transparent animationType="fade">
      <View style={styles.modalBackdropDark}>
        <Animated.Text style={[styles.boxOpeningEmoji, animStyle]}>{t.emoji}</Animated.Text>
        <Text style={styles.boxOpeningText}>Abriendo...</Text>
      </View>
    </Modal>
  );
}

function BoxResultModal({
  result,
  onClose,
}: {
  result: { tier: BoxTier; payout: ReturnType<typeof pickBoxPayout> } | null;
  onClose: () => void;
}) {
  const scale = useSharedValue(0);

  useEffect(() => {
    if (result) {
      scale.value = withSequence(
        withSpring(1.3, { damping: 5, stiffness: 180 }),
        withSpring(1, { damping: 7, stiffness: 200 }),
      );
    } else {
      scale.value = 0;
    }
  }, [result, scale]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  if (!result) return null;
  const isLegendary = result.payout.rarity === "legendario";
  const bg = isLegendary ? colors.antiqueGold : colors.successGreen;

  return (
    <Modal visible={!!result} transparent animationType="fade">
      <View style={styles.modalBackdrop}>
        {isLegendary && (
          <View style={styles.sunburstLayer} pointerEvents="none">
            <SunburstRays size={500} rayCount={20} speed={5000} />
          </View>
        )}
        <Animated.View style={animStyle}>
          <VintageCard tint={bg} style={styles.modalCard}>
            <Text style={styles.modalEmoji}>{result.payout.emoji}</Text>
            <Text
              style={[
                styles.modalTitle,
                { color: isLegendary ? colors.ink : colors.paperHighlight },
              ]}
            >
              {result.payout.label}
            </Text>
            <Text
              style={[
                styles.modalBody,
                { color: isLegendary ? colors.ink : colors.paperHighlight },
              ]}
              testID="box-result-coins"
            >
              +{result.payout.coins} 🪙
            </Text>
            <VintageButton
              label="ABRIR OTRA"
              variant={isLegendary ? "red" : "gold"}
              onPress={onClose}
              testID="close-box-result"
              style={{ marginTop: 14, minWidth: 200 }}
            />
          </VintageCard>
        </Animated.View>
      </View>
    </Modal>
  );
}

function SlotResultModal({
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

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

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
        {isJackpot && (
          <View style={styles.sunburstLayer} pointerEvents="none">
            <SunburstRays size={500} rayCount={24} speed={4500} />
          </View>
        )}
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
  modeRow: { flexDirection: "row", gap: 4, ...inkBorder(2), borderRadius: radii.pill, overflow: "hidden", backgroundColor: colors.paperHighlight },
  modeBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  modeBtnActive: { backgroundColor: colors.vintageRed },
  modeText: { fontFamily: fonts.subheading, fontSize: 11, color: colors.ink, letterSpacing: 1 },
  modeTextActive: { color: colors.paperHighlight },
  cabinet: {
    ...inkBorder(4),
    backgroundColor: colors.wornWoodDark,
    borderRadius: radii.lg,
    padding: 12,
    ...cartoonShadow(6),
  },
  cabinetMarquee: { paddingVertical: 6, marginBottom: 4 },
  cabinetMarqueeBottom: { paddingVertical: 6, marginTop: 4 },
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
  costRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  costRowText: { fontFamily: fonts.body, color: colors.inkSoft },
  costRowValue: { fontFamily: fonts.numbers, color: colors.vintageRed, fontSize: 16 },
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
  // Box styles
  boxesTagline: {
    fontFamily: fonts.subheading,
    color: colors.vintageRed,
    textAlign: "center",
    fontSize: 13,
    letterSpacing: 1,
    marginBottom: 4,
  },
  boxCard: { padding: 14 },
  boxRow: { flexDirection: "row", gap: 14, alignItems: "center" },
  boxIconWrap: {
    width: 72,
    height: 72,
    borderRadius: radii.md,
    borderWidth: 4,
    backgroundColor: colors.cream,
    alignItems: "center",
    justifyContent: "center",
    ...cartoonShadow(3),
  },
  boxEmoji: { fontSize: 36 },
  boxName: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: colors.ink,
    letterSpacing: 1,
  },
  boxRange: { fontFamily: fonts.body, color: colors.inkSoft, fontSize: 12, marginTop: 2 },
  boxCost: { fontFamily: fonts.numbers, color: colors.vintageRed, fontSize: 14, marginTop: 4 },
  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(44,30,22,0.78)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalBackdropDark: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    alignItems: "center",
    justifyContent: "center",
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
  sunburstLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  boxOpeningEmoji: {
    fontSize: 130,
  },
  boxOpeningText: {
    fontFamily: fonts.heading,
    color: colors.antiqueGold,
    fontSize: 22,
    letterSpacing: 4,
    marginTop: 24,
    textShadowColor: colors.vintageRed,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
});
