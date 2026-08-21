const { loadDB, saveDB } = require("./_lib/db");
const { json, preflight } = require("./_lib/http");
const { requireAuth } = require("./_lib/auth");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return preflight();

  try {
    requireAuth(event);
  } catch (err) {
    return json(err.statusCode || 401, { error: err.message });
  }

  const data = await loadDB();

  if (event.httpMethod === "GET") {
    return json(200, data.tiktok);
  }

  if (event.httpMethod === "PUT") {
    let body;
    try {
      body = JSON.parse(event.body || "{}");
    } catch {
      return json(400, { error: "Invalid request body." });
    }
    const { provider, apiKey } = body;
    if (!apiKey || !apiKey.trim()) {
      return json(400, { error: "Enter an API key first." });
    }
    data.tiktok = { provider: provider || data.tiktok.provider, apiKey };
    await saveDB(data);
    return json(200, data.tiktok);
  }

  return json(405, { error: "Method not allowed." });
};
