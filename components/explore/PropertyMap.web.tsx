// Web fallback for PropertyMap. `react-native-maps` can't bundle for web
// (it imports native-only RN internals), so on web we render a simple
// placeholder instead. Metro picks this file for the web platform.
import { forwardRef, useImperativeHandle } from "react";
import { Text, View } from "react-native";
import type { Listing } from "@/api/types";

export type MapLayer = "standard" | "satellite";
export type PropertyMapHandle = { recenter: () => void };

type Props = {
  items: Listing[];
  mapType: MapLayer;
  selectedPin: string | null;
  onSelectPin: (id: string) => void;
};

export const PropertyMap = forwardRef<PropertyMapHandle, Props>(
  function PropertyMap(_props, ref) {
    useImperativeHandle(ref, () => ({ recenter: () => {} }));
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#e7eae5",
          padding: 24,
        }}
      >
        <Text
          style={{
            fontFamily: "Inter_600SemiBold",
            fontSize: 14,
            color: "#4d524f",
            textAlign: "center",
          }}
        >
          The map view is available in the PropertyLoop mobile app.
        </Text>
      </View>
    );
  },
);
