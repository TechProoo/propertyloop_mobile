#!/usr/bin/env node

/**
 * Publish an OTA update that installed builds can actually receive.
 *
 * Two things have gone wrong here before, both silently, and this script
 * exists so neither can happen again:
 *
 * 1. Publishing to a branch nobody is listening to. Installed builds ship
 *    `channel: production`, which maps to the `production` branch. The
 *    `preview` channel has no branch mapped to it at all, so an update
 *    published there reaches no one — and nothing reports a problem, because
 *    the publish itself succeeded.
 *
 * 2. Publishing a runtime version no installed build has. runtimeVersion.policy
 *    is "fingerprint", and the fingerprint hashes the whole Expo config — so
 *    bumping android.versionCode after an iOS build changes the *iOS* runtime
 *    version and orphans every iPhone. That is exactly the state this repo is
 *    in: App Store build 1.0.3 (11) was made at versionCode 9, the repo is now
 *    at 10, and iOS has been unreachable since 30 August 2026.
 *
 * So before publishing to a platform we compare this working tree's
 * fingerprint against the runtime version of that platform's latest finished
 * production build, and refuse if they differ. For a mismatch we first try
 * restoring the versionCode the build was made at: that field is Android-only
 * Play Store metadata, it is not in the iOS binary, and changing it alters
 * nothing an iPhone runs — only the hash. The JS bundle delivered is identical
 * either way.
 *
 * If no candidate matches, the platform is skipped with a reason rather than
 * shipping an update into the void. That means a new build is needed.
 *
 * Usage:
 *   node scripts/ota.js --dry-run "What changed"   # verify only, publish nothing
 *   node scripts/ota.js "What changed"
 *   node scripts/ota.js --platform ios "What changed"
 *
 * Invoked directly rather than through an npm script on purpose: package.json
 * feeds the fingerprint, so adding one here would itself strand every
 * installed build. The `npm run ota` wiring waits on the `next-build` branch
 * with fingerprint.config.js, to land when both platforms are next built.
 *
 * Each fingerprint takes a minute or so, so a full run is a few minutes.
 */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { onlyApiUrlsDiffer, alignLineEndings } = require("./ota-compat.cjs");
const { PRODUCTION_API_URL } = require("../api/endpoint");

// Resolved from the manifest rather than __dirname so the script works from
// any working directory.
const root = path.dirname(require.resolve("../package.json"));
const appJsonPath = path.join(root, "app.json");
const easJsonPath = path.join(root, "eas.json");

/** The branch the production channel is mapped to. Not "preview". */
const BRANCH = "production";

/** How many versionCode values back to try when a fingerprint mismatches. */
const LOOKBACK = 3;

/* ─── shell ──────────────────────────────────────────────────────────────── */

function run(command, args, { capture = false, shell = false } = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    shell,
    stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
  });
  if (result.error) throw result.error;
  return result;
}

/**
 * Both CLIs are run as `node <entry>` rather than through npx, and never
 * through a shell. On Windows a shell concatenates arguments instead of
 * escaping them, so a multi-word --message would arrive at eas split into
 * pieces — or worse, with whatever a stray quote in it did to the command.
 */
let easEntryCache = null;
function easEntry() {
  if (easEntryCache) return easEntryCache;
  // npm is a .cmd on Windows and needs the shell. Passed as one string rather
  // than command-plus-args: with a shell, Node concatenates args instead of
  // escaping them, and warns about it. Nothing of ours goes in here anyway.
  const npmRoot = spawnSync("npm root -g", {
    cwd: root,
    encoding: "utf8",
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
  }).stdout.trim();
  const entry = path.join(npmRoot, "eas-cli", "bin", "run");
  if (!fs.existsSync(entry)) {
    throw new Error(
      `eas-cli not found at ${entry} — install it with: npm install -g eas-cli`,
    );
  }
  easEntryCache = entry;
  return entry;
}

