import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { HapticTab } from "@/components/haptic-tab";
import { TabBarIcon } from "@/components/anim";

const PRIMARY = "#1f6f43"; // brand green — active tab (was blue in the reference)
const INK_3 = "#7f857f";
const LINE = "#e1dcd3";

type IonName = keyof typeof Ionicons.glyphMap;

// Five tabs: Home · Explore · Saved · Inbox · Account. White bar like the
// reference, but the active tab uses brand green with a filled glyph (the
// reference's blue accent), inactive tabs stay grey outlines.
const TAB_ICON: Record<string, { off: IonName; on: IonName }> = {
  index:   { off: "home-outline",       on: "home" },
  explore: { off: "search-outline",     on: "search" },
  saved:   { off: "heart-outline",      on: "heart" },
  inbox:   { off: "chatbubble-outline", on: "chatbubble" },
  account: { off: "person-outline",     on: "person" },
};

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  // Lift the bar clear of the system gesture / nav area, plus a little
  // breathing room so the icons don't hug the bottom edge.
  const bottomPad = Math.max(insets.bottom, 12) + 6;

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: PRIMARY,
        tabBarInactiveTintColor: INK_3,
        tabBarLabelStyle: {
          fontFamily: "Inter_600SemiBold",
          fontSize: 10,
          letterSpacing: 0.2,
          marginTop: -2,
        },
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopWidth: 0.5,
          borderTopColor: LINE,
          height: 54 + bottomPad,
          paddingTop: 8,
          paddingBottom: bottomPad,
        },
        tabBarIcon: ({ focused, color }) => {
          const icons = TAB_ICON[route.name] ?? TAB_ICON.index;
          return (
            <TabBarIcon
              focused={focused}
              color={color}
              name={focused ? icons.on : icons.off}
              size={23}
            />
          );
        },
      })}
    >
      <Tabs.Screen name="index"   options={{ title: "Home" }} />
      <Tabs.Screen name="explore" options={{ title: "Explore" }} />
      <Tabs.Screen name="saved"   options={{ title: "Saved" }} />
      <Tabs.Screen name="inbox"   options={{ title: "Inbox" }} />
      <Tabs.Screen name="account" options={{ title: "Account" }} />
    </Tabs>
  );
}
