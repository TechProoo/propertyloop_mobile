import { useCallback, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Share, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, type Href } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Appear, PressableScale, stagger } from "@/components/anim";
import { BouncyLoader } from "@/components/brand/BouncyLoader";
import partnersService from "@/api/services/partners";
import type {
  PartnerCommission,
  PartnerCommissionStatus,
  PartnerMe,
  PartnerStatus,
} from "@/api/services/partners";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const INK = "#1a2120";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";
const LINE = "#e1dcd3";
const GOLD = "#b9842c";

const PARTNER_SIGNUP_URL = "https://propertyloop.ng/realtors/partners";

const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;

const STATUS_UI: Record<PartnerStatus, { label: string; bg: string; fg: string }> = {
  NEW: { label: "Registered", bg: "#f5ead4", fg: "#6b4a16" },
  CONTACTED: { label: "In progress", bg: "#dfeaf8", fg: "#1b4576" },
  VERIFIED: { label: "Verified", bg: "#d7f0ef", fg: "#0a5352" },
  ACTIVE: { label: "Active", bg: "#e3efe7", fg: PRIMARY_INK },
  DORMANT: { label: "Dormant", bg: "#f0f0f0", fg: INK_2 },
  REJECTED: { label: "Not approved", bg: "#fbe2df", fg: "#7d2820" },
};

const COMMISSION_UI: Record<
  PartnerCommissionStatus,
  { label: string; bg: string; fg: string }
> = {
  PENDING: { label: "Awaiting sign-off", bg: "#f5ead4", fg: "#6b4a16" },
  APPROVED: { label: "Approved", bg: "#d7f0ef", fg: "#0a5352" },
  PAID: { label: "Paid", bg: "#e3efe7", fg: PRIMARY_INK },
  REJECTED: { label: "Declined", bg: "#fbe2df", fg: "#7d2820" },
};

/**
 * A partner's own view of the programme.
 *
 * Three jobs: show where they stand, hand them their referral link in a form
 * they can actually send, and show what they are owed. The link matters most —
 * partners recruit partners over WhatsApp, and a link you cannot share in one
 * tap does not get shared.
 */
