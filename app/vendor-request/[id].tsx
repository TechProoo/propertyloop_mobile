import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Stack, router, useLocalSearchParams, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { PLAvatar } from "@/components/brand/PLAvatar";
import { getVendorRequest } from "@/mocks/vendor";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

export default function VendorRequestScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const req = getVendorRequest(id);

  const accept = () =>
    Alert.alert(
      "Accept job?",
      `Accept ${req.service} from ${req.customer.name} for ${req.amountGross}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Accept",
          onPress: () => {
            Alert.alert("Accepted", "Customer notified. Job is now in your schedule.", [
              { text: "OK", onPress: () => router.back() },
            ]);
          },
        },
      ],
    );

  const propose = () =>
    Alert.alert("Propose another time", "Slot picker coming soon. The customer will see your proposal in the thread.");

  const decline = () =>
    Alert.alert("Decline?", "The customer will be notified and can book a different vendor.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Decline",
        style: "destructive",
        onPress: () => router.back(),
      },
    ]);

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
        <Text className="text-[15px] font-sans-bold text-ink">Booking request</Text>
        <Text className="text-[11px] font-sans-bold text-primary">{req.ago}</Text>
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
          <PLAvatar initials={req.customer.initials} size={48} tone={req.customer.tone} />
          <View className="flex-1">
            <View className="flex-row items-center gap-1.5">
              <Text className="text-[14px] font-sans-bold text-ink">{req.customer.name}</Text>
              <Ionicons name="shield-checkmark" size={13} color={PRIMARY} />
            </View>
            <Text className="text-[12px] text-ink-3 mt-0.5">{req.customerType}</Text>
          </View>
          <Pressable
            onPress={() => router.push("/conversation/chinwe" as Href)}
            className="w-9 h-9 rounded-full bg-cream-2 items-center justify-center"
          >
            <Ionicons name="chatbubble-outline" size={16} color={INK_2} />
          </Pressable>
        </View>

        {/* Amount hero */}
        <View
          className="mt-3 rounded-2xl px-4 py-4"
          style={{ backgroundColor: "#e3efe7" }}
        >
          <Text
            className="text-[11px] font-sans-bold tracking-widest uppercase"
            style={{ color: PRIMARY_INK }}
          >
            You'll earn
          </Text>
          <View className="flex-row items-baseline gap-2 mt-1">
            <Text
              className="font-serif"
              style={{ fontSize: 32, letterSpacing: -0.6, color: PRIMARY_INK }}
            >
              {req.amountNet}
            </Text>
            <Text
              className="text-[12px] font-sans-bold"
              style={{ color: PRIMARY_INK, opacity: 0.7 }}
            >
              after 10% fee
            </Text>
          </View>
          <Text
            className="text-[11.5px] mt-1"
            style={{ color: PRIMARY_INK, opacity: 0.75 }}
          >
            Customer pays {req.amountGross} into escrow
          </Text>
        </View>

        {/* Details */}
        <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mt-6 mb-2">
          Job details
        </Text>
        <View
          className="bg-white rounded-2xl overflow-hidden border-line"
          style={{ borderWidth: 0.5 }}
        >
          <DetailRow label="Service" value={req.service} />
          <DetailRow label="When" value={req.whenFull} />
          <DetailRow label="Duration" value={req.duration} />
          <DetailRow label="Where" value={req.where} sub={req.whereLine2} last />
        </View>

        {/* Note */}
        <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mt-6 mb-2">
          Customer's note
        </Text>
        <View
          className="bg-white rounded-2xl px-3.5 py-3 border-line"
          style={{ borderWidth: 0.5 }}
        >
          <Text
            className="font-serif-italic text-ink-2"
            style={{ fontSize: 14, lineHeight: 21 }}
          >
            "{req.note}"
          </Text>
        </View>

        {/* Map placeholder */}
        <View
          className="mt-4 rounded-2xl items-center justify-center"
          style={{ height: 120, backgroundColor: "#ece6df" }}
        >
          <Ionicons name="map-outline" size={26} color={INK_3} />
          <Text className="text-[11.5px] font-sans-bold text-ink-3 mt-1">
            {req.where}
          </Text>
        </View>
      </ScrollView>

      {/* Sticky actions */}
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
          onPress={accept}
          className="bg-primary rounded-full items-center active:opacity-80"
          style={{ paddingVertical: 16 }}
        >
          <Text className="text-white font-sans-bold text-[15px]">Accept job</Text>
        </Pressable>
        <View className="flex-row gap-2 mt-2">
          <Pressable
            onPress={propose}
            className="flex-1 rounded-full items-center bg-cream-2 active:opacity-80"
            style={{ paddingVertical: 13 }}
          >
            <Text className="text-[12.5px] font-sans-bold text-ink">Propose another time</Text>
          </Pressable>
          <Pressable
            onPress={decline}
            className="flex-1 rounded-full items-center active:opacity-80"
            style={{
              paddingVertical: 13,
              borderWidth: 1,
              borderColor: "#e1dcd3",
              backgroundColor: "transparent",
            }}
          >
            <Text className="text-[12.5px] font-sans-bold text-ink-3">Decline</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function DetailRow({
  label, value, sub, last,
}: {
  label: string;
  value: string;
  sub?: string;
  last?: boolean;
}) {
  return (
    <View
      className="px-3.5 py-3"
      style={{
        borderBottomWidth: last ? 0 : 0.5,
        borderBottomColor: "#ece6df",
      }}
    >
      <View className="flex-row items-baseline justify-between">
        <Text className="text-[12px] font-sans-semibold text-ink-3">{label}</Text>
        <Text className="text-[13px] font-sans-bold text-ink text-right flex-1 ml-3" numberOfLines={2}>
          {value}
        </Text>
      </View>
      {sub && (
        <Text className="text-[11.5px] text-ink-3 text-right mt-1">{sub}</Text>
      )}
    </View>
  );
}
