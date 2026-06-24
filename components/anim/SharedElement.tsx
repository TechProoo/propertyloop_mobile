import { useCallback, useRef, useState, type ReactNode } from "react";
import { Pressable, View } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { SharedElementContext, type SharedElementLayout } from "./SharedElementContext";

export interface SharedElementSourceProps {
  id: string;
  children: ReactNode;
  onPress?: () => void;
  style?: any;
}

export interface SharedElementDestinationProps {
  id: string;
  children: ReactNode;
}

/**
 * Provider for shared element transitions. Wrap your app/route with this to enable
 * hero animations. Source elements become tappable; destinations inherit the animation.
 */
export function SharedElementProvider({ children }: { children: ReactNode }) {
  const layouts = useRef<Map<string, SharedElementLayout>>(new Map());
  const activeTransition = useSharedValue<string | null>(null);

  const register = useCallback((id: string, layout: SharedElementLayout) => {
    layouts.current.set(id, layout);
  }, []);

  const unregister = useCallback((id: string) => {
    layouts.current.delete(id);
  }, []);

  const getLayout = useCallback(
    (id: string): SharedElementLayout | null => layouts.current.get(id) ?? null,
    []
  );

  return (
    <SharedElementContext.Provider value={{ register, unregister, getLayout }}>
      {children}
    </SharedElementContext.Provider>
  );
}

/**
 * Marks a component as the source for a shared element transition. When tapped,
 * this component's layout is captured and broadcast to any matching Destination.
 * Works best with cards or image containers.
 */
export function SharedElementSource({
  id,
  children,
  onPress,
  style,
}: SharedElementSourceProps) {
  const { register, unregister } = useSharedElementContext();

  const handleLayout = useCallback(
    (e: any) => {
      const { x, y, width, height } = e.nativeEvent.layout;
      register(id, { x, y, width, height });
    },
    [id, register]
  );

  return (
    <Pressable
      onPress={onPress}
      onLayout={handleLayout}
      style={style}
      onBlur={() => unregister(id)}
      activeOpacity={0.7}
    >
      {children}
    </Pressable>
  );
}

/**
 * Marks a component as the destination for a shared element transition. When a
 * Source with matching id is tapped, this component animates in from the source's
 * position/size. Use this as the hero image on detail pages.
 */
export function SharedElementDestination({
  id,
  children,
}: SharedElementDestinationProps) {
  const { getLayout } = useSharedElementContext();
  const progress = useSharedValue(0);
  const [destinationLayout, setDestinationLayout] = useState<SharedElementLayout | null>(null);

  const handleLayout = useCallback(
    (e: any) => {
      const { x, y, width, height } = e.nativeEvent.layout;
      setDestinationLayout({ x, y, width, height });
      // Animate in from source position
      const sourceLayout = getLayout(id);
      if (sourceLayout && !destinationLayout) {
        progress.value = withTiming(1, { duration: 300 });
      }
    },
    [id, getLayout, destinationLayout, progress]
  );

  const sourceLayout = getLayout(id);
  const target = destinationLayout || sourceLayout;

  const animStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      {
        scale: progress.value === 1 ? 1 : 0.8,
      },
    ],
  }));

  return (
    <Animated.View onLayout={handleLayout} style={animStyle}>
      {children}
    </Animated.View>
  );
}
