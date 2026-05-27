// Vintage paper card with thick ink border and inner frame.

import { StyleSheet, View, ViewStyle } from "react-native";
import { ReactNode } from "react";

import { cartoonShadow, colors, inkBorder, radii } from "@/src/theme";

type Props = {
  children: ReactNode;
  style?: ViewStyle;
  innerFrame?: boolean;
  tint?: string;
  testID?: string;
};

export function VintageCard({
  children,
  style,
  innerFrame = true,
  tint = colors.paperSecondary,
  testID,
}: Props) {
  return (
    <View testID={testID} style={[styles.card, { backgroundColor: tint }, style]}>
      {innerFrame && <View style={styles.innerFrame} pointerEvents="none" />}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...inkBorder(3),
    borderRadius: radii.md,
    ...cartoonShadow(4),
    overflow: "hidden",
  },
  innerFrame: {
    position: "absolute",
    top: 5,
    left: 5,
    right: 5,
    bottom: 5,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.ink,
    opacity: 0.4,
  },
  content: {
    padding: 12,
  },
});
