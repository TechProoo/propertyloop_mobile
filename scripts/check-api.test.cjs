const { test } = require("node:test");
const assert = require("node:assert/strict");
const { PRODUCTION_API_URL, RETIRED_API_URL, resolveApiBaseUrl } = require("../api/endpoint");
const { validateReleaseUrl, probeAuth } = require("./check-api.cjs");

test("a retired environment override cannot send signup or refresh to the old server", () => {
  assert.equal(resolveApiBaseUrl(RETIRED_API_URL), PRODUCTION_API_URL);
  assert.equal(resolveApiBaseUrl(` ${RETIRED_API_URL}/ `), PRODUCTION_API_URL);
  assert.equal(resolveApiBaseUrl(undefined), PRODUCTION_API_URL);
  assert.equal(resolveApiBaseUrl("  "), PRODUCTION_API_URL);
});

test("development endpoints are preserved", () => {
  assert.equal(resolveApiBaseUrl("http://localhost:3000/api/"), "http://localhost:3000/api");
});

test("release validation rejects retired, missing, and unverified addresses", () => {
  for (const value of [undefined, "", RETIRED_API_URL, "http://localhost:3000/api", "https://unverified.example/api"]) {
    assert.throws(() => validateReleaseUrl(value, "test"));
  }
  assert.equal(validateReleaseUrl(PRODUCTION_API_URL, "test"), PRODUCTION_API_URL);
});

test("the probe checks mobile authentication without following redirects", async () => {
  await probeAuth(PRODUCTION_API_URL, async (url, options) => {
    assert.equal(url, `${PRODUCTION_API_URL}/auth/me`);
    assert.equal(options.headers["X-Client-Platform"], "mobile");
    assert.equal(options.redirect, "error");
    return new Response(JSON.stringify({ statusCode: 401, message: "Unauthorized" }), { status: 401 });
  });
});

test("Railway fallback errors and generic successful pages fail the release check", async () => {
  for (const [status, body] of [[404, { message: "Application not found" }], [200, { status: "ok" }], [401, { message: "Application not found" }]]) {
    await assert.rejects(probeAuth(PRODUCTION_API_URL, async () => new Response(JSON.stringify(body), { status })));
  }
});
