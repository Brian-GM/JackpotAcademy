// MarqueeLights — chasing bulbs around a container, vintage Vegas style.
// Place inside any View with absolute positioning.

import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  interpolate,
  Easing,
} from "react-native-reanimated";

import { colors } from "@/src/theme";

type Props = {
  count?: number;
  size?: number;
  color?: string;
  altColor?: string;
  speed?: number; // duration in ms per bulb
  vertical?: boolean;
};

function Bulb({
  delay,
  duration,
  size,
  color,
  altColor,
}: {
  delay: number;
  duration: number;
  size: number;
  color: string;
  altColor: string;
}) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withDelay(delay, withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false));
  }, [t, delay, duration]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0, 0.2, 0.5, 1], [0.3, 1, 0.3, 0.3]),
    transform: [
      { scale: interpolate(t.value, [0, 0.2, 0.5, 1], [0.85, 1.3, 0.85, 0.85]) },
    ],
    backgroundColor: t.value > 0.2 && t.value < 0.5 ? altColor : color,
  }));

  return (
    <Animated.View
      style={[
        styles.bulb,
        { width: size, height: size, borderRadius: size / 2 },
        animStyle,
      ]}
    />
  );
}

export function MarqueeLights({
  count = 12,
  size = 10,
  color = colors.antiqueGold,
  altColor = colors.vintageRed,
  speed = 1200,
  vertical = false,
}: Props) {
  const items = Array.from({ length: count });
  return (
    <View
      style={[
        styles.row,
        vertical && { flexDirection: "column", justifyContent: "space-around", height: "100%" },
      ]}
    >
      {items.map((_, i) => (
        <Bulb
          key={i}
          delay={(i * speed) / count}
          duration={speed}
          size={size}
          color={color}
          altColor={altColor}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    width: "100%",
  },
  bulb: {
    backgroundColor: colors.antiqueGold,
    shadowColor: colors.antiqueGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },
});
