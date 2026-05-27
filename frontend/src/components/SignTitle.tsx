// Big sepia/ink title used as the casino sign on top of each screen.

import { StyleSheet, Text, View } from "react-native";

import { colors, fonts } from "@/src/theme";

type Props = {
  title: string;
  subtitle?: string;
  testID?: string;
};

export function SignTitle({ title, subtitle, testID }: Props) {
  return (
    <View style={styles.wrap} testID={testID}>
      <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
        {title}
      </Text>
      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      <View style={styles.divider} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingVertical: 4,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 30,
    color: colors.ink,
    letterSpacing: 2,
    textShadowColor: colors.antiqueGold,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  subtitle: {
    fontFamily: fonts.subheading,
    fontSize: 14,
    color: colors.inkSoft,
    letterSpacing: 4,
    marginTop: 2,
    textTransform: "uppercase",
  },
  divider: {
    width: "50%",
    height: 2,
    backgroundColor: colors.ink,
    marginTop: 8,
    opacity: 0.4,
  },
});
