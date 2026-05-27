// "CASINO CERRADO" overlay shown while penalty cooldown is active.
// Pulsing red flashing border with a vintage closed sign feel.

import { StyleSheet, Text, View } from "react-native";
import { useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { cartoonShadow, colors, fonts, inkBorder, radii } from "@/src/theme";

type Props = {
  remainingSec: number;
};

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function CasinoClosedBanner({ remainingSec }: Props) {
  const flash = useSharedValue(0);

  useEffect(() => {
    flash.value = withRepeat(withTiming(1, { duration: 700 }), -1, true);
  }, [flash]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: 0.5 + flash.value * 0.5,
  }));

  return (
    <View style={styles.wrap} testID="casino-closed-banner">
      <Animated.View style={[styles.lights, animStyle]} />
      <Text style={styles.title}>🚫 CASINO CERRADO 🚫</Text>
      <Text style={styles.subtitle}>Has fallado tu sesión de estudio</Text>
      <Text style={styles.timer}>{formatTime(remainingSec)}</Text>
      <Text style={styles.note}>Las apuestas vuelven a abrir pronto...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...inkBorder(4),
    backgroundColor: colors.vintageRedDark,
    borderRadius: radii.md,
    padding: 18,
    alignItems: "center",
    overflow: "hidden",
    ...cartoonShadow(5),
  },
  lights: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.vintageRed,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 24,
    color: colors.paperHighlight,
    letterSpacing: 2,
    textShadowColor: colors.ink,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  subtitle: {
    fontFamily: fonts.subheading,
    fontSize: 13,
    color: colors.cream,
    marginTop: 6,
    letterSpacing: 2,
  },
  timer: {
    fontFamily: fonts.numbers,
    fontSize: 40,
    color: colors.antiqueGold,
    marginTop: 6,
    letterSpacing: 3,
    textShadowColor: colors.ink,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  note: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.cream,
    marginTop: 4,
    fontStyle: "italic",
  },
});
