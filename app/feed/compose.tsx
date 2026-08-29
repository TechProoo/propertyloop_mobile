import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Stack, router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Alert } from "@/lib/dialog";
import feedService, {
  type CreateFeedPostPayload,
} from "@/api/services/feed";
import listingsService from "@/api/services/listings";
import type { Listing } from "@/api/types";
import { useAuth } from "@/context/auth";
import {
  Avatar,
  INK_3,
  LINE,
  PRIMARY,
  RolePill,
} from "@/components/feed/FeedPrimitives";
import { tapLight, tapMedium } from "@/lib/haptics";
import { queueCreatedPost } from "@/components/feed/feedSync";

/** Same five composer modes as the web ComposerModal. */
const TYPES = ["Photos", "Insight", "Project", "Listing", "Poll"] as const;
type ComposerType = (typeof TYPES)[number];

const MAX_IMAGES = 4;

export default function FeedComposeScreen() {
  const params = useLocalSearchParams<{ type?: string }>();
  const { user } = useAuth();
  const isAgent = user?.role === "AGENT";

  const [type, setType] = useState<ComposerType>(
    (TYPES as readonly string[]).includes(params.type ?? "")
      ? (params.type as ComposerType)
      : "Photos",
  );
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);

  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const [insightMetric, setInsightMetric] = useState("");
  const [insightPeriod, setInsightPeriod] = useState("");
  const [insightDelta, setInsightDelta] = useState("");

  const [projectName, setProjectName] = useState("");
  const [projectLocation, setProjectLocation] = useState("");
  const [projectUnits, setProjectUnits] = useState("");

  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);

  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [listingId, setListingId] = useState<string | null>(null);

  // Only agents can attach a listing — the backend rejects a listingId the
  // author doesn't own, so the tab is hidden rather than failing on submit.
  useEffect(() => {
    if (type === "Listing" && isAgent && myListings.length === 0) {
      listingsService
        .listMine({ limit: 20 })
        .then((res) => {
          setMyListings(res.items);
          if (res.items[0]) setListingId(res.items[0].id);
        })
        .catch(() => Alert.alert("Couldn't load your listings"));
    }
  }, [type, isAgent, myListings.length]);

  const pickImages = async () => {
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Photo library", "Allow library access in Settings.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.85,
    });
    if (res.canceled) return;

    setUploading(true);
    try {
      const urls = await Promise.all(
        res.assets.slice(0, remaining).map((a) =>
          feedService.uploadImage(a.uri, {
            name: a.fileName ?? undefined,
            type: a.mimeType ?? undefined,
          }),
        ),
      );
      setImages((prev) => [...prev, ...urls]);
    } catch {
      Alert.alert("Image upload failed", "Please try again.");
    }
    setUploading(false);
  };

  const submit = async () => {
    if (!body.trim()) {
      Alert.alert("Write something first");
      return;
    }
    const payload: CreateFeedPostPayload = { body: body.trim() };

    if (type === "Photos") {
      payload.type = "UPDATE";
      payload.images = images;
    } else if (type === "Insight") {
      payload.type = "INSIGHT";
      if (insightMetric.trim()) {
        payload.insightMetric = insightMetric.trim();
        payload.insightPeriod = insightPeriod.trim() || undefined;
        payload.insightDelta = insightDelta.trim() || undefined;
        // The web composer ships this fixed shape too — the bars are
        // illustrative, not derived from real data.
        payload.insightBars = [34, 46, 58, 72, 88, 100];
      }
    } else if (type === "Project") {
      payload.type = "PROJECT";
      payload.images = images;
      if (projectName.trim()) {
        payload.projectName = projectName.trim();
        payload.projectLocation = projectLocation.trim() || undefined;
        payload.projectUnits = projectUnits.trim() || undefined;
      }
    } else if (type === "Listing") {
      payload.type = "LISTING";
      if (!listingId) {
        Alert.alert("Pick a listing to attach");
        return;
      }
      payload.listingId = listingId;
    } else if (type === "Poll") {
      payload.type = "POLL";
      const opts = pollOptions.map((o) => o.trim()).filter(Boolean);
      if (opts.length < 2) {
        Alert.alert("A poll needs at least 2 options");
        return;
      }
      payload.pollOptions = opts;
    }

    setPosting(true);
    try {
      const post = await feedService.create(payload);
      // The list is a separate route, so hand the post over for it to prepend
      // on focus — the web composer prepends directly.
      queueCreatedPost(post);
      tapMedium();
      router.back();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Couldn't publish your post";
      Alert.alert(Array.isArray(msg) ? msg.join(", ") : String(msg));
    }
    setPosting(false);
  };

  const visibleTypes = TYPES.filter((t) => t !== "Listing" || isAgent);

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <View
          className="flex-row items-center justify-between px-5 py-3"
          style={{ borderBottomWidth: 1, borderBottomColor: "#ece6df" }}
        >
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text className="text-ink-2 text-[15px] font-sans-semibold">
              Cancel
            </Text>
          </Pressable>
          <Text className="text-ink text-[17px] font-sans-bold">New post</Text>
          <Pressable
            onPress={submit}
            disabled={posting || uploading}
            className="px-4 py-1.5 rounded-full"
            style={{
              backgroundColor: PRIMARY,
              opacity: posting || uploading ? 0.5 : 1,
            }}
          >
            {posting ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text className="text-white text-[13.5px] font-sans-bold">
                Post
              </Text>
            )}
          </Pressable>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1"
        >
          <ScrollView
            contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Type switcher */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingBottom: 16 }}
            >
              {visibleTypes.map((t) => {
                const active = type === t;
                return (
                  <Pressable
                    key={t}
                    onPress={() => {
                      tapLight();
                      setType(t);
                    }}
                    className="px-4 py-2 rounded-full"
                    style={{
                      borderWidth: 1,
                      borderColor: active ? "#1a2120" : LINE,
                      backgroundColor: active ? "#1a2120" : "#ffffff",
                    }}
                  >
                    <Text
                      className="text-[13.5px] font-sans-bold"
                      style={{ color: active ? "#ffffff" : "#4d524f" }}
                    >
                      {t}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Author strip */}
            <View className="flex-row items-center gap-3 mb-3">
              <Avatar
                author={{
                  name: user?.name ?? "You",
                  avatarUrl: user?.avatarUrl ?? null,
                }}
                size={44}
              />
              <View>
                <Text className="text-ink text-[15px] font-sans-bold">
                  {user?.name ?? "You"}
                </Text>
                {!!user?.role && (
                  <View className="flex-row mt-0.5">
                    <RolePill role={user.role} />
                  </View>
                )}
              </View>
            </View>

            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder="Share an update, insight, or project…"
              placeholderTextColor="#7f857f"
              multiline
              maxLength={4000}
              textAlignVertical="top"
              className="text-ink text-[16px] leading-6 min-h-[120px]"
            />

            {(type === "Photos" || type === "Project") && (
              <View className="mt-4">
                <View className="flex-row flex-wrap gap-2">
                  {images.map((uri, i) => (
                    <View key={uri} className="rounded-xl overflow-hidden">
                      <Image
                        source={{ uri }}
                        style={{ width: 88, height: 88 }}
                        contentFit="cover"
                      />
                      <Pressable
                        onPress={() =>
                          setImages((prev) => prev.filter((_, x) => x !== i))
                        }
                        hitSlop={6}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full items-center justify-center"
                        style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
                      >
                        <Ionicons name="close" size={14} color="#ffffff" />
                      </Pressable>
                    </View>
                  ))}
                  {images.length < MAX_IMAGES && (
                    <Pressable
                      onPress={pickImages}
                      disabled={uploading}
                      className="w-[88px] h-[88px] rounded-xl items-center justify-center"
                      style={{
                        borderWidth: 1,
                        borderStyle: "dashed",
                        borderColor: LINE,
                      }}
                    >
                      {uploading ? (
                        <ActivityIndicator color={PRIMARY} size="small" />
                      ) : (
                        <Ionicons name="add" size={24} color={INK_3} />
                      )}
                    </Pressable>
                  )}
                </View>
                <Text className="text-ink-3 text-xs mt-2">
                  Up to {MAX_IMAGES} photos.
                </Text>
              </View>
            )}

            {type === "Insight" && (
              <View className="mt-4 gap-3">
                <Field
                  label="Metric"
                  value={insightMetric}
                  onChangeText={setInsightMetric}
                  placeholder="e.g. Lekki 3-bed rents"
                />
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Field
                      label="Period"
                      value={insightPeriod}
                      onChangeText={setInsightPeriod}
                      placeholder="e.g. Q3 2026"
                    />
                  </View>
                  <View className="flex-1">
                    <Field
                      label="Change"
                      value={insightDelta}
                      onChangeText={setInsightDelta}
                      placeholder="e.g. +12%"
                    />
                  </View>
                </View>
              </View>
            )}

            {type === "Project" && (
              <View className="mt-4 gap-3">
                <Field
                  label="Project name"
                  value={projectName}
                  onChangeText={setProjectName}
                  placeholder="e.g. Ikoyi Heights"
                />
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Field
                      label="Location"
                      value={projectLocation}
                      onChangeText={setProjectLocation}
                      placeholder="e.g. Ikoyi, Lagos"
                    />
                  </View>
                  <View className="flex-1">
                    <Field
                      label="Units"
                      value={projectUnits}
                      onChangeText={setProjectUnits}
                      placeholder="e.g. 24 units"
                    />
                  </View>
                </View>
              </View>
            )}

            {type === "Poll" && (
              <View className="mt-4 gap-2">
                <Text className="text-ink-2 text-xs font-sans-semibold">
                  Options · 2 to 6
                </Text>
                {pollOptions.map((opt, i) => (
                  <View key={i} className="flex-row items-center gap-2">
                    <TextInput
                      value={opt}
                      onChangeText={(t) =>
                        setPollOptions((prev) =>
                          prev.map((o, x) => (x === i ? t : o)),
                        )
                      }
                      placeholder={`Option ${i + 1}`}
                      placeholderTextColor="#7f857f"
                      className="flex-1 rounded-xl px-3.5 py-2.5 text-ink text-sm"
                      style={{ borderWidth: 1, borderColor: LINE }}
                    />
                    {pollOptions.length > 2 && (
                      <Pressable
                        onPress={() =>
                          setPollOptions((prev) =>
                            prev.filter((_, x) => x !== i),
                          )
                        }
                        hitSlop={8}
                      >
                        <Ionicons name="close" size={18} color={INK_3} />
                      </Pressable>
                    )}
                  </View>
                ))}
                {pollOptions.length < 6 && (
                  <Pressable
                    onPress={() => setPollOptions((prev) => [...prev, ""])}
                    className="self-start flex-row items-center gap-1.5 mt-1"
                  >
                    <Ionicons name="add" size={16} color={PRIMARY} />
                    <Text
                      className="text-[13px] font-sans-bold"
                      style={{ color: PRIMARY }}
                    >
                      Add option
                    </Text>
                  </Pressable>
                )}
                <Text className="text-ink-3 text-xs mt-1">
                  Polls run for 3 days.
                </Text>
              </View>
            )}

            {type === "Listing" && (
              <View className="mt-4">
                <Text className="text-ink-2 text-xs font-sans-semibold mb-2">
                  Attach one of your listings
                </Text>
                {myListings.length === 0 ? (
                  <Text className="text-ink-3 text-[13px]">
                    You have no listings to attach yet.
                  </Text>
                ) : (
                  <View className="gap-2">
                    {myListings.map((l) => {
                      const active = listingId === l.id;
                      return (
                        <Pressable
                          key={l.id}
                          onPress={() => setListingId(l.id)}
                          className="flex-row items-center gap-3 rounded-2xl p-2.5"
                          style={{
                            borderWidth: 1,
                            borderColor: active ? PRIMARY : LINE,
                          }}
                        >
                          <Image
                            source={{ uri: l.coverImage }}
                            style={{ width: 56, height: 56, borderRadius: 10 }}
                            contentFit="cover"
                          />
                          <View className="flex-1 min-w-0">
                            <Text
                              numberOfLines={1}
                              className="text-ink text-[14px] font-sans-bold"
                            >
                              {l.title}
                            </Text>
                            <Text
                              numberOfLines={1}
                              className="text-ink-3 text-[12px] mt-0.5"
                            >
                              {l.priceLabel}
                            </Text>
                          </View>
                          {active && (
                            <Ionicons
                              name="checkmark-circle"
                              size={20}
                              color={PRIMARY}
                            />
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function Field({
  label,
  ...inputProps
}: React.ComponentProps<typeof TextInput> & { label: string }) {
  return (
    <View>
      <Text className="text-ink-2 text-xs font-sans-semibold mb-1.5">
        {label}
      </Text>
      <TextInput
        {...inputProps}
        placeholderTextColor="#7f857f"
        className="rounded-xl px-3.5 py-2.5 text-ink text-sm"
        style={{ borderWidth: 1, borderColor: LINE }}
      />
    </View>
  );
}
