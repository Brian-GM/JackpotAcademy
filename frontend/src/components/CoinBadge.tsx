// Coin display with brass image + bouncy animation when value changes.

import { Image, StyleSheet, Text, View } from "react-native";
import { useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from "react-native-reanimated";

import { colors, fonts } from "@/src/theme";

const COIN = require("../../assets/images/brass-coin.png");

type Props = {
  amount: number;
  size?: number;
  testID?: string;
};

export function CoinBadge({ amount, size = 32, testID }: Props) {
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);

  useEffect(() => {
    scale.value = withSequence(
      withSpring(1.25, { damping: 5, stiffness: 200 }),
      withSpring(1, { damping: 8, stiffness: 180 }),
    );
    rotate.value = withSequence(withSpring(-10), withSpring(0));
  }, [amount, scale, rotate]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
  }));

  return (
    <View style={styles.row} testID={testID}>
      <Animated.View style={[animStyle, { width: size, height: size }]}>
        <Image source={COIN} style={{ width: size, height: size }} resizeMode="contain" />
      </Animated.View>
      <Text
        style={[styles.amount, { fontSize: size * 0.7 }]}
        testID="coin-balance-text"
      >
        {amount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  amount: {
    fontFamily: fonts.numbers,
    color: colors.ink,
    letterSpacing: 1.5,
  },
});
