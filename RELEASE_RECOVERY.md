# API address and release checks

## Production address

The Railway hostname was restored on 4 November 2026. All active PropertyLoop
clients and build profiles use:

```text
https://propertyloopbackend-production.up.railway.app/api
```

The restored `/api/auth/me` endpoint was verified to return the expected HTTP
401 JSON response without credentials. The mobile endpoint resolver also maps
the hostname used during the temporary migration back to this production URL,
so stale build environment overrides do not send requests to the wrong server.
REST requests, token refresh, and chat share this resolver.

Keep this hostname available for existing installations. iOS 1.0.4 build 13
already embeds it, so restoring the backend repairs that embedded address
without replacing the binary solely for this issue.

## Before a build or Expo update

Run these commands in the mobile directory:

```sh
node --test scripts/check-api.test.cjs scripts/ota-compat.test.cjs
node scripts/check-api.cjs
npx tsc --noEmit
```

The API check validates the production and preview build profiles, the bundle
environment, and the live authentication route. A root-page HTTP 200 alone
does not prove that authentication is routed correctly. The GitHub workflow
runs these checks on pushes, pull requests, manual runs, and every six hours.

For new store binaries:

```sh
eas build --profile production --platform ios
eas build --profile production --platform android
```

The profiles auto-increment build numbers. Confirm that each new build number
exceeds the highest uploaded to its store. Test signup, email verification,
login, refresh, uploads, and chat in TestFlight or Play internal testing before
promoting a release. A routing check is not a full account-creation test.

## Existing installed Expo updates

Changing source or build environment values does not change JavaScript that
has already been installed. Any deployed Expo update containing the temporary
hostname needs a compatible address correction, or that hostname must remain
available through a forwarding service.

Use the latest deployed source for each runtime so the repair preserves later
app changes. Do not rebuild an old native build's original JavaScript over a
newer deployed update. Require the complete native fingerprint to match before
publishing; do not force a runtime hash.

```sh
node scripts/ota.js --dry-run "Restore the production API address"
node scripts/ota.js "Restore the production API address"
```

The script targets the latest finished production build on each platform. It
does not claim coverage for every older runtime. It refuses a publish from a
dirty checkout and restores any temporary metadata edits after runtime checks.
An API-URL-only historical EAS difference can be restored for fingerprint
comparison without changing the live URL used by the exported JavaScript.

An optional forwarding service for clients still using the temporary hostname
is documented in the backend repository's `compat-proxy` directory. It is not
required for clients already using the restored production address.

## Verified address restoration, 4 November 2026

Compatible corrections were published to the production branch and their live
manifests and downloaded bundle checksums were verified:

| Installed build | Update group | Source branch |
| --- | --- | --- |
| iOS 1.0.4 (13) | `9313bf1e-0fd5-4eaf-ad01-9a2374722598` | `release/restore-api-ios13` |
| iOS 1.0.4 (12) | `87938e62-6f87-4a9d-baed-81b41f8973ec` | `release/restore-api-ios12` |
| Android 1.0.3 (10) | `5f51175c-992f-4d45-a769-440abe115709` | `release/restore-api-android` |

For each correction, the rebuilt baseline executable and all app assets were
compared against the preceding live update before changing the API resolver.
The complete native fingerprint matched the installed build. The three source
branches are committed and pushed; they preserve each runtime's deployed UI.

The live update bundles for iOS 1.0.3 builds 11 and 12 were also downloaded and
verified to already use the restored hostname. They did not require another
address correction. An installed app must download and apply its update before
the corrected JavaScript takes effect.
