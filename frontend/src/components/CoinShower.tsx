// CoinShower — emits N coin emojis falling/expanding from the center.
// Optional trigger via key change.

import { useEffect, useMemo } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  withSequence,
  withSpring,
} from "react-native-reanimated";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const COIN_EMOJI = "🪙";
const CONFETTI = ["🎉", "✨", "💰", "🌟"];

type Props = {
  active: boolean;
  count?: number;
  variant?: "coins" | "confetti";
};

function Particle({
  delay,
  duration,
  startX,
  endX,
  endY,
  rotate,
  size,
  emoji,
}: {
  delay: number;
  duration: number;
  startX: number;
  endX: number;
  endY: number;
  rotate: number;
  size: number;
  emoji: string;
}) {
  const progress = useSharedValue(0);
  const scale = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(delay, withTiming(1, { duration, easing: Easing.out(Easing.quad) }));
    scale.value = withDelay(
      delay,
      withSequence(
        withSpring(1, { damping: 6, stiffness: 200 }),
        withTiming(0.4, { duration: duration * 0.6 }),
      ),
    );
  }, [progress, scale, delay, duration]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: startX + (endX - startX) * progress.value },
      { translateY: endY * progress.value },
      { rotate: `${rotate * progress.value}deg` },
      { scale: scale.value },
    ],
    opacity: progress.value < 0.85 ? 1 : 1 - (progress.value - 0.85) / 0.15,
  }));

  return (
    <Animated.Text style={[styles.particle, { fontSize: size }, animStyle]}>
      {emoji}
    </Animated.Text>
  );
}

export function CoinShower({ active, count = 24, variant = "coins" }: Props) {
  const particles = useMemo(() => {
    if (!active) return [];
    return Array.from({ length: count }).map((_, i) => {
      const startX = SCREEN_W / 2 - 16;
      const endX = startX + (Math.random() - 0.5) * SCREEN_W * 0.9;
      const endY = SCREEN_H * (0.4 + Math.random() * 0.6);
      const rotate = (Math.random() - 0.5) * 720;
      const size = 22 + Math.random() * 18;
      const delay = Math.random() * 250;
      const duration = 1200 + Math.random() * 900;
      const emoji = variant === "confetti" ? CONFETTI[i % CONFETTI.length] : COIN_EMOJI;
      return { startX, endX, endY, rotate, size, delay, duration, emoji, key: `${i}-${Date.now()}` };
    });
  }, [active, count, variant]);

  if (!active) return null;

  return (
    <View pointerEvents="none" style={styles.layer}>
      {particles.map((p) => (
        <Particle
          key={p.key}
          delay={p.delay}
          duration={p.duration}
          startX={p.startX}
          endX={p.endX}
          endY={p.endY}
          rotate={p.rotate}
          size={p.size}
          emoji={p.emoji}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  particle: {
    position: "absolute",
    top: 0,
    left: 0,
  },
});
