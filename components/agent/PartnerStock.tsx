import { Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Appear, PressableScale } from "@/components/anim";
import type { HouseListing, PartnerMe } from "@/api/services/partners";

/**
 * PropertyLoop stock — inventory the company holds a mandate on, which agent
 * partners may sell.
 *
 * The distinction matters and is worth stating plainly in the UI: an agent's
 * own listing belongs to them, house stock is there for any partner to bring
 * a buyer to.
 */

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const INK = "#1a2120";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";
const GOLD = "#b9842c";

// Registration stays on the website: the form needs a passport photo upload
// and a live Paystack account-name lookup, both of which already work there.
// Duplicating it in the app would be a second thing to keep correct.
const PARTNER_SIGNUP_URL = "https://propertyloop.ng/realtors/partners";

function MetricChip({
  icon,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
}) {
  return (
    <View className="flex-row items-center gap-1">
      <Ionicons name={icon} size={13} color={INK_3} />
      <Text className="text-[11px]" style={{ color: INK_2 }}>
        {value} {label}
      </Text>
    </View>
  );
}

/** Shown to an agent who has not joined the programme. */
export function JoinPartnerPrompt() {
  return (
    <Appear from="fade">
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
            Sell PropertyLoop stock
          </Text>
          <Text
            className="text-[13.5px] mt-2.5"
            style={{ color: "rgba(255,255,255,0.75)", lineHeight: 20 }}
          >
            Register free and you can sell property PropertyLoop holds a
            mandate on — no listing of your own required. Bring the buyer, earn
            the commission.
          </Text>

          <View className="gap-2.5 mt-5">
            {[
              "Free to join, free to list",
              "Commission paid through escrow",
              "Your own referral link",
            ].map((line) => (
              <View key={line} className="flex-row items-center gap-2.5">
                <Ionicons name="checkmark-circle" size={16} color="#fcd34d" />
                <Text
                  className="text-[13px]"
                  style={{ color: "rgba(255,255,255,0.9)" }}
                >
                  {line}
                </Text>
              </View>
            ))}
          </View>

          <PressableScale
            onPress={() =>
              void WebBrowser.openBrowserAsync(PARTNER_SIGNUP_URL, {
                presentationStyle:
                  WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
              })
            }
            className="rounded-2xl mt-6 py-3.5 items-center"
            style={{ backgroundColor: "#fcd34d" }}
          >
            <Text
              className="font-sans-bold text-[14.5px]"
              style={{ color: "#3f2d06" }}
            >
              Register free
            </Text>
          </PressableScale>

          <Text
            className="text-[11.5px] text-center mt-3"
            style={{ color: "rgba(255,255,255,0.55)" }}
          >
            Opens propertyloop.ng — takes about two minutes
          </Text>
        </View>
      </View>
    </Appear>
  );
}

/** Partner status strip above the stock list. */
export function StockIntro({
  partner,
  count,
  commissionPct,
}: {
  partner: PartnerMe;
  count: number;
  commissionPct: number | null;
}) {
  // Somebody who cannot be paid should hear it here, not after their first
  // sale closes — by then it is no longer a small errand.
  const blocked = !partner.payoutReady && partner.payoutGaps.length > 0;

  return (
    <Appear from="fade">
      <View className="gap-2.5">
        <View
          className="rounded-2xl px-4 py-3 flex-row items-center justify-between"
          style={{ backgroundColor: "#e3efe7" }}
        >
          <View className="flex-1">
            <Text
              className="text-[10.5px] font-sans-bold tracking-widest uppercase"
              style={{ color: PRIMARY_INK }}
            >
              Partner {partner.code}
            </Text>
            <Text className="text-[12.5px] mt-0.5" style={{ color: INK_2 }}>
              {count} {count === 1 ? "property" : "properties"} you can sell
              {commissionPct !== null ? ` · ${commissionPct}% commission` : ""}
            </Text>
          </View>
          <View className="items-end">
            <Text
              className="font-serif"
              style={{ fontSize: 20, color: PRIMARY_INK }}
            >
              {partner.introductions}
            </Text>
            <Text className="text-[10px]" style={{ color: INK_3 }}>
              introduced
            </Text>
          </View>
        </View>

        {blocked && (
          <View
            className="rounded-2xl px-4 py-3 flex-row gap-2.5"
            style={{ backgroundColor: "#f5ead4" }}
          >
            <Ionicons name="alert-circle" size={17} color={GOLD} />
            <Text
              className="flex-1 text-[12px]"
              style={{ color: "#6b4a16", lineHeight: 17 }}
            >
              Before your first commission can be paid we still need your{" "}
              <Text className="font-sans-bold">
                {partner.payoutGaps.join(", ")}
              </Text>
              . You can keep selling in the meantime.
            </Text>
          </View>
        )}
      </View>
    </Appear>
  );
}

