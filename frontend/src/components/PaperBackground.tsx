// Reusable worn paper background. Children render over a sepia ImageBackground.

import { ImageBackground, StyleSheet, View, ViewStyle } from "react-native";
import { ReactNode } from "react";

import { colors } from "@/src/theme";

const PAPER = require("../../assets/images/worn-paper.png");

type Props = {
  children: ReactNode;
  style?: ViewStyle;
  overlay?: boolean;
};

export function PaperBackground({ children, style, overlay = true }: Props) {
  return (
    <ImageBackground
      source={PAPER}
      resizeMode="cover"
      style={[styles.bg, style]}
      imageStyle={styles.image}
    >
      {overlay && <View style={styles.overlay} pointerEvents="none" />}
      {children}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: colors.paperPrimary,
  },
  image: {
    opacity: 0.85,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(230, 213, 184, 0.25)",
  },
});
