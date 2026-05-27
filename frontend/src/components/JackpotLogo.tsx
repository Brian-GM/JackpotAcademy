// Logo banner with marquee bulbs and ribbon — Jackpot Academy style.

import { Image, StyleSheet, View } from "react-native";

import { MarqueeLights } from "./MarqueeLights";
import { colors } from "@/src/theme";

const LOGO = require("../../assets/images/jackpot-logo.png");

type Props = {
  width?: number;
};

export function JackpotLogo({ width = 280 }: Props) {
  return (
    <View style={[styles.wrap, { width, height: width * 0.9 }]}>
      <Image source={LOGO} style={styles.img} resizeMode="contain" />
    </View>
  );
}

// Keep the helper available so existing usages don't break.
void MarqueeLights;
void colors;

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  img: {
    width: "100%",
    height: "100%",
  },
});
