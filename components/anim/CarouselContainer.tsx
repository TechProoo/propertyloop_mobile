import {
  useCallback,
  useState,
  type ReactNode,
} from "react";
import { FlatList, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
} from "react-native-reanimated";
import { CarouselDots } from "./CarouselDots";

export interface CarouselContainerProps<T> {
  /** Data array for the carousel */
  data: T[];
  /** Render function for each item */
  renderItem: (item: T, index: number) => ReactNode;
  /** Width of each carousel item (should match your item width) */
  itemWidth: number;
  /** Show animated dot indicators */
  showDots?: boolean;
  /** Color for active dot */
  dotsActiveColor?: string;
  /** Color for inactive dots */
  dotsInactiveColor?: string;
  /** Spacing between items */
  gap?: number;
  /** Callback when carousel reaches snap point */
  onSnapToItem?: (index: number) => void;
  /** Horizontal padding around carousel */
  horizontalPadding?: number;
  /** Container style */
  style?: any;
}

/**
 * Animated carousel with momentum-based snapping and dot indicators.
 * Use for hero carousels, image galleries, and card sequences.
 * Automatically handles velocity-based snapping with smooth easing.
 */
export function CarouselContainer<T>({
  data,
  renderItem,
  itemWidth,
  showDots = true,
  dotsActiveColor = "#1f6f43",
  dotsInactiveColor = "#e1dcd3",
  gap = 12,
  onSnapToItem,
  horizontalPadding = 20,
  style,
}: CarouselContainerProps<T>) {
  const scrollPosition = useSharedValue(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollPosition.value = event.contentOffset.x;
  });

  const handleMomentumScrollEnd = useCallback(
    (event: any) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / (itemWidth + gap));
      const clampedIndex = Math.max(0, Math.min(index, data.length - 1));

      setCurrentIndex(clampedIndex);
      onSnapToItem?.(clampedIndex);

      // Snap to nearest item if scroll wasn't perfect
      const snapPosition = clampedIndex * (itemWidth + gap);
      if (Math.abs(offsetX - snapPosition) > 5) {
        const flatListRef = event.target._parent;
        if (flatListRef) {
          // FlatList native snap would go here, but rely on momentum for smoothness
        }
      }
    },
    [data.length, itemWidth, gap, onSnapToItem]
  );

  const handleLayout = useCallback((e: any) => {
    setContainerWidth(e.nativeEvent.layout.width);
  }, []);

  const ITEM_WIDTH = itemWidth + gap;

  return (
    <View style={[{ width: "100%" }, style]}>
      {/* Carousel */}
      <Animated.FlatList<T>
        data={data}
        renderItem={({ item, index }) => (
          <View style={{ width: ITEM_WIDTH, paddingRight: gap }}>
            {renderItem(item, index)}
          </View>
        )}
        keyExtractor={(_, i) => String(i)}
        horizontal
        scrollEventThrottle={16}
        onScroll={scrollHandler}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={ITEM_WIDTH}
        snapToAlignment="start"
        style={{
          paddingHorizontal: horizontalPadding - gap / 2,
        }}
        contentContainerStyle={{
          paddingRight: horizontalPadding,
        }}
      />

      {/* Dot indicators */}
      {showDots && (
        <View style={{ marginTop: 12, alignItems: "center" }}>
          <CarouselDots
            scrollPosition={scrollPosition}
            itemCount={data.length}
            itemWidth={ITEM_WIDTH}
            activeColor={dotsActiveColor}
            inactiveColor={dotsInactiveColor}
          />
        </View>
      )}
    </View>
  );
}
