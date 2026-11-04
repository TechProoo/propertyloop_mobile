#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const { PRODUCTION_API_URL, RETIRED_API_URL } = require("../api/endpoint");

function validateReleaseUrl(value, label) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label}: EXPO_PUBLIC_API_URL is missing`);
  }
  const url = value.trim().replace(/\/+$/, "");
  if (url === RETIRED_API_URL) {
    throw new Error(`${label}: the retired API address must not ship again`);
  }
  // Change this deliberately after a replacement hostname is live and tested.
  if (url !== PRODUCTION_API_URL) {
    throw new Error(`${label}: API URL does not match the verified production endpoint`);
  }
  return url;
}

async function probeAuth(baseUrl, request = fetch) {
  const response = await request(`${baseUrl}/auth/me`, {
    headers: { "X-Client-Platform": "mobile" },
    redirect: "error",
    signal: AbortSignal.timeout(30_000),
  });
  const body = await response.json();
  // A root-page 200 is insufficient: verify that the authentication controller
  // is reachable. This request has no session and must not authenticate.
  if (response.status !== 401 || body.statusCode !== 401 || body.message !== "Unauthorized") {
    throw new Error(`Authentication probe failed: HTTP ${response.status}`);
  }
}

async function main() {
  const root = path.dirname(require.resolve("../package.json"));
  const eas = JSON.parse(fs.readFileSync(path.join(root, "eas.json"), "utf8"));
  for (const profile of ["production", "preview"]) {
    validateReleaseUrl(eas.build[profile]?.env?.EXPO_PUBLIC_API_URL, `EAS ${profile}`);
  }
  // Expo's loader uses the same .env precedence as a local bundle export.
  require("@expo/env").loadProjectEnv(root, { mode: "production", silent: true });
  validateReleaseUrl(process.env.EXPO_PUBLIC_API_URL ?? PRODUCTION_API_URL, "Bundle environment");
  await probeAuth(PRODUCTION_API_URL);
  console.log("API release check passed: build profiles, bundle environment, and live authentication route.");
}

module.exports = { validateReleaseUrl, probeAuth };
if (require.main === module) main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
