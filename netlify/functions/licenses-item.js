const { loadDB, saveDB } = require("./_lib/db");
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

  if (event.httpMethod !== "PATCH") return json(405, { error: "Method not allowed." });

  const id = (event.queryStringParameters || {}).id;
  if (!id) return json(400, { error: "Missing license id." });

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid request body." });
  }

  const data = await loadDB();
  const license = data.licenses.find((l) => l.id === id);
  if (!license) return json(404, { error: "License not found." });

  license.status = body.status === "disabled" ? "disabled" : "active";
  await saveDB(data);
  return json(200, withComputedStatus(license));
};
