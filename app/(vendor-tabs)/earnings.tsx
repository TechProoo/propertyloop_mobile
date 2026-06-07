import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { router, useFocusEffect, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import vendorEarningsService, {
  type EarningsSummary,
  type VendorEarning,
} from "@/api/services/vendorEarnings";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const INK = "#1a2120";
const INK_3 = "#7f857f";

function naira(n: number) {
  return `₦${Math.round(n).toLocaleString("en-NG")}`;
}
function dateOf(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

export default function VendorEarningsScreen() {
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [earnings, setEarnings] = useState<VendorEarning[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [s, list] = await Promise.all([
        vendorEarningsService.getSummary(),
        vendorEarningsService.list({ limit: 100 }),
      ]);
      setSummary(s);
      setEarnings(list.items);
    } catch {
      /* leave empty */
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const releasing = earnings.filter((e) => e.status !== "PAID");
  const paid = earnings.filter((e) => e.status === "PAID");
  const inEscrow = (summary?.pending ?? 0) + (summary?.processing ?? 0);

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        <View className="px-5 pt-1">
          <Text className="text-[11px] font-sans-bold text-primary tracking-widest uppercase">Earnings</Text>
          <Text className="font-serif text-ink mt-1" style={{ fontSize: 28, letterSpacing: -0.6, lineHeight: 30 }}>
            Your <Text className="font-serif-italic">money</Text>
          </Text>
        </View>

        {/* Balance hero */}
        <View className="mx-4 mt-4 rounded-2xl px-5 py-4" style={{ backgroundColor: INK }}>
          <Text className="text-[11px] font-sans-bold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.6)" }}>
            Lifetime earnings
          </Text>
          <Text className="font-serif text-white mt-1" style={{ fontSize: 36, letterSpacing: -0.8 }}>
            {naira(summary?.total ?? 0)}
          </Text>
          <View className="flex-row gap-2.5 mt-4">
            <DarkStat label="In escrow" value={naira(inEscrow)} />
            <DarkStat label="This month" value={naira(summary?.thisMonth ?? 0)} />
          </View>
        </View>

        {/* Payout account */}
        <Pressable
          onPress={() => router.push("/payout-bank" as Href)}
          className="mx-4 mt-3 bg-white rounded-2xl px-3.5 py-3 flex-row items-center gap-3 border-line active:opacity-90"
          style={{ borderWidth: 0.5 }}
        >
          <View className="w-9 h-9 rounded-xl items-center justify-center" style={{ backgroundColor: "#e3efe7" }}>
            <Ionicons name="wallet-outline" size={16} color={PRIMARY} />
          </View>
          <View className="flex-1">
            <Text className="text-[13px] font-sans-bold text-ink">Payout account</Text>
            <Text className="text-[11px] text-ink-3 mt-0.5">Payouts land ~24 hrs after each confirm</Text>
          </View>
          <Text className="text-[12px] font-sans-bold text-primary">Manage</Text>
        </Pressable>

        {loading ? (
          <View className="py-16 items-center">
            <ActivityIndicator color={PRIMARY} />
          </View>
        ) : (
          <>
            {/* Releasing soon */}
            <Text className="text-[14px] font-sans-bold text-ink px-5 pt-5">
              Releasing soon · {releasing.length}
            </Text>
            {releasing.length === 0 ? (
              <Text className="px-5 pt-2 text-[12.5px] text-ink-3">Nothing in escrow right now.</Text>
            ) : (
              <View className="px-4 pt-2 gap-2">
                {releasing.map((e) => (
                  <View
                    key={e.id}
                    className="bg-white rounded-2xl px-3 py-3 flex-row items-center gap-3 border-line"
                    style={{ borderWidth: 0.5 }}
                  >
                    <View className="w-9 h-9 rounded-xl items-center justify-center" style={{ backgroundColor: "#e3efe7" }}>
                      <Ionicons name="shield-checkmark" size={16} color={PRIMARY} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[13px] font-sans-bold text-ink" numberOfLines={1}>
                        {e.job?.clientName ? `${e.job.clientName} · ` : ""}{e.job?.title ?? "Job"}
                      </Text>
                      <Text className="text-[11px] font-sans-semibold mt-0.5" style={{ color: INK_3 }}>
                        {e.status === "PROCESSING" ? "Processing payout" : "Held in escrow"}
                      </Text>
                    </View>
                    <Text className="font-serif text-ink" style={{ fontSize: 15 }}>{naira(e.amount)}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Past payouts */}
            <View className="px-5 pt-5">
              <Text className="text-[14px] font-sans-bold text-ink">Past payouts · {paid.length}</Text>
            </View>
            {paid.length === 0 ? (
              <Text className="px-5 pt-2 text-[12.5px] text-ink-3">No payouts yet.</Text>
            ) : (
              <View className="mx-4 mt-2 bg-white rounded-2xl overflow-hidden border-line" style={{ borderWidth: 0.5 }}>
                {paid.map((p, i, arr) => (
                  <View
                    key={p.id}
                    className="flex-row items-center gap-3 px-3.5 py-3"
                    style={{ borderBottomWidth: i === arr.length - 1 ? 0 : 0.5, borderBottomColor: "#ece6df" }}
                  >
                    <View className="w-8 h-8 rounded-lg items-center justify-center" style={{ backgroundColor: "#e3efe7" }}>
                      <Ionicons name="checkmark" size={14} color={PRIMARY_INK} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[13px] font-sans-bold text-ink">{dateOf(p.paidAt ?? p.createdAt)}</Text>
                      <Text className="text-[11px] font-sans-semibold text-ink-3" numberOfLines={1}>
                        {p.job?.title ?? "Job"}
                      </Text>
                    </View>
                    <Text className="text-[13.5px] font-sans-bold text-ink">{naira(p.amount)}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DarkStat({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 rounded-xl px-3 py-2.5" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
      <Text className="text-[10px] font-sans-bold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.55)" }}>
        {label}
      </Text>
      <Text className="font-serif text-white mt-0.5" style={{ fontSize: 17 }}>{value}</Text>
    </View>
  );
}
