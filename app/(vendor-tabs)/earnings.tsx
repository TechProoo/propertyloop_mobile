import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Alert } from "@/lib/dialog";
import { router, useFocusEffect, type Href } from "expo-router";
import { BouncyLoader } from "@/components/brand/BouncyLoader";
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
  const [withdrawing, setWithdrawing] = useState(false);

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

  const available = summary?.available ?? 0;

  const doWithdraw = async () => {
    setWithdrawing(true);
    try {
      const res = await vendorEarningsService.withdraw();
      await load();
      Alert.alert(
        "Withdrawal on its way",
        `${naira(res.amount)} is being sent to ${res.bankName} ••${res.accountNumber.slice(-4)}. It usually lands within 24 hours.`,
      );
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? "Please try again.";
      // No bank account yet → send them to set one up.
      if (typeof msg === "string" && msg.toLowerCase().includes("bank")) {
        Alert.alert("Add a payout account", msg, [
          { text: "Not now", style: "cancel" },
          { text: "Add bank", onPress: () => router.push("/payout-bank" as Href) },
        ]);
      } else {
        Alert.alert("Couldn't withdraw", Array.isArray(msg) ? msg.join(", ") : msg);
      }
    } finally {
      setWithdrawing(false);
    }
  };

  const onWithdraw = () => {
    if (available <= 0 || withdrawing) return;
    Alert.alert(
      "Withdraw to bank?",
      `Send your available balance of ${naira(available)} to your payout account?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Withdraw", onPress: doWithdraw },
      ],
    );
  };

  const availableJobs = earnings.filter((e) => e.status === "AVAILABLE");
  const clearing = earnings.filter(
    (e) => e.status === "PENDING" || e.status === "PROCESSING",
  );
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

        {/* Balance hero — available to withdraw */}
        <View className="mx-4 mt-4 rounded-2xl px-5 py-4" style={{ backgroundColor: INK }}>
          <Text className="text-[11px] font-sans-bold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.6)" }}>
            Available to withdraw
          </Text>
          <Text className="font-serif text-white mt-1" style={{ fontSize: 36, letterSpacing: -0.8 }}>
            {naira(available)}
          </Text>
          <Pressable
            onPress={onWithdraw}
            disabled={available <= 0 || withdrawing}
            className="mt-3 rounded-full items-center justify-center flex-row gap-2"
            style={{
              backgroundColor: available > 0 ? PRIMARY : "rgba(255,255,255,0.12)",
              paddingVertical: 13,
              opacity: withdrawing ? 0.7 : 1,
            }}
          >
            {withdrawing ? (
              <BouncyLoader color="#ffffff" />
            ) : (
              <>
                <Ionicons
                  name="arrow-up-circle"
                  size={16}
                  color={available > 0 ? "#ffffff" : "rgba(255,255,255,0.5)"}
                />
                <Text
                  className="text-[14px] font-sans-bold"
                  style={{ color: available > 0 ? "#ffffff" : "rgba(255,255,255,0.5)" }}
                >
                  {available > 0 ? `Withdraw ${naira(available)}` : "Nothing to withdraw"}
                </Text>
              </>
            )}
          </Pressable>
          <View className="flex-row gap-2.5 mt-3">
            <DarkStat label="In escrow" value={naira(inEscrow)} />
            <DarkStat label="This month" value={naira(summary?.thisMonth ?? 0)} />
            <DarkStat label="Lifetime" value={naira(summary?.total ?? 0)} />
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
            <Text className="text-[11px] text-ink-3 mt-0.5">Where your withdrawals are sent</Text>
          </View>
          <Text className="text-[12px] font-sans-bold text-primary">Manage</Text>
        </Pressable>

        {loading ? (
          <View className="py-16 items-center">
            <BouncyLoader color={PRIMARY} />
          </View>
        ) : (
          <>
            {/* Available to withdraw */}
            {availableJobs.length > 0 && (
              <>
                <Text className="text-[14px] font-sans-bold text-ink px-5 pt-5">
                  Available · {availableJobs.length}
                </Text>
                <View className="px-4 pt-2 gap-2">
                  {availableJobs.map((e) => (
                    <View
                      key={e.id}
                      className="bg-white rounded-2xl px-3 py-3 flex-row items-center gap-3"
                      style={{ borderWidth: 1, borderColor: "#cfe6d7" }}
                    >
                      <View className="w-9 h-9 rounded-xl items-center justify-center" style={{ backgroundColor: "#e3efe7" }}>
                        <Ionicons name="cash-outline" size={16} color={PRIMARY} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-[13px] font-sans-bold text-ink" numberOfLines={1}>
                          {e.job?.clientName ? `${e.job.clientName} · ` : ""}{e.job?.title ?? "Job"}
                        </Text>
                        <Text className="text-[11px] font-sans-semibold mt-0.5" style={{ color: PRIMARY_INK }}>
                          Ready to withdraw
                        </Text>
                      </View>
                      <Text className="font-serif text-ink" style={{ fontSize: 15 }}>{naira(e.amount)}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* In escrow / clearing */}
            <Text className="text-[14px] font-sans-bold text-ink px-5 pt-5">
              In escrow · {clearing.length}
            </Text>
            {clearing.length === 0 ? (
              <Text className="px-5 pt-2 text-[12.5px] text-ink-3">Nothing in escrow right now.</Text>
            ) : (
              <View className="px-4 pt-2 gap-2">
                {clearing.map((e) => {
                  const disputed = e.job?.escrowStatus === "DISPUTED";
                  const row = (
                    <View
                      className="bg-white rounded-2xl px-3 py-3 flex-row items-center gap-3"
                      style={{
                        borderWidth: disputed ? 1 : 0.5,
                        borderColor: disputed ? "#e4a87e" : "#e1dcd3",
                        backgroundColor: disputed ? "#fdf3eb" : "#ffffff",
                      }}
                    >
                      <View
                        className="w-9 h-9 rounded-xl items-center justify-center"
                        style={{ backgroundColor: disputed ? "#f6dcc6" : "#e3efe7" }}
                      >
                        <Ionicons
                          name={disputed ? "alert-circle" : "shield-checkmark"}
                          size={16}
                          color={disputed ? "#c05a1f" : PRIMARY}
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-[13px] font-sans-bold text-ink" numberOfLines={1}>
                          {e.job?.clientName ? `${e.job.clientName} · ` : ""}{e.job?.title ?? "Job"}
                        </Text>
                        <Text
                          className="text-[11px] font-sans-semibold mt-0.5"
                          style={{ color: disputed ? "#7a3a13" : INK_3 }}
                          numberOfLines={1}
                        >
                          {disputed
                            ? "On hold · customer raised a dispute"
                            : e.status === "PROCESSING"
                              ? "Sending to your bank"
                              : "Held until client confirms"}
                        </Text>
                      </View>
                      <Text className="font-serif text-ink" style={{ fontSize: 15 }}>{naira(e.amount)}</Text>
                      {disputed && (
                        <Ionicons name="chevron-forward" size={15} color="#7a3a13" />
                      )}
                    </View>
                  );
                  return disputed && e.job?.id ? (
                    <Pressable
                      key={e.id}
                      onPress={() => router.push(`/vendor-dispute/${e.job!.id}` as Href)}
                      className="active:opacity-90"
                    >
                      {row}
                    </Pressable>
                  ) : (
                    <View key={e.id}>{row}</View>
                  );
                })}
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
