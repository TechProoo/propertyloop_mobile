import { useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, type MapType } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { useListings } from "@/api/hooks/useListings";

const PRIMARY = "#1f6f43";
const INK = "#1a2120";
const INK_2 = "#4d524f";

// Default map viewport — Lekki Phase 1 / Lagos. Listings don't yet carry
// geocoordinates from the backend, so markers are spread deterministically
// around this region (stable per index). Swap to real lat/long once the
// listings API returns them.
const DEFAULT_REGION = {
  latitude: 6.454,
  longitude: 3.473,
  latitudeDelta: 0.018,
  longitudeDelta: 0.014,
};
function spreadCoord(i: number) {
  const angle = i * 2.39996323; // golden angle — even, non-overlapping spiral
  const radius = 0.0016 + (i % 5) * 0.0014;
  return {
    latitude: DEFAULT_REGION.latitude + radius * Math.cos(angle),
    longitude: DEFAULT_REGION.longitude + radius * Math.sin(angle),
  };
}

export default function ExploreMapScreen() {
  const [selectedPin, setSelectedPin] = useState<string | null>(null);
  const [mapType, setMapType] = useState<MapType>("standard");
  const mapRef = useRef<MapView | null>(null);
  const { items, total } = useListings({ sort: "newest", limit: 12 });

  const recenter = () => {
    mapRef.current?.animateToRegion(DEFAULT_REGION, 600);
  };
  const toggleLayer = () => {
    setMapType((t) => (t === "standard" ? "satellite" : "standard"));
  };

  return (
    <View className="flex-1 bg-cream">
      {/* Map fills the entire screen */}
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={DEFAULT_REGION}
        mapType={mapType}
        showsCompass={false}
        toolbarEnabled={false}
      >
        {items.map((listing, i) => {
          const isOn = selectedPin === listing.id;
          return (
            <Marker
              key={listing.id}
              coordinate={spreadCoord(i)}
              onPress={() => setSelectedPin(listing.id)}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
            >
              {/* Custom marker — price pill, dark when active */}
              <View
                style={{
                  paddingHorizontal: isOn ? 12 : 11,
                  paddingVertical: isOn ? 8 : 6,
                  borderRadius: 100,
                  backgroundColor: isOn ? INK : "#ffffff",
                  shadowColor: "#000",
                  shadowOpacity: 0.16,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 4,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Inter_700Bold",
                    fontSize: isOn ? 13 : 12,
                    color: isOn ? "#ffffff" : INK,
                  }}
                >
                  {listing.priceLabel}
                </Text>
              </View>
            </Marker>
          );
        })}
      </MapView>

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
              {total} home{total === 1 ? "" : "s"}
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
          {items.map((c) => (
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
