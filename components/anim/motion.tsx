// ─────────────────────────────────────────────────────────────────────────
// Motion toolkit — the app's shared animation vocabulary.
//
// Everything here is built on react-native-reanimated (UI-thread, 120fps-safe)
// and tuned to one feel: content *arrives* with a gentle spring rise, and
// touch targets *give* a little under the finger. Keeping the timings and
// springs in one place means the whole app shares a single, recognisable
// motion language — and is one edit away from a re-tune.
//
// Usage:
//   <Appear>            – fade + rise in on mount
//   <Appear delay={80}> – same, staggered (see `stagger()` helper)
//   <Stagger>           – auto-staggers its direct children
//   <PressableScale>    – drop-in <Pressable> that springs down on touch
// ─────────────────────────────────────────────────────────────────────────
import {
  Children,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Pressable,
  Text,
  type PressableProps,
  type TextProps,
  type ViewStyle,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

// The signature spring — soft, slightly under-damped so arrivals feel alive
// without overshooting into bounce. Reused everywhere for consistency.
export const SPRING = { damping: 18, stiffness: 170, mass: 0.9 } as const;
// Snappier spring for press feedback — wants to settle fast.
export const PRESS_SPRING = { damping: 15, stiffness: 320, mass: 0.6 } as const;

// Base stagger step (ms). `stagger(i)` turns a list index into a delay so
// rows/cards cascade in instead of popping as one block.
export const STAGGER_MS = 55;
export const stagger = (index: number, base = 0) => base + index * STAGGER_MS;

type Direction = "up" | "down" | "fade";

/**
 * Mount entrance. Fades + rises content into place on its first render.
 * Defaults to a springy rise-from-below; pass `from="fade"` for a pure
 * cross-fade (good for overlays/heroes that shouldn't move).
 */
export function Appear({
  children,
  delay = 0,
  from = "up",
  duration = 460,
  style,
}: {
  children: ReactNode;
  delay?: number;
  from?: Direction;
  duration?: number;
  style?: ViewStyle | ViewStyle[];
}) {
  // FadeInDown rises up-from-below; FadeInUp settles down-from-above (good for
  // a dropping header); FadeIn is a pure cross-fade for heroes that shouldn't move.
  const entering =
    from === "fade"
      ? FadeIn.duration(duration).delay(delay)
      : from === "down"
        ? FadeInUp.springify().damping(20).stiffness(140).mass(0.9).delay(delay)
        : FadeInDown.springify().damping(20).stiffness(140).mass(0.9).delay(delay);

  return (
    <Animated.View entering={entering} style={style}>
      {children}
    </Animated.View>
  );
}

/**
 * Auto-staggers its direct children — each one gets an increasing entrance
 * delay so a column of cards/rows cascades in. Wrap a fixed set of siblings;
 * for mapped lists prefer giving each item `<Appear delay={stagger(i)}>`.
 */
export function Stagger({
  children,
  base = 40,
  step = STAGGER_MS,
  from = "up",
}: {
  children: ReactNode;
  base?: number;
  step?: number;
  from?: Direction;
}) {
  const items = Children.toArray(children).filter(isValidElement);
  return (
    <>
      {items.map((child, i) => (
        <Appear key={i} delay={base + i * step} from={from}>
          {child}
        </Appear>
      ))}
    </>
  );
}

/**
 * Counts a number up from its previous value to `value` with an ease-out, so
 * dashboard stats (listings, leads, views, earnings) tick into place instead of
 * snapping. Re-animates from the old value whenever `value` changes. Renders a
 * plain <Text>, so it takes `className`/`style` like any other label.
 */
export function CountUp({
  value,
  duration = 900,
  format = (n) => String(Math.round(n)),
  ...textProps
}: {
  value: number;
  duration?: number;
  format?: (n: number) => string;
} & TextProps) {
  const [n, setN] = useState(value);
  const from = useRef(0);

  useEffect(() => {
    const startVal = from.current;
    const startedAt = Date.now();
    let raf = 0;
    const tick = () => {
      const t = Math.min(1, (Date.now() - startedAt) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setN(startVal + (value - startVal) * eased);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        from.current = value;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <Text {...textProps}>{format(n)}</Text>;
}

const AReanimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Drop-in <Pressable> that springs down to `activeScale` (and optionally dims)
 * while pressed — the tactile counterpart to the haptics already fired on tap.
 * Use for cards, CTAs, and any sizeable touch target where `active:opacity`
 * alone feels flat.
 */
export function PressableScale({
  children,
  activeScale = 0.96,
  dim = false,
  style,
  onPressIn,
  onPressOut,
  ...rest
}: PressableProps & {
  activeScale?: number;
  dim?: boolean;
  style?: ViewStyle | ViewStyle[];
}) {
  const pressed = useSharedValue(0);
  const animStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: withSpring(1 - pressed.value * (1 - activeScale), PRESS_SPRING),
      },
    ],
    opacity: dim ? withTiming(1 - pressed.value * 0.18, { duration: 120 }) : 1,
  }));

  return (
    <AReanimatedPressable
      {...rest}
      onPressIn={(e) => {
        pressed.value = 1;
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        pressed.value = 0;
        onPressOut?.(e);
      }}
      style={[style, animStyle]}
    >
      {children as ReactNode}
    </AReanimatedPressable>
  );
}
