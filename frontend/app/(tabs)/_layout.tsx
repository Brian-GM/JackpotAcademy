import { Tabs } from "expo-router";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";

import { cartoonShadow, colors, fonts, goldBorder } from "@/src/theme";

// Custom navigation icons
const NAV_HOME = require("../../assets/images/nav-home.png");
const NAV_ESTUDIO = require("../../assets/images/nav-estudio.png");
const NAV_TEMAS = require("../../assets/images/nav-temas.png");
const NAV_CASINO = require("../../assets/images/nav-casino.png");
const NAV_PREMIOS = require("../../assets/images/nav-premios.png");
const NAV_AJUSTES = require("../../assets/images/nav-ajustes.png");

type TabIconProps = { 
  source: any; 
  focused: boolean;
};

function TabIcon({ source, focused }: TabIconProps) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconFocused]}>
      <Image 
        source={source} 
        style={[styles.iconImage, focused && styles.iconImageFocused]} 
        resizeMode="contain" 
      />
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
        tabBarScrollEnabled: true,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tabs.Screen
        name="inicio"
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label="Inicio" focused={focused} />,
          tabBarIcon: ({ focused }) => (
            <TabIcon source={NAV_HOME} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="estudio"
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label="Estudio" focused={focused} />,
          tabBarIcon: ({ focused }) => (
            <TabIcon source={NAV_ESTUDIO} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="temas"
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label="Temas" focused={focused} />,
          tabBarIcon: ({ focused }) => (
            <TabIcon source={NAV_TEMAS} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="casino"
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label="Casino" focused={focused} />,
          tabBarIcon: ({ focused }) => (
            <TabIcon source={NAV_CASINO} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="premios"
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label="Premios" focused={focused} />,
          tabBarIcon: ({ focused }) => (
            <TabIcon source={NAV_PREMIOS} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="ajustes"
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label="Ajustes" focused={focused} />,
          tabBarIcon: ({ focused }) => (
            <TabIcon source={NAV_AJUSTES} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.bgDarker,
    height: 80,
    paddingTop: 4,
    paddingBottom: 6,
    ...cartoonShadow(0),
    borderTopWidth: 2,
    borderTopColor: colors.antiqueGold,
  },
  tabBarItem: {
    minWidth: 50,
    paddingHorizontal: 0,
  },
  iconWrap: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
  },
  iconFocused: {
    backgroundColor: "transparent",
  },
  iconImage: {
    width: 40,
    height: 40,
  },
  iconImageFocused: {
    width: 46,
    height: 46,
  },
  label: {
    fontFamily: fonts.subheading,
    fontSize: 9,
    letterSpacing: 1,
    marginTop: 2,
  },
});
