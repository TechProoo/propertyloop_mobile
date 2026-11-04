const { test } = require("node:test");
const assert = require("node:assert/strict");
const { onlyApiUrlsDiffer, alignLineEndings } = require("./ota-compat.cjs");
const { PRODUCTION_API_URL, RETIRED_API_URL } = require("../api/endpoint");
const config = (url, channel = "production", extraEnv = {}) => JSON.stringify({
  build: { production: { channel, env: { EXPO_PUBLIC_API_URL: url, ...extraEnv } } },
});

test("a historical EAS API URL can be restored for fingerprint comparison", () => {
  assert.equal(onlyApiUrlsDiffer(config(PRODUCTION_API_URL), config(RETIRED_API_URL)), true);
});

test("native configuration, channels, and unrelated environment changes cannot be hidden", () => {
  assert.equal(onlyApiUrlsDiffer(config(PRODUCTION_API_URL), config(RETIRED_API_URL, "preview")), false);
  assert.equal(onlyApiUrlsDiffer(config(PRODUCTION_API_URL), config(RETIRED_API_URL, "production", { NATIVE_VARIANT: "other" })), false);
  assert.equal(onlyApiUrlsDiffer(config(PRODUCTION_API_URL), config("https://unknown.example/api")), false);
});

test("historical config preserves the checkout's line endings for byte-based fingerprinting", () => {
  assert.equal(alignLineEndings("first\nsecond\n", "existing\r\n"), "first\r\nsecond\r\n");
  assert.equal(alignLineEndings("first\r\nsecond\r\n", "existing\n"), "first\nsecond\n");
});
