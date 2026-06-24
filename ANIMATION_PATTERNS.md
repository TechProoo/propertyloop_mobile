# Animation Patterns — PropertyLoop Mobile

Complete guide to the motion system and how to apply animations across the app.

## Overview

The app uses **react-native-reanimated** for all animations, running on the UI thread for 120fps safety. All animations follow a unified spring physics (`SPRING`, `PRESS_SPRING`) to maintain visual consistency.

---

## Phase 1: Foundational Components ✅

**Location:** `components/anim/`

All Phase 1 components are exported from `components/anim/index.ts` and ready to use.

### 1. **SharedElementTransition (Hero Animation)**
File: `components/anim/SharedElement.tsx`

Seamlessly expand a card into a detail page hero image.

**API:**
```typescript
<SharedElementProvider>        {/* Wrap your whole app/router */}
  <SharedElementSource id="property-123">
    <Card />                   {/* Becomes tappable source */}
  </SharedElementSource>
  
  {/* Elsewhere (detail page): */}
  <SharedElementDestination id="property-123">
    <HeroImage />              {/* Animates in from source position */}
  </SharedElementDestination>
</SharedElementProvider>
```

**When to use:**
- Card → detail page transitions
- Image → gallery view
- List item → full page

**Notes:**
- Source must render before destination is navigated to (same route/provider hierarchy)
- ID must match between source and destination
- Destination auto-animates on layout (300ms duration)

---

### 2. **MorphingTabIndicator (Nav Morphing)**
File: `components/anim/MorphingTabBar.tsx`

Smoothly morph the bottom navigation indicator as user switches tabs.

**API:**
```typescript
// Line indicator (under-line style)
<MorphingTabIndicator
  activeIndex={currentTab}
  tabCount={5}
  containerWidth={screenWidth}
  color="#1f6f43"
  height={3}
/>

// Pill indicator (behind-icon style)
<MorphingPillIndicator
  activeIndex={currentTab}
  tabCount={5}
  containerWidth={screenWidth}
/>
```

**Where to integrate:**
- Replace flat tab bar in `(tabs)/_layout.tsx`, `(agent-tabs)/_layout.tsx`, `(vendor-tabs)/_layout.tsx`
- Layer on top of existing tab bar or customize tab rendering

---

### 3. **CarouselContainer (Swipe Carousel)**
File: `components/anim/CarouselContainer.tsx`

Horizontally scrollable carousel with momentum-based snapping and animated dot indicators.

**API:**
```typescript
<CarouselContainer
  data={properties}
  renderItem={(prop, i) => <PropertyCard property={prop} />}
  itemWidth={280}                    // Width of each card
  showDots={true}
  dotsActiveColor="#1f6f43"
  gap={12}
  onSnapToItem={(index) => console.log('Snapped to', index)}
/>
```

**When to use:**
- Hero carousels (Recommended properties)
- Image galleries on detail pages
- Agent featured listings
- Vendor service showcase

**Features:**
- Auto-snaps to nearest item on momentum scroll
- Animated dot indicators (scale + fade based on proximity)
- Responsive to both iOS pan and Android scroll
- Customizable dimensions and colors

---

### 4. **HeaderTransform (Scroll-Driven Morphing)**
File: `components/anim/HeaderTransform.tsx`

Greeting/header collapses and fades as user scrolls down.

**API:**
```typescript
const { scrollOffset, handleScroll } = useHeaderTransform();

<Animated.FlatList
  onScroll={handleScroll}
  scrollEventThrottle={16}
  ...
/>

<HeaderTransform
  scrollOffset={scrollOffset}
  collapsedAt={60}              // Scroll threshold (px)
  minHeight={80}                // Final height when collapsed
  maxHeight={140}               // Initial height when expanded
>
  <Text>Good afternoon, Ahmed</Text>
  <Text>Your listings, stats, etc.</Text>
</HeaderTransform>
```

**When to use:**
- Dashboard greetings
- Stats headers that compact on scroll
- Any header that shouldn't take space when scrolling

**LayerFades:** Use `<HeaderFadeLayer layer={0}>` to stagger fades:
```typescript
<HeaderTransform scrollOffset={scrollOffset}>
  <HeaderFadeLayer scrollOffset={scrollOffset} layer={0}>
    <Greeting />          {/* Fades first */}
  </HeaderFadeLayer>
  <HeaderFadeLayer scrollOffset={scrollOffset} layer={1}>
    <Stats />             {/* Fades after 15px more scroll */}
  </HeaderFadeLayer>
</HeaderTransform>
```

