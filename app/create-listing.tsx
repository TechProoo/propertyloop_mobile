import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Image } from "expo-image";
import { Stack, router, useLocalSearchParams, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { BouncyLoader } from "@/components/brand/BouncyLoader";
import {
  CREATE_LISTING_AMENITIES,
  CREATE_LISTING_TYPES,
} from "@/mocks/agent";
import listingsService from "@/api/services/listings";
import type { ListingType } from "@/api/types";

const TYPE_TO_ID: Record<string, string> = {
  SALE: "sale",
  RENT: "rent",
  SHORTLET: "shortlet",
};

const PRIMARY = "#1f6f43";
const INK = "#1a2120";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

const STEPS = ["Basics", "Photos", "Details", "Publish"] as const;
type Step = (typeof STEPS)[number];

const PROPERTY_TYPES = [
  "Apartment",
  "House",
  "Duplex",
  "Bungalow",
  "Terrace",
  "Penthouse",
  "Studio",
  "Land",
];

const TYPE_MAP: Record<string, ListingType> = {
  sale: "SALE",
  rent: "RENT",
  shortlet: "SHORTLET",
};
const PERIOD_MAP: Record<string, string | undefined> = {
  sale: undefined,
  rent: "/yr",
  shortlet: "/night",
};

export default function CreateListingScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;
  const [loadingEdit, setLoadingEdit] = useState(!!id);
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<Step>("Basics");
  const [type, setType] = useState("sale");
  const [title, setTitle] = useState("");
  const [propertyType, setPropertyType] = useState("Apartment");
  const [address, setAddress] = useState("");
  const [area, setArea] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [price, setPrice] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [beds, setBeds] = useState("3");
  const [baths, setBaths] = useState("3");
  const [sqm, setSqm] = useState("");
  const [year, setYear] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [description, setDescription] = useState("");

  // Editing: load the real listing and prefill every field.
  useEffect(() => {
    if (!id) return;
    let active = true;
    listingsService
      .getById(id)
      .then((l) => {
        if (!active) return;
        setType(TYPE_TO_ID[l.type] ?? "sale");
        setTitle(l.title);
        setPropertyType(l.propertyType || "Apartment");
        setAddress(l.address ?? "");
        setArea(l.location);
        setPrice(String(l.priceNaira));
        setBeds(String(l.beds));
        setBaths(String(l.baths));
        setSqm(l.sqft ?? "");
        setYear(l.yearBuilt ?? "");
        setAmenities(l.features ?? []);
        setDescription(l.description ?? "");
        setPhotos(l.images?.length ? l.images : l.coverImage ? [l.coverImage] : []);
      })
      .catch(() => {})
      .finally(() => active && setLoadingEdit(false));
    return () => {
      active = false;
    };
  }, [id]);

  // Upload only newly-picked (local) photos; keep already-hosted URLs as-is.
  // Sequential, not parallel: mobile radios drop concurrent upload streams
  // (intermittent connection resets), so one-at-a-time is far more reliable.
  const resolvePhotos = async () => {
    const urls: string[] = [];
    for (const u of photos) {
      urls.push(u.startsWith("http") ? u : await listingsService.uploadPhoto(u));
    }
    return urls;
  };

  const stepIdx = STEPS.indexOf(step);
  const progress = (stepIdx + 1) / STEPS.length;

  const goBack = () => {
    if (stepIdx === 0) {
      router.back();
      return;
    }
    setStep(STEPS[stepIdx - 1]);
  };
  const goNext = () => {
    if (stepIdx === STEPS.length - 1) {
      if (isEdit) void saveEdit();
      else void publish();
      return;
    }
    setStep(STEPS[stepIdx + 1]);
  };

  const pickPhotos = async () => {
    const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!lib.granted) {
      Alert.alert("Photo library", "Allow library access in Settings.");
      return;
    }
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: 8 - photos.length,
      quality: 0.85,
    });
    if (!r.canceled) {
      setPhotos((p) => [...p, ...r.assets.map((a) => a.uri)].slice(0, 8));
    }
  };

  const toggleAmenity = (v: string) =>
    setAmenities((arr) =>
      arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v],
    );

  // Description must reach a minimum word count so buyers get a real picture
  // of the home — short blurbs hurt match quality and listing trust.
  const MIN_WORDS = 15;
  const wordCount = description.trim() ? description.trim().split(/\s+/).length : 0;
  const wordsLeft = Math.max(0, MIN_WORDS - wordCount);

  const canNext =
    step === "Basics"
      ? !!type &&
        !!propertyType &&
        !!title.trim() &&
        !!address.trim() &&
        !!area.trim() &&
        !!price.trim()
      : step === "Photos"
        ? photos.length >= 1
        : step === "Details"
          ? !!beds && !!baths && wordCount >= MIN_WORDS
          : true;

  const buildPayload = (urls: string[]) => ({
    title: title.trim(),
    type: TYPE_MAP[type] ?? "SALE",
    propertyType,
    priceNaira: Number(price) || 0,
    period: PERIOD_MAP[type],
    address: address.trim(),
    location: area.trim(),
    beds: Number(beds) || 0,
    baths: Number(baths) || 0,
    sqft: sqm.trim() || undefined,
    yearBuilt: year.trim() || undefined,
    description: description.trim(),
    features: amenities,
    coverImage: urls[0],
    images: urls,
  });

  const publish = async () => {
    setSubmitting(true);
    try {
      let urls: string[];
      try {
        urls = await resolvePhotos();
      } catch (e: any) {
        Alert.alert("Photo upload failed", errText(e));
        return;
      }
      await listingsService.create(buildPayload(urls));
      Alert.alert(
        "Listing published",
        "Your listing is now live for buyers in matching searches.",
        [{ text: "OK", onPress: () => router.replace("/(agent-tabs)/listings" as Href) }],
      );
    } catch (e: any) {
      Alert.alert("Publish failed", errText(e));
    } finally {
      setSubmitting(false);
    }
  };

  const saveEdit = async () => {
    if (!id) return;
    setSubmitting(true);
    try {
      let urls: string[];
      try {
        urls = await resolvePhotos();
      } catch (e: any) {
        Alert.alert("Photo upload failed", errText(e));
        return;
      }
      await listingsService.update(id, buildPayload(urls));
      Alert.alert("Changes saved", "Your listing has been updated.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert("Save failed", errText(e));
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingEdit) {
    return (
      <View className="flex-1 bg-cream items-center justify-center">
        <Stack.Screen options={{ headerShown: false }} />
        <BouncyLoader color={PRIMARY} />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1">
        {/* Top bar */}
        <View className="flex-row items-center justify-between px-5 pt-1 pb-2">
          <Pressable
            onPress={goBack}
            className="w-9 h-9 rounded-full bg-cream-2 items-center justify-center"
          >
            <Ionicons name={stepIdx === 0 ? "close" : "chevron-back"} size={18} color={INK_2} />
          </Pressable>
          <Text className="text-[15px] font-sans-bold text-ink">
            {isEdit ? "Edit listing" : "New listing"}
          </Text>
          <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest">
            {stepIdx + 1}/{STEPS.length}
          </Text>
        </View>

        {/* Progress bar */}
        <View className="px-5 mt-2">
          <View
            className="bg-line rounded-full overflow-hidden"
            style={{ height: 4 }}
          >
            <View
              className="bg-primary"
              style={{ width: `${progress * 100}%`, height: 4 }}
            />
          </View>
          <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mt-2">
            {step}
          </Text>
        </View>

        <KeyboardAwareScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140, paddingTop: 12 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          bottomOffset={24}
        >
          {step === "Basics" && (
            <>
              <Heading title="What are you listing" italic="?" />
              <Label className="mt-5">Type</Label>
              <View className="flex-row gap-2 mt-2">
                {CREATE_LISTING_TYPES.map((t) => {
                  const on = type === t.id;
                  return (
                    <Pressable
                      key={t.id}
                      onPress={() => setType(t.id)}
                      className="flex-1 rounded-full items-center py-2.5"
                      style={{
                        backgroundColor: on ? INK : "#ffffff",
                        borderWidth: on ? 0 : 1,
                        borderColor: "#e1dcd3",
                      }}
                    >
                      <Text
                        className="text-[13px] font-sans-bold"
                        style={{ color: on ? "#ffffff" : INK_2 }}
                      >
                        {t.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Label className="mt-5">Property type</Label>
              <View className="flex-row flex-wrap gap-2">
                {PROPERTY_TYPES.map((p) => {
                  const on = propertyType === p;
                  return (
                    <Pressable
                      key={p}
                      onPress={() => setPropertyType(p)}
                      className="px-3.5 py-2 rounded-full"
                      style={{
                        backgroundColor: on ? "#e3efe7" : "#ffffff",
                        borderWidth: 1,
                        borderColor: on ? PRIMARY : "#e1dcd3",
                      }}
                    >
                      <Text
                        className="text-[12.5px] font-sans-bold"
                        style={{ color: on ? "#134a2d" : INK_2 }}
                      >
                        {p}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Label className="mt-5">Listing title</Label>
              <Field value={title} onChangeText={setTitle} placeholder="e.g. Hibiscus House · 4-bed" autoCapitalize="words" />

              <Label className="mt-4">Full address</Label>
              <Field value={address} onChangeText={setAddress} placeholder="e.g. 12 Admiralty Way, Lekki Phase 1" autoCapitalize="words" />

              <Label className="mt-4">Area</Label>
              <Field value={area} onChangeText={setArea} placeholder="e.g. Lekki Phase 1" autoCapitalize="words" />
              <Text className="text-[11.5px] text-ink-3 mt-1.5">
                The neighbourhood buyers search by. The full address stays private until a viewing is booked.
              </Text>

              <Label className="mt-4">Asking price</Label>
              <Field
                value={price}
                onChangeText={(t) => setPrice(t.replace(/[^0-9]/g, ""))}
                placeholder={type === "sale" ? "₦78,000,000" : "₦4,800,000/yr"}
                keyboardType="number-pad"
              />
              <Text className="text-[11.5px] text-ink-3 mt-1.5">
                {type === "sale"
                  ? "Total sale price in naira."
                  : type === "rent"
                    ? "Annual rent in naira."
                    : "Nightly rate in naira."}
              </Text>
            </>
          )}

          {step === "Photos" && (
            <>
              <Heading title="Add up to 8" italic=" photos" />
              <Text className="text-[13px] text-ink-2 mt-2 leading-5">
                Bright, level, taken in landscape. The first photo is the cover.
              </Text>

              <View className="flex-row flex-wrap gap-2 mt-4">
                {photos.map((uri, i) => (
                  <View key={uri} className="relative" style={{ width: "31.5%" }}>
                    <Image
                      source={{ uri }}
                      style={{ width: "100%", height: 100, borderRadius: 12 }}
                      contentFit="cover"
                    />
                    {i === 0 && (
                      <View className="absolute top-1 left-1 bg-ink px-1.5 py-0.5 rounded-full">
                        <Text className="text-[9px] font-sans-bold text-white tracking-widest uppercase">
                          Cover
                        </Text>
                      </View>
                    )}
                    <Pressable
                      onPress={() => setPhotos((p) => p.filter((u) => u !== uri))}
                      className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white items-center justify-center"
                      hitSlop={6}
                      style={{ borderWidth: 1, borderColor: "#e1dcd3" }}
                    >
                      <Ionicons name="close" size={12} color={INK_2} />
                    </Pressable>
                  </View>
                ))}
                {photos.length < 8 && (
                  <Pressable
                    onPress={pickPhotos}
                    className="items-center justify-center bg-white border-line"
                    style={{
                      width: "31.5%",
                      height: 100,
                      borderRadius: 12,
                      borderWidth: 1.5,
                      borderStyle: "dashed",
                      borderColor: "#d3cdc1",
                    }}
                  >
                    <Ionicons name="add" size={22} color={INK_2} />
                    <Text className="text-[11px] font-sans-bold text-ink-2 mt-1">
                      Add
                    </Text>
                  </Pressable>
                )}
              </View>
              <Text className="text-[11.5px] text-ink-3 mt-3">
                {photos.length}/8 added · drag to reorder coming soon
              </Text>
            </>
          )}

          {step === "Details" && (
            <>
              <Heading title="The" italic=" specifics" />
              <View className="flex-row gap-3 mt-5">
                <Stepper label="Bedrooms" value={beds} setValue={setBeds} />
                <Stepper label="Bathrooms" value={baths} setValue={setBaths} />
              </View>

              <View className="flex-row gap-3 mt-5">
                <View className="flex-1">
                  <Label>
                    Area (m²) <Text className="text-ink-3">· optional</Text>
                  </Label>
                  <Field
                    value={sqm}
                    onChangeText={(t) => setSqm(t.replace(/[^0-9]/g, ""))}
                    placeholder="e.g. 320"
                    keyboardType="number-pad"
                  />
                </View>
                <View className="flex-1">
                  <Label>
                    Year built <Text className="text-ink-3">· optional</Text>
                  </Label>
                  <Field
                    value={year}
                    onChangeText={(t) => setYear(t.replace(/[^0-9]/g, "").slice(0, 4))}
                    placeholder="e.g. 2021"
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <Label className="mt-5">Amenities</Label>
              <View className="flex-row flex-wrap gap-2 mt-2">
                {CREATE_LISTING_AMENITIES.map((a) => {
                  const on = amenities.includes(a);
                  return (
                    <Pressable
                      key={a}
                      onPress={() => toggleAmenity(a)}
                      className="px-3.5 py-2 rounded-full"
                      style={{
                        backgroundColor: on ? "#e3efe7" : "#ffffff",
                        borderWidth: 1,
                        borderColor: on ? PRIMARY : "#e1dcd3",
                      }}
                    >
                      <Text
                        className="text-[12.5px] font-sans-bold"
                        style={{ color: on ? "#134a2d" : INK_2 }}
                      >
                        {a}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Label className="mt-5">Description</Label>
              <TextInput
                value={description}
                onChangeText={setDescription}
                multiline
                textAlignVertical="top"
                placeholder="What makes this home special? Layout, neighbourhood, finishes."
                placeholderTextColor={INK_3}
                className="bg-white border border-line rounded-2xl px-4 py-3 text-ink text-[14px] mt-2"
                style={{ minHeight: 120 }}
              />
              <Text
                className="text-[11px] mt-1.5"
                style={{ color: wordCount < MIN_WORDS ? "#b3261e" : INK_3 }}
              >
                {wordCount < MIN_WORDS
                  ? `Add at least ${MIN_WORDS} words so buyers get the full picture — ${wordsLeft} more to go.`
                  : `${wordCount} words · looks good`}
              </Text>
            </>
          )}

          {step === "Publish" && (
            <>
              <Heading title="Ready to" italic=" publish" />
              <Text className="text-[13px] text-ink-2 mt-2 leading-5">
                Review your listing summary. You can edit anything afterwards from
                the listings tab.
              </Text>
              <View
                className="mt-4 bg-white rounded-2xl px-4 py-3.5 border-line gap-2"
                style={{ borderWidth: 0.5 }}
              >
                <Summary label="Type"        value={CREATE_LISTING_TYPES.find((t) => t.id === type)?.label ?? type} />
                <Summary label="Title"       value={title || "—"} />
                <Summary label="Address"     value={address || "—"} />
                <Summary label="Area"        value={area || "—"} />
                <Summary label="Price"       value={price ? `₦${Number(price).toLocaleString()}` : "—"} />
                <Summary label="Bed / bath"  value={`${beds} bed · ${baths} bath${sqm ? ` · ${sqm} m²` : ""}${year ? ` · ${year}` : ""}`} />
                <Summary label="Photos"      value={`${photos.length} of 8`} />
                <Summary label="Amenities"   value={amenities.length ? `${amenities.length} selected` : "none"} last />
              </View>

              <View
                className="mt-4 rounded-2xl px-3.5 py-3 flex-row gap-2.5 items-start"
                style={{ backgroundColor: "#e3efe7" }}
              >
                <Ionicons name="shield-checkmark" size={15} color="#134a2d" style={{ marginTop: 1 }} />
                <Text className="flex-1 text-[11.5px] leading-4" style={{ color: "#134a2d" }}>
                  Published listings show your verified badge and agency. Listings
                  that violate our guidelines are taken down within 24h.
                </Text>
              </View>
            </>
          )}
        </KeyboardAwareScrollView>

        {/* Sticky CTA */}
        <View
          className="absolute left-0 right-0 bottom-0 bg-cream border-line"
          style={{
            borderTopWidth: 0.5,
            paddingHorizontal: 16,
            paddingTop: 14,
            paddingBottom: Math.max(insets.bottom, 20) + 10,
          }}
        >
          <Pressable
            onPress={goNext}
            disabled={!canNext || submitting}
            className="bg-primary rounded-full items-center active:opacity-80 disabled:opacity-50"
            style={{ paddingVertical: 16 }}
          >
            <Text className="text-white font-sans-bold text-[15px]">
              {step === "Publish"
                ? submitting
                  ? "Publishing…"
                  : isEdit
                    ? "Save changes"
                    : "Publish listing"
                : "Continue"}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

// Surface the *actual* failure instead of a vague fallback, so upload/network
// problems are diagnosable: server validation message → HTTP status → the
// transport error ("Network Error", "timeout of 90000ms exceeded").
function errText(e: any): string {
  const m = e?.response?.data?.message;
  if (m) return Array.isArray(m) ? m.join(", ") : String(m);
  if (e?.response?.status) {
    return `Server responded ${e.response.status}. Please try again.`;
  }
  if (e?.message) return `${e.message}. Please try again.`;
  return "Couldn't publish. Please try again.";
}

function Heading({ title, italic }: { title: string; italic: string }) {
  return (
    <Text
      className="font-serif text-ink mt-2"
      style={{ fontSize: 26, letterSpacing: -0.5, lineHeight: 28 }}
    >
      {title}
      <Text className="font-serif-italic">{italic}</Text>
    </Text>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Text className={`text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mb-1.5 ${className ?? ""}`}>
      {children}
    </Text>
  );
}

function Field(props: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      placeholderTextColor={INK_3}
      className="bg-white border border-line rounded-2xl px-4 py-3.5 text-ink text-[15px]"
      {...props}
    />
  );
}

function Stepper({
  label, value, setValue,
}: {
  label: string;
  value: string;
  setValue: (v: string) => void;
}) {
  const n = Number(value) || 0;
  return (
    <View className="flex-1">
      <Label>{label}</Label>
      <View
        className="bg-white border border-line rounded-2xl flex-row items-center justify-between px-1.5 py-1.5"
      >
        <Pressable
          onPress={() => setValue(String(Math.max(0, n - 1)))}
          className="w-9 h-9 rounded-xl bg-cream-2 items-center justify-center"
        >
          <Ionicons name="remove" size={16} color={INK_2} />
        </Pressable>
        <Text className="font-serif text-ink" style={{ fontSize: 20 }}>
          {value || "0"}
        </Text>
        <Pressable
          onPress={() => setValue(String(n + 1))}
          className="w-9 h-9 rounded-xl bg-cream-2 items-center justify-center"
        >
          <Ionicons name="add" size={16} color={INK_2} />
        </Pressable>
      </View>
    </View>
  );
}

function Summary({
  label, value, last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View
      className="flex-row items-center justify-between py-1.5"
      style={{
        borderBottomWidth: last ? 0 : 0.5,
        borderBottomColor: "#ece6df",
        paddingBottom: last ? 0 : 8,
      }}
    >
      <Text className="text-[11.5px] font-sans-semibold text-ink-3">{label}</Text>
      <Text className="text-[13px] font-sans-bold text-ink flex-1 text-right ml-3" numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}
