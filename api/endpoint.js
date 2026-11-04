// Shared by REST, token refresh, chat, and release checks. Keep this address
// available while any released app still uses it, even after adding a custom domain.
const PRODUCTION_API_URL = "https://propertyloop-backend.up.railway.app/api";
const RETIRED_API_URL = "https://propertyloopbackend-production.up.railway.app/api";

/** @param {string | undefined} configuredUrl */
function resolveApiBaseUrl(configuredUrl) {
  const value = configuredUrl?.trim().replace(/\/+$/, "");
  // Older EAS profiles and environments can override the corrected fallback.
  // Redirect this known retired endpoint before sending credentials or opening chat.
  if (!value || value === RETIRED_API_URL) return PRODUCTION_API_URL;
  return value;
}

module.exports = { PRODUCTION_API_URL, RETIRED_API_URL, resolveApiBaseUrl };
