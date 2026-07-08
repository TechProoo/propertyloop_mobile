import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router, useRootNavigationState, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import '../global.css';
import { useEffect, useRef, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth, roleHome } from '@/context/auth';
import vendorsService from '@/api/services/vendors';
import { BootAnimation } from '@/components/brand/BootAnimation';
import { UpdatePrompt } from '@/components/UpdatePrompt';
import { DialogHost } from '@/lib/dialog';
// v0.4 of @expo-google-fonts moved to per-weight subpaths so you only
// bundle the weights you actually use (instead of all 18 variants).
import { useFonts } from '@expo-google-fonts/inter/useFonts';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { PlayfairDisplay_400Regular } from '@expo-google-fonts/playfair-display/400Regular';
import { PlayfairDisplay_400Regular_Italic } from '@expo-google-fonts/playfair-display/400Regular_Italic';
import { PlayfairDisplay_600SemiBold } from '@expo-google-fonts/playfair-display/600SemiBold';

import { useColorScheme } from '@/hooks/use-color-scheme';

// Keep the splash visible until fonts have loaded — flashing a system
// font for one frame and then re-rendering in Inter/Playfair is jarring
// enough to undermine the whole design system.
SplashScreen.preventAutoHideAsync().catch(() => {
  /* already hidden — fine */
});

export const unstable_settings = {
  anchor: 'welcome',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    PlayfairDisplay_400Regular,
    PlayfairDisplay_400Regular_Italic,
    PlayfairDisplay_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  // Hold render until fonts resolve (or error out). With expo-splash-screen
  // up, the user sees the splash, not a blank white screen.
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <KeyboardProvider>
      <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <SessionRedirect />
        <Stack
          initialRouteName="welcome"
          screenOptions={{
            // App-wide push feel: cards slide in from the right with the
            // platform's native gesture-driven back-swipe. Modal screens opt
            // into their own `presentation: 'modal'` per-screen below.
            animation: "slide_from_right",
            animationDuration: 280,
            gestureEnabled: true,
            contentStyle: { backgroundColor: "#ffffff" },
          }}
        >
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="intro" options={{ headerShown: false }} />
        <Stack.Screen name="role-select" options={{ headerShown: false }} />
        <Stack.Screen name="buyer-preferences" options={{ headerShown: false }} />
        <Stack.Screen name="agent-setup" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* Buyer flow — modal-style sheets pushed from the listing detail */}
        <Stack.Screen name="book-viewing" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="make-offer" options={{ headerShown: false, presentation: 'modal' }} />
        {/* Buyer dashboard tributary screens (B4, B5) */}
        <Stack.Screen name="offers" options={{ headerShown: false }} />
        <Stack.Screen name="purchase-progress" options={{ headerShown: false }} />
        {/* Shortlet + rental flow (B7, B8, B9) */}
        <Stack.Screen name="shortlet/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="shortlet-request" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="rental-application" options={{ headerShown: false, presentation: 'modal' }} />
        {/* Service Loop (B10, B11) */}
        <Stack.Screen name="services" options={{ headerShown: false }} />
        <Stack.Screen name="book-service" options={{ headerShown: false, presentation: 'modal' }} />
        {/* Returning user login (R1, R2) */}
        <Stack.Screen name="login" options={{ headerShown: false }} />
        {/* Email verification — "check your inbox" after signup / blocked login */}
        <Stack.Screen name="verify-email-sent" options={{ headerShown: false }} />
        {/* Deep-link landing after Paystack in-app checkout returns to the app */}
        <Stack.Screen name="payment-callback" options={{ headerShown: false }} />
        <Stack.Screen name="forgot-password" options={{ headerShown: false, presentation: 'modal' }} />
        {/* Inbox thread */}
        <Stack.Screen name="conversation/[id]" options={{ headerShown: false }} />
        {/* Returning user landing (R4) */}
        <Stack.Screen name="welcome-back" options={{ headerShown: false }} />
        {/* Linked detail screens (X1–X6) */}
        <Stack.Screen name="service-job/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="offer-action" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="logbook-info" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="search-results" options={{ headerShown: false }} />
        <Stack.Screen name="escrow-info" options={{ headerShown: false, presentation: 'modal' }} />
        {/* Buyer extras — notifications, filters, settings, payment, logbook, KYC, help */}
        <Stack.Screen name="notifications" options={{ headerShown: false }} />
        <Stack.Screen name="filters" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="logbook/[propertyId]" options={{ headerShown: false }} />
        <Stack.Screen name="help" options={{ headerShown: false }} />
        {/* Polish-pass screens */}
        <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
        <Stack.Screen name="notification-settings" options={{ headerShown: false }} />
        <Stack.Screen name="add-card" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="comps" options={{ headerShown: false }} />
        <Stack.Screen name="new-message" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="terms" options={{ headerShown: false }} />
        <Stack.Screen name="privacy" options={{ headerShown: false }} />
        {/* Agent journey */}
        <Stack.Screen name="agent-verify" options={{ headerShown: false }} />
        <Stack.Screen name="(agent-tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="agent-offers" options={{ headerShown: false }} />
        <Stack.Screen name="create-listing" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="agent-listing/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="agent-profile/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="top-agents" options={{ headerShown: false }} />
        <Stack.Screen name="reschedule-viewing" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="payout-bank" options={{ headerShown: false }} />
        <Stack.Screen name="listing-defaults" options={{ headerShown: false }} />
        {/* Vendor (Service Loop) journey */}
        <Stack.Screen name="vendor-setup" options={{ headerShown: false }} />
        <Stack.Screen name="vendor-categories" options={{ headerShown: false }} />
        <Stack.Screen name="vendor-first-service" options={{ headerShown: false }} />
        <Stack.Screen name="vendor-payout-setup" options={{ headerShown: false }} />
        <Stack.Screen name="vendor-submitted" options={{ headerShown: false }} />
        <Stack.Screen name="(vendor-tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="vendor-request/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="vendor-active-job/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="vendor-job-done" options={{ headerShown: false }} />
        <Stack.Screen name="vendor-dispute/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="vendor-reviews" options={{ headerShown: false }} />
        <Stack.Screen name="vendor-menu" options={{ headerShown: false }} />
        <Stack.Screen name="vendor-availability" options={{ headerShown: false }} />
        <Stack.Screen name="vendor/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="vendor-edit-profile" options={{ headerShown: false }} />
        <Stack.Screen name="vendor-reply" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="vendor-blackout" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
        <UpdatePrompt />
        <DialogHost />
        <BootGate />
      </ThemeProvider>
      </AuthProvider>
    </KeyboardProvider>
  );
}

