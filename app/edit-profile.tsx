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
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { PLAvatar } from "@/components/brand/PLAvatar";
import { SETTINGS_PROFILE } from "@/mocks/buyer-extra";

const PRIMARY = "#1f6f43";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

export default function EditProfileScreen() {
  const [name, setName]   = useState(SETTINGS_PROFILE.name);
  const [email, setEmail] = useState(SETTINGS_PROFILE.email);
  const [phone, setPhone] = useState(SETTINGS_PROFILE.phone);
  const [bio, setBio]     = useState(
    "Relocating from Ikoyi to Lekki — looking for a 3-bed family home near good schools.",
  );

  const onSave = () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert("Missing info", "Name and email are required.");
      return;
    }
    Alert.alert("Saved", "Your profile has been updated.", [
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
          <Text className="text-[15px] font-sans-bold text-ink">
            Edit profile
          </Text>
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
            <View className="relative">
              <PLAvatar initials={SETTINGS_PROFILE.initials} size={88} tone="primary" />
              <Pressable
                onPress={() => Alert.alert("Photo", "Camera + library upload coming soon.")}
                className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-primary items-center justify-center"
                style={{ borderWidth: 3, borderColor: "#f5f0eb" }}
              >
                <Ionicons name="camera" size={15} color="#ffffff" />
              </Pressable>
            </View>
            <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mt-3">
              Profile photo
            </Text>
          </View>

          {/* Form */}
          <View className="mt-6 gap-4">
            <Field label="Full name" value={name} onChangeValue={setName} autoCapitalize="words" />
            <Field label="Email" value={email} onChangeValue={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <Field label="Phone" value={phone} onChangeValue={setPhone} keyboardType="phone-pad" />

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

          {/* Verification banner */}
          <Pressable
            onPress={() => router.push("/verify-identity" as never)}
            className="mt-6 bg-primary-soft rounded-2xl px-4 py-3.5 flex-row items-center gap-3 active:opacity-90"
          >
            <View className="w-10 h-10 rounded-xl bg-white items-center justify-center">
              <Ionicons name="shield-checkmark" size={18} color={PRIMARY} />
            </View>
            <View className="flex-1">
              <Text className="text-[13.5px] font-sans-bold" style={{ color: "#134a2d" }}>
                Verified buyer
              </Text>
              <Text className="text-[11.5px]" style={{ color: "#134a2d", opacity: 0.75 }}>
                NIN on file · last checked 28 May 2026
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color="#134a2d" />
          </Pressable>
        </ScrollView>

        {/* Sticky CTA */}
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
