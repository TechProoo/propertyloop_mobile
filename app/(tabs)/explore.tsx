import { useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useListings } from "@/api/hooks/useListings";
import {
  PropertyMap,
  type MapLayer,
  type PropertyMapHandle,
} from "@/components/explore/PropertyMap";

const PRIMARY = "#1f6f43";
const INK = "#1a2120";
const INK_2 = "#4d524f";

export default function ExploreMapScreen() {
  const [selectedPin, setSelectedPin] = useState<string | null>(null);
  const [mapType, setMapType] = useState<MapLayer>("standard");
  const mapRef = useRef<PropertyMapHandle | null>(null);
  // Fetch the full active set so the map plots every home and the header count
  // reflects what's actually pinned — not a 12-item slice claiming the total.
  const { items, loading } = useListings({ sort: "newest", limit: 100 });

  const recenter = () => {
    mapRef.current?.recenter();
  };
  const toggleLayer = () => {
    setMapType((t) => (t === "standard" ? "satellite" : "standard"));
  };

  return (
    <View className="flex-1 bg-cream">
      {/* Map fills the entire screen */}
      <PropertyMap
        ref={mapRef}
        items={items}
        mapType={mapType}
        selectedPin={selectedPin}
        onSelectPin={setSelectedPin}
      />

      {/* Top floating search */}
      <SafeAreaView
        edges={["top"]}
        pointerEvents="box-none"
        style={{ position: "absolute", top: 0, left: 0, right: 0 }}
      >
        <View className="flex-row gap-2 px-4 pt-2">
          <Pressable
            onPress={() => router.push("/search-results" as Href)}
            className="flex-1 bg-white rounded-full px-3.5 py-3 flex-row items-center gap-2.5"
            style={{
              shadowColor: "#000",
              shadowOpacity: 0.08,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: 3,
            }}
          >
            <Ionicons name="search" size={17} color={INK_2} />
            <Text className="text-[13.5px] font-sans-semibold text-ink">
              Search homes
            </Text>
            <Text className="ml-auto text-[11px] text-ink-3 font-sans-semibold">
              {loading
                ? "…"
                : `${items.length} home${items.length === 1 ? "" : "s"}`}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/filters" as Href)}
            className="w-[42px] h-[42px] rounded-full bg-white items-center justify-center"
            style={{
              shadowColor: "#000",
              shadowOpacity: 0.08,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: 3,
            }}
          >
            <Ionicons name="options-outline" size={18} color={INK} />
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Right-side map controls — locate me + layers */}
      <View
        pointerEvents="box-none"
        style={{ position: "absolute", top: 220, right: 16, gap: 8 }}
      >
        <MapControl icon="locate-outline" color={PRIMARY} onPress={recenter} />
        <MapControl
          icon={mapType === "standard" ? "layers-outline" : "layers"}
          color={INK}
          onPress={toggleLayer}
        />
      </View>

      {/* Bottom sheet with swipeable cards */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "#ffffff",
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          paddingTop: 8,
          paddingBottom: 28,
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowRadius: 30,
          shadowOffset: { width: 0, height: -10 },
          elevation: 12,
        }}
      >
        {/* Drag handle */}
        <View
          style={{
            width: 36,
            height: 4,
            backgroundColor: "#e1dcd3",
            borderRadius: 100,
            alignSelf: "center",
            marginBottom: 12,
          }}
        />

        <View className="px-5 flex-row items-baseline justify-between">
          <Text className="text-[16px] font-sans-bold text-ink tracking-tight">
            Latest homes
          </Text>
          <Pressable onPress={() => router.push("/search-results" as Href)}>
            <Text className="text-xs font-sans-bold text-primary">See all</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12, paddingHorizontal: 18, paddingTop: 12 }}
        >
          {items.slice(0, 20).map((c) => (
            <Pressable
              key={c.id}
              onPress={() => router.push(`/property/${c.id}` as Href)}
              className="bg-white rounded-2xl overflow-hidden active:opacity-90"
              style={{
                width: 220,
                shadowColor: "#000",
                shadowOpacity: 0.05,
                shadowRadius: 2,
                shadowOffset: { width: 0, height: 1 },
              }}
            >
              <View style={{ height: 110 }}>
                <Image
                  source={c.coverImage}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
              </View>
              <View className="px-3 py-3">
                <View className="flex-row items-baseline gap-1">
                  <Text
                    className="font-serif text-ink"
                    style={{ fontSize: 17, letterSpacing: -0.3 }}
                  >
                    {c.priceLabel}
                  </Text>
                  {!!c.period && (
                    <Text className="text-[11px] font-sans-semibold text-ink-3">
                      {c.period}
                    </Text>
                  )}
                </View>
                <Text
                  className="text-[13px] font-sans-semibold text-ink mt-0.5"
                  numberOfLines={1}
                >
                  {c.title}
                </Text>
                <Text className="text-[11px] text-ink-3 mt-0.5" numberOfLines={1}>
                  {c.location} · {c.beds}B / {c.baths}Ba
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

function MapControl({
  icon,
  color,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="w-[42px] h-[42px] rounded-full bg-white items-center justify-center"
      style={{
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
      }}
    >
      <Ionicons name={icon} size={18} color={color} />
    </Pressable>
  );
}
