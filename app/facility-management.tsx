// Facility Management — an information screen, mirroring the website page.
//
// PropertyLoop doesn't run facility management itself; Ultramodern Engineering
// Limited does, as a partner. So this screen explains the offer and hands the
// reader off to Ultramodern by phone or email. It deliberately does not book
// anything: facility management is surveyed and then quoted, which the fixed/
// from service model behind Service Loop can't represent honestly.
//
// Copy and figures come from Ultramodern's own corporate profile — nothing here
// is invented. Photography streams from the website (see FacilityGallery).
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { Stack, router } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Appear } from "@/components/anim";
import { FacilityGallery } from "@/components/facility/FacilityGallery";
import { tapLight } from "@/lib/haptics";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const INK_2 = "#4d524f";

const CDN = "https://propertyloop.ng/ultramodern";

const CONTACT = {
  phone: "+234 803 354 5484",
  phoneTel: "+2348033545484",
  email: "oyewo@ultramoderneng.com",
  emailAlt: "oyewoyinusa@yahoo.com",
  website: "https://www.ultramoderneng.com",
  address: "No 33, Fatai Irawo Street, Ajao Estate, Lagos.",
  hours: "Mon–Fri: 8AM–5PM · Sat: 10AM–2PM",
};

type IonName = keyof typeof Ionicons.glyphMap;

// Blurbs are Ultramodern's own service copy, kept verbatim.
const DISCIPLINES: {
  name: string;
  icon: IonName;
  image: string;
  blurb: string;
  scope: string[];
}[] = [
  {
    name: "HVAC",
    icon: "snow-outline",
    image: "pdf-ccr-chillers.jpeg",
    blurb:
      "HVAC system solutions tailored to your needs, maximizing energy efficiency and minimizing costs.",
    scope: ["Chilled water systems", "G.I ducting", "Variable air volume"],
  },
  {
    name: "Plumbing",
    icon: "water-outline",
    image: "plumbing.jpg",
    blurb:
      "Our specialty plumbing solutions are designed with efficiency, functionality, and longevity in mind.",
    scope: ["Pump rooms", "Drainage", "Water treatment", "LPG gas systems"],
  },
  {
    name: "Fire Safety",
    icon: "flame-outline",
    image: "fire.jpg",
    blurb:
      "Our Fire Fighting solutions stop flames at the source, decreasing risk of the fire spreading.",
    scope: ["Detection & alarms", "Sprinklers", "Hydrants", "Pump house"],
  },
  {
    name: "Electrical",
    icon: "flash-outline",
    image: "pdf-substation.jpeg",
    blurb:
      "We are safety conscious and fully strap our engineers with state of the art safety gears on field duty.",
    scope: ["High & medium voltage", "Low voltage", "ELV", "BMS / DDC"],
  },
];

const COVERS: { icon: IonName; title: string; detail: string }[] = [
  {
    icon: "calendar-outline",
    title: "Planned preventive maintenance",
    detail:
      "A dated service calendar per asset — chillers, pumps, panels, generators, sprinklers — so kit is serviced before it fails.",
  },
  {
    icon: "pulse-outline",
    title: "Reactive callout & repairs",
    detail:
      "One number for every breakdown on the property, across all four disciplines.",
  },
  {
    icon: "shield-checkmark-outline",
    title: "Fire & safety compliance",
    detail:
      "Detection, sprinkler and pump-house checks documented to international standard.",
  },
  {
    icon: "document-text-outline",
    title: "Logged to the Property Logbook",
    detail:
      "Every visit and repair is written into the property's record, so the history follows the building.",
  },
];

const SECTORS = [
  "Federal & State Governments",
  "Banking Industry",
  "Healthcare & Hospitals",
  "Hotels & Leisure",
  "Real Estate",
  "Oil & Gas",
];

