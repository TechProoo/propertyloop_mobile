import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Stack, router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { PLAvatar } from "@/components/brand/PLAvatar";
import { LANGUAGES } from "@/mocks/vendor";
import vendorsService from "@/api/services/vendors";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";
import OnboardingCta from "@/components/onboarding/OnboardingCta";

const PRIMARY = "#1f6f43";
const INK = "#1a2120";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

export default function VendorSetupScreen() {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [name, setName]         = useState("");
  const [tagline, setTagline]   = useState("");
  const [about, setAbout]       = useState("");
  const [years, setYears]       = useState("");
  const [crew, setCrew]         = useState("");
  const [langs, setLangs]       = useState<string[]>(["English", "Pidgin"]);
  const [submitting, setSubmitting] = useState(false);

  const initials = name
    ? name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase()
    : "SC";

  const toggleLang = (l: string) =>
    setLangs((arr) => (arr.includes(l) ? arr.filter((x) => x !== l) : [...arr, l]));

  const pickPhoto = () =>
    Alert.alert("Business photo", "Choose a source", [
      { text: "Photo library", onPress: pickFromLibrary },
      { text: "Take a photo",  onPress: takeWithCamera },
      photoUri ? { text: "Remove", style: "destructive" as const, onPress: () => setPhotoUri(null) } : null,
      { text: "Cancel", style: "cancel" as const },
    ].filter(Boolean) as Parameters<typeof Alert.alert>[2]);

  const pickFromLibrary = async () => {
    const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!lib.granted) {
      Alert.alert("Photo library", "Allow library access in Settings.");
      return;
    }
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.85,
    });
    if (!r.canceled && r.assets[0]) setPhotoUri(r.assets[0].uri);
  };
  const takeWithCamera = async () => {
    const cam = await ImagePicker.requestCameraPermissionsAsync();
    if (!cam.granted) {
      Alert.alert("Camera", "Allow camera access in Settings.");
      return;
    }
    const r = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.85,
    });
    if (!r.canceled && r.assets[0]) setPhotoUri(r.assets[0].uri);
  };

  const canContinue = name.trim().length > 1 && about.trim().length > 10 && langs.length > 0;

  const onContinue = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      let avatar: string | undefined;
      if (photoUri) avatar = await vendorsService.uploadImage(photoUri);
      await vendorsService.updateMe({
        name: name.trim(),
        bio: about.trim(),
        yearsExperience: years.trim() || undefined,
        ...(avatar ? { avatarUrl: avatar } : {}),
      });
      router.push("/vendor-categories" as Href);
    } catch (e: any) {
      Alert.alert("Couldn't save", e?.response?.data?.message ?? "Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const missing = () =>
    [
      name.trim().length <= 1 && "a display name",
      about.trim().length <= 10 && "an About of at least 10 characters",
      langs.length === 0 && "at least one language",
    ].filter(Boolean) as string[];

  return (
    <View className="flex-1 bg-cream">
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1"
        >
          {/* Top bar */}
          <View className="flex-row items-center justify-between px-5 pt-2">
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              className="w-9 h-9 rounded-full bg-white/70 items-center justify-center"
            >
              <Text className="text-ink-2 text-xl">‹</Text>
            </Pressable>
            <Text className="text-ink font-sans-bold text-sm">Vendor setup</Text>
            <View style={{ width: 36 }} />
          </View>
          <OnboardingProgress step={1} total={4} className="px-5 mt-3" />

          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 130 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text
              className="font-serif text-ink mt-6"
              style={{ fontSize: 28, lineHeight: 30, letterSpacing: -0.6 }}
            >
              Set up your <Text className="font-serif-italic">trade profile</Text>
            </Text>
            <Text className="text-[13.5px] text-ink-2 mt-2 leading-5">
              This is what customers see before they hire you. Make it count.
            </Text>

            {/* Avatar */}
            <View className="flex-row items-center gap-3.5 mt-6">
              <Pressable onPress={pickPhoto} className="relative active:opacity-90">
                {photoUri ? (
                  <Image
                    source={{ uri: photoUri }}
                    style={{ width: 68, height: 68, borderRadius: 34 }}
                    contentFit="cover"
                  />
                ) : (
                  <PLAvatar initials={initials} size={68} tone="primary" />
                )}
                <View
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-ink items-center justify-center"
                  style={{ borderWidth: 3, borderColor: "#ffffff" }}
                >
                  <Ionicons name="add" size={14} color="#ffffff" />
                </View>
              </Pressable>
              <View className="flex-1">
                <Text className="text-[13.5px] font-sans-bold text-ink">
                  Business photo or logo
                </Text>
                <Text className="text-[11.5px] text-ink-3 mt-0.5">
                  Builds trust at a glance
                </Text>
              </View>
            </View>

            <Field label="Display name" value={name} onChangeText={setName} placeholder="e.g. Sparkle & Co." autoCapitalize="words" />
            <Field
              label="Tagline"
              value={tagline}
              onChangeText={(t) => setTagline(t.slice(0, 40))}
              placeholder="One short line about what you do"
              trail={<Text className="text-[11px] text-ink-3">{tagline.length} / 40</Text>}
            />
            <View className="flex-row items-center justify-between mt-4">
              <Label>About</Label>
              <Text className="text-[11px] text-ink-3">
                {about.trim().length <= 10
                  ? `${Math.max(0, 11 - about.trim().length)} more characters`
                  : "✓"}
              </Text>
            </View>
            <TextInput
              value={about}
              onChangeText={setAbout}
              multiline
              textAlignVertical="top"
              placeholder="Who you are, what you do, who you serve."
              placeholderTextColor={INK_3}
              className="bg-white border border-line rounded-2xl px-4 py-3 text-ink-2 text-[14px] mt-1.5"
              style={{ minHeight: 90, fontFamily: "PlayfairDisplay_400Regular_Italic" }}
            />

            <View className="flex-row gap-3 mt-4">
              <View className="flex-1">
                <Field
                  label="Years' experience"
                  value={years}
                  onChangeText={(t) => setYears(t.replace(/[^0-9]/g, ""))}
                  placeholder="e.g. 5"
                  keyboardType="number-pad"
                />
              </View>
              <View className="flex-1">
                <Field
                  label="Crew size"
                  value={crew}
                  onChangeText={(t) => setCrew(t.replace(/[^0-9]/g, ""))}
                  placeholder="e.g. 4 people"
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <Label className="mt-5">Languages</Label>
            <View className="flex-row flex-wrap gap-2 mt-2">
              {LANGUAGES.map((l) => {
                const on = langs.includes(l);
                return (
                  <Pressable
                    key={l}
                    onPress={() => toggleLang(l)}
                    className="px-3.5 py-2 rounded-full"
                    style={{
                      backgroundColor: on ? INK : "#ffffff",
                      borderWidth: on ? 0 : 1,
                      borderColor: "#e1dcd3",
                    }}
                  >
                    <Text className="text-[13px] font-sans-bold" style={{ color: on ? "#ffffff" : INK_2 }}>
                      {l}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <View
            className="absolute left-0 right-0 bottom-0 bg-cream border-line"
            style={{ borderTopWidth: 0.5, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 28 }}
          >
            <OnboardingCta
              label={submitting ? "Saving…" : "Continue"}
              ready={canContinue && !submitting}
              onPress={onContinue}
              getMissing={missing}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function Field({
  label, trail, ...rest
}: { label: string; trail?: React.ReactNode } & React.ComponentProps<typeof TextInput>) {
  return (
    <View className="mt-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase">
          {label}
        </Text>
        {trail}
      </View>
      <TextInput
        placeholderTextColor={INK_3}
        className="bg-white border border-line rounded-2xl px-4 py-3.5 text-ink text-[15px] mt-1.5"
        {...rest}
      />
    </View>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Text className={`text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase ${className ?? ""}`}>
      {children}
    </Text>
  );
}

void PRIMARY;
