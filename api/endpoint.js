// Shared by REST, token refresh, chat, and release checks. Keep this address
// available while any released app still uses it, even after adding a custom domain.
const PRODUCTION_API_URL = "https://propertyloopbackend-production.up.railway.app/api";
const PREVIOUS_API_URL = "https://propertyloop-backend.up.railway.app/api";

/** @param {string | undefined} configuredUrl */
function resolveApiBaseUrl(configuredUrl) {
  const value = configuredUrl?.trim().replace(/\/+$/, "");
  // An older build environment may still supply the hostname used during the
  // migration. Keep REST, refresh, and chat on the restored production address.
  if (!value || value === PREVIOUS_API_URL) return PRODUCTION_API_URL;
  return value;
}

module.exports = { PRODUCTION_API_URL, PREVIOUS_API_URL, resolveApiBaseUrl };
