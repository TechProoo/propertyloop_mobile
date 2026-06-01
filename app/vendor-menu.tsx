import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { VENDOR_SERVICES, type VendorService } from "@/mocks/vendor";

const PRIMARY = "#1f6f43";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

export default function VendorMenuScreen() {
  const active = VENDOR_SERVICES.filter((s) => !s.archived);
  const archived = VENDOR_SERVICES.filter((s) => s.archived);

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
        <View className="items-center">
          <Text className="text-[11px] font-sans-bold text-primary tracking-widest uppercase">
            Your offer
          </Text>
          <Text className="text-[14px] font-sans-bold text-ink">Service menu</Text>
        </View>
        <Pressable
          onPress={() => router.push("/vendor-first-service" as never)}
          className="flex-row items-center gap-1 px-3 py-1.5 rounded-full"
          style={{ backgroundColor: PRIMARY }}
        >
          <Ionicons name="add" size={14} color="#ffffff" />
          <Text className="text-[12px] font-sans-bold text-white">Add</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mb-2 px-1">
          Active · {active.length}
        </Text>
        <View className="gap-2.5">
          {active.map((s) => (
            <ServiceCard key={s.id} service={s} />
          ))}
        </View>

        {archived.length > 0 && (
          <>
            <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mb-2 mt-5 px-1">
              Archived · {archived.length}
            </Text>
            <View className="gap-2.5">
              {archived.map((s) => (
                <ServiceCard key={s.id} service={s} />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ServiceCard({ service }: { service: VendorService }) {
  const archived = !!service.archived;
  const edit = () => Alert.alert("Edit service", `Edit "${service.name}" — coming soon.`);
  const toggle = () =>
    Alert.alert(
      archived ? "Restore service?" : "Archive service?",
      archived
        ? `"${service.name}" will become bookable again.`
        : `Customers won't see "${service.name}" until you restore it.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: archived ? "Restore" : "Archive", style: archived ? "default" : "destructive" },
      ],
    );
  return (
    <View
      className="bg-white rounded-2xl overflow-hidden border-line"
      style={{ borderWidth: 0.5, opacity: archived ? 0.55 : 1 }}
    >
      <View className="p-3.5 flex-row items-start gap-3">
        <View className="flex-1">
          <Text className="text-[14px] font-sans-bold text-ink">{service.name}</Text>
          <Text className="text-[12px] text-ink-3 mt-1 leading-4">{service.description}</Text>
        </View>
        <View className="items-end">
          <Text className="font-serif text-ink" style={{ fontSize: 17, letterSpacing: -0.3 }}>
            {service.price}
          </Text>
          <Text className="text-[10.5px] font-sans-semibold text-ink-3 mt-0.5">
            {service.duration}
          </Text>
        </View>
      </View>
      <View className="flex-row" style={{ borderTopWidth: 0.5, borderTopColor: "#ece6df" }}>
        <Pressable
          onPress={edit}
          className="flex-1 items-center py-2.5 active:opacity-80"
          style={{ borderRightWidth: 0.5, borderRightColor: "#ece6df" }}
        >
          <Text className="text-[12.5px] font-sans-bold text-ink">Edit</Text>
        </Pressable>
        <Pressable
          onPress={toggle}
          className="flex-1 items-center py-2.5 active:opacity-80"
        >
          <Text className="text-[12.5px] font-sans-bold text-ink-3">
            {archived ? "Restore" : "Archive"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
