// SunburstRays — animated rotating rays behind a jackpot/win. SVG-free using View transforms.

import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

import { colors } from "@/src/theme";

type Props = {
  size?: number;
  rayCount?: number;
  color?: string;
  altColor?: string;
  speed?: number;
};

export function SunburstRays({
  size = 320,
  rayCount = 16,
  color = colors.antiqueGold,
  altColor = colors.vintageRed,
  speed = 8000,
}: Props) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: speed, easing: Easing.linear }),
      -1,
      false,
    );
  }, [rotation, speed]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={[styles.wrap, { width: size, height: size }, animStyle]} pointerEvents="none">
      {Array.from({ length: rayCount }).map((_, i) => {
        const angle = (360 / rayCount) * i;
        const isAlt = i % 2 === 0;
        return (
          <View
            key={i}
            style={[
              styles.ray,
              {
                width: size,
                height: size * 0.06,
                top: size / 2 - (size * 0.06) / 2,
                left: 0,
                backgroundColor: isAlt ? color : altColor,
                transform: [{ rotate: `${angle}deg` }],
                opacity: 0.55,
              },
            ]}
          />
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  ray: {
    position: "absolute",
  },
});