const PROJECTS: { file: string; name: string; where: string }[] = [
  { file: "p1-radisson.jpeg", name: "Radisson Collection", where: "Ikoyi, Lagos" },
  { file: "pdf-dangote-ducting.jpeg", name: "Dangote Fertilizer", where: "Ibeju-Lekki" },
  { file: "p8-greystone.jpg", name: "Greystone Tower", where: "VI, Lagos" },
  { file: "p2-chelsea.jpeg", name: "Chelsea Hotel", where: "Abuja" },
];

const STATS = [
  { value: "30+", label: "Projects delivered" },
  { value: "21+", label: "Years in MEP" },
  { value: "6", label: "Sectors served" },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text
      className="text-[11px] font-sans-bold text-primary tracking-widest uppercase mt-8"
      style={{ letterSpacing: 1.2 }}
    >
      {children}
    </Text>
  );
}

export default function FacilityManagementScreen() {
  const insets = useSafeAreaInsets();

  const call = () => {
    tapLight();
    Linking.openURL(`tel:${CONTACT.phoneTel}`).catch(() => {});
  };
  const email = (address: string) => {
    tapLight();
    Linking.openURL(
      `mailto:${address}?subject=${encodeURIComponent("Facility management enquiry")}`,
    ).catch(() => {});
  };

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top bar */}
      <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Close"
          className="w-9 h-9 rounded-full bg-cream-2 items-center justify-center"
        >
          <Ionicons name="close" size={18} color={INK_2} />
        </Pressable>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 150 + insets.bottom,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <Appear>
          <View
            className="rounded-3xl overflow-hidden bg-ink"
            style={{ height: 230 }}
          >
            <Image
              source={`${CDN}/site-3.jpg`}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              transition={500}
              cachePolicy="disk"
            />
            <LinearGradient
              colors={["rgba(26,33,32,0.15)", "rgba(26,33,32,0.9)"]}
              style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
            />
            <View className="absolute left-4 right-4 bottom-4">
              <View
                className="self-start rounded-full px-3 py-1.5 mb-2"
                style={{ backgroundColor: "rgba(255,255,255,0.18)" }}
              >
                <Text className="text-white font-sans-bold text-[10px] tracking-widest uppercase">
                  Facility Management
                </Text>
              </View>
              <Text
                className="font-serif text-white"
                style={{ fontSize: 27, letterSpacing: -0.6, lineHeight: 31 }}
              >
                Buildings that{" "}
                <Text className="font-serif-italic">run properly</Text>
              </Text>
            </View>
          </View>
        </Appear>

        <Text className="text-[13.5px] text-ink-2 mt-4 leading-5">
          Cooling, water, fire and power are what actually take a building out of
          service. PropertyLoop&apos;s facility management keeps all four under one
          contract, delivered by{" "}
          <Text className="font-sans-bold text-ink">
            Ultramodern Engineering Limited
          </Text>
          .
        </Text>

        {/* Stats */}
        <View className="flex-row gap-2 mt-4">
          {STATS.map((s) => (
            <View
              key={s.label}
              className="flex-1 rounded-2xl px-3 py-3 items-center"
              style={{ backgroundColor: "#e3efe7" }}
            >
              <Text
                className="font-serif text-primary-ink"
                style={{ fontSize: 21, letterSpacing: -0.4 }}
              >
                {s.value}
              </Text>
              <Text
                className="text-[10.5px] text-ink-2 mt-0.5 text-center leading-3.5"
                numberOfLines={2}
              >
                {s.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Partner */}
        <SectionLabel>Delivered by</SectionLabel>
        <View
          className="mt-2 bg-white rounded-2xl px-4 py-4 border-line"
          style={{ borderWidth: 0.5 }}
        >
          <Image
            source={`${CDN}/logo.jpeg`}
            style={{ width: 150, height: 42 }}
            contentFit="contain"
            transition={300}
            cachePolicy="disk"
          />
          <Text className="text-[13px] text-ink-2 mt-3 leading-5">
            An incorporated electromechanical company and a leading MEP
            contractor in Nigeria, working across government, banking,
            healthcare, hospitality, real estate and oil &amp; gas.
          </Text>
          <View className="flex-row flex-wrap gap-1.5 mt-3">
            {SECTORS.map((s) => (
              <View
                key={s}
                className="rounded-full px-2.5 py-1"
                style={{ backgroundColor: "#f0f0f0" }}
              >
                <Text className="text-[10.5px] text-ink-2">{s}</Text>
              </View>
            ))}
          </View>
          <Pressable
            onPress={() => {
              tapLight();
              Linking.openURL(CONTACT.website).catch(() => {});
            }}
            className="flex-row items-center gap-1.5 mt-3.5 active:opacity-70"
            accessibilityRole="link"
          >
            <Text className="text-[12.5px] font-sans-bold text-primary">
              ultramoderneng.com
            </Text>
            <Ionicons name="open-outline" size={13} color={PRIMARY} />
          </Pressable>
        </View>

        {/* Disciplines */}
        <SectionLabel>Four systems, one contract</SectionLabel>
        <View className="mt-2 gap-3">
          {DISCIPLINES.map((d, i) => (
            <Appear key={d.name} delay={i * 50}>
              <View
                className="bg-white rounded-2xl overflow-hidden border-line"
                style={{ borderWidth: 0.5 }}
              >
                <View style={{ height: 120 }}>
                  <Image
                    source={`${CDN}/${d.image}`}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                    transition={400}
                    cachePolicy="disk"
                  />
                  <LinearGradient
                    colors={["transparent", "rgba(26,33,32,0.75)"]}
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      bottom: 0,
                      height: 70,
                    }}
                  />
                  <View className="absolute left-3.5 bottom-3 flex-row items-center gap-2">
                    <Ionicons name={d.icon} size={16} color="#ffffff" />
                    <Text className="text-white font-sans-bold text-[14px]">
                      {d.name}
                    </Text>
                  </View>
                </View>
                <View className="px-4 py-3.5">
                  <Text className="text-[12.5px] text-ink-2 leading-5">
                    {d.blurb}
                  </Text>
                  <View className="flex-row flex-wrap gap-1.5 mt-2.5">
                    {d.scope.map((s) => (
                      <View
                        key={s}
                        className="rounded-full px-2.5 py-1"
                        style={{ backgroundColor: "#e3efe7" }}
                      >
                        <Text className="text-[10.5px] text-primary-ink">
                          {s}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </Appear>
          ))}
        </View>

        {/* What a contract covers */}
        <SectionLabel>What a contract covers</SectionLabel>
        <View className="mt-2 gap-3.5">
          {COVERS.map((c) => (
            <View key={c.title} className="flex-row gap-3.5">
              <View className="w-11 h-11 rounded-xl bg-primary-soft items-center justify-center">
                <Ionicons name={c.icon} size={20} color={PRIMARY_INK} />
              </View>
              <View className="flex-1">
                <Text className="text-[14px] font-sans-bold text-ink">
                  {c.title}
                </Text>
                <Text className="text-[12.5px] text-ink-2 mt-0.5 leading-5">
                  {c.detail}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Live maintenance contract — the strongest proof point */}
        <View
          className="mt-6 rounded-2xl px-4 py-3.5 flex-row gap-3"
          style={{ backgroundColor: "#e3efe7" }}
        >
          <Ionicons
            name="ribbon-outline"
            size={18}
            color={PRIMARY_INK}
            style={{ marginTop: 1 }}
          />
          <View className="flex-1">
            <Text className="text-[12.5px] font-sans-bold text-primary-ink">
              Already running a live maintenance contract
            </Text>
            <Text
              className="text-[11.5px] mt-1 leading-4"
              style={{ color: PRIMARY_INK, opacity: 0.78 }}
            >
              Ultramodern holds an ongoing annual maintenance contract covering
              all installations at the Dangote Fertilizer plant, alongside
              ongoing HVAC works at Dangote&apos;s Refinery. Long-run upkeep of live
              plant is work they do today.
            </Text>
          </View>
        </View>

        {/* Gallery */}
        <SectionLabel>From the field</SectionLabel>
        <Text className="text-[12.5px] text-ink-2 mt-1 mb-3 leading-5">
          Plant rooms, chiller yards and risers photographed on live sites.
        </Text>
        <FacilityGallery />

        {/* Track record */}
        <SectionLabel>Track record</SectionLabel>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingTop: 10, paddingRight: 8 }}
        >
          {PROJECTS.map((p) => (
            <View
              key={p.file}
              className="rounded-2xl overflow-hidden"
              style={{ width: 160, height: 120 }}
            >
              <Image
                source={`${CDN}/${p.file}`}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
                transition={350}
                cachePolicy="disk"
              />
              <LinearGradient
                colors={["transparent", "rgba(26,33,32,0.88)"]}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: 68,
                }}
              />
              <View className="absolute left-3 right-3 bottom-2.5">
                <Text
                  className="text-white font-sans-bold text-[12px]"
                  numberOfLines={1}
                >
                  {p.name}
                </Text>
                <Text
                  className="text-[10.5px]"
                  style={{ color: "rgba(255,255,255,0.7)" }}
                  numberOfLines={1}
                >
                  {p.where}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Contact */}
        <SectionLabel>Talk to the team</SectionLabel>
        <View
          className="mt-2 bg-white rounded-2xl px-4 py-4 border-line"
          style={{ borderWidth: 0.5 }}
        >
          <Text className="text-[14px] font-sans-bold text-ink">
            Engr Oyewo Yinusa
          </Text>
          <Text className="text-[11.5px] text-ink-3 mt-0.5">
            Chairman, Ultramodern Engineering Limited
          </Text>

          <Pressable
            onPress={() => email(CONTACT.email)}
            className="flex-row items-center gap-2.5 mt-3.5 active:opacity-70"
            accessibilityRole="button"
          >
            <Ionicons name="mail-outline" size={15} color={PRIMARY} />
            <Text className="text-[12.5px] text-ink-2">{CONTACT.email}</Text>
          </Pressable>
          <Pressable
            onPress={() => email(CONTACT.emailAlt)}
            className="flex-row items-center gap-2.5 mt-2 active:opacity-70"
            accessibilityRole="button"
          >
            <Ionicons name="mail-outline" size={15} color={PRIMARY} />
            <Text className="text-[12.5px] text-ink-2">{CONTACT.emailAlt}</Text>
          </Pressable>

          <View className="h-px bg-line my-3.5" />

          <View className="flex-row items-start gap-2.5">
            <Ionicons name="location-outline" size={15} color={PRIMARY} />
            <Text className="flex-1 text-[12px] text-ink-3 leading-4">
              {CONTACT.address}
            </Text>
          </View>
          <View className="flex-row items-start gap-2.5 mt-2">
            <Ionicons name="time-outline" size={15} color={PRIMARY} />
            <Text className="flex-1 text-[12px] text-ink-3 leading-4">
              {CONTACT.hours}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky call CTA */}
      <View
        className="absolute left-0 right-0 bottom-0 bg-cream"
        style={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: Math.max(insets.bottom, 20) + 10,
        }}
      >
        <Pressable
          onPress={call}
          className="bg-primary rounded-full flex-row items-center justify-center gap-2 active:opacity-80"
          style={{ paddingVertical: 16, minHeight: 52 }}
          accessibilityRole="button"
          accessibilityLabel={`Call Ultramodern Engineering on ${CONTACT.phone}`}
        >
          <Ionicons name="call" size={17} color="#ffffff" />
          <Text className="text-white font-sans-bold text-[15px]">
            Call {CONTACT.phone}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
