import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Stack, router, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

const SPECIALTIES = [
  "Sales",
  "Rentals",
  "Shortlets",
  "Luxury",
  "Land",
  "Commercial",
  "New developments",
];
const MAX_SPECIALTIES = 3;

export default function AgentSetupScreen() {
  // Form state — every field except the photo upload, which is deferred.
  const [agencyName, setAgencyName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [languages, setLanguages] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [bio, setBio] = useState("");

  // For the avatar placeholder we'd normally derive initials from the user's
  // name. Since name isn't collected yet on this screen, fall back to "EA"
  // (matching the mockup) until we wire the multi-step state container.
  const initials = "EA";

  const toggleSpecialty = (s: string) => {
    setSpecialties((prev) => {
      if (prev.includes(s)) return prev.filter((x) => x !== s);
      if (prev.length >= MAX_SPECIALTIES) return prev;
      return [...prev, s];
    });
  };

  const canContinue = useMemo(
    () =>
      agencyName.trim() &&
      licenseNumber.trim() &&
      businessAddress.trim() &&
      yearsExperience.trim() &&
      specialties.length > 0,
    [agencyName, licenseNumber, businessAddress, yearsExperience, specialties],
  );

  const handleContinue = () => {
    if (!canContinue) return;
    // Pass everything onward as URL params so the eventual signup POST has
    // the full agent profile. Profile photo is excluded — uploads are
    // deferred until expo-image-picker is wired.
    router.push({
      pathname: "/signup",
      params: {
        role: "AGENT",
        agencyName: agencyName.trim(),
        licenseNumber: licenseNumber.trim(),
        businessAddress: businessAddress.trim(),
        yearsExperience: yearsExperience.trim(),
        languages: languages.trim(),
        specialties: specialties.join("|"),
        bio: bio.trim(),
      },
    } as Href);
  };

  return (
    <View className="flex-1 bg-[#f5f0eb]">
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1"
        >
          {/* Top bar — back / centred title / step counter */}
          <View className="flex-row items-center justify-between px-5 pt-2">
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              className="w-9 h-9 rounded-full bg-white/70 items-center justify-center"
            >
              <Text className="text-slate-700 text-xl">‹</Text>
            </Pressable>
            <Text className="text-slate-900 font-semibold text-sm">
              Agent setup
            </Text>
            <Text className="text-slate-500 text-xs font-medium w-12 text-right">
              Step 1 of 4
            </Text>
          </View>

          <ScrollView
            contentContainerClassName="px-5 pb-32"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Heading */}
            <Text className="text-slate-900 font-serif text-3xl mt-6 leading-[36px]">
              Tell us about <Text className="italic">your practice</Text>
            </Text>
            <Text className="text-slate-500 text-sm mt-2 leading-5">
              This information appears on your public agent profile. Buyers and
              renters see it before they reach out.
            </Text>

            {/* Profile photo */}
            <View className="flex-row items-center gap-3 mt-7">
              <Pressable className="w-16 h-16 rounded-full bg-amber-100 items-center justify-center border-2 border-amber-200 active:opacity-80">
                <Text className="text-amber-700 font-bold text-lg">
                  {initials}
                </Text>
              </Pressable>
              <View className="flex-1">
                <Text className="text-slate-900 font-semibold text-sm">
                  Profile photo
                </Text>
                <Text className="text-slate-500 text-xs mt-0.5">
                  Use a clear, friendly headshot
                </Text>
              </View>
            </View>

            {/* Agency name */}
            <View className="mt-6">
              <Field
                label="Agency name"
                value={agencyName}
                onChangeText={setAgencyName}
                placeholder="e.g. Loop Realty Lagos"
                autoCapitalize="words"
              />
            </View>

            {/* License — with verification pill */}
            <View className="mt-4">
              <View className="flex-row items-center justify-between mb-1.5">
                <Text className="text-slate-700 text-xs font-semibold">
                  Licence number · NIESV
                </Text>
                <View className="bg-amber-100 px-2 py-0.5 rounded-full">
                  <Text className="text-amber-700 text-[10px] font-bold">
                    Will be verified
                  </Text>
                </View>
              </View>
              <TextInput
                value={licenseNumber}
                onChangeText={setLicenseNumber}
                placeholder="e.g. NIESV/L/3492-A"
                placeholderTextColor="#94a3b8"
                autoCapitalize="characters"
                className="bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-900 text-base"
              />
            </View>

            {/* Business address */}
            <View className="mt-4">
              <Field
                label="Business address"
                value={businessAddress}
                onChangeText={setBusinessAddress}
                placeholder="e.g. 14 Adeola Odeku St, V.I., Lagos"
                autoCapitalize="words"
              />
            </View>

            {/* Years + Languages — two columns */}
            <View className="flex-row gap-3 mt-4">
              <View className="flex-1">
                <Field
                  label="Years experience"
                  value={yearsExperience}
                  onChangeText={setYearsExperience}
                  placeholder="e.g. 8"
                  keyboardType="number-pad"
                />
              </View>
              <View className="flex-1">
                <Field
                  label="Languages"
                  value={languages}
                  onChangeText={setLanguages}
                  placeholder="EN, YO"
                  autoCapitalize="characters"
                />
              </View>
            </View>

            {/* Specialty chips */}
            <View className="mt-5">
              <Text className="text-slate-700 text-xs font-semibold mb-2">
                Speciality · pick up to {MAX_SPECIALTIES}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {SPECIALTIES.map((s) => {
                  const selected = specialties.includes(s);
                  const disabled =
                    !selected && specialties.length >= MAX_SPECIALTIES;
                  return (
                    <Pressable
                      key={s}
                      onPress={() => toggleSpecialty(s)}
                      disabled={disabled}
                      className={`px-4 py-2 rounded-full border ${
                        selected
                          ? "bg-slate-900 border-slate-900"
                          : disabled
                            ? "bg-white border-slate-200 opacity-40"
                            : "bg-white border-slate-200"
                      } active:opacity-80`}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          selected ? "text-white" : "text-slate-700"
                        }`}
                      >
                        {s}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Short bio */}
            <View className="mt-5">
              <Text className="text-slate-700 text-xs font-semibold mb-1.5">
                Short bio
              </Text>
              <TextInput
                value={bio}
                onChangeText={setBio}
                placeholder="A line or two on your focus areas, deals you've closed, why buyers like working with you."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 text-base min-h-[110px]"
              />
            </View>

            <Text className="text-slate-500 text-[11px] text-center mt-4 leading-4">
              Listed agents must not act as buyer — we verify both ends to keep
              negotiations honest.
            </Text>
          </ScrollView>

          {/* Sticky CTA */}
          <View className="absolute bottom-0 left-0 right-0 px-5 pb-6 pt-3 bg-[#f5f0eb]">
            <Pressable
              onPress={handleContinue}
              disabled={!canContinue}
              className="bg-emerald-700 rounded-full py-4 items-center active:opacity-80 disabled:opacity-50"
            >
              <Text className="text-white font-semibold text-base">
                Continue to verification
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

type FieldProps = React.ComponentProps<typeof TextInput> & { label: string };

function Field({ label, ...inputProps }: FieldProps) {
  return (
    <View>
      <Text className="text-slate-700 text-xs font-semibold mb-1.5">
        {label}
      </Text>
      <TextInput
        {...inputProps}
        placeholderTextColor="#94a3b8"
        className="bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-900 text-base"
      />
    </View>
  );
}
