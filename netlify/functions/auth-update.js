const { loadDB, saveDB, hashPassword, verifyPassword } = require("./_lib/db");
const { json, preflight } = require("./_lib/http");
const { requireAuth, sign } = require("./_lib/auth");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return preflight();
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed." });

  try {
    requireAuth(event);
  } catch (err) {
    return json(err.statusCode || 401, { error: err.message });
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid request body." });
  }

  const { currentPassword, newUsername, newPassword } = body;
  const data = await loadDB();

  if (!verifyPassword(currentPassword || "", data.admin.salt, data.admin.hash)) {
    return json(400, { error: "Current password is incorrect." });
  }

  if (newUsername) data.admin.username = newUsername;
  if (newPassword) {
    const { salt, hash } = hashPassword(newPassword);
    data.admin.salt = salt;
    data.admin.hash = hash;
  }

  await saveDB(data);
  const token = sign({ username: data.admin.username });
  return json(200, { token, username: data.admin.username });
};
