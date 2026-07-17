import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

interface Props {
  visible: boolean;
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}

/**
 * Full-screen, swipeable photo viewer. Shows each image uncropped
 * (contentFit="contain") on black, pages horizontally between them, and lets
 * the user pinch-to-zoom (iOS via the inner ScrollView). Used from the listing
 * detail hero so tapping a photo opens the full picture.
 */
export function PhotoViewer({ visible, images, initialIndex = 0, onClose }: Props) {
  const [index, setIndex] = useState(initialIndex);
  const listRef = useRef<FlatList<string>>(null);
  // Read the insets from the hook rather than wrapping the chrome in a
  // SafeAreaView: this content lives inside a react-native <Modal>, which is a
  // separate native container where SafeAreaView's own measurement collapses to
  // zero — that left the close button sitting up in the status bar. The hook
  // reads the provider's context (expo-router mounts SafeAreaProvider at the
  // root), so it still reports the real device insets in here.
  const insets = useSafeAreaInsets();

  // Re-sync to the tapped photo each time the viewer is opened.
  useEffect(() => {
    if (visible) setIndex(initialIndex);
  }, [visible, initialIndex]);

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (i !== index) setIndex(i);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1, backgroundColor: "#000" }}>
        <StatusBar barStyle="light-content" />
        <FlatList
          ref={listRef}
          data={images}
          keyExtractor={(uri, i) => `${i}-${uri}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, i) => ({
            length: SCREEN_W,
            offset: SCREEN_W * i,
            index: i,
          })}
          onMomentumScrollEnd={onMomentumEnd}
          renderItem={({ item }) => (
            <ScrollView
              style={{ width: SCREEN_W, height: SCREEN_H }}
              contentContainerStyle={{
                width: SCREEN_W,
                height: SCREEN_H,
                justifyContent: "center",
              }}
              maximumZoomScale={3}
              minimumZoomScale={1}
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
              centerContent
            >
              <Image
                source={item}
                style={{ width: SCREEN_W, height: SCREEN_H }}
                contentFit="contain"
              />
            </ScrollView>
          )}
        />

        {/* Top chrome: close + counter */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            paddingTop: Math.max(insets.top, 12) + 8,
          }}
        >
          <View className="flex-row items-center justify-between px-4">
            <Pressable
              onPress={onClose}
              hitSlop={8}
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            >
              <Ionicons name="close" size={22} color="#ffffff" />
            </Pressable>
            {images.length > 1 && (
              <View
                className="px-3 py-1.5 rounded-full"
                style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
              >
                <Text className="text-white text-[13px] font-sans-bold">
                  {index + 1} / {images.length}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
