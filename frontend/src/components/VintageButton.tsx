// Marquee-bulb pill button — Jackpot Academy style.
// Gold outer ring with chasing/static light bulbs around the perimeter,
// solid colored interior, bold white serif label, optional icon badge on left.

import { Image, ImageSourcePropType, Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { ReactNode, useRef } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import { FontAwesome5 } from "@expo/vector-icons";

import { cartoonShadow, colors, fonts, goldBorder, radii } from "@/src/theme";

type Variant = "red" | "green" | "purple" | "gold" | "brown" | "wood" | "cream";

type Props = {
  label?: string;
  children?: ReactNode;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  style?: ViewStyle;
  testID?: string;
  icon?: string;
  imageSource?: ImageSourcePropType;
};

const VARIANTS: Record<Variant, { bg: string; text: string; iconBg: string }> = {
  red: { bg: colors.vintageRed, text: colors.paperHighlight, iconBg: colors.vintageRedDark },
  green: { bg: colors.vintageGreen, text: colors.paperHighlight, iconBg: colors.vintageGreenDark },
  purple: { bg: colors.vintagePurple, text: colors.paperHighlight, iconBg: colors.vintagePurpleDark },
  gold: { bg: colors.antiqueGold, text: colors.bgDark, iconBg: colors.antiqueGoldDark },
  brown: { bg: colors.brassDark, text: colors.paperHighlight, iconBg: colors.bgDark },
  wood: { bg: colors.brassDark, text: colors.paperHighlight, iconBg: colors.bgDark },
  cream: { bg: colors.cream, text: colors.ink, iconBg: colors.paperPrimary },
};

function Bulb({ left, top, size = 4 }: { left?: number | string; top?: number | string; size?: number }) {
  return (
    <View
      style={[
        styles.bulb,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          left: left as number,
          top: top as number,
        },
      ]}
    />
  );
}

export function VintageButton({
  label,
  children,
  onPress,
  variant = "red",
  disabled,
  size = "md",
  style,
  testID,
  icon,
  imageSource,
}: Props) {
  const scale = useSharedValue(1);
  const lastPress = useRef(0);
  const palette = VARIANTS[variant];

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = () => {
    const now = Date.now();
    if (now - lastPress.current < 200) return;
    lastPress.current = now;
    scale.value = withSequence(
      withSpring(0.92, { damping: 9, stiffness: 220 }),
      withSpring(1.04, { damping: 6, stiffness: 200 }),
      withSpring(1, { damping: 8, stiffness: 200 }),
    );
    onPress?.();
  };

  const padding =
    size === "lg"
      ? { paddingVertical: 14, paddingHorizontal: 22 }
      : size === "sm"
        ? { paddingVertical: 6, paddingHorizontal: 12 }
        : { paddingVertical: 10, paddingHorizontal: 18 };

  const fontSize = size === "lg" ? 18 : size === "sm" ? 12 : 15;
  const iconSize = size === "lg" ? 28 : size === "sm" ? 14 : 20;
  const badgeSize = size === "lg" ? 40 : size === "sm" ? 24 : 32;
  const bulbCount = size === "lg" ? 9 : size === "sm" ? 5 : 7;
  const bulbsTop: number[] = [];
  for (let i = 1; i <= bulbCount; i++) {
    bulbsTop.push(i * (100 / (bulbCount + 1)));
  }

  return (
    <Animated.View style={[animStyle, style]}>
      <Pressable
        testID={testID}
        onPress={disabled ? undefined : handlePress}
        style={({ pressed }) => [
          styles.btn,
          { backgroundColor: palette.bg, opacity: disabled ? 0.4 : 1 },
          pressed && !disabled && styles.pressed,
        ]}
      >
        {/* Top bulb row */}
        {bulbsTop.map((pct, i) => (
          <Bulb key={`t${i}`} left={`${pct}%` as unknown as number} top={-2} />
        ))}
        {/* Bottom bulb row */}
        {bulbsTop.map((pct, i) => (
          <Bulb key={`b${i}`} left={`${pct}%` as unknown as number} top={undefined} />
        ))}
        <View style={styles.bulbsBottomWrap}>
          {bulbsTop.map((pct, i) => (
            <View
              key={`bb${i}`}
              style={[styles.bulb, { width: 4, height: 4, borderRadius: 2, left: `${pct}%` as unknown as number, bottom: -2 }]}
            />
          ))}
        </View>

        <View style={[styles.innerRow, padding]}>
          {!!imageSource && (
            <View style={[styles.iconBadge, { backgroundColor: palette.iconBg, width: badgeSize, height: badgeSize, borderRadius: badgeSize / 2 }]}>
              <Image source={imageSource} style={{ width: iconSize, height: iconSize }} resizeMode="contain" />
            </View>
          )}
          {!!icon && !imageSource && (
            <View style={[styles.iconBadge, { backgroundColor: palette.iconBg, width: badgeSize, height: badgeSize, borderRadius: badgeSize / 2 }]}>
              <FontAwesome5 name={icon} size={iconSize - 8} color={palette.text} solid />
            </View>
          )}
          {children ? (
            children
          ) : (
            <Text
              style={[styles.label, { color: palette.text, fontSize }]}
              numberOfLines={1}
            >
              {label}
            </Text>
          )}
          {(!!icon || !!imageSource) && <View style={{ width: badgeSize + 8 }} />}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  btn: {
    ...goldBorder(2),
    borderRadius: radii.pill,
    ...cartoonShadow(3),
    overflow: "visible",
    position: "relative",
  },
  pressed: {
    transform: [{ translateY: 1 }],
  },
  innerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  label: {
    fontFamily: fonts.heading,
    letterSpacing: 1.5,
    textAlign: "center",
    flex: 1,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },
  bulb: {
    position: "absolute",
    backgroundColor: colors.antiqueGold,
    shadowColor: colors.antiqueGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: colors.antiqueGoldDark,
  },
  bulbsBottomWrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
