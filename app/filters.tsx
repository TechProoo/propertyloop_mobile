import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const PRIMARY = "#1f6f43";
const INK = "#1a2120";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

const TYPES = ["Any", "Apartment", "Duplex", "Detached", "Semi-detached", "Penthouse"];
const BEDS = ["Any", "1+", "2+", "3+", "4+", "5+"];
const BATHS = ["Any", "1+", "2+", "3+", "4+"];
const AMENITIES = [
  "Pool", "Gym", "Generator", "Security", "Parking", "Furnished",
  "Pet-friendly", "Garden", "Sea view",
];
const TRUST = ["Verified agent", "Title-verified", "PropertyLoop logbook"];

function fmtNaira(n: number) {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(0)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}k`;
  return `₦${n}`;
}

export default function FiltersScreen() {
  const [type, setType] = useState("Any");
  const [beds, setBeds] = useState("3+");
  const [baths, setBaths] = useState("Any");
  const [minPrice, setMinPrice] = useState("60000000");
  const [maxPrice, setMaxPrice] = useState("150000000");
  const [amenities, setAmenities] = useState<string[]>(["Generator", "Parking"]);
  const [trust, setTrust] = useState<string[]>(["Verified agent"]);

  const toggle = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    value: string,
  ) =>
    setter((arr) =>
      arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value],
    );

  const reset = () => {
    setType("Any");
    setBeds("Any");
    setBaths("Any");
    setMinPrice("");
    setMaxPrice("");
    setAmenities([]);
    setTrust([]);
  };

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top", "bottom"]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Drag handle */}
      <View className="items-center pt-2 pb-1">
        <View
          style={{ width: 38, height: 4, borderRadius: 2, backgroundColor: "#d3cdc1" }}
        />
      </View>

      {/* Top bar */}
      <View className="flex-row items-center justify-between px-5 pt-2 pb-3">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text className="text-[13px] font-sans-bold text-ink-2">Close</Text>
        </Pressable>
        <Text className="text-[15px] font-sans-bold text-ink">Filters</Text>
        <Pressable onPress={reset} hitSlop={8}>
          <Text className="text-[13px] font-sans-bold text-primary">Reset</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 160 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Price */}
        <SectionLabel>Price range</SectionLabel>
        <View className="flex-row gap-2.5 mt-2">
          <PriceField label="Min" value={minPrice} onChange={setMinPrice} placeholder="₦0" />
          <PriceField label="Max" value={maxPrice} onChange={setMaxPrice} placeholder="₦ any" />
        </View>
        <Text className="text-[11.5px] text-ink-3 mt-2">
          {minPrice ? fmtNaira(Number(minPrice)) : "₦0"} —{" "}
          {maxPrice ? fmtNaira(Number(maxPrice)) : "any"}
        </Text>

        {/* Type */}
        <SectionLabel className="mt-6">Property type</SectionLabel>
        <ChipRow values={TYPES} selected={type} onSelect={setType} />

        {/* Beds */}
        <SectionLabel className="mt-6">Bedrooms</SectionLabel>
        <ChipRow values={BEDS} selected={beds} onSelect={setBeds} />

        {/* Baths */}
        <SectionLabel className="mt-6">Bathrooms</SectionLabel>
        <ChipRow values={BATHS} selected={baths} onSelect={setBaths} />

        {/* Amenities */}
        <SectionLabel className="mt-6">Amenities</SectionLabel>
        <MultiChips
          values={AMENITIES}
          selected={amenities}
          onToggle={(v) => toggle(setAmenities, v)}
        />

        {/* Trust */}
        <SectionLabel className="mt-6">Trust signals</SectionLabel>
        <View className="mt-2 gap-2">
          {TRUST.map((t) => {
            const on = trust.includes(t);
            return (
              <Pressable
                key={t}
                onPress={() => toggle(setTrust, t)}
                className="flex-row items-center gap-3 bg-white rounded-2xl px-3.5 py-3 border-line active:opacity-90"
                style={{ borderWidth: 1 }}
              >
                <View
                  className="w-5 h-5 rounded items-center justify-center"
                  style={{
                    backgroundColor: on ? PRIMARY : "transparent",
                    borderWidth: on ? 0 : 1.5,
                    borderColor: "#d3cdc1",
                  }}
                >
                  {on && <Ionicons name="checkmark" size={13} color="#ffffff" />}
                </View>
                <Text className="flex-1 text-[13.5px] font-sans-bold text-ink">{t}</Text>
                <Ionicons name="shield-checkmark" size={14} color={PRIMARY} />
              </Pressable>
            );
          })}
        </View>
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
          onPress={() => router.back()}
          className="bg-primary rounded-full items-center active:opacity-80"
          style={{ paddingVertical: 16 }}
        >
          <Text className="text-white font-sans-bold text-[15px]">
            Show 142 homes
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
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
      className={`text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase ${className ?? ""}`}
    >
      {children}
    </Text>
  );
}

function PriceField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <View className="flex-1">
      <Text className="text-[11px] font-sans-bold text-ink-3 mb-1.5">
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={(t) => onChange(t.replace(/[^0-9]/g, ""))}
        placeholder={placeholder}
        placeholderTextColor={INK_3}
        keyboardType="number-pad"
        className="bg-white border border-line rounded-2xl px-3.5 py-3 text-ink text-[14px] font-sans-bold"
      />
    </View>
  );
}

function ChipRow({
  values,
  selected,
  onSelect,
}: {
  values: string[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingTop: 8 }}
    >
      {values.map((v) => {
        const on = selected === v;
        return (
          <Pressable
            key={v}
            onPress={() => onSelect(v)}
            className="px-4 py-2.5 rounded-full"
            style={{
              backgroundColor: on ? INK : "#ffffff",
              borderWidth: on ? 0 : 1,
              borderColor: "#e1dcd3",
            }}
          >
            <Text
              className="text-[13px] font-sans-bold"
              style={{ color: on ? "#ffffff" : INK_2 }}
            >
              {v}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function MultiChips({
  values,
  selected,
  onToggle,
}: {
  values: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <View className="flex-row flex-wrap gap-2 mt-2">
      {values.map((v) => {
        const on = selected.includes(v);
        return (
          <Pressable
            key={v}
            onPress={() => onToggle(v)}
            className="px-3.5 py-2 rounded-full"
            style={{
              backgroundColor: on ? "#e3efe7" : "#ffffff",
              borderWidth: 1,
              borderColor: on ? PRIMARY : "#e1dcd3",
            }}
          >
            <Text
              className="text-[12.5px] font-sans-bold"
              style={{ color: on ? "#134a2d" : INK_2 }}
            >
              {v}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