const expoUpdatesEntry = () =>
  path.join(
    path.dirname(require.resolve("expo-updates/package.json")),
    "bin",
    "cli.js",
  );

function easJson(args) {
  const result = run(process.execPath, [easEntry(), ...args], {
    capture: true,
  });
  if (result.status !== 0) {
    throw new Error(`eas ${args[0]} failed:\n${result.stderr}`);
  }
  return JSON.parse(result.stdout);
}

/**
 * Fingerprint in a child process rather than through the programmatic API:
 * we change app.json between calls, and a fresh process cannot serve us a
 * cached read of the config we just edited.
 */
function fingerprint(platform) {
  const result = run(
    process.execPath,
    [expoUpdatesEntry(), "fingerprint:generate", "--platform", platform],
    { capture: true },
  );
  if (result.status !== 0) {
    throw new Error(`fingerprint failed for ${platform}:\n${result.stderr}`);
  }
  return JSON.parse(result.stdout).hash;
}

/* ─── app.json ───────────────────────────────────────────────────────────── */

// Edited as text, not parsed and re-stringified: JSON.stringify would reformat
// the whole file and leave a diff nobody asked for.
const readAppJson = () => fs.readFileSync(appJsonPath, "utf8");
const writeAppJson = (text) => fs.writeFileSync(appJsonPath, text);

function versionCodeOf(text) {
  const match = text.match(/"versionCode":\s*(\d+)/);
  if (!match) throw new Error("android.versionCode not found in app.json");
  return Number(match[1]);
}

const withVersionCode = (text, value) =>
  text.replace(/("versionCode":\s*)\d+/, `$1${value}`);

/* ─── EAS ────────────────────────────────────────────────────────────────── */

/** The latest finished production build for a platform, or null. */
function latestProductionBuild(platform) {
  const page = easJson([
    "build:list",
    "--platform",
    platform,
    "--status",
    "finished",
    "--limit",
    "20",
    "--json",
    "--non-interactive",
  ]);
  const builds = Array.isArray(page) ? page : (page.currentPage ?? []);
  return builds.find((b) => b.buildProfile === "production") ?? null;
}

function publish(platform, message) {
  const result = run(process.execPath, [
    easEntry(),
    "update",
    "--branch",
    BRANCH,
    "--platform",
    platform,
    "--message",
    message,
    "--non-interactive",
  ]);
  if (result.status !== 0) {
    throw new Error(`publish failed for ${platform}`);
  }
}

/* ─── the work ───────────────────────────────────────────────────────────── */

/**
 * Find a versionCode at which this tree fingerprints to what the installed
 * build expects. Returns null if none within the lookback does.
 */
function findMatchingVersionCode(platform, target, original) {
  const current = versionCodeOf(original);
  for (let candidate = current - 1; candidate > current - 1 - LOOKBACK && candidate >= 1; candidate--) {
    process.stdout.write(`  trying versionCode ${candidate}… `);
    writeAppJson(withVersionCode(original, candidate));
    const hash = fingerprint(platform);
    console.log(hash === target ? "match" : "no");
    if (hash === target) return candidate;
  }
  return null;
}

