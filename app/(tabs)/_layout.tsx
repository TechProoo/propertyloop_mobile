import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { HapticTab } from "@/components/haptic-tab";
import { TabBarIcon } from "@/components/anim";
import { useTabBarStyle } from "@/hooks/use-tab-bar";

const PRIMARY = "#1f6f43"; // brand green — active tab (was blue in the reference)
const INK_3 = "#7f857f";

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
  const { tabBarStyle } = useTabBarStyle("#ffffff");

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
        tabBarStyle,
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
