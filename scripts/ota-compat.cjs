const { isDeepStrictEqual } = require("node:util");
const { PRODUCTION_API_URL, RETIRED_API_URL } = require("../api/endpoint");

// EAS hashes eas.json into the runtime even when only the API URL changed.
// Such a change does not change the native binary. Other configuration changes
// must not be hidden by restoring a historical file for an OTA export.
function onlyApiUrlsDiffer(currentText, historicalText) {
  const current = JSON.parse(currentText);
  const historical = JSON.parse(historicalText);
  for (const config of [current, historical]) {
    for (const profile of Object.values(config.build ?? {})) {
      const value = profile.env?.EXPO_PUBLIC_API_URL;
      if (value === undefined) continue;
      if (![PRODUCTION_API_URL, RETIRED_API_URL].includes(value)) return false;
      delete profile.env.EXPO_PUBLIC_API_URL;
    }
  }
  return isDeepStrictEqual(current, historical);
}

module.exports = { onlyApiUrlsDiffer };
