import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { Stack, router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { VENDOR_CATEGORIES } from "@/mocks/vendor";

const PRIMARY = "#1f6f43";
const INK = "#1a2120";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

type VerifyState = "done" | "active" | "todo";

export default function VendorCategoriesScreen() {
  const [cats, setCats]       = useState<string[]>(["cleaning"]);
  const [area, setArea]       = useState("Lekki, Ikoyi, V.I.");
  const [radius, setRadius]   = useState("10");
  const [idDone, setIdDone]         = useState(true);
  const [skillDone, setSkillDone]   = useState(false);
  const [selfieDone, setSelfieDone] = useState(false);
  const [samples, setSamples]       = useState<string[]>([]);

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

  const canContinue = cats.length > 0 && idDone && (skillDone || samples.length >= 3);

  const onContinue = () => {
    if (!canContinue) {
      Alert.alert("Almost there", "Pick at least one category and finish the verification steps.");
      return;
    }
    router.push("/vendor-first-service" as Href);
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
          <View className="items-center">
            <Text className="text-ink font-sans-bold text-sm">Categories & verification</Text>
            <Text className="text-ink-3 text-xs mt-0.5">Step 2 of 4</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

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
          </View>

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
          <Label className="mt-6">Get the verified badge</Label>
          <View className="gap-2 mt-2">
            <VerifyRow
              state={stepState(idDone, true)}
              title="Government ID"
              detail="NIN or driver's licence"
              icon="card-outline"
              cta="Upload"
              onPress={() => setIdDone(true)}
            />
            <VerifyRow
              state={stepState(skillDone, idDone)}
              title="Proof of skill"
              detail="Trade certificate or 3+ work photos"
              icon="ribbon-outline"
              cta="Add"
              onPress={pickSamples}
            />
            <VerifyRow
              state={stepState(selfieDone, idDone && skillDone)}
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
        </ScrollView>

        <View
          className="absolute left-0 right-0 bottom-0 bg-cream border-line"
          style={{ borderTopWidth: 0.5, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 28 }}
        >
          <Pressable
            onPress={onContinue}
            disabled={!canContinue}
            className="bg-primary rounded-full items-center active:opacity-80 disabled:opacity-50"
            style={{ paddingVertical: 17 }}
          >
            <Text className="text-white font-sans-bold text-[15px]">Continue</Text>
          </Pressable>
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
        style={{ backgroundColor: done ? PRIMARY : "#ece6df" }}
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

void INK_3;