/**
 * Renders the animated PropertyLoop boot overlay on top of the navigator from
 * cold start, then unmounts it once the session has resolved (and the boot
 * animation has played its minimum beat + fade-out). Lives inside AuthProvider
 * so it can read session status.
 */
function BootGate() {
  const { status } = useAuth();
  const [done, setDone] = useState(false);
  if (done) return null;
  return (
    <BootAnimation authReady={status !== 'loading'} onDone={() => setDone(true)} />
  );
}

/**
 * One-time redirect for a returning, already-authenticated user: once the
 * session resolves on cold start, send them straight to their role's home.
 * Guests stay on the welcome flow; runs once so it never fights onboarding
 * navigation that happens after sign-up/login.
 */
function SessionRedirect() {
  const { status, user } = useAuth();
  const navState = useRootNavigationState();
  const done = useRef(false);

  useEffect(() => {
    if (!navState?.key) return; // navigation tree not mounted yet
    if (status === 'loading' || done.current) return;
    done.current = true;
    if (status === 'authed' && user) {
      // A vendor who hasn't finished the setup wizard yet (no bio on their
      // trade profile) resumes onboarding instead of landing on an empty
      // dashboard; everyone else goes straight to their role's home.
      if (user.role === 'VENDOR') {
        vendorsService
          .needsOnboarding()
          .then((needs) =>
            router.replace((needs ? '/vendor-setup' : roleHome(user.role)) as Href),
          )
          .catch(() => router.replace(roleHome(user.role) as Href));
      } else {
        router.replace(roleHome(user.role) as Href);
      }
    }
  }, [navState?.key, status, user]);

  return null;
}
