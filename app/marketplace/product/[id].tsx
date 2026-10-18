import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { Stack, router, useLocalSearchParams, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Appear, PressableScale } from "@/components/anim";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { cart, useCartCount } from "@/lib/storeCart";
import { tapLight, tapSuccess } from "@/lib/haptics";
import { Alert } from "@/lib/dialog";
import { naira } from "@/lib/money";
import marketplaceService, {
  type ProductDetail,
} from "@/api/services/marketplace";

const PRIMARY = "#1f6f43";
const ACCENT = "#b9842c";

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const cartCount = useCartCount();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const [activeImage, setActiveImage] = useState(0);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [qty, setQty] = useState(1);

  useEffect(() => {
    let alive = true;
    if (!id) return;
    marketplaceService
      .getProduct(id)
      .then((p) => {
        if (!alive) return;
        setProduct(p);
        // Default each option to its first value.
        const defaults: Record<string, string> = {};
        (p.options ?? []).forEach((o) => {
          if (o.values[0]) defaults[o.label] = o.values[0];
        });
        setSelected(defaults);
      })
      .catch(() => alive && setFailed(true))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id]);

  const gallery = useMemo(() => {
    if (!product) return [] as string[];
    const g = [product.image, ...(product.gallery ?? [])];
    return [...new Set(g.filter(Boolean))];
  }, [product]);

  if (loading) {
    return (
      <View className="flex-1 bg-cream items-center justify-center">
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color={PRIMARY} />
      </View>
    );
  }
  if (failed || !product) {
    return (
      <View className="flex-1 bg-cream items-center justify-center px-8">
        <Stack.Screen options={{ headerShown: false }} />
        <Ionicons name="cube-outline" size={32} color="#c7ccc8" />
        <Text className="text-ink-2 text-center mt-3">
          We couldn't open this product.
        </Text>
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text className="text-primary font-sans-bold">Go back</Text>
        </Pressable>
      </View>
    );
  }

  const onSale =
    product.compareAtNaira && product.compareAtNaira > product.priceNaira;

  function addToCart() {
    if (!product) return;
    cart.add(
      {
        productId: product.id,
        name: product.name,
        image: product.image,
        priceNaira: product.priceNaira,
        storeSlug: product.storeSlug,
        storeName: product.storeName,
        options: Object.keys(selected).length ? selected : undefined,
      },
      qty,
    );
    tapSuccess();
    Alert.alert("Added to cart", `${product.name} × ${qty}`, [
      { text: "Keep shopping", style: "cancel" },
      {
        text: "View cart",
        onPress: () => router.push("/marketplace/cart" as Href),
      },
    ]);
  }

  return (
    <View className="flex-1 bg-cream">
      <Stack.Screen options={{ headerShown: false }} />

      {/* Floating controls */}
      <SafeAreaView edges={["top"]} className="absolute left-0 right-0 z-10">
        <View className="flex-row items-center justify-between px-5 pt-2">
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            className="h-9 w-9 rounded-full items-center justify-center bg-black/30"
          >
            <Ionicons name="chevron-back" size={22} color="#ffffff" />
          </Pressable>
          <Pressable
            onPress={() => {
              tapLight();
              router.push("/marketplace/cart" as Href);
            }}
            hitSlop={12}
            className="h-9 w-9 rounded-full items-center justify-center bg-black/30 relative"
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
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Gallery */}
        <View>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) =>
              setActiveImage(Math.round(e.nativeEvent.contentOffset.x / width))
            }
          >
            {gallery.map((uri) => (
              <Image
                key={uri}
                source={{ uri }}
                style={{ width, height: width }}
                contentFit="cover"
                transition={200}
              />
            ))}
          </ScrollView>
          {gallery.length > 1 && (
            <View className="flex-row justify-center gap-1.5 mt-3">
              {gallery.map((_, i) => (
                <View
                  key={i}
                  className="rounded-full"
                  style={{
                    width: i === activeImage ? 18 : 6,
                    height: 6,
                    backgroundColor: i === activeImage ? PRIMARY : "#d4d8d4",
                  }}
                />
              ))}
            </View>
          )}
        </View>

        <View className="px-5 pt-4">
          {/* Store link */}
          <Pressable
            onPress={() =>
              router.push(`/marketplace/store/${product.storeSlug}` as Href)
            }
            className="flex-row items-center gap-1.5 self-start"
          >
            <Text className="text-primary text-[12.5px] font-sans-bold">
              {product.storeName}
            </Text>
            {product.store.verified && (
              <Ionicons name="checkmark-circle" size={13} color={PRIMARY} />
            )}
            <Ionicons name="chevron-forward" size={12} color={PRIMARY} />
          </Pressable>

          <Text className="font-serif text-ink text-[24px] mt-1.5 leading-[30px]">
            {product.name}
          </Text>

          <View className="flex-row items-center gap-2 mt-2">
            <Text className="text-primary-ink text-[22px] font-sans-bold">
              {naira(product.priceNaira)}
            </Text>
            {onSale && (
              <Text className="text-ink-3 text-[15px] line-through">
                {naira(product.compareAtNaira!)}
              </Text>
            )}
          </View>

          {product.rating > 0 && (
            <View className="flex-row items-center gap-1 mt-1.5">
              <Ionicons name="star" size={14} color={ACCENT} />
              <Text className="text-ink-2 text-[12.5px] font-sans-medium">
                {product.rating.toFixed(1)} · {product.reviews} reviews
              </Text>
            </View>
          )}

          {/* Options */}
          {(product.options ?? []).map((opt) => (
            <View key={opt.label} className="mt-5">
              <Text className="text-ink text-[13px] font-sans-bold mb-2">
                {opt.label}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {opt.values.map((v) => {
                  const active = selected[opt.label] === v;
                  return (
                    <Pressable
                      key={v}
                      onPress={() => {
                        tapLight();
                        setSelected((s) => ({ ...s, [opt.label]: v }));
                      }}
                      className={`rounded-full border px-4 py-2 ${
                        active ? "bg-primary border-primary" : "bg-white border-line"
                      }`}
                    >
                      <Text
                        className={`text-[12.5px] font-sans-medium ${
                          active ? "text-white" : "text-ink-2"
                        }`}
                      >
                        {v}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}

          {/* Quantity */}
          <View className="mt-5 flex-row items-center justify-between">
            <Text className="text-ink text-[13px] font-sans-bold">Quantity</Text>
            <View className="flex-row items-center gap-4 rounded-full bg-white border border-line px-3 py-1.5">
              <Pressable onPress={() => setQty((q) => Math.max(1, q - 1))} hitSlop={8}>
                <Ionicons name="remove" size={18} color="#1a2120" />
              </Pressable>
              <Text className="text-ink text-[15px] font-sans-bold w-6 text-center">
                {qty}
              </Text>
              <Pressable onPress={() => setQty((q) => Math.min(99, q + 1))} hitSlop={8}>
                <Ionicons name="add" size={18} color="#1a2120" />
              </Pressable>
            </View>
          </View>

          {/* Description */}
          {product.description ? (
            <View className="mt-6">
              <Text className="text-ink text-[14px] font-sans-bold mb-1.5">
                Description
              </Text>
              <Text className="text-ink-2 text-[13.5px] leading-[21px]">
                {product.description}
              </Text>
            </View>
          ) : null}

          {/* Specs */}
          {product.specs && product.specs.length > 0 && (
            <View className="mt-6">
              <Text className="text-ink text-[14px] font-sans-bold mb-2">
                Details
              </Text>
              <View className="rounded-2xl bg-white border border-line overflow-hidden">
                {product.specs.map((s, i) => (
                  <View
                    key={s.label}
                    className={`flex-row justify-between px-4 py-3 ${
                      i > 0 ? "border-t border-line" : ""
                    }`}
                  >
                    <Text className="text-ink-3 text-[12.5px]">{s.label}</Text>
                    <Text className="text-ink text-[12.5px] font-sans-medium">
                      {s.value}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Related */}
          {product.related.length > 0 && (
            <View className="mt-7">
              <Text className="text-ink text-[14px] font-sans-bold mb-3">
                More from {product.storeName}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="gap-3 pr-5"
              >
                {product.related.map((r, i) => (
                  <Appear key={r.id} delay={i * 50}>
                    <ProductCard product={r} width={150} />
                  </Appear>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky add-to-cart bar */}
      <SafeAreaView edges={["bottom"]} className="absolute bottom-0 left-0 right-0 bg-cream border-t border-line">
        <View className="px-5 py-3">
          {product.inStock ? (
            <PressableScale
              onPress={addToCart}
              className="rounded-full bg-primary py-4 flex-row items-center justify-center gap-2"
            >
              <Ionicons name="cart" size={18} color="#ffffff" />
              <Text className="text-white font-sans-bold text-[15px]">
                Add to cart · {naira(product.priceNaira * qty)}
              </Text>
            </PressableScale>
          ) : (
            <View className="rounded-full bg-cream-2 py-4 items-center">
              <Text className="text-ink-3 font-sans-bold text-[15px]">
                Sold out
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}
