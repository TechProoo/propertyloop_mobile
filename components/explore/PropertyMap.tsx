// Native map (iOS/Android). The web build resolves PropertyMap.web.tsx
// instead, so `react-native-maps` — which imports native-only modules and
// can't bundle for web — never reaches the web bundle.
import { forwardRef, useImperativeHandle, useRef } from "react";
import { Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import type { Listing } from "@/api/types";

const INK = "#1a2120";

export type MapLayer = "standard" | "satellite";
export type PropertyMapHandle = { recenter: () => void };

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

type Props = {
  items: Listing[];
  mapType: MapLayer;
  selectedPin: string | null;
  onSelectPin: (id: string) => void;
};

export const PropertyMap = forwardRef<PropertyMapHandle, Props>(
  function PropertyMap({ items, mapType, selectedPin, onSelectPin }, ref) {
    const mapRef = useRef<MapView | null>(null);

    useImperativeHandle(ref, () => ({
      recenter: () => mapRef.current?.animateToRegion(DEFAULT_REGION, 600),
    }));

    return (
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
              onPress={() => onSelectPin(listing.id)}
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
    );
  },
);
