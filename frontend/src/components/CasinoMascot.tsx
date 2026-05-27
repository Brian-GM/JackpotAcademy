// Casino Mascot — a vintage 1930s cartoon character built entirely from View shapes
// (no external assets). Supports several emotional states with rubber-hose animations.

import { useEffect } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
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

export type MascotState = "idle" | "cheer" | "sad" | "spin" | "wave";

type Props = {
  state: MascotState;
  size?: number;
  style?: ViewStyle;
};

/**
 * Casino Mascot "Mr. Brass": a top-hat wearing brass-coin-headed cartoon
 * with rubber-hose limbs. All drawing is done with positioned Views — no SVG.
 */
export function CasinoMascot({ state, size = 140, style }: Props) {
  const bob = useSharedValue(0);
  const armL = useSharedValue(0);
  const armR = useSharedValue(0);
  const spin = useSharedValue(0);
  const sparkle = useSharedValue(0);
  const mouthOpen = useSharedValue(0);
  const eyeStretch = useSharedValue(0);

  useEffect(() => {
    // reset all animations
    bob.value = 0;
    armL.value = 0;
    armR.value = 0;
    spin.value = 0;
    sparkle.value = 0;
    mouthOpen.value = 0;
    eyeStretch.value = 0;

    if (state === "idle") {
      bob.value = withRepeat(
        withSequence(
          withTiming(-4, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
          withTiming(4, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
      armL.value = withRepeat(withSequence(withTiming(-8, { duration: 1100 }), withTiming(8, { duration: 1100 })), -1, true);
      armR.value = withRepeat(withSequence(withTiming(8, { duration: 1100 }), withTiming(-8, { duration: 1100 })), -1, true);
    } else if (state === "cheer") {
      bob.value = withRepeat(
        withSequence(
          withTiming(-14, { duration: 350, easing: Easing.out(Easing.exp) }),
          withSpring(0, { damping: 4, stiffness: 200 }),
        ),
        -1,
        false,
      );
      armL.value = withRepeat(
        withSequence(withTiming(-110, { duration: 300 }), withTiming(-90, { duration: 300 })),
        -1,
        true,
      );
      armR.value = withRepeat(
        withSequence(withTiming(110, { duration: 300 }), withTiming(90, { duration: 300 })),
        -1,
        true,
      );
      mouthOpen.value = withRepeat(
        withSequence(withTiming(1, { duration: 250 }), withTiming(0.6, { duration: 250 })),
        -1,
        true,
      );
      sparkle.value = withRepeat(withTiming(1, { duration: 800 }), -1, false);
      eyeStretch.value = withRepeat(
        withSequence(withTiming(1.2, { duration: 250 }), withTiming(1, { duration: 250 })),
        -1,
        true,
      );
    } else if (state === "sad") {
      bob.value = withRepeat(
        withSequence(
          withTiming(2, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
          withTiming(-2, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      );
      armL.value = withTiming(45, { duration: 400 }); // drooped down
      armR.value = withTiming(-45, { duration: 400 });
      mouthOpen.value = -1; // frown
    } else if (state === "spin") {
      spin.value = withRepeat(withTiming(360, { duration: 600, easing: Easing.linear }), -1, false);
      armL.value = withTiming(-80, { duration: 200 });
      armR.value = withTiming(80, { duration: 200 });
    } else if (state === "wave") {
      armR.value = withRepeat(
        withSequence(
          withTiming(-130, { duration: 400 }),
          withTiming(-100, { duration: 400 }),
        ),
        -1,
        true,
      );
      bob.value = withRepeat(
        withSequence(withTiming(-6, { duration: 600 }), withTiming(6, { duration: 600 })),
        -1,
        true,
      );
    }
  }, [state, bob, armL, armR, spin, sparkle, mouthOpen, eyeStretch]);

  const bodyAnim = useAnimatedStyle(() => ({
    transform: [{ translateY: bob.value }, { rotate: `${spin.value}deg` }],
  }));
  const armLAnim = useAnimatedStyle(() => ({
    transform: [{ rotate: `${armL.value}deg` }],
  }));
  const armRAnim = useAnimatedStyle(() => ({
    transform: [{ rotate: `${armR.value}deg` }],
  }));
  const mouthAnim = useAnimatedStyle(() => ({
    height: mouthOpen.value > 0 ? 14 + 10 * mouthOpen.value : 6,
    borderTopLeftRadius: mouthOpen.value >= 0 ? 0 : 12,
    borderTopRightRadius: mouthOpen.value >= 0 ? 0 : 12,
    borderBottomLeftRadius: mouthOpen.value >= 0 ? 12 : 0,
    borderBottomRightRadius: mouthOpen.value >= 0 ? 12 : 0,
  }));
  const sparkleAnim1 = useAnimatedStyle(() => ({
    opacity: sparkle.value > 0 ? 1 - sparkle.value : 0,
    transform: [{ scale: 0.5 + sparkle.value }, { translateX: -sparkle.value * 70 }, { translateY: -sparkle.value * 30 }],
  }));
  const sparkleAnim2 = useAnimatedStyle(() => ({
    opacity: sparkle.value > 0 ? 1 - sparkle.value : 0,
    transform: [{ scale: 0.5 + sparkle.value }, { translateX: sparkle.value * 70 }, { translateY: -sparkle.value * 30 }],
  }));
  const eyeAnim = useAnimatedStyle(() => ({
    transform: [{ scaleX: eyeStretch.value ? eyeStretch.value : 1 }],
  }));

  const headSize = size * 0.6;
  const bodySize = size * 0.45;

  return (
    <View style={[styles.wrap, { width: size, height: size * 1.4 }, style]} pointerEvents="none">
      {/* Sparkles for cheer */}
      <Animated.Text style={[styles.sparkle, { top: size * 0.1, left: size * 0.45 }, sparkleAnim1]}>
        ✨
      </Animated.Text>
      <Animated.Text style={[styles.sparkle, { top: size * 0.1, right: size * 0.45 }, sparkleAnim2]}>
        ✨
      </Animated.Text>

      <Animated.View style={[styles.body, bodyAnim]}>
        {/* Top hat */}
        <View
          style={[
            styles.hatBrim,
            { width: headSize * 1.2, height: headSize * 0.08, top: 0 },
          ]}
        />
        <View
          style={[
            styles.hatTop,
            {
              width: headSize * 0.7,
              height: headSize * 0.55,
              top: -headSize * 0.5,
              left: (headSize * 1.2 - headSize * 0.7) / 2,
            },
          ]}
        >
          <View style={styles.hatBand} />
        </View>

        {/* Head — brass coin */}
        <View
          style={[
            styles.head,
            { width: headSize, height: headSize, top: headSize * 0.08, left: (headSize * 1.2 - headSize) / 2 },
          ]}
        >
          {/* Eyes */}
          <View style={[styles.eyeRow, { top: headSize * 0.32 }]}>
            <Animated.View style={[styles.eye, eyeAnim]} />
            <Animated.View style={[styles.eye, eyeAnim]} />
          </View>
          {/* Mouth */}
          <View style={[styles.mouthWrap, { top: headSize * 0.6 }]}>
            <Animated.View style={[styles.mouth, mouthAnim]}>
              {/* tongue */}
              <View style={styles.tongue} />
            </Animated.View>
          </View>
          {/* Cheeks */}
          <View style={[styles.cheek, { left: headSize * 0.05, top: headSize * 0.55 }]} />
          <View style={[styles.cheek, { right: headSize * 0.05, top: headSize * 0.55 }]} />
        </View>

        {/* Body — bowtie + suit */}
        <View
          style={[
            styles.suit,
            {
              width: bodySize,
              height: bodySize * 0.8,
              top: headSize + headSize * 0.05,
              left: (headSize * 1.2 - bodySize) / 2,
            },
          ]}
        >
          <View style={styles.bowtie} />
        </View>

        {/* Arms (rubber-hose) */}
        <Animated.View
          style={[
            styles.arm,
            armLAnim,
            {
              top: headSize + headSize * 0.1,
              left: -headSize * 0.05,
              width: headSize * 0.5,
            },
          ]}
        >
          <View style={styles.hand} />
        </Animated.View>
        <Animated.View
          style={[
            styles.arm,
            armRAnim,
            {
              top: headSize + headSize * 0.1,
              right: -headSize * 0.05,
              width: headSize * 0.5,
              transformOrigin: "right",
            },
          ]}
        >
          <View style={[styles.hand, { right: -8, left: undefined }]} />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "flex-end",
  },
  body: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    position: "relative",
  },
  hatBrim: {
    position: "absolute",
    backgroundColor: colors.ink,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.ink,
    alignSelf: "center",
    left: "50%",
    transform: [{ translateX: "-50%" }],
  },
  hatTop: {
    position: "absolute",
    backgroundColor: colors.ink,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 4,
  },
  hatBand: {
    position: "absolute",
    bottom: "20%",
    left: 0,
    right: 0,
    height: "15%",
    backgroundColor: colors.vintageRed,
  },
  head: {
    position: "absolute",
    backgroundColor: colors.antiqueGold,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: colors.ink,
    overflow: "hidden",
  },
  eyeRow: {
    position: "absolute",
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: "18%",
  },
  eye: {
    width: 10,
    height: 14,
    backgroundColor: colors.ink,
    borderRadius: 5,
  },
  mouthWrap: {
    position: "absolute",
    width: "100%",
    alignItems: "center",
  },
  mouth: {
    width: 24,
    height: 10,
    backgroundColor: colors.ink,
    overflow: "hidden",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  tongue: {
    width: 16,
    height: 6,
    backgroundColor: colors.vintageRed,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  cheek: {
    position: "absolute",
    width: 10,
    height: 6,
    backgroundColor: "rgba(166,44,43,0.4)",
    borderRadius: 6,
  },
  suit: {
    position: "absolute",
    backgroundColor: colors.wornWoodDark,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: colors.ink,
    alignItems: "center",
    paddingTop: 6,
  },
  bowtie: {
    width: 18,
    height: 10,
    backgroundColor: colors.vintageRed,
    borderWidth: 2,
    borderColor: colors.ink,
    transform: [{ rotate: "0deg" }],
  },
  arm: {
    position: "absolute",
    height: 8,
    backgroundColor: colors.antiqueGold,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.ink,
    transformOrigin: "left",
  },
  hand: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.paperHighlight,
    borderWidth: 2,
    borderColor: colors.ink,
    left: -8,
    top: -5,
  },
  sparkle: {
    position: "absolute",
    fontSize: 20,
  },
});
