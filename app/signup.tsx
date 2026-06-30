import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import {
  Stack,
  router,
  useLocalSearchParams,
  type Href,
} from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/auth";
import { type SignupPayload } from "@/api/services/auth";
import { seedLocationIfUnset } from "@/lib/location";

type Role = "BUYER" | "AGENT" | "VENDOR";

const ROLE_LABEL: Record<Role, string> = {
  BUYER: "Buyer / Renter",
  AGENT: "Real estate professional",
  VENDOR: "Building services vendor",
};

// Mirrors backend: 8+ chars, at least 1 lowercase, 1 uppercase, 1 digit.
// Source: backend/src/auth/dto/signup.dto.ts password regex.
const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export default function SignupScreen() {
  const params = useLocalSearchParams<{
    role?: string;
    areas?: string;
    intent?: string;
    // Forwarded from /agent-setup
    agencyName?: string;
    licenseNumber?: string;
    businessAddress?: string;
    yearsExperience?: string;
    languages?: string;
    specialties?: string;
    bio?: string;
  }>();
  const role: Role =
    params.role === "AGENT" || params.role === "VENDOR" ? params.role : "BUYER";
  // areas comes in as "Lekki Phase 1|Ikoyi|Victoria Island" — buyer-preferences
  // joins on "|" because commas appear inside area names like "Maitama (Abuja)".
  const preferredLocations =
    role === "BUYER" && params.areas
      ? params.areas.split("|").join(", ")
      : undefined;

  // Common
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  // Agent-specific — pre-filled from /agent-setup if the user came through it
  const [agencyName, setAgencyName] = useState(params.agencyName ?? "");
  const [licenseNumber, setLicenseNumber] = useState(params.licenseNumber ?? "");
  const [businessAddress, setBusinessAddress] = useState(
    params.businessAddress ?? "",
  );

  // Vendor-specific
  const [serviceCategory, setServiceCategory] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [serviceArea, setServiceArea] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signUp, signOut } = useAuth();

  const validate = (): string | null => {
    if (!name.trim()) return "Please enter your full name.";
    if (!email.trim()) return "Please enter your email.";
    if (!PASSWORD_RULE.test(password)) {
      return "Password must be 8+ characters with an uppercase letter, lowercase letter, and number.";
    }
    if (role === "AGENT") {
      if (!agencyName.trim() || !licenseNumber.trim() || !businessAddress.trim()) {
        return "Agency name, license number, and business address are required.";
      }
    }
    if (role === "VENDOR") {
      if (
        !serviceCategory.trim() ||
        !yearsExperience.trim() ||
        !serviceArea.trim()
      ) {
        return "Service category, years of experience, and service area are required.";
      }
    }
    return null;
  };

  const handleSignup = async () => {
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setError(null);
    setSubmitting(true);

    const payload: SignupPayload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      phone: phone.trim() || undefined,
      role,
      ...(role === "BUYER" && preferredLocations
        ? { buyer: { preferredLocations } }
        : {}),
      ...(role === "AGENT"
        ? {
            agent: {
              agencyName: agencyName.trim(),
              licenseNumber: licenseNumber.trim(),
              businessAddress: businessAddress.trim(),
            },
          }
        : {}),
      ...(role === "VENDOR"
        ? {
            vendor: {
              serviceCategory: serviceCategory.trim(),
              yearsExperience: yearsExperience.trim(),
              serviceArea: serviceArea.trim(),
            },
          }
        : {}),
    };

    try {
      await signUp(payload);
      // Signup creates the account unverified and the backend emails a
      // verification link. Agents stay signed in to finish onboarding via
      // verification → plan → payment (those wizards need auth; the email-
      // verified gate is enforced at their next login). Buyers and vendors must
      // verify their email before entering — we drop the just-created session
      // and send them to "Check your inbox". After verifying and logging back
      // in, vendors are routed into the setup wizard (see login.tsx /
      // SessionRedirect in _layout.tsx).
      if (role === "AGENT") {
        router.replace("/agent-verify" as Href);
      } else {
        // Seed the Home feed location from the buyer's preferred areas. Stored
        // device-locally, so it survives the sign-out below and is there when
        // they log back in. Only seeds if they've never picked one themselves.
        if (preferredLocations) await seedLocationIfUnset(preferredLocations);
        await signOut();
        router.replace({
          pathname: "/verify-email-sent",
          params: { email: payload.email },
        });
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? "Signup failed. Please try again.";
      setError(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-cream">
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1"
        >
          <ScrollView
            contentContainerClassName="flex-grow px-5 pb-6"
            keyboardShouldPersistTaps="handled"
          >
            {/* Top bar */}
            <View className="flex-row items-center justify-between pt-2">
              <Pressable onPress={() => router.back()} hitSlop={12}>
                <Text className="text-ink-2 text-xl">‹</Text>
              </Pressable>
              <Pressable
                hitSlop={12}
                onPress={() => router.push("/help" as Href)}
              >
                <Text className="text-ink-2 text-sm font-sans-medium">Help</Text>
              </Pressable>
            </View>

            <View className="mt-3">
              <Image
                source={require("@/assets/images/logo.png")}
                style={{ width: 120, height: 32 }}
                contentFit="contain"
              />
            </View>

            {/* Heading */}
            <Text className="text-ink font-serif text-3xl mt-6 leading-[36px]">
              Let&apos;s get you <Text className="font-serif-italic">started</Text>.
            </Text>
            <Text className="text-ink-3 text-sm mt-2 leading-5">
              Signing up as <Text className="font-sans-semibold">{ROLE_LABEL[role]}</Text>.{" "}
              <Pressable
                onPress={() => router.replace("/role-select" as Href)}
                hitSlop={6}
              >
                <Text className="text-primary font-sans-semibold text-sm">
                  Change
                </Text>
              </Pressable>
            </Text>

            {/* Core fields */}
            <View className="mt-7 gap-4">
              <Field
                label="Full name"
                value={name}
                onChangeText={setName}
                placeholder="Your full name"
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
              />
              <Field
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
              />
              <Field
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="8+ chars · upper, lower, number"
                secureToggle
                autoComplete="new-password"
                textContentType="newPassword"
              />
              <Field
                label="Phone (optional)"
                value={phone}
                onChangeText={setPhone}
                placeholder="+234 80 1234 5678"
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
              />
            </View>

            {/* Agent-only fields */}
            {role === "AGENT" && (
              <>
                <SectionTitle>Agency details</SectionTitle>
                <View className="gap-4">
                  <Field
                    label="Agency name"
                    value={agencyName}
                    onChangeText={setAgencyName}
                    placeholder="e.g. Lekki Premier Realty"
                    autoCapitalize="words"
                  />
                  <Field
                    label="Reg. number (NIESV or CAC)"
                    value={licenseNumber}
                    onChangeText={setLicenseNumber}
                    placeholder="e.g. F1234 (NIESV) or BN1234567 (CAC)"
                    autoCapitalize="characters"
                  />
                  <Field
                    label="Business address"
                    value={businessAddress}
                    onChangeText={setBusinessAddress}
                    placeholder="e.g. 36 Lekki-Epe Expressway, Lekki"
                    autoCapitalize="words"
                  />
                </View>
              </>
            )}

            {/* Vendor-only fields */}
            {role === "VENDOR" && (
              <>
                <SectionTitle>Service details</SectionTitle>
                <View className="gap-4">
                  <Field
                    label="Service category"
                    value={serviceCategory}
                    onChangeText={setServiceCategory}
                    placeholder="e.g. Plumbing, Electrical, Cleaning"
                    autoCapitalize="words"
                  />
                  <Field
                    label="Years of experience"
                    value={yearsExperience}
                    onChangeText={setYearsExperience}
                    placeholder="e.g. 5"
                    keyboardType="number-pad"
                  />
                  <Field
                    label="Service area"
                    value={serviceArea}
                    onChangeText={setServiceArea}
                    placeholder="e.g. Lekki, Ajah, VI"
                    autoCapitalize="words"
                  />
                </View>
              </>
            )}

            {error && <Text className="text-red-600 text-xs mt-3">{error}</Text>}

            <Pressable
              onPress={handleSignup}
              disabled={submitting}
              className="bg-primary rounded-full py-4 items-center mt-6 active:opacity-80 disabled:opacity-60"
            >
              <Text className="text-white font-sans-semibold text-base">
                {submitting ? "Creating account…" : "Continue"}
              </Text>
            </Pressable>

            <Text className="text-ink-3 text-[11px] text-center mt-6">
              By continuing, you agree to our{" "}
              <Text
                className="text-primary font-sans-semibold"
                onPress={() => router.push("/terms" as Href)}
              >
                Terms
              </Text>{" "}
              &amp;{" "}
              <Text
                className="text-primary font-sans-semibold"
                onPress={() => router.push("/privacy" as Href)}
              >
                Privacy Policy
              </Text>
              .
            </Text>

            <View className="flex-row justify-center mt-5">
              <Text className="text-ink-2 text-sm">
                Already have an account?{" "}
              </Text>
              <Pressable onPress={() => router.push("/login" as Href)}>
                <Text className="text-primary font-sans-semibold text-sm">
                  Log in
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// ─── Small primitives ──────────────────────────────────────────────────────

type FieldProps = React.ComponentProps<typeof TextInput> & {
  label: string;
  // When set, masks input by default and shows an eye toggle to reveal it.
  secureToggle?: boolean;
};

function Field({ label, secureToggle, ...inputProps }: FieldProps) {
  const [hidden, setHidden] = useState(true);

  if (!secureToggle) {
    return (
      <View>
        <Text className="text-ink-2 text-xs font-sans-semibold mb-1.5">{label}</Text>
        <TextInput
          {...inputProps}
          placeholderTextColor="#7f857f"
          className="bg-white border border-line rounded-2xl px-4 py-3.5 text-ink text-base"
        />
      </View>
    );
  }

  return (
    <View>
      <Text className="text-ink-2 text-xs font-sans-semibold mb-1.5">{label}</Text>
      <View className="bg-white border border-line rounded-2xl px-4 flex-row items-center">
        <TextInput
          {...inputProps}
          secureTextEntry={hidden}
          placeholderTextColor="#7f857f"
          className="flex-1 py-3.5 text-ink text-base"
        />
        <Pressable
          onPress={() => setHidden((v) => !v)}
          hitSlop={8}
          className="pl-2"
        >
          <Ionicons
            name={hidden ? "eye-outline" : "eye-off-outline"}
            size={20}
            color="#7f857f"
          />
        </Pressable>
      </View>
    </View>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text className="text-primary text-[11px] font-sans-bold tracking-[1.5px] mt-6 mb-3">
      {String(children).toUpperCase()}
    </Text>
  );
}

