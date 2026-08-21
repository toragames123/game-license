const { json, preflight } = require("./_lib/http");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return preflight();
  return json(200, { ok: true });
};
