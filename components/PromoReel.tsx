// Sponsored partner spot on the app home screen.
//
// Currently carrying the Mega Project Nigeria 2026 expo ad, which runs
// 25–27 Aug 2026. Third-party creative, so the card is labelled Sponsored;
// pull the section once the event has passed.
//
// The 9:16 cut is streamed from the website rather than bundled: an 8MB asset
// in the update payload would mean every user re-downloads it on every EAS
// update, and adds the same weight to the store binary. Streaming keeps the
// update to JS, at the cost of needing the site deployed.
//
// It starts muted and paused behind a poster-ish frame, so opening the app
// never blasts audio; one tap plays with sound in the native fullscreen player.
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { tapLight } from "@/lib/haptics";

// Apex host on purpose — www 301s here, and skipping the hop matters on 3G.
const REEL_URL = "https://propertyloop.ng/ads/propertyloop-ad-portrait.mp4";

const INK = "#1a2120";
const MINT = "#6ee7b7";
const GOLD = "#f0d69f";

export function PromoReel() {
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  // Mirrored in state because the player field alone would not re-render.
  const [muted, setMuted] = useState(true);

  // Muted + looping so the frame reads as a live teaser, not a dead thumbnail.
  const player = useVideoPlayer(REEL_URL, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  useEffect(() => {
    const statusSub = player.addListener("statusChange", ({ status, error }) => {
      if (status === "error" || error) setFailed(true);
    });
    const playSub = player.addListener("playingChange", ({ isPlaying }) => {
      setPlaying(isPlaying);
    });
    return () => {
      statusSub.remove();
      playSub.remove();
    };
  }, [player]);

  // Offline, or the site not yet deployed — show nothing rather than a black box.
  if (failed) return null;

  // Tapping hands over to the native player: sound on, controls, fullscreen.
  const watch = () => {
    tapLight();
    player.muted = false;
    setMuted(false);
    player.play();
  };

  return (
    <View className="px-5 pt-6">
      <View
        className="rounded-[26px] overflow-hidden"
        style={{ backgroundColor: "#0d2419" }}
      >
        <View style={{ aspectRatio: 9 / 16, width: "100%" }}>
          <VideoView
            player={player}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            nativeControls={false}
            allowsFullscreen
            allowsPictureInPicture={false}
          />

          {/* Top wash carries the brand chip; bottom wash seats the copy. */}
          <LinearGradient
            colors={["rgba(8,16,11,0.75)", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 0.35 }}
            style={{ position: "absolute", left: 0, right: 0, top: 0, height: "40%", pointerEvents: "none" }}
          />
          <LinearGradient
            colors={["transparent", "rgba(8,16,11,0.55)", "rgba(8,16,11,0.92)"]}
            start={{ x: 0, y: 0.35 }}
            end={{ x: 0, y: 1 }}
            style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "62%", pointerEvents: "none" }}
          />

          {/* Brand chip */}
          <View className="absolute top-4 left-4 flex-row items-center rounded-full px-3 py-1.5"
            style={{ backgroundColor: "rgba(255,255,255,0.16)" }}
          >
            <View
              style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: MINT, marginRight: 6 }}
            />
            <Text className="text-[9.5px] font-sans-bold text-white tracking-widest uppercase">
              Sponsored
            </Text>
          </View>

          {/* Sound-off hint while the muted teaser runs. */}
          {playing && muted && (
            <View
              className="absolute top-4 right-4 rounded-full w-8 h-8 items-center justify-center"
              style={{ backgroundColor: "rgba(255,255,255,0.16)" }}
            >
              <Ionicons name="volume-mute" size={14} color="#ffffff" />
            </View>
          )}

          {/* Copy + CTA */}
          <Pressable
            onPress={watch}
            className="absolute left-0 right-0 bottom-0 px-5 pb-5 active:opacity-90"
            accessibilityRole="button"
            accessibilityLabel="Watch the Mega Project Nigeria spot with sound"
          >
            <Text className="text-[21px] leading-[26px] font-sans-bold text-white">
              Mega Project Nigeria
            </Text>
            <Text className="text-[21px] leading-[26px] font-sans-bold" style={{ color: GOLD }}>
              25–27 August 2026
            </Text>
            <Text
              className="text-[12.5px] leading-[18px] mt-2"
              style={{ color: "rgba(255,255,255,0.72)" }}
            >
              The Construction, HVAC, Energy, Water & Infrastructure Expo,
              co-located with Mega Ceramica.
            </Text>

            <View className="flex-row mt-3.5">
              <View
                className="rounded-full flex-row items-center"
                style={{ backgroundColor: GOLD, paddingVertical: 11, paddingHorizontal: 20 }}
              >
                <Ionicons name="play" size={13} color="#392609" />
                <Text className="text-[13px] font-sans-bold ml-1.5" style={{ color: "#392609" }}>
                  Watch with sound
                </Text>
              </View>
            </View>
          </Pressable>
        </View>
      </View>

      {/* Grounding caption, matching the weight of other section footnotes. */}
      <Text className="text-[11px] font-sans-semibold mt-2.5 text-center" style={{ color: INK }}>
        nigeriamegaproject.com
      </Text>
    </View>
  );
}
