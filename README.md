# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Shipping updates over the air

For backend address recovery, store builds, and the live API preflight, follow
[the release recovery procedure](./RELEASE_RECOVERY.md).

```bash
node scripts/ota.js --dry-run "What changed"   # verify, publish nothing
node scripts/ota.js "What changed"             # publish to both platforms
```

Never run `eas update` by hand. Two things go wrong silently, and the script
exists to catch both:

**The branch.** Installed builds ship `channel: production`, which maps to the
`production` branch. The `preview` channel has no branch mapped to it at all,
so anything published there reaches nobody — and nothing reports a problem,
because the publish succeeded.

**The runtime version.** `runtimeVersion.policy` is `fingerprint`, and the
fingerprint hashes the whole Expo config *and* `package.json`. So a change with
no native content at all — bumping `android.versionCode`, adding an npm script
— gives installed builds a runtime version they do not have, and they ignore
the update. Silently. That is why iOS received nothing between 30 August 2026
and this feature: `versionCode` went 9 → 10 after the iOS build was made, which
changed the *iOS* fingerprint.

The script compares this tree's fingerprint against the runtime version of each
platform's latest finished production build and refuses to publish a mismatch.
Where the only difference is `android.versionCode` it restores the old value
for the publish and puts it back afterwards — Android metadata that is not in
the iOS binary and changes nothing an iPhone runs, only the hash.

### Before you edit package.json or app.json

Both feed the fingerprint. Editing either strands every installed build until
you ship a new one. If you are about to publish an update, publish it first and
edit afterwards.

The durable fix is on the **`next-build` branch**: a `fingerprint.config.js`
that skips version fields, plus `npm run ota` wiring. It is deliberately not on
`main`, because merging it changes the fingerprint and would itself strand
installed builds. Merge it when you next build both platforms, not before.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