/** One house listing, with the action that makes a commission attributable. */
export function StockCard({
  listing,
  commissionPct,
}: {
  listing: HouseListing;
  commissionPct: number | null;
}) {
  const cut =
    commissionPct !== null
      ? Math.round((listing.priceNaira * commissionPct) / 100)
      : null;

  return (
    <View
      className="bg-white rounded-2xl overflow-hidden"
      style={{
        shadowColor: INK,
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
      }}
    >
      <PressableScale
        onPress={() => router.push(`/property/${listing.id}` as Href)}
        activeScale={0.985}
      >
        <View className="flex-row gap-3 p-3">
          <Image
            source={listing.coverImage}
            style={{ width: 82, height: 82, borderRadius: 14 }}
            contentFit="cover"
          />
          <View className="flex-1">
            <View className="flex-row items-baseline justify-between">
              <Text
                className="text-[14px] font-sans-bold text-ink"
                numberOfLines={2}
                style={{ flex: 1, lineHeight: 18 }}
              >
                {listing.title}
              </Text>
              <Text
                className="font-serif text-ink ml-2"
                style={{ fontSize: 16, letterSpacing: -0.3 }}
              >
                {listing.priceLabel}
              </Text>
            </View>
            <Text className="text-[11.5px] text-ink-3 mt-1" numberOfLines={1}>
              {listing.location}
            </Text>
            <View className="flex-row gap-3 mt-2">
              <MetricChip
                icon="bed-outline"
                value={`${listing.beds}`}
                label="bed"
              />
              <MetricChip
                icon="water-outline"
                value={`${listing.baths}`}
                label="bath"
              />
              {listing.verified && (
                <View className="flex-row items-center gap-1">
                  <Ionicons name="shield-checkmark" size={13} color={PRIMARY} />
                  <Text className="text-[11px]" style={{ color: PRIMARY }}>
                    verified
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </PressableScale>

      {/* The action this screen exists for. */}
      <View
        className="flex-row items-center justify-between px-3.5 py-2.5"
        style={{ borderTopWidth: 1, borderTopColor: "#f0eee9" }}
      >
        <View>
          {cut !== null && (
            <>
              <Text
                className="text-[10px] tracking-wider uppercase"
                style={{ color: INK_3 }}
              >
                You earn
              </Text>
              <Text
                className="font-sans-bold text-[13.5px]"
                style={{ color: PRIMARY_INK }}
              >
                ₦{cut.toLocaleString("en-NG")}
              </Text>
            </>
          )}
        </View>
        <PressableScale
          onPress={() => {
            // Query string rather than the object form: expo-router's
            // generated route types do not include a screen until the dev
            // server has regenerated them, and a new file would fail to
            // typecheck on a clean checkout.
            const q = new URLSearchParams({
              listingId: listing.id,
              title: listing.title,
              price: listing.priceLabel,
              ...(commissionPct !== null && {
                commission: String(commissionPct),
              }),
            }).toString();
            router.push(`/bring-buyer?${q}` as Href);
          }}
          className="rounded-xl px-4 py-2.5 flex-row items-center gap-1.5"
          style={{ backgroundColor: PRIMARY }}
        >
          <Ionicons name="person-add-outline" size={14} color="#ffffff" />
          <Text className="text-white font-sans-bold text-[13px]">
            Bring a buyer
          </Text>
        </PressableScale>
      </View>
    </View>
  );
}
