import { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Alert } from "@/lib/dialog";
import { Stack, router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { BouncyLoader } from "@/components/brand/BouncyLoader";
import { PLAvatar } from "@/components/brand/PLAvatar";
import { Appear, PressableScale, RevealScrollView } from "@/components/anim";
import blocksService, { type BlockedUser } from "@/api/services/blocks";

const PRIMARY = "#1f6f43";
const INK = "#1a2120";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

function initialsOf(name?: string | null) {
  if (!name) return "PL";
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export default function BlockedUsersScreen() {
  const [items, setItems] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [working, setWorking] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(false);
    try {
      const res = await blocksService.list();
      setItems(res);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const unblock = (u: BlockedUser) => {
    Alert.alert(`Unblock ${u.name}?`, "They'll be able to message you again.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Unblock",
        onPress: async () => {
          setWorking(u.id);
          try {
            await blocksService.unblock(u.id);
            setItems((arr) => arr.filter((x) => x.id !== u.id));
          } catch {
            Alert.alert("Couldn't unblock", "Please try again.");
          } finally {
            setWorking(null);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-row items-center justify-between px-5 pt-1 pb-2">
        <Pressable
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full bg-cream-2 items-center justify-center"
        >
          <Ionicons name="chevron-back" size={18} color={INK_2} />
        </Pressable>
        <Text className="text-[15px] font-sans-bold text-ink">Blocked users</Text>
        <View style={{ width: 36 }} />
      </View>

      <RevealScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View className="py-20 items-center">
            <BouncyLoader color={PRIMARY} />
          </View>
        ) : error ? (
          <Appear from="fade">
            <View className="items-center pt-16">
              <Text className="text-[14px] font-sans-bold text-ink">
                Couldn't load blocked users
              </Text>
              <Text className="text-[12.5px] text-ink-3 mt-1">
                Check your connection and try again.
              </Text>
            </View>
          </Appear>
        ) : items.length === 0 ? (
          <Appear from="fade">
            <View className="items-center pt-16">
              <View className="w-16 h-16 rounded-full bg-cream-2 items-center justify-center">
                <Ionicons name="person-remove-outline" size={26} color={INK_2} />
              </View>
              <Text className="text-[15px] font-sans-bold text-ink mt-4">
                No blocked users
              </Text>
              <Text className="text-[12.5px] text-ink-3 mt-1.5 text-center leading-5 max-w-[260px]">
                When you block someone from a chat or their profile, they'll
                show up here.
              </Text>
            </View>
          </Appear>
        ) : (
          <View className="mt-4 gap-2.5">
            {items.map((u) => (
              <View
                key={u.id}
                className="flex-row items-center gap-3 bg-white rounded-2xl p-3"
                style={{ borderWidth: 0.5, borderColor: "#e1dcd3" }}
              >
                {u.avatarUrl ? (
                  <Image
                    source={{ uri: u.avatarUrl }}
                    style={{ width: 44, height: 44, borderRadius: 22 }}
                    contentFit="cover"
                  />
                ) : (
                  <PLAvatar initials={initialsOf(u.name)} size={44} tone="primary" />
                )}
                <View className="flex-1">
                  <Text className="text-[13.5px] font-sans-bold text-ink">
                    {u.name}
                  </Text>
                  <Text className="text-[11.5px] text-ink-3 mt-0.5">
                    Blocked ·{" "}
                    {new Date(u.blockedAt).toLocaleDateString()}
                  </Text>
                </View>
                <PressableScale
                  onPress={() => unblock(u)}
                  disabled={working === u.id}
                  className="px-3.5 py-2 rounded-full"
                  style={{ backgroundColor: "#f0f0f0" }}
                >
                  <Text className="text-[12px] font-sans-bold text-ink-2">
                    {working === u.id ? "…" : "Unblock"}
                  </Text>
                </PressableScale>
              </View>
            ))}
          </View>
        )}
      </RevealScrollView>
    </SafeAreaView>
  );
}
