import { View } from "react-native";
import { Tabs, useSegments, Redirect, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { HapticTab } from "@/components/haptic-tab";
import { TabBarIcon, MorphingTabIndicator } from "@/components/anim";
import { useTabBarStyle } from "@/hooks/use-tab-bar";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useAuth } from "@/context/auth";

const PRIMARY = "#1f6f43";
const INK_3 = "#7f857f";
const BADGE = "#e5484d";

type IonName = keyof typeof Ionicons.glyphMap;

// Five agent tabs: Home (dashboard) · Listings · Leads · Inbox · Profile.
// Mirrors the buyer outline+filled pattern.
const TAB_ICON: Record<string, { off: IonName; on: IonName }> = {
  index:    { off: "grid-outline",       on: "grid"       },
  listings: { off: "home-outline",       on: "home"       },
  leads:    { off: "people-outline",     on: "people"     },
  inbox:    { off: "chatbubble-outline", on: "chatbubble" },
  profile:  { off: "person-outline",     on: "person"     },
};

const TAB_ORDER = ["index", "listings", "leads", "inbox", "profile"];

function useActiveTabIndex() {
  const segments = useSegments();
  const last = segments[segments.length - 1] ?? "index";
  const name = last.startsWith("(") ? "index" : last;
  return Math.max(0, TAB_ORDER.indexOf(name));
}

export default function AgentTabLayout() {
  const { status } = useAuth();
  const { tabBarStyle } = useTabBarStyle("rgba(255,255,255,0.96)");
  const activeIndex = useActiveTabIndex();
  const tabBarHeight = Number(tabBarStyle.height ?? 60);
  const unread = useUnreadMessages();

  // The agent area is account-only (unlike the buyer tabs, which allow guest
  // browsing per App Store 5.1.1). A logged-out user must never see the agent
  // dashboard/listings/profile — even with placeholder data — so gate the whole
  // group here and send guests to welcome to log in or create an account.
  // Hooks above run unconditionally to satisfy the rules of hooks.
  if (status === "guest") return <Redirect href={"/welcome" as Href} />;
  if (status !== "authed") return null; // session still resolving; BootGate covers the screen

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
        <Tabs.Screen name="listings" options={{ title: "Listings" }} />
        <Tabs.Screen name="leads"    options={{ title: "Leads" }} />
        <Tabs.Screen
          name="inbox"
          options={{
            title: "Inbox",
            tabBarBadge: unread > 0 ? (unread > 99 ? "99+" : unread) : undefined,
            tabBarBadgeStyle: { backgroundColor: BADGE, color: "#ffffff", fontSize: 10 },
          }}
        />
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
