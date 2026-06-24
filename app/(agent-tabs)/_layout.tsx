import { useState } from "react";
import { useWindowDimensions, View } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { HapticTab } from "@/components/haptic-tab";
import { TabBarIcon, MorphingTabIndicator } from "@/components/anim";
import { useTabBarStyle } from "@/hooks/use-tab-bar";

const PRIMARY = "#1f6f43";
const INK_3 = "#7f857f";

type IonName = keyof typeof Ionicons.glyphMap;
type TabName = "index" | "listings" | "leads" | "inbox" | "profile";

const TAB_ICON: Record<TabName, { off: IonName; on: IonName }> = {
  index:    { off: "grid-outline",       on: "grid"       },
  listings: { off: "home-outline",       on: "home"       },
  leads:    { off: "people-outline",     on: "people"     },
  inbox:    { off: "chatbubble-outline", on: "chatbubble" },
  profile:  { off: "person-outline",     on: "person"     },
};

const TAB_ORDER: TabName[] = ["index", "listings", "leads", "inbox", "profile"];

function getTabIndex(routeName: string): number {
  return TAB_ORDER.indexOf(routeName as TabName);
}

export default function AgentTabLayout() {
  const { tabBarStyle } = useTabBarStyle("rgba(255,255,255,0.96)");
  const { width: screenWidth } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);

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
        tabBarStyle: [
          tabBarStyle,
          { position: "relative" },
        ],
        tabBarIcon: ({ focused, color }) => {
          const icons = TAB_ICON[route.name as TabName] ?? TAB_ICON.index;
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
      sceneContainerStyle={{ backgroundColor: "#ffffff" }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          listeners: () => ({
            focus: () => setActiveIndex(getTabIndex("index")),
          }),
        }}
      />
      <Tabs.Screen
        name="listings"
        options={{
          title: "Listings",
          listeners: () => ({
            focus: () => setActiveIndex(getTabIndex("listings")),
          }),
        }}
      />
      <Tabs.Screen
        name="leads"
        options={{
          title: "Leads",
          listeners: () => ({
            focus: () => setActiveIndex(getTabIndex("leads")),
          }),
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: "Inbox",
          listeners: () => ({
            focus: () => setActiveIndex(getTabIndex("inbox")),
          }),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          listeners: () => ({
            focus: () => setActiveIndex(getTabIndex("profile")),
          }),
        }}
      />

      {/* Morphing indicator overlay */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
        }}
      >
        <MorphingTabIndicator
          activeIndex={activeIndex}
          tabCount={5}
          containerWidth={screenWidth}
          color={PRIMARY}
          height={2.5}
          bottom={0}
        />
      </View>
    </Tabs>
  );
}