---

### 5. **Staggered Entrance (Cascade In)**
File: `hooks/useStaggeredEntrance.ts`

Hook to generate cascading animation delays for list items.

**API:**
```typescript
const delays = useStaggeredEntrance(items.length);

items.map((item, i) => (
  <Appear key={item.id} delay={delays[i]}>
    <Card item={item} />
  </Appear>
))
```

**Default behavior:**
- Base delay: 40ms (before first item)
- Step delay: 55ms (between each item)
- Fully configurable:

```typescript
const delays = useStaggeredEntrance(
  items.length,
  baseDelay = 100,   // Start 100ms after mount
  stepDelay = 80     // Each item waits 80ms after previous
);
```

---

## Existing Components (Already in Use)

### **Appear** (Entrance animation)
Fade + rise from below. Already used throughout the app.

```typescript
<Appear delay={0}>
  <View>Hello</View>
</Appear>
```

### **Stagger** (Auto-stagger children)
Auto-staggers direct children with cascade timing.

```typescript
<Stagger>
  <Card />
  <Card />
  <Card />
</Stagger>
```

### **PressableScale** (Touch feedback)
Spring-based press feedback. Already applied to cards/buttons.

```typescript
<PressableScale activeScale={0.96}>
  <Text>Tap me</Text>
</PressableScale>
```

### **CountUp** (Number animation)
Animates numbers up from previous value. Already used in dashboards.

```typescript
<CountUp value={listings.length} />
```

### **SaveHeart** (Like button)
Heart pops + ring burst on save. Already on property cards.

### **RevealScrollView** (Smart reveal)
Auto-fades/reveals content as user scrolls. Already in use on home, explore, etc.

---

## Phase 2: Screen Integration

### **High-Impact Screens (Priority Order)**

#### 1. **Buyer Home** (`app/(tabs)/index.tsx`)
**To add:**
- SharedElement sources on cards
- Better stagger timing for card grid
- Carousel for "Recommended" section (if exists)

**Implementation:**
```typescript
import {
  SharedElementSource,
  useStaggeredEntrance,
} from "@/components/anim";

// Wrap cards in SharedElementSource
<SharedElementSource id={`property-${listing.id}`}>
  <HomeCard listing={listing} />
</SharedElementSource>

// Use staggered entrance for grid
const delays = useStaggeredEntrance(filtered.length);
filtered.map((h, i) => (
  <Appear delay={delays[i]} key={h.id}>
    <HomeCard listing={h} />
  </Appear>
))
```

#### 2. **Property Detail** (`app/property/[id].tsx`)
**To add:**
- SharedElement destination for hero image
- Carousel for gallery
- Staggered sections (description, agent, reviews)

**Implementation:**
```typescript
import {
  SharedElementDestination,
  CarouselContainer,
} from "@/components/anim";

// Hero destination
<SharedElementDestination id={`property-${propertyId}`}>
  <Image source={property.coverImage} />
</SharedElementDestination>

// Image gallery carousel
<CarouselContainer
  data={property.images}
  renderItem={(img) => <Image source={img} />}
  itemWidth={width - 40}
/>

// Staggered sections
<Appear delay={stagger(0)}>
  <Description />
</Appear>
<Appear delay={stagger(1)}>
  <AgentCard />
</Appear>
```

#### 3. **Agent Dashboard** (`app/(agent-tabs)/index.tsx`)
**To add:**
- Header collapse on scroll
- Stat cards staggered entrance
- Listings grid cascade

**Implementation:**
```typescript
import { HeaderTransform, useHeaderTransform } from "@/components/anim";

const { scrollOffset, handleScroll } = useHeaderTransform();

// ... apply handleScroll to FlatList

<HeaderTransform scrollOffset={scrollOffset} minHeight={80}>
  <GreetingAndStats />
</HeaderTransform>

// Stats cards
const statsDelays = useStaggeredEntrance(stats.length);
stats.map((stat, i) => (
  <Appear delay={statsDelays[i]}>
    <StatCard stat={stat} />
  </Appear>
))
```

#### 4. **Vendor Dashboard** (`app/(vendor-tabs)/index.tsx`)
Same pattern as agent dashboard.

