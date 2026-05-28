// CASINO — slot machine + reward boxes. Wins now GRANT REWARDS (not coins).
// Coins come from studying with difficulty multiplier; the slot is pure dopamine.

import { useCallback, useEffect, useRef, useState } from "react";
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
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
import { CasinoMascot } from "@/src/components/CasinoMascot";
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
import { Rarity, Reward } from "@/src/store/types";
import { cartoonShadow, colors, fonts, goldBorder, inkBorder, radii, rarityColor, rarityLabel } from "@/src/theme";

// New assets
const RACHA_ICON = require("../../assets/images/racha-icon.png");

// Slot symbol images
const SLOT_CHERRY = require("../../assets/images/slot-cherry.png");
const SLOT_LEMON = require("../../assets/images/slot-lemon.png");
const SLOT_BELL = require("../../assets/images/slot-bell.png");
const SLOT_CLOVER = require("../../assets/images/slot-clover.png");
const SLOT_STAR = require("../../assets/images/slot-star.png");
const SLOT_DIAMOND = require("../../assets/images/slot-diamond.png");
const SLOT_SEVEN = require("../../assets/images/slot-seven.png");

type SymbolDef = { symbol: string; image: any; weight: number; rarity: Rarity | "none"; name: string };

const SYMBOLS: SymbolDef[] = [
  { symbol: "🍒", image: SLOT_CHERRY, weight: 30, rarity: "comun", name: "CEREZA" },
  { symbol: "🍋", image: SLOT_LEMON, weight: 25, rarity: "comun", name: "LIMÓN" },
  { symbol: "🔔", image: SLOT_BELL, weight: 20, rarity: "raro", name: "CAMPANA" },
  { symbol: "🍀", image: SLOT_CLOVER, weight: 15, rarity: "raro", name: "TRÉBOL" },
  { symbol: "⭐", image: SLOT_STAR, weight: 7, rarity: "epico", name: "ESTRELLA" },
  { symbol: "💎", image: SLOT_DIAMOND, weight: 2, rarity: "epico", name: "DIAMANTE" },
  { symbol: "7️⃣", image: SLOT_SEVEN, weight: 1, rarity: "legendario", name: "JACKPOT" },
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

type BoxTier = "bronce" | "plata" | "oro";
const BOX_TIERS: Record<
  BoxTier,
  {
    name: string;
    emoji: string;
    color: string;
    // weighted rarity distribution per tier
    rarityWeights: Record<Rarity, number>;
  }
> = {
  bronce: {
    name: "Caja de Bronce",
    emoji: "📦",
    color: "#8C6239",
    rarityWeights: { comun: 70, raro: 22, epico: 7, legendario: 1 },
  },
  plata: {
    name: "Caja de Plata",
    emoji: "🎁",
    color: "#9C9CB3",
    rarityWeights: { comun: 40, raro: 35, epico: 20, legendario: 5 },
  },
  oro: {
    name: "Caja de Oro",
    emoji: "🏆",
    color: "#D4AF37",
    rarityWeights: { comun: 15, raro: 35, epico: 35, legendario: 15 },
  },
};

function pickRarityForBox(tier: BoxTier): Rarity {
  const w = BOX_TIERS[tier].rarityWeights;
  const total = Object.values(w).reduce((s, x) => s + x, 0);
  let r = Math.random() * total;
  for (const rar of ["legendario", "epico", "raro", "comun"] as Rarity[]) {
    r -= w[rar];
    if (r <= 0) return rar;
  }
  return "comun";
}

function Reel({ symbolDef, spinning }: { symbolDef: SymbolDef; spinning: boolean }) {
  const [displayed, setDisplayed] = useState(symbolDef);
  const rotate = useSharedValue(0);

  useEffect(() => {
    if (spinning) {
      const id = setInterval(() => {
        setDisplayed(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
      }, 80);
      rotate.value = withRepeat(withTiming(360, { duration: 600 }), -1, false);
      return () => {
        clearInterval(id);
        rotate.value = 0;
      };
    }
    setDisplayed(symbolDef);
    rotate.value = withSpring(0, { damping: 6, stiffness: 200 });
  }, [spinning, symbolDef, rotate]);

  const animStyle = useAnimatedStyle(() => ({
    transform: spinning ? [{ translateY: (rotate.value % 60) - 30 }] : [{ translateY: 0 }],
  }));

  return (
    <View style={styles.reelOuter}>
      <View style={styles.reelInner}>
        <Animated.View style={animStyle}>
          <Image source={displayed.image} style={styles.symbolImage} resizeMode="contain" />
        </Animated.View>
      </View>
    </View>
  );
}

type Mode = "slot" | "boxes";

type SlotResult = {
  symbol: SymbolDef;
  matches: number;
  rewardGranted: Reward | null;
  consolation: number; // coins back for 2-match
  isJackpot: boolean;
};

export default function CasinoScreen() {
  const {
    state,
    spendCoins,
    addCoins,
    recordSpin,
    grantRewardOfRarity,
    isCasinoClosed,
    casinoClosedRemainingSec,
  } = useGameStore();
  const { play } = useSounds();
  const [mode, setMode] = useState<Mode>("slot");
  const [reels, setReels] = useState<SymbolDef[]>([
    SYMBOLS[0],
    SYMBOLS[0],
    SYMBOLS[0],
  ]);
  const [spinning, setSpinning] = useState<boolean[]>([false, false, false]);
  const [slotResult, setSlotResult] = useState<SlotResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showShower, setShowShower] = useState(false);
  const [, force] = useState(0);
  const spinningRef = useRef(false);

  const [openingBox, setOpeningBox] = useState<BoxTier | null>(null);
  const [boxResult, setBoxResult] = useState<{
    tier: BoxTier;
    rarity: Rarity;
    reward: Reward | null;
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
      return { reels: [j, j, j], match: j, count: 3 };
    }
    const isTriple = Math.random() < 0.08;
    if (isTriple) {
      const winner = pickWeighted();
      const safeWinner = winner.symbol === "7️⃣" ? SYMBOLS[5] : winner;
      return {
        reels: [safeWinner, safeWinner, safeWinner],
        match: safeWinner,
        count: 3,
      };
    }
    const nearMissRoll = Math.random() < 0.2;
    if (nearMissRoll) {
      const winner = pickWeighted();
      const adj = nearMiss(winner);
      return { reels: [winner, winner, adj], match: winner, count: 2 };
    }
    const r1 = pickWeighted();
    const r2 = pickWeighted();
    const r3 = pickWeighted();
    let count = 1;
    if (r1.symbol === r2.symbol && r2.symbol === r3.symbol) count = 3;
    else if (r1.symbol === r2.symbol || r2.symbol === r3.symbol) count = 2;
    return {
      reels: [r1, r2, r3],
      match: r2,
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
      const m = outcome.match;
      const isJackpot = outcome.count === 3 && m.symbol === "7️⃣";
      let rewardGranted: Reward | null = null;
      let consolation = 0;
      if (outcome.count === 3 && m.rarity !== "none") {
        rewardGranted = grantRewardOfRarity(m.rarity as Rarity);
      } else if (outcome.count === 2) {
        // Small consolation coins back (still feels lossy)
        consolation = 2;
        addCoins(consolation);
      }
      recordSpin(isJackpot);
      setSlotResult({
        symbol: m,
        matches: outcome.count,
        rewardGranted,
        consolation,
        isJackpot,
      });
      setShowResult(true);
      if (isJackpot) {
        play("jackpot");
        setShowShower(true);
        setTimeout(() => setShowShower(false), 2400);
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {
          // ignore
        }
      } else if (rewardGranted) {
        play("win");
        setTimeout(() => play("bell", { volume: 0.5 }), 300);
        setShowShower(true);
        setTimeout(() => setShowShower(false), 1500);
      } else {
        play("fail", { volume: 0.5 });
      }
    }, 2500);
  }, [
    addCoins,
    closed,
    computeOutcome,
    grantRewardOfRarity,
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
      setTimeout(() => {
        const rarity = pickRarityForBox(tier);
        const reward = grantRewardOfRarity(rarity);
        recordSpin(rarity === "legendario");
        setBoxResult({ tier, rarity, reward });
        setOpeningBox(null);
        play("box_open");
        if (rarity === "legendario") {
          play("jackpot");
          setShowShower(true);
          setTimeout(() => setShowShower(false), 2600);
        } else {
          play("win");
          setTimeout(() => play("bell", { volume: 0.5 }), 250);
          setShowShower(true);
          setTimeout(() => setShowShower(false), 1500);
        }
      }, 1800);
    },
    [
      closed,
      grantRewardOfRarity,
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
          <SignTitle title="CASINO DE LA SUERTE" subtitle="¡Gana premios reales!" />

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
                <Text style={styles.streakNum}>{state.streak}</Text>
              </View>
              <Text style={styles.streakHint}>{state.streak === 1 ? "día" : "días"}</Text>
            </View>
          </View>

          {/* Mode switcher */}
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
                🎁 Cajas Misteriosas
              </Text>
            </Pressable>
          </View>

          {closed && <CasinoClosedBanner remainingSec={remaining} />}

          {mode === "slot" ? (
            <>
              <View style={styles.cabinet}>
                <View style={styles.cabinetMarquee}>
                  <MarqueeLights count={14} size={9} speed={1100} />
                </View>
                <View style={styles.cabinetTop}>
                  <Text style={styles.cabinetTitle}>★ PREMIOS ★</Text>
                </View>
                <View style={styles.reels}>
                  {reels.map((s, i) => (
                    <Reel key={i} symbolDef={s} spinning={spinning[i]} />
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

              {/* Symbol → rarity table */}
              <VintageCard style={styles.section}>
                <Text style={styles.sectionTitle}>🎁 Premios posibles</Text>
                <Text style={styles.sectionSub}>
                  3 símbolos iguales = premio aleatorio de esa rareza
                </Text>
                {SYMBOLS.map((s) => (
                  <View key={s.symbol} style={styles.payRow}>
                    <View style={styles.paySymbols}>
                      <Image source={s.image} style={styles.paySymbolImg} resizeMode="contain" />
                      <Image source={s.image} style={styles.paySymbolImg} resizeMode="contain" />
                      <Image source={s.image} style={styles.paySymbolImg} resizeMode="contain" />
                    </View>
                    <View style={styles.payRight}>
                      <Text style={styles.payText}>{s.name}</Text>
                      <View
                        style={[
                          styles.rarityPill,
                          s.rarity !== "none" && { backgroundColor: rarityColor(s.rarity) },
                        ]}
                      >
                        <Text style={styles.rarityPillText}>
                          {s.rarity !== "none" ? rarityLabel(s.rarity) : "—"}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
                <Text style={styles.payNote}>2 iguales → 2 🪙 de consolación</Text>
              </VintageCard>
            </>
          ) : (
            <BoxesSection state={state} closed={closed} onOpen={openBox} />
          )}
        </ScrollView>
      </SafeAreaView>

      <CoinShower active={showShower} count={28} variant="coins" />

      <SlotResultModal
        visible={showResult}
        result={slotResult}
        spinCost={state.settings.slotSpinCost}
        onClose={() => {
          play("click");
          setShowResult(false);
        }}
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
        ✨ Las cajas dan PREMIOS REALES, no fichas ✨
      </Text>
      {(Object.keys(BOX_TIERS) as BoxTier[]).map((tier) => {
        const t = BOX_TIERS[tier];
        const cost = costs[tier];
        const canAfford = state.coins >= cost;
        const w = t.rarityWeights;
        const total = Object.values(w).reduce((s, x) => s + x, 0);
        const legendPct = Math.round((w.legendario / total) * 100);
        return (
          <BoxCard
            key={tier}
            tier={tier}
            name={t.name}
            emoji={t.emoji}
            color={t.color}
            cost={cost}
            legendPct={legendPct}
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
  legendPct,
  disabled,
  onOpen,
}: {
  tier: BoxTier;
  name: string;
  emoji: string;
  color: string;
  cost: number;
  legendPct: number;
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
        withTiming(0, { duration: 1500 }),
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
          <Text style={styles.boxRange}>{legendPct}% chance de legendario</Text>
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
      withSequence(withTiming(-15, { duration: 80 }), withTiming(15, { duration: 80 })),
      -1,
      true,
    );
    scale.value = withRepeat(
      withSequence(withTiming(1.15, { duration: 200 }), withTiming(0.9, { duration: 200 })),
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
  result: { tier: BoxTier; rarity: Rarity; reward: Reward | null } | null;
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
  const isLegend = result.rarity === "legendario";
  const bg = isLegend ? colors.antiqueGold : rarityColor(result.rarity);
  const fg = isLegend ? colors.ink : colors.paperHighlight;

  return (
    <Modal visible={!!result} transparent animationType="fade">
      <View style={styles.modalBackdrop}>
        {isLegend && (
          <View style={styles.sunburstLayer} pointerEvents="none">
            <SunburstRays size={520} rayCount={20} speed={5000} />
          </View>
        )}
        <Animated.View style={animStyle}>
          <VintageCard tint={bg} style={styles.modalCard}>
            <CasinoMascot state={isLegend ? "cheer" : "wave"} size={120} />
            <Text style={[styles.modalEyebrow, { color: fg }]}>
              {rarityLabel(result.rarity)}
            </Text>
            {result.reward ? (
              <>
                <Text style={[styles.modalEmoji]}>{result.reward.icon}</Text>
                <Text style={[styles.modalTitle, { color: fg }]} testID="box-result-reward">
                  {result.reward.name}
                </Text>
                <Text style={[styles.modalBody, { color: fg }]}>
                  Disponible en la pestaña Premios
                </Text>
              </>
            ) : (
              <>
                <Text style={[styles.modalEmoji]}>🎫</Text>
                <Text style={[styles.modalTitle, { color: fg }]}>Caja vacía</Text>
                <Text style={[styles.modalBody, { color: fg }]}>
                  Añade premios en el Catálogo para ganarlos
                </Text>
              </>
            )}
            <VintageButton
              label="ABRIR OTRA"
              variant={isLegend ? "red" : "gold"}
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
  result: SlotResult | null;
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

  const isJackpot = result.isJackpot;
  const isWin = !!result.rewardGranted;
  const isNearMiss = !isWin && result.matches === 2;

  let title = "Sin suerte...";
  let bg = colors.wornWood;
  let body = `Gastaste ${spinCost} fichas`;
  let mascotState: "cheer" | "sad" | "wave" = "sad";

  if (isJackpot) {
    title = "¡¡¡JACKPOT!!!";
    bg = colors.antiqueGold;
    body = "¡Premio legendario desbloqueado!";
    mascotState = "cheer";
  } else if (isWin) {
    title = "¡PREMIO!";
    bg = rarityColor(result.symbol.rarity as Rarity);
    body = "Tu nuevo premio está en la pestaña Premios";
    mascotState = "cheer";
  } else if (isNearMiss) {
    title = "¡Casi lo logras!";
    bg = colors.warningAmber;
    body = `Dos iguales · +${result.consolation} 🪙 de consolación`;
    mascotState = "wave";
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalBackdrop}>
        {isJackpot && (
          <View style={styles.sunburstLayer} pointerEvents="none">
            <SunburstRays size={520} rayCount={24} speed={4500} />
          </View>
        )}
        <Animated.View style={animStyle}>
          <VintageCard tint={bg} style={styles.modalCard}>
            <CasinoMascot state={mascotState} size={120} />
            <Text
              style={[
                styles.modalTitle,
                { color: isJackpot ? colors.ink : colors.paperHighlight },
              ]}
              testID="slot-result-title"
            >
              {title}
            </Text>
            {result.rewardGranted && (
              <View style={styles.rewardChip}>
                <Text style={styles.rewardChipEmoji}>{result.rewardGranted.icon}</Text>
                <Text style={styles.rewardChipName}>{result.rewardGranted.name}</Text>
              </View>
            )}
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
  modeRow: {
    flexDirection: "row",
    gap: 4,
    ...goldBorder(2),
    borderRadius: radii.pill,
    overflow: "hidden",
    backgroundColor: colors.bgPanel,
  },
  modeBtn: { flex: 1, paddingHorizontal: 12, paddingVertical: 10, alignItems: "center" },
  modeBtnActive: { backgroundColor: colors.vintageRed },
  modeText: { fontFamily: fonts.subheading, fontSize: 11, color: colors.cream, letterSpacing: 1 },
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
  symbolImage: { width: 70, height: 70 },
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
    marginBottom: 4,
    letterSpacing: 1,
  },
  sectionSub: {
    fontFamily: fonts.body,
    color: colors.inkSoft,
    fontSize: 12,
    fontStyle: "italic",
    marginBottom: 8,
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
  paySymbols: { flexDirection: "row", alignItems: "center", gap: 2 },
  paySymbolImg: { width: 28, height: 28 },
  payRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  payText: { fontFamily: fonts.body, color: colors.ink, fontSize: 13 },
  rarityPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
    ...inkBorder(1),
    backgroundColor: colors.paperPrimary,
  },
  rarityPillText: {
    fontFamily: fonts.subheading,
    fontSize: 10,
    color: colors.paperHighlight,
    letterSpacing: 1,
  },
  payNote: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkSoft,
    fontStyle: "italic",
    marginTop: 6,
  },
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
  boxName: { fontFamily: fonts.heading, fontSize: 18, color: colors.ink, letterSpacing: 1 },
  boxRange: { fontFamily: fonts.body, color: colors.inkSoft, fontSize: 12, marginTop: 2 },
  boxCost: { fontFamily: fonts.numbers, color: colors.vintageRed, fontSize: 14, marginTop: 4 },
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
  modalCard: { padding: 20, alignItems: "center", minWidth: 300, ...cartoonShadow(6) },
  modalEmoji: { fontSize: 56, marginTop: 4 },
  modalEyebrow: {
    fontFamily: fonts.subheading,
    fontSize: 12,
    letterSpacing: 4,
    marginTop: 4,
  },
  modalTitle: {
    fontFamily: fonts.heading,
    fontSize: 22,
    marginTop: 4,
    letterSpacing: 2,
    textAlign: "center",
  },
  modalBody: {
    fontFamily: fonts.subheading,
    fontSize: 14,
    marginTop: 8,
    letterSpacing: 1,
    textAlign: "center",
  },
  rewardChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    ...inkBorder(2),
    backgroundColor: colors.paperHighlight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    marginTop: 10,
    ...cartoonShadow(2),
  },
  rewardChipEmoji: { fontSize: 26 },
  rewardChipName: {
    fontFamily: fonts.subheading,
    color: colors.ink,
    fontSize: 14,
    letterSpacing: 1,
  },
  sunburstLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  boxOpeningEmoji: { fontSize: 130 },
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
