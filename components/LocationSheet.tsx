import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  LOCATIONS,
  ALL_LOCATIONS_LABEL,
  setSelectedLocation,
} from "@/lib/location";
import { tapSelection } from "@/lib/haptics";

const PRIMARY = "#1f6f43";
const INK = "#1a2120";

interface Props {
  visible: boolean;
  /** Current selection token (null = All) — drives the active row. */
  selected: string | null;
  onClose: () => void;
}

type Row = { key: string; label: string; token: string | null };

const ROWS: Row[] = [
  { key: "__all__", label: ALL_LOCATIONS_LABEL, token: null },
  ...LOCATIONS.map((l) => ({ key: l.filter, label: l.label, token: l.filter })),
];

/**
 * Bottom-sheet location picker for the Home feed. Tapping a row commits the
 * choice to the shared store (which refilters the feed) and closes.
 */
export function LocationSheet({ visible, selected, onClose }: Props) {
  const choose = (token: string | null) => {
    tapSelection();
    setSelectedLocation(token);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Scrim — tap to dismiss */}
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }}
        onPress={onClose}
      />
      <View
        className="bg-cream rounded-t-3xl"
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          maxHeight: "75%",
        }}
      >
        <SafeAreaView edges={["bottom"]}>
          <View className="items-center pt-3 pb-1">
            <View
              className="rounded-full"
              style={{ width: 40, height: 4, backgroundColor: "#e1dcd3" }}
            />
          </View>

          <View className="flex-row items-center justify-between px-5 pt-2 pb-2">
            <Text className="text-ink font-sans-bold text-lg">
              Choose location
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={22} color={INK} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {ROWS.map((r) => {
              const active = r.token === selected;
              return (
                <Pressable
                  key={r.key}
                  onPress={() => choose(r.token)}
                  className="flex-row items-center justify-between px-5 py-3.5 active:opacity-70"
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={r.label}
                >
                  <View className="flex-row items-center gap-3">
                    <Ionicons
                      name={r.token === null ? "globe-outline" : "location-outline"}
                      size={20}
                      color={active ? PRIMARY : INK}
                    />
                    <Text
                      className={`text-[15px] ${
                        active
                          ? "font-sans-bold text-primary"
                          : "font-sans-medium text-ink"
                      }`}
                    >
                      {r.label}
                    </Text>
                  </View>
                  {active && (
                    <Ionicons name="checkmark" size={20} color={PRIMARY} />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
