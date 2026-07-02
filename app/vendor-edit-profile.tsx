import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Alert } from "@/lib/dialog";
import { Image } from "expo-image";
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { PLAvatar } from "@/components/brand/PLAvatar";
import { useAuth } from "@/context/auth";
import vendorsService from "@/api/services/vendors";

const PRIMARY = "#1f6f43";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

const MAX_PORTFOLIO = 8;

function initialsOf(name?: string | null) {
  if (!name) return "PL";
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export default function VendorEditProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bannerUri, setBannerUri] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  // Portfolio holds a mix of already-hosted URLs and freshly-picked local URIs;
  // locals are uploaded on save.
  const [portfolio, setPortfolio] = useState<string[]>([]);
  const [name, setName] = useState(user?.name ?? "");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [about, setAbout] = useState("");
  const [years, setYears] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let on = true;
    vendorsService
      .getMe()
      .then((me) => {
        if (!on) return;
        if (me?.name) setName(me.name);
        setCategory(me?.category ?? me?.serviceCategory ?? "");
        // The public profile shows serviceArea (set at signup); prefer it so the
        // field reflects what buyers actually see, falling back to location.
        setLocation(me?.serviceArea ?? me?.location ?? "");
        setAbout(me?.bio ?? "");
        setYears(me?.yearsExperience ? String(me.yearsExperience) : "");
        setAvatarUrl(me?.avatarUrl ?? null);
        setBannerUrl(me?.bannerImage ?? null);
        setPortfolio(me?.portfolioImages ?? []);
      })
      .catch(() => {});
    return () => {
      on = false;
    };
  }, []);

  const pickPhoto = () =>
    Alert.alert("Business photo", "Choose a source", [
      { text: "Photo library", onPress: pickFromLibrary },
      { text: "Take a photo", onPress: takeWithCamera },
      photoUri ? { text: "Remove", style: "destructive" as const, onPress: () => setPhotoUri(null) } : null,
      { text: "Cancel", style: "cancel" as const },
    ].filter(Boolean) as Parameters<typeof Alert.alert>[2]);

  const pickFromLibrary = async () => {
    const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!lib.granted) { Alert.alert("Photo library", "Allow library access in Settings."); return; }
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.85 });
    if (!r.canceled && r.assets[0]) setPhotoUri(r.assets[0].uri);
  };
  const takeWithCamera = async () => {
    const cam = await ImagePicker.requestCameraPermissionsAsync();
    if (!cam.granted) { Alert.alert("Camera", "Allow camera access in Settings."); return; }
    const r = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.85 });
    if (!r.canceled && r.assets[0]) setPhotoUri(r.assets[0].uri);
  };

  const pickBanner = async () => {
    const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!lib.granted) { Alert.alert("Photo library", "Allow library access in Settings."); return; }
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [16, 9], quality: 0.85 });
    if (!r.canceled && r.assets[0]) setBannerUri(r.assets[0].uri);
  };

  const pickPortfolio = async () => {
    const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!lib.granted) { Alert.alert("Photo library", "Allow library access in Settings."); return; }
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: MAX_PORTFOLIO - portfolio.length,
      quality: 0.85,
    });
    if (!r.canceled) {
      setPortfolio((p) => [...p, ...r.assets.map((a) => a.uri)].slice(0, MAX_PORTFOLIO));
    }
  };

  const onSave = async () => {
    if (!name.trim()) {
      Alert.alert("Missing info", "Display name is required.");
      return;
    }
    setSaving(true);
    try {
      let avatar = avatarUrl ?? undefined;
      if (photoUri) avatar = await vendorsService.uploadImage(photoUri);

      // Banner: upload a freshly-picked one; otherwise keep/clear the hosted URL.
      let banner = bannerUrl ?? null;
      if (bannerUri) banner = await vendorsService.uploadImage(bannerUri, "banner");

      // Portfolio: upload any new local picks, keep already-hosted URLs.
      const portfolioUrls: string[] = [];
      for (const u of portfolio) {
        portfolioUrls.push(
          u.startsWith("http") ? u : await vendorsService.uploadImage(u, "portfolio"),
        );
      }

      await vendorsService.updateMe({
        name: name.trim(),
        bio: about.trim() || undefined,
        yearsExperience: years.trim() || undefined,
        // Write both so the public profile (serviceArea) and any location-based
        // display stay in sync.
        serviceArea: location.trim() || undefined,
        location: location.trim() || undefined,
        serviceCategory: category.trim() || undefined,
        bannerImage: banner,
        portfolioImages: portfolioUrls,
        ...(avatar ? { avatarUrl: avatar } : {}),
      });
      await refreshUser();
      Alert.alert("Saved", "Your business profile has been updated.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert("Save failed", e?.response?.data?.message ?? "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        {/* Top bar */}
        <View className="flex-row items-center justify-between px-5 pt-1 pb-2">
          <Pressable onPress={() => router.back()} className="w-9 h-9 rounded-full bg-cream-2 items-center justify-center">
            <Ionicons name="chevron-back" size={18} color={INK_2} />
          </Pressable>
          <Text className="text-[15px] font-sans-bold text-ink">Edit business profile</Text>
          <Pressable onPress={onSave} hitSlop={8} disabled={saving}>
            <Text className="text-[13px] font-sans-bold text-primary">{saving ? "Saving…" : "Save"}</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Avatar */}
          <View className="items-center mt-3">
            <Pressable onPress={pickPhoto} className="relative active:opacity-90">
              {photoUri || avatarUrl ? (
                <Image source={{ uri: photoUri ?? avatarUrl ?? undefined }} style={{ width: 88, height: 88, borderRadius: 44 }} contentFit="cover" />
              ) : (
                <PLAvatar initials={initialsOf(name)} size={88} tone="primary" />
              )}
              <View className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full items-center justify-center" style={{ backgroundColor: PRIMARY, borderWidth: 3, borderColor: "#ffffff" }}>
                <Ionicons name="camera" size={15} color="#ffffff" />
              </View>
            </Pressable>
            <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mt-3">Business photo</Text>
          </View>

          {/* Cover / banner */}
          <View className="mt-6">
            <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mb-1.5">Cover banner</Text>
            <Pressable onPress={pickBanner} className="relative rounded-2xl overflow-hidden active:opacity-90" style={{ height: 130 }}>
              {bannerUri || bannerUrl ? (
                <Image source={{ uri: bannerUri ?? bannerUrl ?? undefined }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
              ) : (
                <View className="flex-1 items-center justify-center bg-white border-line" style={{ borderWidth: 1.5, borderStyle: "dashed", borderColor: "#d3cdc1", borderRadius: 16 }}>
                  <Ionicons name="image-outline" size={22} color={INK_3} />
                  <Text className="text-[12px] font-sans-bold text-ink-2 mt-1">Add a cover banner</Text>
                </View>
              )}
              {(bannerUri || bannerUrl) && (
                <View className="absolute bottom-2 right-2 flex-row gap-2">
                  <Pressable
                    onPress={() => { setBannerUri(null); setBannerUrl(null); }}
                    hitSlop={6}
                    className="w-8 h-8 rounded-full items-center justify-center"
                    style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
                  >
                    <Ionicons name="trash-outline" size={15} color="#ffffff" />
                  </Pressable>
                  <View className="w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.55)" }}>
                    <Ionicons name="camera" size={15} color="#ffffff" />
                  </View>
                </View>
              )}
            </Pressable>
          </View>

          {/* Form */}
          <Field label="Display name" value={name} onChangeValue={setName} autoCapitalize="words" />
          <Field label="Service category" value={category} onChangeValue={setCategory} placeholder="e.g. Cleaning" autoCapitalize="words" />
          <Field label="Service area / location" value={location} onChangeValue={setLocation} placeholder="e.g. Lekki, Lagos" autoCapitalize="words" />

          <View className="mt-4">
            <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mb-1.5">About</Text>
            <TextInput
              value={about}
              onChangeText={setAbout}
              multiline
              textAlignVertical="top"
              placeholder="What your business does and what makes it stand out."
              placeholderTextColor={INK_3}
              className="bg-white border border-line rounded-2xl px-4 py-3 text-ink-2 text-[14px]"
              style={{ minHeight: 100 }}
            />
          </View>

          <Field
            label="Years' experience"
            value={years}
            onChangeValue={(v) => setYears(v.replace(/[^0-9]/g, ""))}
            keyboardType="number-pad"
          />

          {/* Portfolio / recent work */}
          <View className="mt-6">
            <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mb-1.5">
              Recent work
            </Text>
            <Text className="text-[11.5px] text-ink-3 mb-2.5">
              Show off completed jobs — up to {MAX_PORTFOLIO} photos. These appear on your public profile.
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {portfolio.map((uri) => (
                <View key={uri} className="relative" style={{ width: "31.5%" }}>
                  <Image source={{ uri }} style={{ width: "100%", height: 100, borderRadius: 12 }} contentFit="cover" />
                  <Pressable
                    onPress={() => setPortfolio((p) => p.filter((u) => u !== uri))}
                    className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white items-center justify-center"
                    hitSlop={6}
                    style={{ borderWidth: 1, borderColor: "#e1dcd3" }}
                  >
                    <Ionicons name="close" size={12} color={INK_2} />
                  </Pressable>
                </View>
              ))}
              {portfolio.length < MAX_PORTFOLIO && (
                <Pressable
                  onPress={pickPortfolio}
                  className="items-center justify-center bg-white"
                  style={{ width: "31.5%", height: 100, borderRadius: 12, borderWidth: 1.5, borderStyle: "dashed", borderColor: "#d3cdc1" }}
                >
                  <Ionicons name="add" size={22} color={INK_2} />
                  <Text className="text-[11px] font-sans-bold text-ink-2 mt-1">Add</Text>
                </Pressable>
              )}
            </View>
            <Text className="text-[11.5px] text-ink-3 mt-2">{portfolio.length}/{MAX_PORTFOLIO} added</Text>
          </View>
        </ScrollView>

        <View className="absolute left-0 right-0 bottom-0 bg-cream border-line" style={{ borderTopWidth: 0.5, paddingHorizontal: 16, paddingTop: 14, paddingBottom: Math.max(insets.bottom, 20) + 10 }}>
          <Pressable onPress={onSave} disabled={saving} className="bg-primary rounded-full items-center active:opacity-80" style={{ paddingVertical: 16, opacity: saving ? 0.6 : 1 }}>
            <Text className="text-white font-sans-bold text-[15px]">{saving ? "Saving…" : "Save changes"}</Text>
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
        <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase">{label}</Text>
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
