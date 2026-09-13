/**
 * What is allowed to change the native fingerprint.
 *
 * runtimeVersion.policy is "fingerprint", so this hash decides which installed
 * builds accept an OTA update. By default it covers the whole Expo config —
 * which means a release chore with no native content at all can strand every
 * phone already out there, silently. It has happened: android.versionCode
 * 9 → 10, synced after an EAS autoIncrement, changed the *iOS* fingerprint and
 * cut off App Store build 1.0.3 (11) for a fortnight.
 *
 * ExpoConfigVersions drops version, android.versionCode and ios.buildNumber
 * from the hash. They describe a store release, not a native binary: two
 * builds differing only in buildNumber run identical JS.
 *
 * This does not make the fingerprint safe in general. package.json still feeds
 * it — adding an npm script is enough to change the hash, which is measured,
 * not assumed. scripts/ota.js is what catches that: it refuses to publish an
 * update whose fingerprint no installed build has.
 *
 * Careful: changing this file changes the fingerprint, so adopting it strands
 * installed builds exactly like the problem it fixes. It must ship together
 * with a new build of BOTH platforms, never on its own.
 */
module.exports = {
  sourceSkips: ["ExpoConfigVersions"],
};
