import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { HapticTab } from "@/components/haptic-tab";

const PRIMARY = "#1f6f43";
const INK_3 = "#7f857f";
const LINE = "#e1dcd3";

type IonName = keyof typeof Ionicons.glyphMap;

// Five tabs per the Claude Design bundle: Home · Explore · Saved · Inbox
// · Account. Each tab uses the Ionicons outline/filled pair so the
// active tab visibly thickens without shipping a separate sprite sheet.
const TAB_ICON: Record<string, { off: IonName; on: IonName }> = {
  index:   { off: "home-outline",        on: "home" },
  explore: { off: "search-outline",      on: "search" },
  saved:   { off: "heart-outline",       on: "heart" },
  inbox:   { off: "chatbubble-outline",  on: "chatbubble" },
  account: { off: "person-outline",      on: "person" },
};

export default function TabLayout() {
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
          backgroundColor: "rgba(255,255,255,0.96)",
          borderTopWidth: 0.5,
          borderTopColor: LINE,
          height: Platform.OS === "ios" ? 84 : 64,
          paddingTop: 8,
          paddingBottom: Platform.OS === "ios" ? 24 : 10,
        },
        tabBarIcon: ({ focused, color }) => {
          const icons = TAB_ICON[route.name] ?? TAB_ICON.index;
          return (
            <Ionicons
              name={focused ? icons.on : icons.off}
              size={22}
              color={color}
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
