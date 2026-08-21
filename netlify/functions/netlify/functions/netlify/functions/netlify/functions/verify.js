const { loadDB, saveDB } = require("./_lib/db");
const { json, preflight } = require("./_lib/http");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return preflight();
  if (event.httpMethod !== "POST") {
    return json(405, { valid: false, reason: "method_not_allowed" });
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { valid: false, reason: "invalid_body" });
  }

  const { key, deviceId } = body;
  if (!key || !deviceId) {
    return json(400, { valid: false, reason: "missing_key_or_device" });
  }

  const data = await loadDB();
  const license = data.licenses.find((l) => l.key === key);

  if (!license) return json(200, { valid: false, reason: "not_found" });
  if (license.status === "disabled") return json(200, { valid: false, reason: "disabled" });
  if (license.expiresAt && license.expiresAt < Date.now()) {
    return json(200, { valid: false, reason: "expired" });
  }

  const alreadyRegistered = license.deviceIds.includes(deviceId);
  if (!alreadyRegistered) {
    if (license.deviceIds.length >= license.maxDevices) {
      return json(200, { valid: false, reason: "device_limit_reached" });
    }
    license.deviceIds.push(deviceId);
    await saveDB(data);
  }

  const daysLeft = license.expiresAt
    ? Math.max(0, Math.ceil((license.expiresAt - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return json(200, {
    valid: true,
    plan: license.plan,
    expiresAt: license.expiresAt,
    daysLeft,
    devicesUsed: license.deviceIds.length,
    maxDevices: license.maxDevices,
  });
};
