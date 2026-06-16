import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Image } from "expo-image";
import { Stack, router, useLocalSearchParams, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { VENDOR_CATEGORIES } from "@/mocks/vendor";
import vendorsService from "@/api/services/vendors";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";
import OnboardingCta from "@/components/onboarding/OnboardingCta";

const PRIMARY = "#1f6f43";
const INK = "#1a2120";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

type VerifyState = "done" | "active" | "todo";

export default function VendorCategoriesScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const isManage = params.mode === "manage";

  const [cats, setCats]       = useState<string[]>(["cleaning"]);
  const [customCat, setCustomCat] = useState("");
  const [area, setArea]       = useState("Lekki, Ikoyi, V.I.");
  const [radius, setRadius]   = useState("10");
  const [skillDone, setSkillDone]   = useState(false);
  const [selfieDone, setSelfieDone] = useState(false);
  const [samples, setSamples]       = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const toggle = (id: string) =>
    setCats((arr) => (arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]));

  const pickSamples = async () => {
    const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!lib.granted) {
      Alert.alert("Photo library", "Allow library access in Settings.");
      return;
    }
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: 8 - samples.length,
      quality: 0.85,
    });
    if (!r.canceled) {
      setSamples((p) => [...p, ...r.assets.map((a) => a.uri)].slice(0, 8));
      if (samples.length + r.assets.length >= 3) setSkillDone(true);
    }
  };

  const takeSelfie = async () => {
    const cam = await ImagePicker.requestCameraPermissionsAsync();
    if (!cam.granted) {
      Alert.alert("Camera", "Allow camera access in Settings.");
      return;
    }
    const r = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.85,
    });
    if (!r.canceled && r.assets[0]) setSelfieDone(true);
  };

  const stepState = (done: boolean, prev: boolean): VerifyState =>
    done ? "done" : prev ? "active" : "todo";

  // Resolve a selected chip id to the label we save. "other" maps to whatever
  // trade the vendor typed, so professions outside the preset list aren't lost.
  const resolveLabel = (id: string) =>
    id === "other"
      ? customCat.trim()
      : VENDOR_CATEGORIES.find((c) => c.id === id)?.label ?? id;

  // If they picked "Other" they must type a trade — otherwise we'd save a blank
  // category and they'd show up as "Other" in the directory.
  const otherNeedsTrade = cats.includes("other") && !customCat.trim();
  const hasValidCats = cats.length > 0 && !otherNeedsTrade;

  const canContinueOnboarding = hasValidCats && (skillDone || samples.length >= 3);
  const canSaveManage = hasValidCats;
  const canContinue = isManage ? canSaveManage : canContinueOnboarding;

  const onContinue = async () => {
    if (!canContinue) {
      Alert.alert(
        "Almost there",
        isManage
          ? "Pick at least one category to save."
          : "Pick at least one category and finish the verification steps.",
      );
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    try {
      const primary = resolveLabel(cats[0]);
      let portfolio: string[] | undefined;
      if (samples.length) {
        portfolio = await Promise.all(samples.map((u) => vendorsService.uploadImage(u)));
      }
      await vendorsService.updateMe({
        serviceCategory: primary,
        serviceArea: area,
        ...(portfolio ? { portfolioImages: portfolio } : {}),
      });
      if (isManage) {
        Alert.alert("Categories saved", "Your service category has been updated.", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        router.push("/vendor-first-service" as Href);
      }
    } catch (e: any) {
      Alert.alert("Couldn't save", e?.response?.data?.message ?? "Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-cream">
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        {/* Top bar */}
        <View className="flex-row items-center justify-between px-5 pt-2">
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            className="w-9 h-9 rounded-full bg-white/70 items-center justify-center"
          >
            <Text className="text-ink-2 text-xl">‹</Text>
          </Pressable>
          <Text className="text-ink font-sans-bold text-sm">
            {isManage ? "Service categories" : "Categories & verification"}
          </Text>
          <View style={{ width: 36 }} />
        </View>
        {!isManage && (
          <OnboardingProgress step={2} total={4} className="px-5 mt-3" />
        )}

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 130 }}
          showsVerticalScrollIndicator={false}
        >
          <Text
            className="font-serif text-ink mt-6"
            style={{ fontSize: 26, lineHeight: 28, letterSpacing: -0.5 }}
          >
            What do you <Text className="font-serif-italic">do</Text>?
          </Text>
          <Text className="text-[13px] text-ink-2 mt-1.5 leading-5">
            Pick all that apply. You can add more later.
          </Text>

          {/* Categories */}
          <View className="flex-row flex-wrap gap-2 mt-4">
            {VENDOR_CATEGORIES.map((c) => {
              const on = cats.includes(c.id);
              return (
                <Pressable
                  key={c.id}
                  onPress={() => toggle(c.id)}
                  className="flex-row items-center gap-1.5 rounded-full px-3.5 py-2"
                  style={{
                    backgroundColor: on ? INK : "#ffffff",
                    borderWidth: on ? 0 : 1,
                    borderColor: "#e1dcd3",
                  }}
                >
                  <Ionicons name={c.icon} size={14} color={on ? "#ffffff" : INK_2} />
                  <Text className="text-[12.5px] font-sans-bold" style={{ color: on ? "#ffffff" : INK_2 }}>
                    {c.label}
                  </Text>
                </Pressable>
              );
            })}

            {/* Anything not in the preset list — vendor types their own trade */}
            {(() => {
              const on = cats.includes("other");
              return (
                <Pressable
                  key="other"
                  onPress={() => toggle("other")}
                  className="flex-row items-center gap-1.5 rounded-full px-3.5 py-2"
                  style={{
                    backgroundColor: on ? INK : "#ffffff",
                    borderWidth: on ? 0 : 1,
                    borderColor: "#e1dcd3",
                  }}
                >
                  <Ionicons name="add-outline" size={14} color={on ? "#ffffff" : INK_2} />
                  <Text className="text-[12.5px] font-sans-bold" style={{ color: on ? "#ffffff" : INK_2 }}>
                    Other
                  </Text>
                </Pressable>
              );
            })()}
          </View>

          {/* Custom trade input — revealed when "Other" is selected */}
          {cats.includes("other") && (
            <TextInput
              value={customCat}
              onChangeText={setCustomCat}
              placeholder="Type your trade (e.g. Tiler, Welder, Locksmith)"
              placeholderTextColor={INK_3}
              autoCapitalize="words"
              maxLength={60}
              className="mt-3 bg-white rounded-2xl px-3.5 py-3 text-[14px] font-sans-bold text-ink border-line"
              style={{ borderWidth: 1 }}
            />
          )}

          {/* Service area */}
          <Label className="mt-6">Service area</Label>
          <View
            className="mt-2 bg-white rounded-2xl px-3.5 py-3 flex-row items-center gap-2.5 border-line"
            style={{ borderWidth: 1 }}
          >
            <Ionicons name="location-outline" size={16} color={PRIMARY} />
            <Text className="flex-1 text-[14px] font-sans-bold text-ink">{area}</Text>
            <Text className="text-[12px] text-ink-3 font-sans-bold">{radius} km radius</Text>
          </View>

          {/* Verification */}
          {!isManage && (
          <>
          <Label className="mt-6">Get the verified badge</Label>
          <View className="gap-2 mt-2">
            <VerifyRow
              state={stepState(skillDone, true)}
              title="Proof of skill"
              detail="Trade certificate or 3+ work photos"
              icon="ribbon-outline"
              cta="Add"
              onPress={pickSamples}
            />
            <VerifyRow
              state={stepState(selfieDone, skillDone)}
              title="Selfie check"
              detail="Confirm it's really you"
              icon="happy-outline"
              cta="Take"
              onPress={takeSelfie}
            />
          </View>

          {/* Work samples */}
          <View className="flex-row items-baseline justify-between mt-6 mb-2">
            <Label className="">Work samples</Label>
            <Text className="text-[11px] font-sans-semibold text-ink-3">{samples.length} of 8</Text>
          </View>
          <View className="flex-row flex-wrap gap-1.5">
            {samples.map((uri) => (
              <View key={uri} className="relative" style={{ width: "23.5%" }}>
                <Image
                  source={{ uri }}
                  style={{ width: "100%", aspectRatio: 1, borderRadius: 10 }}
                  contentFit="cover"
                />
                <Pressable
                  onPress={() => setSamples((p) => p.filter((u) => u !== uri))}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white items-center justify-center"
                  hitSlop={6}
                  style={{ borderWidth: 1, borderColor: "#e1dcd3" }}
                >
                  <Ionicons name="close" size={10} color={INK_2} />
                </Pressable>
              </View>
            ))}
            {samples.length < 8 && (
              <Pressable
                onPress={pickSamples}
                className="items-center justify-center"
                style={{
                  width: "23.5%",
                  aspectRatio: 1,
                  borderRadius: 10,
                  borderWidth: 1.5,
                  borderStyle: "dashed",
                  borderColor: "#d3cdc1",
                }}
              >
                <Ionicons name="add" size={18} color={INK_2} />
              </Pressable>
            )}
          </View>
          </>
          )}
        </ScrollView>

        <View
          className="absolute left-0 right-0 bottom-0 bg-cream border-line"
          style={{ borderTopWidth: 0.5, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 28 }}
        >
          <OnboardingCta
            label={submitting ? "Saving…" : isManage ? "Save categories" : "Continue"}
            ready={canContinue && !submitting}
            onPress={onContinue}
            getMissing={() => {
              const catMissing = otherNeedsTrade
                ? "your trade name"
                : cats.length === 0 && "at least one category";
              return isManage
                ? ([catMissing].filter(Boolean) as string[])
                : ([
                    catMissing,
                    !(skillDone || samples.length >= 3) &&
                      "a skill certificate or 3 work samples",
                  ].filter(Boolean) as string[]);
            }}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

function VerifyRow({
  state, title, detail, icon, cta, onPress,
}: {
  state: VerifyState;
  title: string;
  detail: string;
  icon: keyof typeof Ionicons.glyphMap;
  cta: string;
  onPress: () => void;
}) {
  const done = state === "done";
  const active = state === "active";
  const todo = state === "todo";
  return (
    <Pressable
      onPress={() => !todo && onPress()}
      className="flex-row items-center gap-3 px-3.5 py-3 rounded-2xl"
      style={{
        backgroundColor: "#ffffff",
        borderWidth: active ? 1.5 : 1,
        borderColor: active ? PRIMARY : "#e1dcd3",
        opacity: todo ? 0.55 : 1,
      }}
    >
      <View
        className="w-10 h-10 rounded-xl items-center justify-center"
        style={{ backgroundColor: done ? PRIMARY : "#f0f0f0" }}
      >
        <Ionicons name={done ? "checkmark" : icon} size={18} color={done ? "#ffffff" : INK_2} />
      </View>
      <View className="flex-1">
        <Text className="text-[13.5px] font-sans-bold text-ink">{title}</Text>
        <Text className="text-[11.5px] text-ink-3 mt-0.5">{detail}</Text>
      </View>
      {done ? (
        <Text className="text-[11px] font-sans-bold text-primary">Done</Text>
      ) : active ? (
        <Text className="text-[12px] font-sans-bold text-primary">{cta}</Text>
      ) : (
        <Text className="text-[11px] font-sans-bold text-ink-3">Locked</Text>
      )}
    </Pressable>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Text className={`text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase ${className ?? ""}`}>
      {children}
    </Text>
  );
}