export default function Partnership() {
  const [partner, setPartner] = useState<PartnerMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      setPartner(await partnersService.me());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function shareLink() {
    if (!partner) return;
    try {
      await Share.share({
        message:
          `Join me as a PropertyLoop agent partner — free to register, and you can ` +
          `sell PropertyLoop's own property listings.\n\n${partner.referralUrl}`,
      });
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // The user dismissed the sheet. Nothing to report.
    }
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: "#f5f7f5" }}>
        <BouncyLoader />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#f5f7f5" }}>
      <View
        className="flex-row items-center gap-2 px-4 py-3"
        style={{ borderBottomWidth: 1, borderBottomColor: LINE }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          className="w-9 h-9 rounded-full items-center justify-center"
          style={{ backgroundColor: "#ffffff" }}
        >
          <Ionicons name="chevron-back" size={20} color={INK} />
        </Pressable>
        <Text className="font-sans-bold text-[16px]" style={{ color: INK }}>
          My partnership
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={PRIMARY}
          />
        }
      >
        {!partner ? (
          <NotAPartner />
        ) : (
          <>
            <Appear from="fade">
              <StatusCard partner={partner} />
            </Appear>

            <Appear delay={60} from="fade">
              <ReferralCard
                url={partner.referralUrl}
                onShare={shareLink}
                shared={copied}
              />
            </Appear>

            {!partner.payoutReady && partner.payoutGaps.length > 0 && (
              <Appear delay={100} from="fade">
                <PayoutGapCard gaps={partner.payoutGaps} />
              </Appear>
            )}

            <Appear delay={140} from="fade">
              <Text
                className="text-[11px] font-sans-bold tracking-widest uppercase mt-6 mb-2.5 px-1"
                style={{ color: INK_3 }}
              >
                Commission
              </Text>
            </Appear>

            {partner.commissions.length === 0 ? (
              <Appear delay={160} from="fade">
                <View
                  className="bg-white rounded-2xl p-6 items-center"
                  style={{ borderWidth: 1, borderColor: LINE }}
                >
                  <Ionicons name="cash-outline" size={26} color={INK_3} />
                  <Text
                    className="text-[13.5px] font-sans-bold mt-2.5"
                    style={{ color: INK }}
                  >
                    Nothing yet
                  </Text>
                  <Text
                    className="text-[12.5px] text-center mt-1"
                    style={{ color: INK_3, lineHeight: 18 }}
                  >
                    Commission appears here once a buyer you introduced
                    completes a purchase.
                  </Text>
                </View>
              </Appear>
            ) : (
              <View className="gap-2.5">
                {partner.commissions.map((c, i) => (
                  <Appear key={c.id} delay={stagger(Math.min(i, 8))}>
                    <CommissionRow commission={c} />
                  </Appear>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ─── Pieces ────────────────────────────────────────────────────────────── */

function StatusCard({ partner }: { partner: PartnerMe }) {
  const meta = STATUS_UI[partner.status];
  const earned = partner.commissions
    .filter((c) => c.status === "PAID")
    .reduce((n, c) => n + c.amountNaira, 0);
  const owed = partner.commissions
    .filter((c) => c.status === "PENDING" || c.status === "APPROVED")
    .reduce((n, c) => n + c.amountNaira, 0);

  return (
    <View
      className="rounded-3xl overflow-hidden"
      style={{ backgroundColor: PRIMARY_INK }}
    >
      <View className="p-5">
        <View className="flex-row items-start justify-between">
          <View>
            <Text
              className="text-[10px] font-sans-bold tracking-widest uppercase"
              style={{ color: "#fcd34d" }}
            >
              Partner number
            </Text>
            <Text
              className="font-serif text-white mt-1"
              style={{ fontSize: 28, letterSpacing: -0.5 }}
            >
              {partner.code}
            </Text>
          </View>
          <View
            className="px-2.5 py-1 rounded-full"
            style={{ backgroundColor: meta.bg }}
          >
            <Text
              className="text-[10.5px] font-sans-bold tracking-wider uppercase"
              style={{ color: meta.fg }}
            >
              {meta.label}
            </Text>
          </View>
        </View>

        <View
          className="flex-row mt-5 pt-4"
          style={{ borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.12)" }}
        >
          <Stat label="Introduced" value={String(partner.introductions)} />
          <Stat label="Earned" value={naira(earned)} />
          <Stat label="Owed" value={naira(owed)} highlight={owed > 0} />
        </View>
      </View>
    </View>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View className="flex-1">
      <Text
        className="font-sans-bold text-[15px]"
        style={{ color: highlight ? "#fcd34d" : "#ffffff" }}
        numberOfLines={1}
      >
        {value}
      </Text>
      <Text
        className="text-[10.5px] mt-0.5"
        style={{ color: "rgba(255,255,255,0.55)" }}
      >
        {label}
      </Text>
    </View>
  );
}

function ReferralCard({
  url,
  onShare,
  shared,
}: {
  url: string;
  onShare: () => void;
  shared: boolean;
}) {
  return (
    <View
      className="bg-white rounded-2xl p-4 mt-3"
      style={{ borderWidth: 1, borderColor: LINE }}
    >
      <Text className="text-[13.5px] font-sans-bold" style={{ color: INK }}>
        Your referral link
      </Text>
      <Text className="text-[12px] mt-1" style={{ color: INK_3, lineHeight: 17 }}>
        Anyone who registers through this link is credited to you.
      </Text>

      <View
        className="rounded-xl px-3 py-2.5 mt-3"
        style={{ backgroundColor: "#f5f7f5" }}
      >
        <Text
          className="text-[11.5px]"
          style={{ color: PRIMARY_INK }}
          numberOfLines={1}
        >
          {url}
        </Text>
      </View>

      <PressableScale
        onPress={onShare}
        className="rounded-xl mt-3 py-3 items-center flex-row justify-center gap-2"
        style={{ backgroundColor: shared ? "#e3efe7" : PRIMARY }}
      >
        <Ionicons
          name={shared ? "checkmark" : "share-social-outline"}
          size={16}
          color={shared ? PRIMARY_INK : "#ffffff"}
        />
        <Text
          className="font-sans-bold text-[14px]"
          style={{ color: shared ? PRIMARY_INK : "#ffffff" }}
        >
          {shared ? "Shared" : "Share your link"}
        </Text>
      </PressableScale>
    </View>
  );
}

function PayoutGapCard({ gaps }: { gaps: string[] }) {
  return (
    <View
      className="rounded-2xl p-4 mt-3 flex-row gap-3"
      style={{ backgroundColor: "#f5ead4" }}
    >
      <Ionicons name="alert-circle" size={19} color={GOLD} />
      <View className="flex-1">
        <Text className="text-[13px] font-sans-bold" style={{ color: "#6b4a16" }}>
          We cannot pay you yet
        </Text>
        <Text
          className="text-[12px] mt-1"
          style={{ color: "#6b4a16", lineHeight: 17 }}
        >
          Still needed: <Text className="font-sans-bold">{gaps.join(", ")}</Text>.
          You can keep selling — this only blocks the transfer.
        </Text>
        <Pressable
          onPress={() =>
            void WebBrowser.openBrowserAsync(PARTNER_SIGNUP_URL, {
              presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
            })
          }
          className="mt-2.5"
        >
          <Text
            className="text-[12.5px] font-sans-bold"
            style={{ color: "#6b4a16", textDecorationLine: "underline" }}
          >
            Complete my details
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function CommissionRow({ commission }: { commission: PartnerCommission }) {
  const meta = COMMISSION_UI[commission.status];
  return (
    <View
      className="bg-white rounded-2xl p-3.5"
      style={{ borderWidth: 1, borderColor: LINE }}
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text
            className="text-[13.5px] font-sans-bold"
            style={{ color: INK }}
            numberOfLines={2}
          >
            {commission.listing ?? "Property removed"}
          </Text>
          <Text className="text-[11.5px] mt-1" style={{ color: INK_3 }}>
            {new Date(commission.createdAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
            {commission.paidAt
              ? ` · paid ${new Date(commission.paidAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                })}`
              : ""}
          </Text>
        </View>
        <Text className="font-serif" style={{ fontSize: 17, color: INK }}>
          {naira(commission.amountNaira)}
        </Text>
      </View>
      <View
        className="self-start px-2 py-0.5 rounded-full mt-2.5"
        style={{ backgroundColor: meta.bg }}
      >
        <Text
          className="text-[10.5px] font-sans-bold tracking-wider uppercase"
          style={{ color: meta.fg }}
        >
          {meta.label}
        </Text>
      </View>
    </View>
  );
}

function NotAPartner() {
  return (
    <View
      className="rounded-3xl overflow-hidden"
      style={{ backgroundColor: PRIMARY_INK }}
    >
      <View className="p-6">
        <Text
          className="text-[10.5px] font-sans-bold tracking-widest uppercase"
          style={{ color: "#fcd34d" }}
        >
          Agent Partner Programme
        </Text>
        <Text
          className="font-serif text-white mt-2"
          style={{ fontSize: 23, lineHeight: 29, letterSpacing: -0.4 }}
        >
          You have not joined yet
        </Text>
        <Text
          className="text-[13.5px] mt-2.5"
          style={{ color: "rgba(255,255,255,0.75)", lineHeight: 20 }}
        >
          Register free and you can sell property PropertyLoop holds a mandate
          on, without listing anything of your own. Bring the buyer, earn the
          commission.
        </Text>
        <PressableScale
          onPress={() =>
            void WebBrowser.openBrowserAsync(PARTNER_SIGNUP_URL, {
              presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
            })
          }
          className="rounded-2xl mt-6 py-3.5 items-center"
          style={{ backgroundColor: "#fcd34d" }}
        >
          <Text className="font-sans-bold text-[14.5px]" style={{ color: "#3f2d06" }}>
            Register free
          </Text>
        </PressableScale>
        <Pressable
          onPress={() => router.push("/(agent-tabs)/listings" as Href)}
          className="mt-3 items-center"
        >
          <Text className="text-[12.5px]" style={{ color: "rgba(255,255,255,0.6)" }}>
            See what is on offer first
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
