// Casino Mascot — vintage clown joker. Uses cropped sprites from the asset sheet
// + reanimated transforms for bouncing/wobbling reactions.

import { useEffect } from "react";
import { Image, StyleSheet, View, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  Easing,
} from "react-native-reanimated";

import { colors } from "@/src/theme";

const MAIN = require("../../assets/images/mascot-main.png");
const CHEER = require("../../assets/images/mascot-cheer.png");
const STUDY = require("../../assets/images/mascot-study.png");

export type MascotState = "idle" | "cheer" | "sad" | "spin" | "wave" | "study";

type Props = {
  state: MascotState;
  size?: number;
  style?: ViewStyle;
};

export function CasinoMascot({ state, size = 140, style }: Props) {
  const bob = useSharedValue(0);
  const rotate = useSharedValue(0);
  const spin = useSharedValue(0);
  const sparkleA = useSharedValue(0);
  const sparkleB = useSharedValue(0);

  useEffect(() => {
    bob.value = 0;
    rotate.value = 0;
    spin.value = 0;
    sparkleA.value = 0;
    sparkleB.value = 0;

    if (state === "idle" || state === "wave") {
      bob.value = withRepeat(
        withSequence(
          withTiming(-4, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
          withTiming(4, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
      rotate.value = withRepeat(
        withSequence(withTiming(-2, { duration: 1100 }), withTiming(2, { duration: 1100 })),
        -1,
        true,
      );
    } else if (state === "cheer") {
      bob.value = withRepeat(
        withSequence(
          withTiming(-18, { duration: 300, easing: Easing.out(Easing.exp) }),
          withSpring(0, { damping: 4, stiffness: 200 }),
        ),
        -1,
        false,
      );
      rotate.value = withRepeat(
        withSequence(withTiming(-5, { duration: 300 }), withTiming(5, { duration: 300 })),
        -1,
        true,
      );
      sparkleA.value = withRepeat(withTiming(1, { duration: 900 }), -1, false);
      sparkleB.value = withRepeat(withTiming(1, { duration: 1100 }), -1, false);
    } else if (state === "sad") {
      bob.value = withRepeat(
        withSequence(
          withTiming(3, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
          withTiming(-3, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      );
      rotate.value = withTiming(0);
    } else if (state === "spin") {
      spin.value = withRepeat(withTiming(360, { duration: 700, easing: Easing.linear }), -1, false);
    } else if (state === "study") {
      bob.value = withRepeat(
        withSequence(withTiming(-2, { duration: 1400 }), withTiming(2, { duration: 1400 })),
        -1,
        true,
      );
    }
  }, [state, bob, rotate, spin, sparkleA, sparkleB]);

  const bodyAnim = useAnimatedStyle(() => ({
    transform: [
      { translateY: bob.value },
      { rotate: `${rotate.value}deg` },
      { rotate: `${spin.value}deg` },
    ],
  }));

  const sparkleAAnim = useAnimatedStyle(() => ({
    opacity: sparkleA.value > 0 && sparkleA.value < 1 ? 1 - sparkleA.value : 0,
    transform: [
      { translateX: -size * 0.4 * sparkleA.value },
      { translateY: -size * 0.3 * sparkleA.value },
      { scale: 0.4 + sparkleA.value * 1.2 },
    ],
  }));
  const sparkleBAnim = useAnimatedStyle(() => ({
    opacity: sparkleB.value > 0 && sparkleB.value < 1 ? 1 - sparkleB.value : 0,
    transform: [
      { translateX: size * 0.4 * sparkleB.value },
      { translateY: -size * 0.35 * sparkleB.value },
      { scale: 0.4 + sparkleB.value * 1.2 },
    ],
  }));

  const sad = state === "sad";
  const useSheet = state === "cheer" ? CHEER : state === "study" ? STUDY : MAIN;

  return (
    <View
      style={[styles.wrap, { width: size, height: size * 1.45 }, style]}
      pointerEvents="none"
    >
      {state === "cheer" && (
        <>
          <Animated.Text style={[styles.sparkle, { top: size * 0.15 }, sparkleAAnim]}>✨</Animated.Text>
          <Animated.Text style={[styles.sparkle, { top: size * 0.1 }, sparkleBAnim]}>⭐</Animated.Text>
        </>
      )}
      <Animated.View
        style={[
          styles.imageWrap,
          { width: size, height: size * 1.4, opacity: sad ? 0.7 : 1 },
          bodyAnim,
        ]}
      >
        <Image source={useSheet} style={styles.image} resizeMode="contain" />
      </Animated.View>
      {sad && (
        <View style={[styles.sadOverlay, { width: size * 0.3, height: size * 0.3 }]}>
          <View style={styles.tearDrop} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "flex-end",
    position: "relative",
  },
  imageWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  sparkle: {
    position: "absolute",
    fontSize: 28,
  },
  sadOverlay: {
    position: "absolute",
    top: "20%",
    right: "10%",
  },
  tearDrop: {
    width: 8,
    height: 14,
    backgroundColor: colors.rare,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    transform: [{ rotate: "180deg" }],
  },
});
