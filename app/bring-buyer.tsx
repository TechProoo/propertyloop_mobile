import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Appear, PressableScale } from "@/components/anim";
import { Alert } from "@/lib/dialog";
import partnersService from "@/api/services/partners";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const INK = "#1a2120";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";
const LINE = "#e1dcd3";
const GOLD = "#b9842c";

/** 11 local digits (08031234567) or +234 followed by 10. */
function isValidNgPhone(raw: string): boolean {
  const d = raw.replace(/\D/g, "");
  if (d.startsWith("234")) return d.length === 13;
  return d.length === 11 && d.startsWith("0");
}

/**
 * Register a buyer a partner has brought to PropertyLoop stock.
 *
 * The whole point of doing this on a phone is timing: the partner is standing
 * with the buyer at the property. Recording the introduction now is what makes
 * the commission attributable — after the sale it is just a claim.
 */
export default function BringBuyer() {
  const { listingId, title, price, commission } = useLocalSearchParams<{
    listingId: string;
    title?: string;
    price?: string;
    commission?: string;
  }>();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ duplicate: boolean } | null>(null);

  const valid = name.trim().length > 1 && isValidNgPhone(phone);

  async function submit() {
    if (!valid || submitting) return;
    setSubmitting(true);
    try {
      const res = await partnersService.introduce(listingId, {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        message: message.trim() || undefined,
      });
      setDone({ duplicate: res.duplicate });
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ??
        "Could not record the introduction. Check your connection and try again.";
      Alert.alert(
        "Not recorded",
        Array.isArray(msg) ? msg.join(", ") : String(msg),
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: "#f5f7f5" }}>
        <View className="flex-1 items-center justify-center px-6">
          <Appear from="fade">
            <View className="items-center">
              <View
                className="w-20 h-20 rounded-full items-center justify-center mb-5"
                style={{ backgroundColor: "#e3efe7" }}
              >
                <Ionicons name="checkmark" size={40} color={PRIMARY} />
              </View>
              <Text
                className="font-serif text-center"
                style={{ fontSize: 24, color: INK, letterSpacing: -0.4 }}
              >
                {done.duplicate ? "Already recorded" : "Buyer recorded"}
              </Text>
              <Text
                className="text-[13.5px] text-center mt-2.5"
                style={{ color: INK_2, lineHeight: 20 }}
              >
                {done.duplicate
                  ? `You had already introduced ${name.trim()} to this property. The original introduction still stands — you have not lost it, and nobody has taken it.`
                  : `${name.trim()} is now on record as your introduction. If this sale closes, the commission is attributed to you.`}
              </Text>

              <PressableScale
                onPress={() => router.back()}
                className="rounded-2xl mt-7 px-7 py-3.5"
                style={{ backgroundColor: PRIMARY }}
              >
                <Text className="text-white font-sans-bold text-[14px]">
                  Back to stock
                </Text>
              </PressableScale>
            </View>
          </Appear>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#f5f7f5" }}>
      {/* Header */}
      <View
        className="flex-row items-center gap-2 px-4 py-3"
        style={{ borderBottomWidth: 1, borderBottomColor: LINE }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          className="w-9 h-9 rounded-full items-center justify-center"
          style={{ backgroundColor: "#ffffff" }}
        >
          <Ionicons name="chevron-back" size={20} color={INK} />
        </Pressable>
        <Text className="font-sans-bold text-[16px]" style={{ color: INK }}>
          Bring a buyer
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* What they are introducing a buyer to */}
        {!!title && (
          <Appear from="fade">
            <View
              className="rounded-2xl p-4 mb-4"
              style={{ backgroundColor: PRIMARY_INK }}
            >
              <Text
                className="text-[10px] font-sans-bold tracking-widest uppercase"
                style={{ color: "#fcd34d" }}
              >
                PropertyLoop stock
              </Text>
              <Text
                className="font-serif text-white mt-1.5"
                style={{ fontSize: 18, lineHeight: 24 }}
                numberOfLines={2}
              >
                {title}
              </Text>
              <View className="flex-row items-center gap-2 mt-2">
                {!!price && (
                  <Text className="text-[13px] text-white/80">{price}</Text>
                )}
                {!!commission && (
                  <>
                    <Text className="text-white/40">·</Text>
                    <Text
                      className="text-[12.5px] font-sans-bold"
                      style={{ color: "#fcd34d" }}
                    >
                      {commission}% to you
                    </Text>
                  </>
                )}
              </View>
            </View>
          </Appear>
        )}

        <Field label="Buyer's name" hint="As they would give it to the agent">
          <Input value={name} onChangeText={setName} placeholder="Full name" />
        </Field>

        <Field
          label="Phone number"
          hint="How the agent reaches them. Nigerian mobile."
        >
          <Input
            value={phone}
            onChangeText={setPhone}
            placeholder="0803 000 0000"
            keyboardType="phone-pad"
            invalid={phone.length > 0 && !isValidNgPhone(phone)}
          />
          {phone.length > 0 && !isValidNgPhone(phone) && (
            <Text className="text-[11.5px] mt-1.5" style={{ color: "#b4442f" }}>
              That does not look like a Nigerian number.
            </Text>
          )}
        </Field>

        <Field label="Email" optional>
          <Input
            value={email}
            onChangeText={setEmail}
            placeholder="Optional"
            keyboardType="email-address"
          />
        </Field>

        <Field
          label="Anything the agent should know"
          optional
          hint="Budget, timeline, what they are looking for."
        >
          <Input
            value={message}
            onChangeText={setMessage}
            placeholder="Optional"
            multiline
          />
        </Field>

        <View
          className="rounded-2xl p-3.5 mt-1 flex-row gap-2.5"
          style={{ backgroundColor: "#f5ead4" }}
        >
          <Ionicons name="information-circle" size={17} color={GOLD} />
          <Text
            className="flex-1 text-[12px]"
            style={{ color: "#6b4a16", lineHeight: 17 }}
          >
            Recording this now is what ties the commission to you. Do it before
            the agent speaks to them, not after the sale.
          </Text>
        </View>

        <PressableScale
          onPress={submit}
          disabled={!valid || submitting}
          className="rounded-2xl mt-5 py-4 items-center"
          style={{
            backgroundColor: valid && !submitting ? PRIMARY : "#c9d3cc",
          }}
        >
          <Text className="text-white font-sans-bold text-[15px]">
            {submitting ? "Recording…" : "Record this introduction"}
          </Text>
        </PressableScale>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ─── Form bits ─────────────────────────────────────────────────────────── */

function Field({
  label,
  hint,
  optional,
  children,
}: {
  label: string;
  hint?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-4">
      <View className="flex-row items-center gap-1.5 mb-1.5">
        <Text
          className="text-[11px] font-sans-bold tracking-wider uppercase"
          style={{ color: INK_3 }}
        >
          {label}
        </Text>
        {optional && (
          <Text className="text-[11px]" style={{ color: INK_3 }}>
            optional
          </Text>
        )}
      </View>
      {children}
      {!!hint && (
        <Text className="text-[11.5px] mt-1.5" style={{ color: INK_3 }}>
          {hint}
        </Text>
      )}
    </View>
  );
}

function Input({
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  invalid,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "phone-pad" | "email-address";
  multiline?: boolean;
  invalid?: boolean;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#a8aea9"
      keyboardType={keyboardType ?? "default"}
      autoCapitalize={keyboardType === "email-address" ? "none" : "words"}
      multiline={multiline}
      className="bg-white rounded-2xl px-4 text-[14px]"
      style={{
        borderWidth: 1,
        borderColor: invalid ? "#d99a8e" : LINE,
        color: INK,
        paddingVertical: multiline ? 12 : 13,
        minHeight: multiline ? 88 : undefined,
        textAlignVertical: multiline ? "top" : "center",
      }}
    />
  );
}
