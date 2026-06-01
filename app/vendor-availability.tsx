import { useState } from "react";
import { Alert, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { VENDOR_AVAILABILITY } from "@/mocks/vendor";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

export default function VendorAvailabilityScreen() {
  const [accepting, setAccepting] = useState(VENDOR_AVAILABILITY.acceptingBookings);
  const [schedule, setSchedule]   = useState(VENDOR_AVAILABILITY.schedule);
  const [maxJobs, setMaxJobs]     = useState(VENDOR_AVAILABILITY.maxJobsPerDay);
  const [blackouts, setBlackouts] = useState(VENDOR_AVAILABILITY.blackoutDates);

  const toggleDay = (day: string) =>
    setSchedule((arr) =>
      arr.map((r) => (r.day === day ? { ...r, on: !r.on, hours: !r.on ? "8:00 AM – 6:00 PM" : "Off" } : r)),
    );

  const save = () =>
    Alert.alert("Availability saved", "Customers will see the new hours immediately.", [
      { text: "OK", onPress: () => router.back() },
    ]);

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top bar */}
      <View className="flex-row items-center justify-between px-5 pt-1 pb-2">
        <Pressable
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full bg-cream-2 items-center justify-center"
        >
          <Ionicons name="chevron-back" size={18} color={INK_2} />
        </Pressable>
        <Text className="text-[15px] font-sans-bold text-ink">Availability</Text>
        <Pressable onPress={save} hitSlop={8}>
          <Text className="text-[13px] font-sans-bold text-primary">Save</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Status */}
        <View
          className="rounded-2xl px-4 py-3.5 flex-row items-center gap-3"
          style={{ backgroundColor: "#e3efe7" }}
        >
          <View
            style={{
              width: 10, height: 10, borderRadius: 5,
              backgroundColor: accepting ? PRIMARY : INK_3,
            }}
          />
          <View className="flex-1">
            <Text
              className="text-[14px] font-sans-bold"
              style={{ color: PRIMARY_INK }}
            >
              {accepting ? "Accepting bookings" : "Not accepting"}
            </Text>
            <Text
              className="text-[11.5px]"
              style={{ color: PRIMARY_INK, opacity: 0.7 }}
            >
              {accepting
                ? "You appear in search and can get requests"
                : "You're hidden from search until you toggle back on"}
            </Text>
          </View>
          <Switch
            value={accepting}
            onValueChange={setAccepting}
            trackColor={{ false: "#cbd5e1", true: PRIMARY }}
            thumbColor="#ffffff"
          />
        </View>

        {/* Working hours */}
        <Label className="mt-6">Working hours</Label>
        <View
          className="bg-white rounded-2xl overflow-hidden border-line mt-2"
          style={{ borderWidth: 0.5 }}
        >
          {schedule.map((row, i, arr) => (
            <View
              key={row.day}
              className="flex-row items-center gap-3 px-3.5 py-3"
              style={{
                borderBottomWidth: i === arr.length - 1 ? 0 : 0.5,
                borderBottomColor: "#ece6df",
              }}
            >
              <Switch
                value={row.on}
                onValueChange={() => toggleDay(row.day)}
                trackColor={{ false: "#cbd5e1", true: PRIMARY }}
                thumbColor="#ffffff"
              />
              <Text
                className="flex-1 text-[13.5px] font-sans-bold"
                style={{ color: row.on ? "#1a2120" : INK_3 }}
              >
                {row.day}
              </Text>
              <Text
                className="text-[12.5px] font-sans-semibold"
                style={{ color: row.on ? INK_2 : INK_3 }}
              >
                {row.hours}
              </Text>
            </View>
          ))}
        </View>

        {/* Limits */}
        <Label className="mt-6">Limits</Label>
        <View
          className="bg-white rounded-2xl overflow-hidden border-line mt-2"
          style={{ borderWidth: 0.5 }}
        >
          <View className="flex-row items-center justify-between px-3.5 py-3" style={{ borderBottomWidth: 0.5, borderBottomColor: "#ece6df" }}>
            <Text className="text-[13.5px] font-sans-semibold text-ink">Max jobs per day</Text>
            <View className="flex-row items-center gap-3">
              <Pressable
                onPress={() => setMaxJobs((n) => Math.max(1, n - 1))}
                className="w-7 h-7 rounded-full items-center justify-center"
                style={{ borderWidth: 1, borderColor: "#e1dcd3", backgroundColor: "#ffffff" }}
              >
                <Ionicons name="remove" size={14} color={INK_2} />
              </Pressable>
              <Text className="font-serif text-ink" style={{ fontSize: 17, minWidth: 16, textAlign: "center" }}>
                {maxJobs}
              </Text>
              <Pressable
                onPress={() => setMaxJobs((n) => n + 1)}
                className="w-7 h-7 rounded-full items-center justify-center"
                style={{ borderWidth: 1, borderColor: "#e1dcd3", backgroundColor: "#ffffff" }}
              >
                <Ionicons name="add" size={14} color={INK_2} />
              </Pressable>
            </View>
          </View>
          <View className="flex-row items-center justify-between px-3.5 py-3">
            <Text className="text-[13.5px] font-sans-semibold text-ink">Response commitment</Text>
            <Text className="text-[13px] font-sans-bold text-primary">
              {VENDOR_AVAILABILITY.responseCommitment}
            </Text>
          </View>
        </View>

        {/* Blackouts */}
        <Label className="mt-6">Time off</Label>
        <View className="flex-row flex-wrap gap-2 mt-2">
          {blackouts.map((b) => (
            <View
              key={b}
              className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
              style={{ backgroundColor: "#1a2120" }}
            >
              <Text className="text-[12px] font-sans-bold text-white">{b}</Text>
              <Pressable
                onPress={() => setBlackouts((arr) => arr.filter((x) => x !== b))}
                hitSlop={6}
              >
                <Ionicons name="close" size={11} color="#ffffff" />
              </Pressable>
            </View>
          ))}
          <Pressable
            onPress={() => Alert.alert("Block dates", "Calendar picker coming soon.")}
            className="flex-row items-center gap-1.5 rounded-full px-3.5 py-1.5"
            style={{
              borderWidth: 1, borderStyle: "dashed", borderColor: "#d3cdc1",
              backgroundColor: "transparent",
            }}
          >
            <Ionicons name="add" size={13} color={INK_2} />
            <Text className="text-[12.5px] font-sans-bold text-ink-2">Block dates</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Text className={`text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase ${className ?? ""}`}>
      {children}
    </Text>
  );
}