function shipPlatform(platform, message, dryRun) {
  console.log(`\n── ${platform} ──`);

  const build = latestProductionBuild(platform);
  if (!build) {
    console.log("  no finished production build — nothing to update. SKIPPED");
    return false;
  }
  console.log(
    `  installed build: ${build.appVersion} (${build.appBuildVersion}), runtime ${build.runtimeVersion}`,
  );

  const local = fingerprint(platform);
  console.log(`  this tree:       ${local}`);

  if (local === build.runtimeVersion) {
    console.log("  fingerprints match — installed builds will receive this.");
    if (dryRun) return true;
    publish(platform, message);
    return true;
  }

  console.log("  mismatch — installed builds would ignore this update.");
  const original = readAppJson();
  const originalEas = fs.readFileSync(easJsonPath, "utf8");
  try {
    // The backend URL correction changed the EAS file hash after build 13.
    // Restore only an API-URL-only historical difference, then require the
    // complete fingerprint to match. The exported JS still uses the live URL.
    if (/^[a-f0-9]{40}$/.test(build.gitCommitHash ?? "")) {
      const previous = run("git", ["show", `${build.gitCommitHash}:eas.json`], { capture: true });
      if (previous.status === 0 && onlyApiUrlsDiffer(originalEas, previous.stdout)) {
        fs.writeFileSync(easJsonPath, alignLineEndings(previous.stdout, originalEas));
        if (fingerprint(platform) === build.runtimeVersion) {
          console.log("  native fingerprint matches with the build's API URL metadata.");
          if (!dryRun) publish(platform, message);
          return true;
        }
      }
    }
    const candidate = findMatchingVersionCode(platform, build.runtimeVersion, original);
    if (candidate === null) {
      console.log(
        "  no versionCode within lookback reproduces that runtime version.\n" +
          "  Something native really did change: this platform needs a new build. SKIPPED",
      );
      return false;
    }
    console.log(
      `  publishing with android.versionCode temporarily at ${candidate}\n` +
        "  (Android-only metadata, absent from this bundle — it only feeds the hash)",
    );
    if (dryRun) return true;
    publish(platform, message);
    return true;
  } finally {
    // Restore whatever happened above, including on a failed publish.
    writeAppJson(original);
    fs.writeFileSync(easJsonPath, originalEas);
    if (readAppJson() !== original) {
      throw new Error("app.json could not be restored — check it before committing");
    }
    if (fs.readFileSync(easJsonPath, "utf8") !== originalEas) {
      throw new Error("eas.json could not be restored — check it before committing");
    }
  }
}

function main() {
  const argv = process.argv.slice(2);
  let dryRun = false;
  let platform = "all";
  const words = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dry-run") dryRun = true;
    else if (arg === "-p" || arg === "--platform") platform = argv[++i];
    else if (arg.startsWith("--platform=")) platform = arg.slice("--platform=".length);
    else if (arg === "-m" || arg === "--message") words.push(argv[++i]);
    else words.push(arg);
  }

  const message = words.join(" ").trim();
  if (!message) {
    console.error(
      'A message is required: npm run ota -- "What changed"\n' +
        "It is what you will read in the update list months from now.",
    );
    process.exit(1);
  }

  const platforms = platform === "all" ? ["android", "ios"] : [platform];
  if (platforms.some((p) => p !== "android" && p !== "ios")) {
    console.error(`Unknown platform "${platform}" — use android, ios or all.`);
    process.exit(1);
  }

  console.log(
    `${dryRun ? "Checking" : "Publishing"} "${message}" to branch ${BRANCH}`,
  );

  if (!dryRun) {
    const status = run("git", ["status", "--porcelain"], { capture: true });
    if (status.status !== 0 || status.stdout.trim()) {
      throw new Error("Commit the intended app changes before publishing an OTA update.");
    }
  }

  // Refuse a publish if an environment override points signup at a dead host.
  const apiCheck = run(process.execPath, [path.join(root, "scripts/check-api.cjs")]);
  if (apiCheck.status !== 0) throw new Error("API release check failed");
  process.env.EXPO_PUBLIC_API_URL = PRODUCTION_API_URL;

  const shipped = platforms.filter((p) => shipPlatform(p, message, dryRun));
  const skipped = platforms.filter((p) => !shipped.includes(p));

  console.log(
    `\n${dryRun ? "Compatible with latest production build" : "Published for latest production build"}: ${shipped.join(", ") || "nothing"}` +
      (skipped.length ? `\nNeeds a new build: ${skipped.join(", ")}` : ""),
  );
  if (skipped.length) process.exitCode = 1;
}

main();
