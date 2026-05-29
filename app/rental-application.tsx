import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";
const LINE = "#e1dcd3";

// Mock prefill — the user has reached step 2 of 3 with most fields filled.
const APP = {
  imageSeed: "sand-2",
  listing: { name: "Sandbridge Court · 3-bed", detail: "₦4.8M/yr · move in Aug 2026" },
  step: 2,
  totalSteps: 3,
  moveIn: "1 Aug 2026",
  tenancy: "2 years",
  occupants: "2 adults, 1 child",
  occupantsNote: "no pets",
  income: [
    { label: "Employment",   value: "Senior Eng · Flutterwave" },
    { label: "Years at job", value: "3.5" },
    { label: "Monthly gross", value: "₦950,000" },
  ],
  affordability: {
    title: "Comfortable affordability",
    detail: "Rent is ~35% of net income",
  },
  docs: [
    { label: "NIN slip",                value: "NIN_Okafor.pdf",         uploaded: true },
    { label: "3 months bank statement", value: "GTBank_FebMayApr.pdf",   uploaded: true },
    { label: "Employment letter",       value: "Add to strengthen application" },
    { label: "Previous landlord reference", value: "Optional · helpful" },
  ],
};

export default function RentalApplicationScreen() {
  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top bar */}
      <View className="flex-row items-center gap-2.5 px-5 pt-1 pb-3">
        <Pressable
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full bg-cream-2 items-center justify-center"
        >
          <Ionicons name="chevron-back" size={18} color={INK_2} />
        </Pressable>
        <Text className="flex-1 text-center text-[15px] font-sans-bold text-ink">
          Rental application
        </Text>
        <Pressable hitSlop={8} style={{ width: 50 }}>
          <Text className="text-xs font-sans-bold text-primary text-right">
            Save
          </Text>
        </Pressable>
      </View>

      {/* Progress bar */}
      <View className="flex-row gap-1.5 px-5 pb-3">
        {[1, 2, 3].map((i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 100,
              backgroundColor: i <= APP.step ? PRIMARY : LINE,
            }}
          />
        ))}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Property mini */}
        <View className="flex-row gap-3 p-2.5 bg-cream-2 rounded-2xl items-center">
          <Image
            source={`https://picsum.photos/seed/${APP.imageSeed}/200/200`}
            style={{ width: 50, height: 50, borderRadius: 10 }}
            contentFit="cover"
          />
          <View className="flex-1">
            <Text className="text-[13.5px] font-sans-bold text-ink">
              {APP.listing.name}
            </Text>
            <Text className="text-[11.5px] text-ink-3">{APP.listing.detail}</Text>
          </View>
        </View>

        {/* Heading */}
        <Text
          className="font-serif text-ink mt-5"
          style={{ fontSize: 24, lineHeight: 26, letterSpacing: -0.5 }}
        >
          Tell us about{" "}
          <Text className="font-serif-italic">your tenancy</Text>
        </Text>
        <Text className="text-[13px] text-ink-2 mt-1.5 leading-5">
          The landlord uses these details to make a decision. We never share
          with anyone outside this listing.
        </Text>

        {/* Move-in & tenancy */}
        <View className="flex-row gap-2.5 mt-4">
          <FieldDisplay label="Move-in" value={APP.moveIn} />
          <FieldDisplay label="Tenancy" value={APP.tenancy} />
        </View>

        {/* Occupants */}
        <Label className="mt-4">Occupants</Label>
        <View
          className="mt-1.5 bg-white rounded-2xl px-3.5 py-3 flex-row items-center gap-3 border-line"
          style={{ borderWidth: 1 }}
        >
          <Text className="text-[13.5px] font-sans-bold text-ink">
            {APP.occupants}
          </Text>
          <Text className="ml-auto text-[11px] text-ink-3">
            · {APP.occupantsNote}
          </Text>
        </View>

        {/* Income */}
        <SectionLabel className="mt-5">Income</SectionLabel>
        <View
          className="bg-white rounded-2xl overflow-hidden mt-2 border-line"
          style={{ borderWidth: 1 }}
        >
          {APP.income.map((r, i) => (
            <TripRow
              key={r.label}
              label={r.label}
              value={r.value}
              last={i === APP.income.length - 1}
            />
          ))}
        </View>

        {/* Affordability */}
        <View className="mt-3 bg-primary-soft rounded-2xl px-3.5 py-3 flex-row items-center gap-2.5">
          <View
            className="w-8 h-8 rounded-[10px] bg-white items-center justify-center"
          >
            <Ionicons name="checkmark" size={16} color={PRIMARY} />
          </View>
          <View className="flex-1">
            <Text
              className="text-[12.5px] font-sans-bold"
              style={{ color: PRIMARY_INK }}
            >
              {APP.affordability.title}
            </Text>
            <Text
              className="text-[11px] mt-0.5"
              style={{ color: PRIMARY_INK, opacity: 0.7 }}
            >
              {APP.affordability.detail}
            </Text>
          </View>
        </View>

        {/* Documents */}
        <SectionLabel className="mt-5">Documents</SectionLabel>
        <View className="gap-2 mt-2">
          {APP.docs.map((d) => (
            <DocRow key={d.label} doc={d} />
          ))}
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View
        className="absolute left-0 right-0 bottom-0 border-line"
        style={{
          backgroundColor: "rgba(245,240,235,0.96)",
          borderTopWidth: 0.5,
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: 30,
        }}
      >
        <Pressable
          className="bg-primary rounded-full items-center active:opacity-80"
          style={{ paddingVertical: 17 }}
          onPress={() => router.back()}
        >
          <Text className="text-white font-sans-bold text-[15px]">
            Submit application
          </Text>
        </Pressable>
        <Text className="text-center text-[11px] text-ink-3 mt-1.5">
          If approved · landlord contacts you directly
        </Text>
      </View>
    </SafeAreaView>
  );
}

