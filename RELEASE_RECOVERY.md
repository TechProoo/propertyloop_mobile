# Signup recovery and release procedure

## Confirmed on 4 November 2026

- `https://propertyloopbackend-production.up.railway.app/api` returns Railway's
  HTTP 404 `Application not found` response.
- `https://propertyloop-backend.up.railway.app/api/auth/me` returns the expected
  HTTP 401 JSON response when called without a session.
- The latest finished production iOS artifact in EAS is version 1.0.4, build 13,
  build ID `6e9ac021-35e6-4352-9393-604d7f03c850`.
- Its embedded `main.jsbundle` contains the retired hostname and does not contain
  the current hostname. It was built before the EAS profiles were corrected.
  A compatible OTA can repair the downloaded JavaScript, but the embedded bundle
  remains broken on a fresh install until that update downloads and runs.

The current source resolves the retired environment value to the live endpoint
for REST, refresh, and chat. This source change does not alter already installed
bundles until it is delivered in a compatible OTA or a new store binary.

## Restore existing installations

In Railway, inspect the original service/environment and its public networking
settings. If the old generated hostname can be restored, attach it to the live
API service and verify both addresses. Preserve the `/api` paths and forward
requests directly, including POST bodies, authorization, and WebSocket upgrades.
A normal website redirect is insufficient as a compatibility guarantee.

Do not delete or rename the current working hostname during this repair. If
Railway cannot restore the original generated hostname, ask Railway support
whether that hostname can be recovered. We do not control its DNS zone.

Without recovery of that address, clients can only be repaired by a compatible
Expo update or a store update. This repository's OTA script checks the latest
finished production build per platform; it does not cover every older runtime.
For each older runtime, use its matching native dependency/configuration tree,
apply only the endpoint fix, verify its fingerprint, and publish to its mapped
channel. Do not override a runtime hash to make incompatible code appear valid.

## Replace the submitted binary and build Android

Before each build, in this directory:

```sh
node --test scripts/check-api.test.cjs scripts/ota-compat.test.cjs
node scripts/check-api.cjs
npx tsc --noEmit
```

Then build using the production profile:

```sh
eas build --profile production --platform ios
eas build --profile production --platform android
```

The OTA recovery script can temporarily restore a historical `eas.json` when
only the known API URL values differ. It requires a full native fingerprint
match afterwards, keeps the live URL in the exported environment, and restores
the configuration files afterwards. Other EAS changes are not eligible.

The current profiles use auto-increment. Confirm the resulting iOS build number
is above 13 and the Android version code exceeds the highest already uploaded
to Play Console. Select the corrected iOS binary in App Store Connect; the
already uploaded build 13 cannot be modified in place. If review has begun,
follow App Store Connect's process to replace the selected build.

Test signup, email verification, login, refresh after reopening, and chat on
TestFlight and Play internal testing before promoting the releases. A live
authentication probe verifies routing, not the full account creation journey.

`node scripts/ota.js --dry-run "Endpoint recovery"` now runs the API check before
its runtime checks. Publish only from a reviewed tree: an OTA exports uncommitted
JavaScript too. Never assume an update for the newest build reaches older ones.

## Keep the address independent of the hosting service

Configure `api.propertyloop.ng` as a custom domain on the live Railway service,
add Railway's requested DNS records at the domain provider, and wait for valid
HTTPS. Check `/api/auth/me`, signup, uploads, and `/chat` through it before
changing `PRODUCTION_API_URL` in `api/endpoint.js`, the EAS profiles, and the
production Expo environment together. That subdomain was not resolving during
this investigation and must not be shipped yet.

Keep every previously shipped backend hostname serving compatible API traffic
while supported installations depend on it. Host migrations should change the
custom domain's routing, not the address installed on users' phones.

The GitHub workflow checks release configuration and the live authentication
route on pushes, pull requests, manual runs, and every six hours. Make its check
required in branch protection if releases must be blocked when it fails. Direct
`eas build` commands still require the preflight above.

Add a remote minimum-version policy after the corrected releases are available
in both stores. It complements this routing repair; it cannot reach a client
whose backend hostname is already broken.
