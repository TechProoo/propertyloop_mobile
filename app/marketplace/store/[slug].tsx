import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Stack, router, useLocalSearchParams, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Appear, stagger } from "@/components/anim";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { useCartCount } from "@/lib/storeCart";
import { tapLight } from "@/lib/haptics";
import marketplaceService, {
  type Storefront,
  type ProductWithStore,
} from "@/api/services/marketplace";

const PRIMARY = "#1f6f43";
const ACCENT = "#b9842c";

const POLICY_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  shield: "shield-checkmark-outline",
  truck: "car-outline",
  clock: "time-outline",
  tag: "pricetag-outline",
};

export default function StorefrontScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const cartCount = useCartCount();
  const [store, setStore] = useState<Storefront | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!slug) return;
    marketplaceService
      .getStore(slug)
      .then((s) => alive && setStore(s))
      .catch(() => alive && setFailed(true))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <View className="flex-1 bg-cream items-center justify-center">
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color={PRIMARY} />
      </View>
    );
  }

  if (failed || !store) {
    return (
      <View className="flex-1 bg-cream items-center justify-center px-8">
        <Stack.Screen options={{ headerShown: false }} />
        <Ionicons name="storefront-outline" size={32} color="#c7ccc8" />
        <Text className="text-ink-2 text-center mt-3">
          We couldn't open this store.
        </Text>
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text className="text-primary font-sans-bold">Go back</Text>
        </Pressable>
      </View>
    );
  }

  const asProduct = (p: Storefront["products"][number]): ProductWithStore => ({
    ...p,
    storeSlug: store.slug,
    storeName: store.name,
    storeAccent: store.accent,
  });

  return (
    <View className="flex-1 bg-cream">
      <Stack.Screen options={{ headerShown: false }} />

      {/* Floating header controls over the banner */}
      <SafeAreaView edges={["top"]} className="absolute left-0 right-0 z-10">
        <View className="flex-row items-center justify-between px-5 pt-2">
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            className="h-9 w-9 rounded-full items-center justify-center bg-black/35"
          >
            <Ionicons name="chevron-back" size={22} color="#ffffff" />
          </Pressable>
          <Pressable
            onPress={() => {
              tapLight();
              router.push("/marketplace/cart" as Href);
            }}
            hitSlop={12}
            className="h-9 w-9 rounded-full items-center justify-center bg-black/35 relative"
          >
            <Ionicons name="cart-outline" size={20} color="#ffffff" />
            {cartCount > 0 && (
              <View
                className="absolute -right-1.5 -top-1 rounded-full items-center justify-center px-1"
                style={{ minWidth: 17, height: 17, backgroundColor: ACCENT }}
              >
                <Text className="text-white text-[10px] font-sans-bold">
                  {cartCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Banner */}
        <View style={{ height: 180, backgroundColor: store.accent }}>
          {store.banner ? (
            <Image
              source={{ uri: store.banner }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
          ) : null}
        </View>

        {/* Store identity */}
        <View className="px-5 -mt-10">
          <View className="h-20 w-20 rounded-2xl overflow-hidden border-4 border-cream bg-white">
            <Image
              source={{ uri: store.logo }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
          </View>
          <View className="flex-row items-center gap-1.5 mt-3">
            <Text className="font-serif text-ink text-[26px]">{store.name}</Text>
            {store.verified && (
              <Ionicons name="checkmark-circle" size={18} color={PRIMARY} />
            )}
          </View>
          <Text className="text-ink-2 text-[14px] mt-1 leading-5">
            {store.tagline}
          </Text>

          <View className="flex-row flex-wrap items-center gap-x-4 gap-y-1 mt-2.5">
            <View className="flex-row items-center gap-1">
              <Ionicons name="star" size={13} color={ACCENT} />
              <Text className="text-ink-2 text-[12.5px] font-sans-medium">
                {store.rating.toFixed(1)} ({store.reviews})
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Ionicons name="cube-outline" size={13} color="#7f857f" />
              <Text className="text-ink-2 text-[12.5px]">
                {store.ordersFulfilled} delivered
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Ionicons name="location-outline" size={13} color="#7f857f" />
              <Text className="text-ink-2 text-[12.5px]">{store.location}</Text>
            </View>
          </View>

          {store.bio ? (
            <Text className="text-ink-2 text-[13.5px] mt-3 leading-5">
              {store.bio}
            </Text>
          ) : null}
        </View>

        {/* Promo */}
        {store.promo && (
          <View className="mx-5 mt-4 rounded-2xl bg-accent-soft p-4 flex-row items-center gap-3">
            <Ionicons name="pricetag" size={20} color={ACCENT} />
            <View className="flex-1">
              <Text className="text-ink text-[13.5px] font-sans-bold">
                {store.promo.title}
              </Text>
              <Text className="text-ink-2 text-[12px] mt-0.5">
                {store.promo.subtitle} · Code {store.promo.code}
              </Text>
            </View>
          </View>
        )}

        {/* Policies */}
        {store.policies?.length > 0 && (
          <View className="flex-row flex-wrap gap-2 px-5 mt-4">
            {store.policies.map((p) => (
              <View
                key={p.label}
                className="flex-row items-center gap-1.5 rounded-full bg-white border border-line px-3 py-1.5"
              >
                <Ionicons
                  name={POLICY_ICON[p.icon] ?? "ellipse-outline"}
                  size={13}
                  color={PRIMARY}
                />
                <Text className="text-ink-2 text-[12px] font-sans-medium">
                  {p.label}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Products */}
        <View className="px-5 mt-6">
          <Text className="text-[15px] font-sans-bold text-ink mb-3">
            {store.products.length} product
            {store.products.length === 1 ? "" : "s"}
          </Text>
          {store.products.length === 0 ? (
            <Text className="text-ink-3 text-sm py-6 text-center">
              This store hasn't listed anything yet.
            </Text>
          ) : (
            <View className="flex-row flex-wrap justify-between">
              {store.products.map((p, i) => (
                <Appear
                  key={p.id}
                  delay={stagger(i, 40)}
                  style={{ width: "48.5%", marginBottom: 14 }}
                >
                  <ProductCard product={asProduct(p)} />
                </Appear>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
