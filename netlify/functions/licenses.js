const crypto = require("crypto");
const { loadDB, saveDB } = require("./_lib/db");
const { json, preflight } = require("./_lib/http");
const { requireAuth } = require("./_lib/auth");

const PLAN_DAYS = { weekly: 7, monthly: 30, lifetime: null };
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function makeKey() {
  const seg = () =>
    Array.from({ length: 4 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join("");
  return `TLG-${seg()}-${seg()}-${seg()}`;
}

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

  const data = await loadDB();

  if (event.httpMethod === "GET") {
    const params = event.queryStringParameters || {};
    const q = (params.search || "").trim().toLowerCase();
    const status = params.status || "all";
    const result = data.licenses
      .map(withComputedStatus)
      .filter((l) => {
        const matchesSearch =
          !q ||
          l.key.toLowerCase().includes(q) ||
          (l.customerName || "").toLowerCase().includes(q) ||
          (l.customerEmail || "").toLowerCase().includes(q);
        const matchesStatus = status === "all" || l.effectiveStatus === status;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => b.createdAt - a.createdAt);
    return json(200, result);
  }

  if (event.httpMethod === "POST") {
    let body;
    try {
      body = JSON.parse(event.body || "{}");
    } catch {
      return json(400, { error: "Invalid request body." });
    }

    // "plan" can be weekly / monthly / lifetime, or "custom" together
    // with "days" for any exact number of days you want the key to last.
    const {
      plan = "monthly",
      days,
      maxDevices = 1,
      quantity = 1,
      customerName = "",
      customerEmail = "",
    } = body;

    const qty = Math.max(1, Math.min(50, Number(quantity) || 1));
    const planLength = plan === "custom" ? Number(days) || 30 : PLAN_DAYS[plan];
    const now = Date.now();

    const created = Array.from({ length: qty }, () => ({
      id: crypto.randomUUID(),
      key: makeKey(),
      customerName,
      customerEmail,
      plan,
      status: "active",
      maxDevices: Number(maxDevices) || 1,
      deviceIds: [],
      createdAt: now,
      expiresAt: planLength ? now + planLength * 24 * 60 * 60 * 1000 : null,
    }));

    data.licenses = [...created, ...data.licenses];
    await saveDB(data);
    return json(201, created);
  }

  return json(405, { error: "Method not allowed." });
};
