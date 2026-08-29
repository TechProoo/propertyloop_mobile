import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { Ionicons } from "@expo/vector-icons";
import { tapLight } from "@/lib/haptics";

/**
 * A feed post's video. Tap to play, not autoplay: the feed is a scrolling list
 * on mobile data, and autoplaying every clip that passes would spend the
 * viewer's bundle without being asked. PromoReel autoplays because it's one
 * deliberate placement — a list is a different bargain.
 *
 * Nothing is prefetched until the first tap for the same reason, and playback
 * pauses when the card leaves the tree so a scrolled-past clip can't keep
 * playing under a new screen.
 *
 * No poster frame: none is generated at upload, so the tile is black with a
 * play control until it starts.
 */
export function VideoTile({ uri }: { uri: string }) {
  const { width } = useWindowDimensions();
  // Screen padding (20 each side) + card padding (16 each side).
  const w = width - 40 - 32;

  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  // Read inside the status listener, which closes over its first render.
  const startedRef = useRef(false);

  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
    // Sound on — unlike an autoplaying reel, playback here is a deliberate tap.
    p.muted = false;
  });

  useEffect(() => {
    const statusSub = player.addListener("statusChange", ({ status, error }) => {
      if (status === "error" || error) {
        setFailed(true);
        return;
      }
      // Stand-in for a poster frame. expo-video shows nothing until it has a
      // decoded frame, so an unplayed clip is a black rectangle; a frame-
      // accurate seek just past zero produces one without starting playback.
      // Guarded on startedRef so it can't yank a playing video back to the top.
      if (status === "readyToPlay" && !startedRef.current) {
        try {
          player.currentTime = 0.1;
        } catch {
          /* seek unsupported for this source — falls back to a black tile */
        }
      }
    });
    const playSub = player.addListener("playingChange", ({ isPlaying }) =>
      setPlaying(isPlaying),
    );
    return () => {
      statusSub.remove();
      playSub.remove();
      // Leaving the list must stop the audio, not just hide the view.
      try {
        player.pause();
      } catch {
        /* player already released */
      }
    };
  }, [player]);

  const toggle = () => {
    tapLight();
    if (!started) {
      startedRef.current = true;
      setStarted(true);
    }
    if (playing) player.pause();
    else player.play();
  };

  if (failed) {
    return (
      <View
        className="mt-4 rounded-2xl items-center justify-center"
        style={{ width: w, height: 300, backgroundColor: "#16321f" }}
      >
        <Ionicons name="cloud-offline-outline" size={26} color="#ffffff" />
        <Text className="text-white text-[13px] mt-2">
          This video couldn&apos;t be played
        </Text>
      </View>
    );
  }

  return (
    <Pressable
      onPress={toggle}
      accessibilityRole="button"
      accessibilityLabel={playing ? "Pause video" : "Play video"}
      className="mt-4 rounded-2xl overflow-hidden"
      style={{ width: w, height: 300, backgroundColor: "#16321f" }}
    >
      <VideoView
        player={player}
        style={{ width: "100%", height: "100%" }}
        contentFit="contain"
        // Once it's playing the viewer gets the real controls — scrubbing,
        // fullscreen, volume. Before that the tile is just a big play target.
        nativeControls={started}
        allowsFullscreen
        allowsPictureInPicture={false}
      />

      {!started && (
        <View
          className="absolute left-0 right-0 top-0 bottom-0 items-center justify-center"
          pointerEvents="none"
        >
          <View
            className="w-16 h-16 rounded-full items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
          >
            <Ionicons name="play" size={28} color="#ffffff" />
          </View>
        </View>
      )}
    </Pressable>
  );
}