#### 5. **Tab Navigation** (All three layouts)
**To add:**
- MorphingTabIndicator overlay

**Implementation:**
```typescript
import { useRoute } from "@react-navigation/native";
import { MorphingTabIndicator } from "@/components/anim";

// In the Tabs screenOptions:
<MorphingTabIndicator
  activeIndex={getTabIndex(route.name)}
  tabCount={5}
  containerWidth={screenWidth}
/>
```

#### 6. **Carousels** (Recommended cards, Featured listings, etc.)
**Find carousel sections and wrap:**
```typescript
import { CarouselContainer } from "@/components/anim";

<CarouselContainer
  data={recommendedProperties}
  renderItem={(prop) => <Card property={prop} />}
  itemWidth={280}
  showDots
/>
```

---

## Animation Constants & Tuning

**SPRING** (Primary animation):
```typescript
const SPRING = { damping: 18, stiffness: 170, mass: 0.9 };
```
Used for: Appear, Stagger, HeaderTransform, MorphingTabBar, etc.
Feel: Smooth, gentle bounce, settles naturally.

**PRESS_SPRING** (Touch feedback):
```typescript
const PRESS_SPRING = { damping: 15, stiffness: 320, mass: 0.6 };
```
Used for: PressableScale press feedback.
Feel: Snappy, settles fast.

**STAGGER_MS** (Cascade timing):
```typescript
const STAGGER_MS = 55; // ms between each item
```
Recommended range: 40–80ms. Faster (<40ms) feels jittery, slower (>80ms) feels sluggish.

---

## Performance Best Practices

1. **Use UI-thread animations only** — All components here are Reanimated (UI thread). Never animate style changes via state.

2. **Avoid over-animation** — Not every view needs to animate. Reserve animations for:
   - Entrance (mount)
   - User interaction (press, swipe)
   - Navigation (screen change)
   - State change (alert, expand/collapse)

3. **Lazy-load lists carefully** — FlatList virtualization can conflict with stagger timing. Test on real devices, not simulators.

4. **Profile with DevTools** — Use React DevTools Profiler to spot dropped frames. Target 60fps on real devices.

5. **Test accessibility** — Ensure `prefers-reduced-motion` is respected (see Accessibility section below).

---

## Accessibility

### Reduced Motion Support

Add this hook to disable animations when user prefers reduced motion:

```typescript
// hooks/useReducedMotion.ts
import { AccessibilityInfo, useAccessibilityInfo } from "react-native";

export function useAnimationDuration(durationMs: number = 460): number {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled().then(
      (enabled) => setPrefersReducedMotion(enabled)
    );
  }, []);

  return prefersReducedMotion ? 0 : durationMs;
}
```

Then use in `Appear`:
```typescript
const duration = useAnimationDuration();
<Appear duration={duration}>
  <View>Hi</View>
</Appear>
```

---

## Troubleshooting

### **Animation stutters or jank**
- Check: Are you animating large lists? Reduce item count or use FlatList virtualization.
- Check: Is something else running on JS thread (API call, filter, etc.)? Move to useEffect with separate state.
- Check: Use Reanimated Profiler to measure frame time.

### **Animation doesn't play**
- Check: Is component mounted? Appear only animates on mount.
- Check: Is duration 0? Check reduced-motion hook.
- Check: Is animation being interrupted by navigation? Ensure timing < screen transition duration.

### **Carousel doesn't snap**
- Check: itemWidth + gap must match your actual card dimensions.
- Check: Is FlatList scrollEnabled={true}?
- Check: Test on real device (simulator scroll is unreliable).

### **SharedElement doesn't work**
- Check: Is SharedElementProvider wrapping both source and destination? (Usually wrap entire app.)
- Check: IDs match between source and destination.
- Check: Is source rendered before navigation happens?

---

## Future Enhancements

- [ ] Page transition animations (native Navigator.pop/push style)
- [ ] Gesture-driven animations (swipe to dismiss, drag to expand)
- [ ] SVG morphing for icons
- [ ] Text highlight animations (appear → fade on specific words)
- [ ] Physics-based scroll snap (decay deceleration curve)

---

## References

- **react-native-reanimated**: https://docs.swmansion.com/react-native-reanimated/
- **SPRING physics**: https://docs.swmansion.com/react-native-reanimated/docs/animations/withSpring
- **Expo Router**: https://docs.expo.dev/routing/introduction/
