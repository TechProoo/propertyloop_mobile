import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/auth";
import { Alert } from "@/lib/dialog";
import savedSearchesService, {
  pickSavedSearchFilters,
  type SavedSearchFilters,
} from "@/api/services/savedSearches";

export function SaveSearchButton({ filters }: { filters: SavedSearchFilters }) {
  const { requireAuth } = useAuth();
  const [saving, setSaving] = useState(false);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const selected = pickSavedSearchFilters(filters);
  const key = JSON.stringify(selected);
  const saved = savedKey === key;
  const narrowed = Object.keys(selected).some((field) => field !== "sort");
  async function save() {
    if (!requireAuth("save this search")) return;
    setSaving(true);
    try {
      await savedSearchesService.create(selected);
      setSavedKey(key);
    } catch {
      Alert.alert(
        "Could not save search",
        "Check your connection and try again.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <View className="flex-row items-center justify-between gap-3 px-5 py-2">
      <Pressable
        onPress={save}
        disabled={saving || saved || !narrowed}
        accessibilityRole="button"
        className="flex-row items-center gap-2 rounded-full border border-line bg-white px-4 py-2.5"
        style={{ opacity: saving || !narrowed ? 0.5 : 1 }}
      >
        <Ionicons
          name={saved ? "checkmark-circle" : "bookmark-outline"}
          size={16}
          color="#1f6f43"
        />
        <Text className="text-[12px] font-sans-bold text-primary">
          {saving ? "Saving…" : saved ? "Search saved" : "Save this search"}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => router.push("/saved-searches" as Href)}
        accessibilityRole="button"
        className="py-2"
      >
        <Text className="text-[12px] font-sans-semibold text-primary">
          Saved searches
        </Text>
      </Pressable>
    </View>
  );
}
