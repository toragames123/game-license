const { loadDB } = require("./_lib/db");
const { json, preflight } = require("./_lib/http");
const { requireAuth } = require("./_lib/auth");

function withComputedStatus(license) {
  const expired = license.expiresAt && license.expiresAt < Date.now();
  return {
    ...license,
    effectiveStatus: license.status === "disabled" ? "disabled" : expired ? "expired" : "active",
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return preflight();

  try {
    requireAuth(event);
  } catch (err) {
    return json(err.statusCode || 401, { error: err.message });
  }

  if (event.httpMethod !== "GET") return json(405, { error: "Method not allowed." });

  const data = await loadDB();
  const withStatus = data.licenses.map(withComputedStatus);
  return json(200, {
    total: withStatus.length,
    active: withStatus.filter((l) => l.effectiveStatus === "active").length,
    expired: withStatus.filter((l) => l.effectiveStatus === "expired").length,
    disabled: withStatus.filter((l) => l.effectiveStatus === "disabled").length,
    customers: new Set(withStatus.filter((l) => l.customerEmail).map((l) => l.customerEmail)).size,
  });
};