function FieldDisplay({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1">
      <Label>{label}</Label>
      <View
        className="mt-1.5 bg-white rounded-xl px-3 py-3 border-line"
        style={{ borderWidth: 1 }}
      >
        <Text className="text-[13.5px] font-sans-bold text-ink">{value}</Text>
      </View>
    </View>
  );
}

function Label({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Text
      className={`text-[11px] font-sans-bold text-ink-3 tracking-wider uppercase ${className ?? ""}`}
    >
      {children}
    </Text>
  );
}

function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Text
      className={`text-[13px] font-sans-bold text-ink-2 tracking-wider uppercase ${className ?? ""}`}
    >
      {children}
    </Text>
  );
}

function TripRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View
      className="flex-row items-center justify-between px-3.5 py-3"
      style={{
        borderBottomWidth: last ? 0 : 0.5,
        borderBottomColor: "#ece6df",
      }}
    >
      <Text className="text-xs font-sans-semibold text-ink-3">{label}</Text>
      <Text className="text-[13px] font-sans-bold text-ink">{value}</Text>
    </View>
  );
}

function DocRow({
  doc,
}: {
  doc: { label: string; value: string; uploaded?: boolean };
}) {
  const uploaded = doc.uploaded === true;
  return (
    <View
      className="flex-row items-center gap-3 px-3.5 py-3 rounded-xl"
      style={{
        backgroundColor: uploaded ? "#e3efe7" : "#ffffff",
        borderWidth: uploaded ? 0 : 1,
        borderColor: uploaded ? "transparent" : LINE,
        borderStyle: uploaded ? "solid" : "dashed",
      }}
    >
      <View
        className="w-8 h-8 rounded-lg items-center justify-center"
        style={{
          backgroundColor: uploaded ? "#ffffff" : "#ece6df",
        }}
      >
        <Ionicons
          name="document-text-outline"
          size={15}
          color={uploaded ? PRIMARY : INK_3}
        />
      </View>
      <View className="flex-1">
        <Text className="text-[13px] font-sans-bold text-ink">{doc.label}</Text>
        <Text className="text-[11.5px] text-ink-3 mt-0.5">{doc.value}</Text>
      </View>
      {uploaded ? (
        <Ionicons name="shield-checkmark" size={16} color={PRIMARY} />
      ) : (
        <Ionicons name="add" size={16} color={INK_3} />
      )}
    </View>
  );
}
