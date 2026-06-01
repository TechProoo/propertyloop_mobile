import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Stack, router, useLocalSearchParams, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { PLAvatar } from "@/components/brand/PLAvatar";
import { ACTIVE_JOB_STEPS, getVendorJob } from "@/mocks/vendor";

const PRIMARY = "#1f6f43";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

type StepIdx = 0 | 1 | 2 | 3;

export default function VendorActiveJobScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const job = getVendorJob(id);

  const [stepIdx, setStepIdx] = useState<StepIdx>(2); // 'started'
  const [photos, setPhotos]   = useState<string[]>([]);
  const [note, setNote]       = useState("");

  const pickPhotos = async () => {
    const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!lib.granted) {
      Alert.alert("Photo library", "Allow library access in Settings.");
      return;
    }
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: 6 - photos.length,
      quality: 0.85,
    });
    if (!r.canceled) {
      setPhotos((p) => [...p, ...r.assets.map((a) => a.uri)].slice(0, 6));
    }
  };

  const advance = () => {
    if (stepIdx < 2) {
      setStepIdx(((stepIdx as number) + 1) as StepIdx);
      return;
    }
    // Marking complete
    Alert.alert(
      "Mark complete & request release?",
      "Customer will be asked to confirm. Once they do, your share lands in your bank.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Mark complete",
          onPress: () => router.replace("/vendor-job-done" as Href),
        },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top bar */}
      <View className="flex-row items-center justify-between px-5 pt-1 pb-2">
        <Pressable
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full bg-cream-2 items-center justify-center"
        >
          <Ionicons name="chevron-back" size={18} color={INK_2} />
        </Pressable>
        <Text className="text-[15px] font-sans-bold text-ink">Active job</Text>
        <View className="flex-row items-center gap-1">
          <View style={{ width: 6, height: 6, borderRadius: 6, backgroundColor: PRIMARY }} />
          <Text className="text-[11px] font-sans-bold text-primary">Live</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 170 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Customer */}
        <View
          className="bg-white rounded-2xl p-3 flex-row items-center gap-3 border-line"
          style={{ borderWidth: 0.5 }}
        >
          <PLAvatar
            initials={job.customer.initials}
            size={44}
            tone={job.customer.tone}
          />
          <View className="flex-1">
            <Text className="text-[14px] font-sans-bold text-ink">{job.customer.name}</Text>
            <Text className="text-[12px] text-ink-3">
              {job.service} · {job.amount}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/conversation/chinwe" as Href)}
            className="w-9 h-9 rounded-full bg-cream-2 items-center justify-center"
          >
            <Ionicons name="chatbubble-outline" size={16} color={INK_2} />
          </Pressable>
        </View>

        {/* Progress tracker */}
        <View className="mt-5">
          {ACTIVE_JOB_STEPS.map((s, i, arr) => {
            const done = i < stepIdx;
            const active = i === stepIdx;
            const todo = i > stepIdx;
            return (
              <View key={s.id} className="flex-row gap-3.5">
                <View className="items-center" style={{ width: 30 }}>
                  <View
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 15,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: done ? PRIMARY : active ? "#ffffff" : "#ece6df",
                      borderWidth: active ? 2 : 0,
                      borderColor: PRIMARY,
                    }}
                  >
                    {done ? (
                      <Ionicons name="checkmark" size={14} color="#ffffff" />
                    ) : (
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 8,
                          backgroundColor: active ? PRIMARY : INK_3,
                        }}
                      />
                    )}
                  </View>
                  {i < arr.length - 1 && (
                    <View
                      style={{
                        flex: 1,
                        width: 2,
                        backgroundColor: done ? PRIMARY : "#e1dcd3",
                        marginVertical: 2,
                        minHeight: 18,
                      }}
                    />
                  )}
                </View>
                <View className="flex-1 pb-4">
                  <Text
                    className="text-[14px] font-sans-bold"
                    style={{ color: todo ? INK_3 : "#1a2120" }}
                  >
                    {s.title}
                  </Text>
                  <Text className="text-[11.5px] text-ink-3 mt-0.5">{s.detail}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Completion photos */}
        <View className="flex-row items-baseline justify-between mt-2 mb-2">
          <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase">
            Photos of finished work
          </Text>
          <Text className="text-[11px] font-sans-semibold text-ink-3">
            {photos.length} added
          </Text>
        </View>
        <View className="flex-row flex-wrap gap-1.5">
          {photos.map((uri) => (
            <View key={uri} className="relative" style={{ width: "23.5%" }}>
              <Image
                source={{ uri }}
                style={{ width: "100%", aspectRatio: 1, borderRadius: 10 }}
                contentFit="cover"
              />
              <Pressable
                onPress={() => setPhotos((p) => p.filter((u) => u !== uri))}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white items-center justify-center"
                hitSlop={6}
                style={{ borderWidth: 1, borderColor: "#e1dcd3" }}
              >
                <Ionicons name="close" size={10} color={INK_2} />
              </Pressable>
            </View>
          ))}
          {photos.length < 6 && (
            <Pressable
              onPress={pickPhotos}
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

        {/* Note */}
        <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mt-5 mb-2">
          Note for customer
        </Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          multiline
          textAlignVertical="top"
          placeholder='"All done — left a note about what we tackled."'
          placeholderTextColor={INK_3}
          className="bg-white border border-line rounded-2xl px-4 py-3 text-ink-2 text-[14px]"
          style={{ minHeight: 70, fontFamily: "PlayfairDisplay_400Regular_Italic" }}
        />

        {/* Add extra */}
        <Pressable
          onPress={() => router.push(`/vendor-extra?jobId=${job.id}` as Href)}
          className="mt-3 flex-row items-center gap-3 px-3.5 py-3 rounded-2xl active:opacity-90"
          style={{
            backgroundColor: "#ece6df",
            borderWidth: 1,
            borderStyle: "dashed",
            borderColor: "#d3cdc1",
          }}
        >
          <View
            className="w-9 h-9 rounded-lg items-center justify-center"
            style={{ backgroundColor: "#ffffff" }}
          >
            <Ionicons name="add" size={16} color={INK_2} />
          </View>
          <View className="flex-1">
            <Text className="text-[13px] font-sans-bold text-ink">
              Add unexpected extra
            </Text>
            <Text className="text-[11px] text-ink-3 mt-0.5">
              Needs customer approval before charging
            </Text>
          </View>
        </Pressable>
      </ScrollView>

      {/* Sticky CTA */}
      <View
        className="absolute left-0 right-0 bottom-0 bg-cream border-line"
        style={{
          borderTopWidth: 0.5,
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: 28,
        }}
      >
        <Pressable
          onPress={advance}
          className="bg-primary rounded-full items-center active:opacity-80"
          style={{ paddingVertical: 16 }}
        >
          <Text className="text-white font-sans-bold text-[15px]">
            {stepIdx === 0
              ? "Mark arrived"
              : stepIdx === 1
                ? "Start work"
                : "Mark complete & request release"}
          </Text>
        </Pressable>
        <Text className="text-center text-[11px] text-ink-3 mt-2">
          Customer confirms → your share released to your bank
        </Text>
      </View>
    </SafeAreaView>
  );
}
