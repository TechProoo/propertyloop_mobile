import { useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, type MapType } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  MAP_CARDS,
  MAP_LOCATION,
  MAP_PINS,
  MAP_REGION,
} from "@/mocks/map";

const PRIMARY = "#1f6f43";
const INK = "#1a2120";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

function picsum(seed: string) {
  return `https://picsum.photos/seed/${seed}/360/240`;
}

export default function ExploreMapScreen() {
  const [selectedPin, setSelectedPin] = useState("p1");
  const [mapType, setMapType] = useState<MapType>("standard");
  const mapRef = useRef<MapView | null>(null);

  const recenter = () => {
    mapRef.current?.animateToRegion(MAP_REGION, 600);
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
        initialRegion={MAP_REGION}
        mapType={mapType}
        showsCompass={false}
        toolbarEnabled={false}
      >
        {MAP_PINS.map((p) => {
          const isOn = selectedPin === p.id;
          return (
            <Marker
              key={p.id}
              coordinate={{ latitude: p.latitude, longitude: p.longitude }}
              onPress={() => setSelectedPin(p.id)}
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
                  {p.priceLabel}
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
              {MAP_LOCATION.label}
            </Text>
            <Text className="ml-auto text-[11px] text-ink-3 font-sans-semibold">
              {MAP_LOCATION.count}
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
            {MAP_LOCATION.count} in this area
          </Text>
          <Text className="text-xs font-sans-bold text-primary">
            Sort: Price ↑
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12, paddingHorizontal: 18, paddingTop: 12 }}
        >
          {MAP_CARDS.map((c) => {
            const isOn = selectedPin === c.pinId;
            return (
              <Pressable
                key={c.id}
                onPress={() => {
                  setSelectedPin(c.pinId);
                  router.push(`/property/${c.id}` as Href);
                }}
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
                    source={picsum(c.imageSeed)}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                  />
                  {isOn && (
                    <View
                      className="absolute top-2 left-2 bg-ink px-2 py-1 rounded-full"
                    >
                      <Text className="text-[10px] font-sans-bold text-white tracking-widest uppercase">
                        Selected
                      </Text>
                    </View>
                  )}
                </View>
                <View className="px-3 py-3">
                  <View className="flex-row items-baseline gap-1">
                    <Text
                      className="font-serif text-ink"
                      style={{ fontSize: 17, letterSpacing: -0.3 }}
                    >
                      {c.price}
                    </Text>
                    <Text className="text-[11px] font-sans-semibold text-ink-3">
                      /yr
                    </Text>
                  </View>
                  <Text
                    className="text-[13px] font-sans-semibold text-ink mt-0.5"
                    numberOfLines={1}
                  >
                    {c.title}
                  </Text>
                  <Text className="text-[11px] text-ink-3 mt-0.5">
                    {c.area} · {c.beds}B / {c.baths}Ba
                  </Text>
                </View>
              </Pressable>
            );
          })}
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
