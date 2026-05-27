// TOPIC ROULETTE — spin a vintage wheel to randomly pick a study topic.

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
import { CoinBadge } from "@/src/components/CoinBadge";
import { PaperBackground } from "@/src/components/PaperBackground";
import { SignTitle } from "@/src/components/SignTitle";
import { VintageButton } from "@/src/components/VintageButton";
import { VintageCard } from "@/src/components/VintageCard";
import { useGameStore } from "@/src/store/game-store";
import { cartoonShadow, colors, fonts, inkBorder, radii } from "@/src/theme";

const WHEEL = require("../../assets/images/roulette-wheel.png");

export default function RuletaScreen() {
  const {
    state,
    spendCoins,
    markTopicStudied,
    toggleTopic,
    isCasinoClosed,
    casinoClosedRemainingSec,
  } = useGameStore();

  const rotation = useSharedValue(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [, force] = useState(0);

  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const closed = isCasinoClosed();
  const remaining = casinoClosedRemainingSec();

  const enabledTopics = useMemo(
    () => state.topics.filter((t) => t.enabled),
    [state.topics],
  );

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const lastResultRef = useRef<string | null>(null);

  const showResult = (name: string) => {
    setResult(name);
    setSpinning(false);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // ignore
    }
  };

  const spin = () => {
    if (spinning) return;
    if (closed) return;
    if (enabledTopics.length === 0) return;
    if (!spendCoins(state.settings.rouletteSpinCost)) return;

    // weighted random selection avoiding most-recent topic when possible
    const now = Date.now();
    const recentMs = 30 * 60 * 1000;
    let pool = enabledTopics.filter((t) => !t.lastStudiedAt || now - t.lastStudiedAt > recentMs);
    if (pool.length === 0) pool = enabledTopics;
    const total = pool.reduce((s, t) => s + Math.max(0.1, t.weight), 0);
    let r = Math.random() * total;
    let chosen = pool[0];
    for (const t of pool) {
      r -= Math.max(0.1, t.weight);
      if (r <= 0) {
        chosen = t;
        break;
      }
    }

    setSpinning(true);
    setResult(null);
    lastResultRef.current = chosen.name;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {
      // ignore
    }
    // multi-rotation spin then settle at random offset
    const rotations = 4 + Math.floor(Math.random() * 3);
    const offset = Math.floor(Math.random() * 360);
    const target = rotation.value + rotations * 360 + offset;
    rotation.value = withTiming(
      target,
      { duration: 3500, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) {
          runOnJS(showResult)(chosen.name);
        }
      },
    );
    markTopicStudied(chosen.id);
  };

  return (
    <PaperBackground>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <SignTitle title="RULETA DE TEMAS" subtitle="¿Qué estudiar hoy?" />

          <View style={styles.topRow}>
            <CoinBadge amount={state.coins} size={28} />
            <View style={styles.costPill}>
              <Text style={styles.costPillText}>
                Costo: {state.settings.rouletteSpinCost} 🪙
              </Text>
            </View>
          </View>

          {closed && <CasinoClosedBanner remainingSec={remaining} />}

          {/* Wheel */}
          <View style={styles.wheelWrap}>
            <View style={styles.pointer}>
              <Text style={styles.pointerArrow}>▼</Text>
            </View>
            <Animated.View style={[styles.wheelImageWrap, animStyle]} testID="topic-roulette-wheel">
              <Image source={WHEEL} style={styles.wheelImage} />
            </Animated.View>
          </View>

          <VintageButton
            label={spinning ? "GIRANDO..." : closed ? "CASINO CERRADO" : "¡GIRAR RULETA!"}
            variant="red"
            size="lg"
            onPress={spin}
            disabled={spinning || closed || enabledTopics.length === 0}
            testID="spin-roulette-button"
          />

          {enabledTopics.length === 0 && (
            <Text style={styles.warn}>
              No tienes temas habilitados. Activa al menos uno abajo.
            </Text>
          )}

          {/* Topics list */}
          <VintageCard style={styles.section}>
            <Text style={styles.sectionTitle}>📚 Temas en juego</Text>
            <Text style={styles.sectionSub}>
              Toca un tema para excluirlo/incluirlo de la ruleta.
            </Text>
            {state.topics.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => toggleTopic(t.id)}
                style={[styles.topicRow, !t.enabled && styles.topicRowDisabled]}
                testID={`topic-${t.id}`}
              >
                <View style={styles.checkBox}>
                  {t.enabled ? <Text style={styles.check}>✓</Text> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.topicName, !t.enabled && styles.strike]}>{t.name}</Text>
                  {!!t.category && <Text style={styles.topicCat}>{t.category}</Text>}
                </View>
                <Text style={styles.topicWeight}>×{t.weight}</Text>
              </Pressable>
            ))}
          </VintageCard>
        </ScrollView>
      </SafeAreaView>

      {/* Result modal */}
      <Modal visible={!!result} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <VintageCard tint={colors.antiqueGold} style={styles.modalCard}>
            <Text style={styles.modalEmoji}>🎯</Text>
            <Text style={styles.modalEyebrow}>EL DESTINO ELIGIÓ</Text>
            <Text style={styles.modalTitle} testID="roulette-result">
              {result}
            </Text>
            <Text style={styles.modalBody}>¡A estudiar este tema!</Text>
            <VintageButton
              label="ESTUDIAR AHORA"
              variant="red"
              onPress={() => setResult(null)}
              style={{ marginTop: 14, minWidth: 200 }}
              testID="roulette-close"
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
  wheelWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  pointer: {
    position: "absolute",
    top: -2,
    zIndex: 10,
    alignItems: "center",
  },
  pointerArrow: {
    fontSize: 30,
    color: colors.vintageRed,
    textShadowColor: colors.ink,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  wheelImageWrap: {
    width: 280,
    height: 280,
    ...cartoonShadow(5),
  },
  wheelImage: {
    width: 280,
    height: 280,
    resizeMode: "contain",
  },
  warn: {
    fontFamily: fonts.body,
    color: colors.vintageRed,
    fontStyle: "italic",
    textAlign: "center",
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
    fontSize: 12,
    color: colors.inkSoft,
    marginBottom: 8,
    fontStyle: "italic",
  },
  topicRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(44,30,22,0.15)",
  },
  topicRowDisabled: { opacity: 0.5 },
  checkBox: {
    width: 24,
    height: 24,
    ...inkBorder(2),
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.paperHighlight,
  },
  check: { fontFamily: fonts.heading, color: colors.vintageRed, fontSize: 16 },
  topicName: { fontFamily: fonts.subheading, color: colors.ink, fontSize: 15, letterSpacing: 1 },
  topicCat: { fontFamily: fonts.body, color: colors.inkSoft, fontSize: 11 },
  topicWeight: { fontFamily: fonts.numbers, color: colors.vintageRed, fontSize: 14 },
  strike: { textDecorationLine: "line-through" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(44,30,22,0.7)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: { padding: 22, alignItems: "center", minWidth: 280, ...cartoonShadow(6) },
  modalEmoji: { fontSize: 56 },
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
    color: colors.ink,
    marginTop: 6,
    letterSpacing: 1,
    textAlign: "center",
  },
  modalBody: { fontFamily: fonts.body, color: colors.inkSoft, marginTop: 4, fontStyle: "italic" },
});
