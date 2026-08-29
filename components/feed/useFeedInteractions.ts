import { useCallback, useRef, useState } from "react";
import { Share } from "react-native";
import { router } from "expo-router";
import type { Href } from "expo-router";
import { Alert } from "@/lib/dialog";
import { useAuth } from "@/context/auth";
import feedService, { type FeedPost } from "@/api/services/feed";
import { tapLight, tapMedium } from "@/lib/haptics";

/** Posts link back to the website, which renders a single post at /feed?post=id. */
const WEB_ORIGIN = "https://propertyloop.ng";

/**
 * All post-mutation logic for a list of feed posts, ported from the web
 * useFeedInteractions hook so the feed screen and the profile screen behave
 * identically. Callers own their `setPosts` and render `toast` themselves.
 *
 * Two deliberate platform swaps from web:
 *  - the custom ShareSheet becomes the OS share sheet (Share.share), which
 *    already offers WhatsApp and copy-link natively;
 *  - the anchored PostMenu becomes an action-sheet Alert.
 */
export function useFeedInteractions(
  setPosts: React.Dispatch<React.SetStateAction<FeedPost[]>>,
  opts?: { onFollowChange?: (userId: string, following: boolean) => void },
) {
  const { isAuthed, requireAuth } = useAuth();
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  const patchPost = useCallback(
    (id: string, patch: Partial<FeedPost>) =>
      setPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      ),
    [setPosts],
  );

  /** Optimistic, with the server count as the correction — same as web. */
  const handleLike = useCallback(
    async (post: FeedPost) => {
      if (!requireAuth("like posts")) return;
      tapLight();
      patchPost(post.id, {
        likesCount: post.viewer.liked
          ? post.likesCount - 1
          : post.likesCount + 1,
        viewer: { ...post.viewer, liked: !post.viewer.liked },
      });
      try {
        const res = await feedService.toggleLike(post.id);
        patchPost(post.id, {
          likesCount: res.count,
          viewer: { ...post.viewer, liked: res.liked },
        });
      } catch {
        patchPost(post.id, post); // roll back to the pre-tap post
      }
    },
    [patchPost, requireAuth],
  );

  const handleSave = useCallback(
    async (post: FeedPost) => {
      if (!requireAuth("save posts")) return;
      tapLight();
      try {
        const res = await feedService.toggleSave(post.id);
        patchPost(post.id, { viewer: { ...post.viewer, saved: res.saved } });
        showToast(res.saved ? "Saved to your collection" : "Removed from saved");
      } catch {
        showToast("Something went wrong");
      }
    },
    [patchPost, requireAuth, showToast],
  );

  const handleVote = useCallback(
    async (post: FeedPost, optionId: string) => {
      if (!requireAuth("vote in polls")) return;
      tapLight();
      try {
        const res = await feedService.vote(post.id, optionId);
        patchPost(post.id, {
          poll: post.poll
            ? { ...post.poll, totalVotes: res.totalVotes, options: res.options }
            : post.poll,
          viewer: { ...post.viewer, votedOptionId: res.votedOptionId },
        });
      } catch (err: any) {
        showToast(
          err?.response?.data?.message ?? "Couldn't record your vote",
        );
      }
    },
    [patchPost, requireAuth, showToast],
  );

  const handleFollow = useCallback(
    async (userId: string): Promise<boolean | undefined> => {
      if (!requireAuth("follow people")) return;
      tapMedium();
      try {
        const res = await feedService.toggleFollow(userId);
        // Every post by this author reflects the change, not just the tapped one.
        setPosts((prev) =>
          prev.map((p) =>
            p.author.id === userId
              ? { ...p, viewer: { ...p.viewer, followingAuthor: res.following } }
              : p,
          ),
        );
        opts?.onFollowChange?.(userId, res.following);
        showToast(res.following ? "Following" : "Unfollowed");
        return res.following;
      } catch {
        showToast("Something went wrong");
      }
    },
    [requireAuth, setPosts, showToast, opts],
  );

  const handleDelete = useCallback(
    async (post: FeedPost) => {
      try {
        await feedService.remove(post.id);
        setPosts((prev) => prev.filter((p) => p.id !== post.id));
        showToast("Post deleted");
      } catch {
        showToast("Couldn't delete the post");
      }
    },
    [setPosts, showToast],
  );

  const handleReport = useCallback(
    async (post: FeedPost) => {
      if (!requireAuth("report posts")) return;
      try {
        await feedService.report(post.id);
        showToast("Thanks — we'll review this post");
      } catch {
        showToast("Couldn't submit the report");
      }
    },
    [requireAuth, showToast],
  );

  const handleShare = useCallback(async (post: FeedPost) => {
    tapLight();
    const url = `${WEB_ORIGIN}/feed?post=${post.id}`;
    try {
      await Share.share({
        // Android puts everything in `message`; iOS prefers a separate `url`.
        message: `${post.author.name} on PropertyLoop: ${url}`,
        url,
      });
    } catch {
      /* user dismissed the sheet — nothing to report */
    }
  }, []);

  /** Native stand-in for the web PostMenu. */
  const openMore = useCallback(
    (post: FeedPost) => {
      tapLight();
      Alert.alert("Post options", undefined, [
        {
          text: post.viewer.saved ? "Remove from saved" : "Save post",
          onPress: () => void handleSave(post),
        },
        { text: "Share", onPress: () => void handleShare(post) },
        ...(post.viewer.isAuthor
          ? [
              {
                text: "Delete post",
                style: "destructive" as const,
                onPress: () =>
                  Alert.alert(
                    "Delete this post?",
                    "This can't be undone.",
                    [
                      { text: "Cancel", style: "cancel" as const },
                      {
                        text: "Delete",
                        style: "destructive" as const,
                        onPress: () => void handleDelete(post),
                      },
                    ],
                  ),
              },
            ]
          : [
              {
                text: "Report post",
                style: "destructive" as const,
                onPress: () => void handleReport(post),
              },
            ]),
        { text: "Cancel", style: "cancel" as const },
      ]);
    },
    [handleSave, handleShare, handleDelete, handleReport],
  );

  const openProfile = useCallback((authorId: string) => {
    router.push(`/feed/user/${authorId}` as Href);
  }, []);

  const openListing = useCallback((listingId: string) => {
    router.push(`/property/${listingId}` as Href);
  }, []);

  const openComments = useCallback((postId: string) => {
    router.push(`/feed/comments/${postId}` as Href);
  }, []);

  return {
    isAuthed,
    requireAuth,
    toast,
    showToast,
    patchPost,
    handleLike,
    handleSave,
    handleVote,
    handleFollow,
    handleDelete,
    handleReport,
    handleShare,
    openMore,
    openProfile,
    openListing,
    openComments,
  };
}
