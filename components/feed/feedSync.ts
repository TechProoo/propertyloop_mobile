import type { FeedPost } from "@/api/services/feed";

/**
 * Cross-screen sync for the feed.
 *
 * On the web the composer and the comments drawer are overlays over the list,
 * so they call back into it directly (`onPosted` prepends, `onCountChange`
 * patches the count). On mobile they're separate routes with no shared state,
 * so they leave their changes here and the list drains them when it regains
 * focus — same visible outcome, no refetch and no lost scroll position.
 */

type PostPatch = { commentsCount?: number };

let created: FeedPost[] = [];
const patches = new Map<string, PostPatch>();

/** A post published from the composer, to be prepended to the list. */
export function queueCreatedPost(post: FeedPost) {
  created = [post, ...created];
}

/** A field that changed elsewhere — currently just the comment count. */
export function queuePostPatch(postId: string, patch: PostPatch) {
  patches.set(postId, { ...patches.get(postId), ...patch });
}

/**
 * Take everything queued and clear it. Only the focused list drains, so a
 * change made while two feed screens are stacked lands on whichever regains
 * focus first; pull-to-refresh is the backstop either way.
 */
export function drainFeedSync(): {
  created: FeedPost[];
  patches: Map<string, PostPatch>;
} {
  const out = { created, patches: new Map(patches) };
  created = [];
  patches.clear();
  return out;
}
