import { Pressable, Text, View } from "react-native";

export interface SegmentedOption<T extends string> {
  id: T;
  label: string;
}

/**
 * Two-or-more option segmented control (iOS-style): a pill track with the
 * active segment raised on white. Used on the agent/vendor Profile tab to flip
 * between the "Profile" dashboard and "Settings".
 */
export function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View
      className="flex-row rounded-full p-1"
      style={{ backgroundColor: "#ece9e3" }}
    >
      {options.map((o) => {
        const on = o.id === value;
        return (
          <Pressable
            key={o.id}
            onPress={() => onChange(o.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            className="flex-1 items-center justify-center rounded-full py-2"
            style={
              on
                ? {
                    backgroundColor: "#ffffff",
                    shadowColor: "#000",
                    shadowOpacity: 0.08,
                    shadowRadius: 6,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: 2,
                  }
                : undefined
            }
          >
            <Text
              className="text-[13px] font-sans-bold"
              style={{ color: on ? "#1a2120" : "#7f857f" }}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
