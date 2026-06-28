import { View } from "react-native";
import { Tabs, useSegments } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { HapticTab } from "@/components/haptic-tab";
import { TabBarIcon, MorphingTabIndicator } from "@/components/anim";
import { useTabBarStyle } from "@/hooks/use-tab-bar";

const PRIMARY = "#1f6f43";
const INK_3 = "#7f857f";

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

const TAB_ORDER = ["index", "jobs", "inbox", "earnings", "profile"];

function useActiveTabIndex() {
  const segments = useSegments();
  const last = segments[segments.length - 1] ?? "index";
  const name = last.startsWith("(") ? "index" : last;
  return Math.max(0, TAB_ORDER.indexOf(name));
}

export default function VendorTabLayout() {
  const { tabBarStyle } = useTabBarStyle("rgba(255,255,255,0.96)");
  const activeIndex = useActiveTabIndex();
  const tabBarHeight = Number(tabBarStyle.height ?? 60);

  return (
    <View style={{ flex: 1 }}>
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

      <MorphingTabIndicator
        activeIndex={activeIndex}
        tabCount={TAB_ORDER.length}
        bottom={tabBarHeight - 3}
        color={PRIMARY}
      />
    </View>
  );
}
