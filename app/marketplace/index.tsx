import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Stack, router, useLocalSearchParams, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Appear, PressableScale, stagger } from "@/components/anim";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { useCartCount } from "@/lib/storeCart";
import { tapLight } from "@/lib/haptics";
import marketplaceService, {
  type ProductWithStore,
  type StoreTeaser,
} from "@/api/services/marketplace";

const PRIMARY = "#1f6f43";
const ACCENT = "#b9842c";

const CATEGORIES = [
  { label: "All", icon: "grid-outline" as const },
  { label: "Furniture", icon: "bed-outline" as const },
  { label: "Lighting & Decor", icon: "bulb-outline" as const },
  { label: "Building Materials", icon: "construct-outline" as const },
  { label: "Smart Home", icon: "home-outline" as const },
  { label: "Tools & Hardware", icon: "hammer-outline" as const },
  { label: "Landscaping", icon: "leaf-outline" as const },
];

export default function MarketplaceHubScreen() {
  const params = useLocalSearchParams<{ category?: string }>();
  const cartCount = useCartCount();
  const [stores, setStores] = useState<StoreTeaser[]>([]);
  const [products, setProducts] = useState<ProductWithStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // Open straight into a category when one is deep-linked from the home screen.
  const [category, setCategory] = useState(
    params.category && CATEGORIES.some((c) => c.label === params.category)
      ? params.category
      : "All",
  );
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    try {
      const [s, p] = await Promise.all([
        marketplaceService.listStores().catch(() => [] as StoreTeaser[]),
        marketplaceService
          .listProducts({
            category: category === "All" ? undefined : category,
            search: query.trim() || undefined,
            limit: 24,
          })
          .catch(() => ({ items: [] as ProductWithStore[] })),
      ]);
      setStores(s);
      setProducts(p.items);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [category, query]);

  useEffect(() => {
    load();
  }, [load]);

  function submitSearch() {
    setLoading(true);
    load();
  }

  return (
    <View className="flex-1 bg-cream">
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1" edges={["top"]}>
        {/* Header */}
        <View className="flex-row items-center gap-3 px-5 pt-2 pb-3">
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color="#1a2120" />
          </Pressable>
          <Text className="flex-1 font-serif text-ink text-[22px]">
            Marketplace
          </Text>
          <Pressable
            onPress={() => {
              tapLight();
              router.push("/marketplace/cart" as Href);
            }}
            hitSlop={12}
            className="relative"
          >
            <Ionicons name="cart-outline" size={24} color="#1a2120" />
            {cartCount > 0 && (
              <View
                className="absolute -right-2 -top-1.5 rounded-full items-center justify-center px-1"
                style={{ minWidth: 18, height: 18, backgroundColor: ACCENT }}
              >
                <Text className="text-white text-[10px] font-sans-bold">
                  {cartCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Search */}
        <View className="px-5">
          <View className="flex-row items-center gap-2 rounded-2xl bg-cream-2 px-4 py-3">
            <Ionicons name="search" size={18} color="#7f857f" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={submitSearch}
              returnKeyType="search"
              placeholder="Search stores, categories or products"
              placeholderTextColor="#7f857f"
              className="flex-1 text-[14px] text-ink"
            />
            {query.length > 0 && (
              <Pressable
                onPress={() => {
                  setQuery("");
                  setLoading(true);
                  load();
                }}
                hitSlop={10}
              >
                <Ionicons name="close-circle" size={18} color="#7f857f" />
              </Pressable>
            )}
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor={PRIMARY}
            />
          }
        >
          {/* Category chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2 px-5 py-4"
          >
            {CATEGORIES.map((c) => {
              const active = category === c.label;
              return (
                <Pressable
                  key={c.label}
                  onPress={() => {
                    tapLight();
                    setCategory(c.label);
                    setLoading(true);
                  }}
                  className={`flex-row items-center gap-1.5 rounded-full border px-3.5 py-2 ${
                    active
                      ? "bg-primary border-primary"
                      : "bg-white border-line"
                  }`}
                >
                  <Ionicons
                    name={c.icon}
                    size={14}
                    color={active ? "#ffffff" : "#4d524f"}
                  />
                  <Text
                    className={`text-[12.5px] font-sans-medium ${
                      active ? "text-white" : "text-ink-2"
                    }`}
                  >
                    {c.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Featured stores */}
          {stores.length > 0 && (
            <View className="mb-2">
              <Text className="px-5 text-[15px] font-sans-bold text-ink">
                Featured stores
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="gap-3 px-5 py-3"
              >
                {stores.map((s, i) => (
                  <Appear key={s.slug} delay={stagger(i, 60)}>
                    <StoreChip store={s} />
                  </Appear>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Products */}
          <View className="px-5 pt-2">
            <Text className="text-[15px] font-sans-bold text-ink mb-3">
              {category === "All" ? "All products" : category}
            </Text>

            {loading ? (
              <View className="py-16 items-center">
                <ActivityIndicator color={PRIMARY} />
              </View>
            ) : products.length === 0 ? (
              <View className="py-16 items-center">
                <Ionicons name="bag-outline" size={30} color="#c7ccc8" />
                <Text className="text-ink-3 text-sm mt-3">
                  Nothing here yet. Check back soon.
                </Text>
              </View>
            ) : (
              <View className="flex-row flex-wrap justify-between">
                {products.map((p, i) => (
                  <Appear
                    key={p.id}
                    delay={stagger(i, 40)}
                    style={{ width: "48.5%", marginBottom: 14 }}
                  >
                    <ProductCard product={p} />
                  </Appear>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function StoreChip({ store }: { store: StoreTeaser }) {
  return (
    <PressableScale
      onPress={() => {
        tapLight();
        router.push(`/marketplace/store/${store.slug}` as Href);
      }}
      className="w-44 rounded-3xl overflow-hidden border border-line bg-white"
    >
      <View style={{ height: 84, backgroundColor: store.accent }}>
        {store.banner ? (
          <Image
            source={{ uri: store.banner }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        ) : null}
      </View>
      <View className="p-3 -mt-6">
        <View className="h-10 w-10 rounded-xl overflow-hidden border-2 border-white bg-white">
          <Image
            source={{ uri: store.logo }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        </View>
        <View className="flex-row items-center gap-1 mt-2">
          <Text numberOfLines={1} className="flex-1 text-ink text-[13px] font-sans-bold">
            {store.name}
          </Text>
          {store.verified && (
            <Ionicons name="checkmark-circle" size={13} color={PRIMARY} />
          )}
        </View>
        <Text numberOfLines={1} className="text-ink-3 text-[11px] mt-0.5">
          {store.productsCount} products · {store.category}
        </Text>
      </View>
    </PressableScale>
  );
}
