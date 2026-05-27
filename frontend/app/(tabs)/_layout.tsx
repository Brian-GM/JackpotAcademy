import { Tabs } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { cartoonShadow, colors, fonts, goldBorder } from "@/src/theme";

type TabIconProps = { name: string; color: string; focused: boolean };

function TabIcon({ name, color, focused }: TabIconProps) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconFocused]}>
      <FontAwesome5 name={name} size={focused ? 22 : 18} color={color} solid />
    </View>
  );
}

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text
      numberOfLines={1}
      style={[styles.label, { color: focused ? colors.antiqueGold : colors.cream }]}
    >
      {label}
    </Text>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.antiqueGold,
        tabBarInactiveTintColor: colors.cream,
        tabBarShowLabel: true,
      }}
    >
      <Tabs.Screen
        name="inicio"
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label="Inicio" focused={focused} />,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="home" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="estudio"
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label="Estudio" focused={focused} />,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="book" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="ruleta"
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label="Ruleta" focused={focused} />,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="compass" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="casino"
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label="Casino" focused={focused} />,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="dice" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="premios"
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label="Premios" focused={focused} />,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="gift" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="ajustes"
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label="Ajustes" focused={focused} />,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="cog" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.bgDarker,
    height: 70,
    paddingTop: 6,
    paddingBottom: 8,
    ...cartoonShadow(0),
    borderTopWidth: 2,
    borderTopColor: colors.antiqueGold,
  },
  iconWrap: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
  },
  iconFocused: {
    backgroundColor: colors.bgPanel,
    ...goldBorder(2),
  },
  label: {
    fontFamily: fonts.subheading,
    fontSize: 10,
    letterSpacing: 1,
  },
});
