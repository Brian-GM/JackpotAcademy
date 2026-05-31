// Dark vintage background. Uses a deep brown/black with subtle paper grain overlay.

import { ImageBackground, StyleSheet, View, ViewStyle } from "react-native";
import { ReactNode } from "react";

import { colors } from "@/src/theme";

const PAPER = require("../../assets/images/worn-paper.png");

type Props = {
  children: ReactNode;
  style?: ViewStyle;
  variant?: "dark" | "paper";
};

export function PaperBackground({ children, style, variant = "dark" }: Props) {
  if (variant === "paper") {
    return (
      <ImageBackground
        source={PAPER}
        resizeMode="cover"
        style={[styles.bg, { backgroundColor: colors.paperPrimary }, style]}
        imageStyle={styles.image}
      >
        {children}
      </ImageBackground>
    );
  }
  return (
    <View style={[styles.bg, { backgroundColor: colors.bgDark }, style]}>
      <ImageBackground
        source={PAPER}
        resizeMode="cover"
        style={StyleSheet.absoluteFill}
        imageStyle={{ opacity: 0.06 }}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  image: {
    opacity: 0.85,
  },
});
