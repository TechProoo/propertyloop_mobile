// Apply over-the-air updates on the launch that finds them, not the one after.
//
// expo-updates on its own checks at launch, downloads in the background, and
// only runs the new bundle on the *next* cold start — so people had to open
// the app twice to see a release, and most never did. This holds the launch
// screen while that startup check runs, and if an update lands inside the
// budget, restarts straight into it.
//
// It watches expo-updates' own state (useUpdates) rather than running a
// parallel check of its own, so it can't race the native startup procedure.
// Anything slow or failing opens the app normally: the download carries on in
// the background and UpdatePrompt offers it once it's ready.
import { useEffect, useRef, useState } from "react";
import * as Updates from "expo-updates";
import { useUpdates } from "expo-updates";
import * as SecureStore from "expo-secure-store";

/** How long to wait to learn whether there's an update at all. */
const CHECK_BUDGET_MS = 6_000;
/** Hard ceiling on holding the launch screen, download included. */
const DOWNLOAD_BUDGET_MS = 25_000;

/**
 * Loop guard. The id we restarted into is recorded just before reloading; if
 * we come back up still not running it, that update didn't take, and forcing
 * it again would restart the app forever. We leave it to the next cold start
 * instead of retrying inside this window.
 */
const GUARD_KEY = "pl_ota_launch_attempt_v1";
const GUARD_WINDOW_MS = 10 * 60 * 1000;

export function useLaunchUpdate(): {
  /** True once the app may be shown. */
  settled: boolean;
  /** True while an update is being fetched to restart into. */
  updating: boolean;
} {
  const u = useUpdates();

  // Disabled in Expo Go and dev builds, and never forced on an emergency
  // launch — that means an update already failed to start and expo-updates
  // fell back to the embedded bundle.
  const enabled =
    Updates.isEnabled && !__DEV__ && !u.currentlyRunning.isEmergencyLaunch;

  const [settled, setSettled] = useState(!enabled);
  // undefined until the guard has been read; null when nothing is blocked.
  const [blockedId, setBlockedId] = useState<string | null | undefined>(
    undefined,
  );
  const reloading = useRef(false);

  // The timers and the check callback outlive the render that started them.
  const latest = useRef(u);
  latest.current = u;

  useEffect(() => {
    let on = true;
    SecureStore.getItemAsync(GUARD_KEY)
      .then((raw) => {
        if (!on) return;
        if (!raw) return setBlockedId(null);
        const g = JSON.parse(raw) as { id?: string; at?: number };
        const recent = !!g.at && Date.now() - g.at < GUARD_WINDOW_MS;
        setBlockedId(g.id && recent ? g.id : null);
      })
      .catch(() => {
        if (on) setBlockedId(null);
      });
    return () => {
      on = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Ask explicitly as well: the startup check may be configured off or have
    // finished before this mounted. If native is already mid-check this
    // rejects, which is fine — its progress still arrives through useUpdates.
    Updates.checkForUpdateAsync()
      .then((result) => {
        if (result.isAvailable) {
          return Updates.fetchUpdateAsync().then(() => undefined);
        }
        const s = latest.current;
        // Nothing new: open now rather than waiting out the check budget.
        if (!s.isUpdatePending && !s.isDownloading) setSettled(true);
      })
      .catch(() => {
        /* offline or already checking — the budgets below decide */
      });

    const checkTimer = setTimeout(() => {
      const s = latest.current;
      if (!s.isUpdateAvailable && !s.isDownloading && !s.isUpdatePending) {
        setSettled(true);
      }
    }, CHECK_BUDGET_MS);
    const ceiling = setTimeout(() => setSettled(true), DOWNLOAD_BUDGET_MS);

    return () => {
      clearTimeout(checkTimer);
      clearTimeout(ceiling);
    };
  }, [enabled]);

  // A failed download just opens the app.
  useEffect(() => {
    if (u.downloadError) setSettled(true);
  }, [u.downloadError]);

  // Restart into the update the moment it's on disk.
  const downloadedId = u.downloadedUpdate?.updateId;
  useEffect(() => {
    if (!enabled || settled || reloading.current) return;
    if (!u.isUpdatePending || blockedId === undefined) return;

    if (
      !downloadedId ||
      downloadedId === u.currentlyRunning.updateId ||
      downloadedId === blockedId
    ) {
      setSettled(true);
      return;
    }

    reloading.current = true;
    SecureStore.setItemAsync(
      GUARD_KEY,
      JSON.stringify({ id: downloadedId, at: Date.now() }),
    )
      .catch(() => {
        /* no guard is worse than a restart, not a reason to skip it */
      })
      .finally(() => {
        Updates.reloadAsync().catch(() => {
          reloading.current = false;
          setSettled(true);
        });
      });
  }, [
    enabled,
    settled,
    blockedId,
    downloadedId,
    u.isUpdatePending,
    u.currentlyRunning.updateId,
  ]);

  const updating =
    enabled &&
    !settled &&
    (u.isUpdateAvailable || u.isDownloading || u.isUpdatePending);

  return { settled, updating };
}
