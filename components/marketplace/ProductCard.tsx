import { Text, View } from "react-native";
import { Image } from "expo-image";
import { router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { PressableScale } from "@/components/anim";
import { tapLight } from "@/lib/haptics";
import { naira } from "@/lib/money";
import type { ProductWithStore } from "@/api/services/marketplace";

const ACCENT = "#b9842c";

const TAG_LABEL: Record<string, string> = {
  new: "New",
  bestseller: "Bestseller",
  sale: "Sale",
};

/**
 * One product, as a card — used in the hub grid, storefronts and related rows.
 * Photo-first, with price, store and rating beneath.
 */
export function ProductCard({
  product,
  width,
}: {
  product: ProductWithStore;
  width?: number;
}) {
  const onSale =
    product.compareAtNaira && product.compareAtNaira > product.priceNaira;

  return (
    <PressableScale
      onPress={() => {
        tapLight();
        router.push(`/marketplace/product/${product.id}` as Href);
      }}
      style={width ? { width } : undefined}
      className="rounded-3xl bg-white border border-line overflow-hidden"
    >
      <View className="relative">
        <Image
          source={{ uri: product.image }}
          style={{ width: "100%", aspectRatio: 1 }}
          contentFit="cover"
          transition={200}
        />
        {product.tag && (
          <View
            className="absolute left-2.5 top-2.5 rounded-full px-2.5 py-1"
            style={{ backgroundColor: product.tag === "sale" ? "#c2410c" : "#1f6f43" }}
          >
            <Text className="text-white text-[10px] font-sans-bold uppercase tracking-wide">
              {TAG_LABEL[product.tag] ?? product.tag}
            </Text>
          </View>
        )}
        {!product.inStock && (
          <View className="absolute inset-0 items-center justify-center bg-black/35">
            <Text className="text-white text-xs font-sans-bold uppercase tracking-wider">
              Sold out
            </Text>
          </View>
        )}
      </View>

      <View className="p-3">
        <Text
          numberOfLines={2}
          className="text-ink text-[13.5px] font-sans-semibold leading-[18px]"
        >
          {product.name}
        </Text>
        <Text numberOfLines={1} className="text-ink-3 text-[11px] mt-0.5">
          {product.storeName}
        </Text>

        <View className="flex-row items-end justify-between mt-2">
          <View className="flex-1 min-w-0">
            <Text className="text-primary-ink text-[15px] font-sans-bold">
              {naira(product.priceNaira)}
            </Text>
            {onSale && (
              <Text className="text-ink-3 text-[11px] line-through">
                {naira(product.compareAtNaira!)}
              </Text>
            )}
          </View>
          {product.rating > 0 && (
            <View className="flex-row items-center gap-0.5 shrink-0">
              <Ionicons name="star" size={11} color={ACCENT} />
              <Text className="text-ink-2 text-[11px] font-sans-medium">
                {product.rating.toFixed(1)}
              </Text>
            </View>
          )}
        </View>
      </View>
    </PressableScale>
  );
}
