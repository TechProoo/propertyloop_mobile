import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { HapticTab } from "@/components/haptic-tab";

const PRIMARY = "#1f6f43";
const INK_3 = "#7f857f";
const LINE = "#e1dcd3";

type IonName = keyof typeof Ionicons.glyphMap;

// Five vendor tabs: Home (today + queue), Jobs (schedule), Inbox,
// Earnings, Profile.
const TAB_ICON: Record<string, { off: IonName; on: IonName }> = {
  index:    { off: "grid-outline",           on: "grid"           },
  jobs:     { off: "calendar-outline",       on: "calendar"       },
  inbox:    { off: "chatbubble-outline",     on: "chatbubble"     },
  earnings: { off: "wallet-outline",         on: "wallet"         },
  profile:  { off: "person-outline",         on: "person"         },
};

export default function VendorTabLayout() {
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
      <Tabs.Screen name="index"    options={{ title: "Home" }} />
      <Tabs.Screen name="jobs"     options={{ title: "Jobs" }} />
      <Tabs.Screen name="inbox"    options={{ title: "Inbox" }} />
      <Tabs.Screen name="earnings" options={{ title: "Earnings" }} />
      <Tabs.Screen name="profile"  options={{ title: "Profile" }} />
    </Tabs>
  );
}
