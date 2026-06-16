import { useEffect, useState } from "react";
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
import { Stack, router } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { PLAvatar } from "@/components/brand/PLAvatar";
import { useAuth } from "@/context/auth";
import usersService from "@/api/services/users";

const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

function initialsOf(name?: string | null) {
  if (!name) return "PL";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export default function EditProfileScreen() {
  const { user, refreshUser } = useAuth();
  const [name, setName]   = useState(user?.name ?? "");
  const [email] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [location, setLocation] = useState("");
  const [bio, setBio]     = useState("");
  const [avatarUri, setAvatarUri] = useState<string | null>(user?.avatarUrl ?? null);
  const [saving, setSaving] = useState(false);
  const insets = useSafeAreaInsets();

  // Bio / location aren't on the lightweight auth user — pull the full profile.
  useEffect(() => {
    let active = true;
    usersService
      .getProfile()
      .then((p) => {
        if (!active) return;
        if (p?.name) setName(p.name);
        if (p?.phone) setPhone(p.phone);
        if (p?.location) setLocation(p.location);
        if (p?.bio) setBio(p.bio);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const pickAvatar = () =>
    Alert.alert("Profile photo", "Choose a source", [
      { text: "Photo library", onPress: pickFromLibrary },
      { text: "Take a photo",  onPress: takeWithCamera },
      avatarUri ? { text: "Remove", style: "destructive" as const, onPress: () => setAvatarUri(null) } : null,
      { text: "Cancel", style: "cancel" as const },
    ].filter(Boolean) as Parameters<typeof Alert.alert>[2]);

  const pickFromLibrary = async () => {
    const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!lib.granted) {
      Alert.alert("Photo library", "Allow library access in Settings.");
      return;
    }
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!r.canceled && r.assets[0]) setAvatarUri(r.assets[0].uri);
  };

  const takeWithCamera = async () => {
    const cam = await ImagePicker.requestCameraPermissionsAsync();
    if (!cam.granted) {
      Alert.alert("Camera", "Allow camera access in Settings.");
      return;
    }
    const r = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!r.canceled && r.assets[0]) setAvatarUri(r.assets[0].uri);
  };

  const onSave = async () => {
    if (!name.trim()) {
      Alert.alert("Missing info", "Your name is required.");
      return;
    }
    setSaving(true);
    try {
      await usersService.updateProfile({
        name: name.trim(),
        phone: phone.trim() || undefined,
        location: location.trim() || undefined,
        bio: bio.trim() || undefined,
      });
      await refreshUser();
      Alert.alert("Saved", "Your profile has been updated.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? "Couldn't save. Please try again.";
      Alert.alert("Save failed", Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setSaving(false);
    }
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
          <Text className="text-[15px] font-sans-bold text-ink">
            Edit profile
          </Text>
          <Pressable onPress={onSave} hitSlop={8} disabled={saving}>
            <Text className="text-[13px] font-sans-bold text-primary">
              {saving ? "Saving…" : "Save"}
            </Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar */}
          <View className="items-center mt-3">
            <Pressable onPress={pickAvatar} className="relative active:opacity-90">
              {avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  style={{ width: 88, height: 88, borderRadius: 44 }}
                  contentFit="cover"
                />
              ) : (
                <PLAvatar initials={initialsOf(name)} size={88} tone="primary" />
              )}
              <View
                className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-primary items-center justify-center"
                style={{ borderWidth: 3, borderColor: "#ffffff" }}
              >
                <Ionicons name="camera" size={15} color="#ffffff" />
              </View>
            </Pressable>
            <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mt-3">
              Profile photo
            </Text>
          </View>

          {/* Form */}
          <View className="mt-6 gap-4">
            <Field label="Full name" value={name} onChangeValue={setName} autoCapitalize="words" />
            <View>
              <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mb-1.5">
                Email
              </Text>
              <View className="bg-cream-2 border border-line rounded-2xl px-4 py-3.5">
                <Text className="text-ink text-[15px]">{email || "—"}</Text>
              </View>
            </View>
            <Field label="Phone" value={phone} onChangeValue={setPhone} keyboardType="phone-pad" />
            <Field label="Location" value={location} onChangeValue={setLocation} placeholder="e.g. Lekki, Lagos" autoCapitalize="words" />

            <View>
              <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mb-1.5">
                About you · optional
              </Text>
              <TextInput
                value={bio}
                onChangeText={setBio}
                multiline
                textAlignVertical="top"
                placeholder="A short intro — what you're looking for, when you'd like to move."
                placeholderTextColor={INK_3}
                className="bg-white border border-line rounded-2xl px-4 py-3 text-ink text-[14px]"
                style={{ minHeight: 100 }}
              />
              <Text className="text-[11px] text-ink-3 mt-1.5">
                Shared with agents and landlords you reach out to.
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Sticky CTA */}
        <View
          className="absolute left-0 right-0 bottom-0 bg-cream border-line"
          style={{ borderTopWidth: 0.5, paddingHorizontal: 16, paddingTop: 14, paddingBottom: Math.max(insets.bottom, 20) + 10 }}
        >
          <Pressable
            onPress={onSave}
            disabled={saving}
            className="bg-primary rounded-full items-center active:opacity-80"
            style={{ paddingVertical: 16, opacity: saving ? 0.6 : 1 }}
          >
            <Text className="text-white font-sans-bold text-[15px]">
              {saving ? "Saving…" : "Save changes"}
            </Text>
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
} & Omit<React.ComponentProps<typeof TextInput>, "onChangeText" | "value" | "onChange">;

function Field({ label, value, onChangeValue, ...rest }: FieldProps) {
  return (
    <View>
      <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mb-1.5">
        {label}
      </Text>
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
