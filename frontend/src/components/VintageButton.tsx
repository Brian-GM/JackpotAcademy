// Hand-painted, bouncy vintage button. Supports primary (red) / gold / wood variants.

import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { ReactNode, useRef } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from "react-native-reanimated";

import { cartoonShadow, colors, fonts, inkBorder, radii } from "@/src/theme";

type Variant = "red" | "gold" | "wood" | "cream";

type Props = {
  label?: string;
  children?: ReactNode;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  style?: ViewStyle;
  testID?: string;
};

const VARIANTS: Record<Variant, { bg: string; text: string }> = {
  red: { bg: colors.vintageRed, text: colors.paperHighlight },
  gold: { bg: colors.antiqueGold, text: colors.ink },
  wood: { bg: colors.wornWood, text: colors.paperHighlight },
  cream: { bg: colors.cream, text: colors.ink },
};

export function VintageButton({
  label,
  children,
  onPress,
  variant = "red",
  disabled,
  size = "md",
  style,
  testID,
}: Props) {
  const scale = useSharedValue(1);
  const lastPress = useRef(0);
  const palette = VARIANTS[variant];

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = () => {
    const now = Date.now();
    if (now - lastPress.current < 200) return; // debounce double presses
    lastPress.current = now;
    scale.value = withSequence(
      withSpring(0.9, { damping: 9, stiffness: 220 }),
      withSpring(1.05, { damping: 6, stiffness: 200 }),
      withSpring(1, { damping: 8, stiffness: 200 }),
    );
    onPress?.();
  };

  const padding =
    size === "lg" ? { paddingVertical: 18, paddingHorizontal: 28 } : size === "sm" ? { paddingVertical: 8, paddingHorizontal: 14 } : { paddingVertical: 12, paddingHorizontal: 20 };

  const fontSize = size === "lg" ? 22 : size === "sm" ? 14 : 17;

  return (
    <Animated.View style={[animStyle, style]}>
      <Pressable
        testID={testID}
        onPress={disabled ? undefined : handlePress}
        style={({ pressed }) => [
          styles.btn,
          padding,
          { backgroundColor: palette.bg, opacity: disabled ? 0.5 : 1 },
          pressed && !disabled && styles.pressed,
        ]}
      >
        <View style={styles.innerBorder} pointerEvents="none" />
        {children ? (
          children
        ) : (
          <Text style={[styles.label, { color: palette.text, fontSize }]} numberOfLines={1}>
            {label}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  btn: {
    ...inkBorder(3),
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
    ...cartoonShadow(4),
  },
  innerBorder: {
    position: "absolute",
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "rgba(44,30,22,0.35)",
  },
  pressed: {
    transform: [{ translateY: 2 }],
  },
  label: {
    fontFamily: fonts.heading,
    letterSpacing: 1.5,
    textAlign: "center",
  },
});
