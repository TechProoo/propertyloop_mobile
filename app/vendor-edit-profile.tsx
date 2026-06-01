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
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { PLAvatar } from "@/components/brand/PLAvatar";
import { LANGUAGES, VENDOR } from "@/mocks/vendor";

const PRIMARY = "#1f6f43";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

export default function VendorEditProfileScreen() {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [name, setName]         = useState(VENDOR.name);
  const [tagline, setTagline]   = useState(VENDOR.tagline);
  const [about, setAbout]       = useState(VENDOR.bio);
  const [years, setYears]       = useState(String(VENDOR.yearsExperience));
  const [crew, setCrew]         = useState(String(VENDOR.crewSize));
  const [langs, setLangs]       = useState<string[]>(["English", "Yoruba", "Pidgin"]);

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
    if (!lib.granted) { Alert.alert("Photo library", "Allow library access in Settings."); return; }
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.85,
    });
    if (!r.canceled && r.assets[0]) setPhotoUri(r.assets[0].uri);
  };
  const takeWithCamera = async () => {
    const cam = await ImagePicker.requestCameraPermissionsAsync();
    if (!cam.granted) { Alert.alert("Camera", "Allow camera access in Settings."); return; }
    const r = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.85,
    });
    if (!r.canceled && r.assets[0]) setPhotoUri(r.assets[0].uri);
  };

  const onSave = () => {
    if (!name.trim() || !about.trim()) {
      Alert.alert("Missing info", "Display name and about are required.");
      return;
    }
    Alert.alert("Saved", "Your business profile has been updated.", [
      { text: "OK", onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        {/* Top bar */}
        <View className="flex-row items-center justify-between px-5 pt-1 pb-2">
          <Pressable
            onPress={() => router.back()}
            className="w-9 h-9 rounded-full bg-cream-2 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={18} color={INK_2} />
          </Pressable>
          <Text className="text-[15px] font-sans-bold text-ink">Edit business profile</Text>
          <Pressable onPress={onSave} hitSlop={8}>
            <Text className="text-[13px] font-sans-bold text-primary">Save</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar */}
          <View className="items-center mt-3">
            <Pressable onPress={pickPhoto} className="relative active:opacity-90">
              {photoUri ? (
                <Image
                  source={{ uri: photoUri }}
                  style={{ width: 88, height: 88, borderRadius: 44 }}
                  contentFit="cover"
                />
              ) : (
                <PLAvatar initials={VENDOR.initials} size={88} tone="primary" />
              )}
              <View
                className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full items-center justify-center"
                style={{ backgroundColor: PRIMARY, borderWidth: 3, borderColor: "#f5f0eb" }}
              >
                <Ionicons name="camera" size={15} color="#ffffff" />
              </View>
            </Pressable>
            <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mt-3">
              Business photo
            </Text>
          </View>

          {/* Form */}
          <Field label="Display name" value={name} onChangeValue={setName} autoCapitalize="words" />
          <Field
            label="Tagline"
            value={tagline}
            onChangeValue={(v) => setTagline(v.slice(0, 40))}
            trail={<Text className="text-[11px] text-ink-3">{tagline.length} / 40</Text>}
          />
          <View className="mt-4">
            <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mb-1.5">
              About
            </Text>
            <TextInput
              value={about}
              onChangeText={setAbout}
              multiline
              textAlignVertical="top"
              placeholderTextColor={INK_3}
              className="bg-white border border-line rounded-2xl px-4 py-3 text-ink-2 text-[14px]"
              style={{ minHeight: 100, fontFamily: "PlayfairDisplay_400Regular_Italic" }}
            />
          </View>

          <View className="flex-row gap-3 mt-4">
            <View className="flex-1">
              <Field
                label="Years' experience"
                value={years}
                onChangeValue={(v) => setYears(v.replace(/[^0-9]/g, ""))}
                keyboardType="number-pad"
              />
            </View>
            <View className="flex-1">
              <Field
                label="Crew size"
                value={crew}
                onChangeValue={(v) => setCrew(v.replace(/[^0-9]/g, ""))}
                keyboardType="number-pad"
              />
            </View>
          </View>

          <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mt-5 mb-2">
            Languages
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {LANGUAGES.map((l) => {
              const on = langs.includes(l);
              return (
                <Pressable
                  key={l}
                  onPress={() => toggleLang(l)}
                  className="px-3.5 py-2 rounded-full"
                  style={{
                    backgroundColor: on ? "#1a2120" : "#ffffff",
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
          <Pressable
            onPress={onSave}
            className="bg-primary rounded-full items-center active:opacity-80"
            style={{ paddingVertical: 16 }}
          >
            <Text className="text-white font-sans-bold text-[15px]">Save changes</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChangeValue: (v: string) => void;
  trail?: React.ReactNode;
} & Omit<React.ComponentProps<typeof TextInput>, "onChangeText" | "value" | "onChange">;

function Field({ label, value, onChangeValue, trail, ...rest }: FieldProps) {
  return (
    <View className="mt-4">
      <View className="flex-row items-center justify-between mb-1.5">
        <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase">
          {label}
        </Text>
        {trail}
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeValue}
        placeholderTextColor={INK_3}
        className="bg-white border border-line rounded-2xl px-4 py-3.5 text-ink text-[15px]"
        {...rest}
      />
    </View>
  );
}
