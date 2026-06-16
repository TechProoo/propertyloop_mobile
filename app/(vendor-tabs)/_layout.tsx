import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { HapticTab } from "@/components/haptic-tab";
import { TabBarIcon } from "@/components/anim";

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
          backgroundColor: "rgba(255,255,255,0.96)",
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
              size={22}
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
