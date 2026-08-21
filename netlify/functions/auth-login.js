const { loadDB, verifyPassword } = require("./_lib/db");
const { json, preflight } = require("./_lib/http");
const { sign } = require("./_lib/auth");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return preflight();
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed." });

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid request body." });
  }

  const { username, password } = body;
  if (!username || !password) {
    return json(400, { error: "Enter a username and password." });
  }

  const data = await loadDB();
  const ok =
    data.admin.username === username &&
    verifyPassword(password, data.admin.salt, data.admin.hash);

  if (!ok) return json(401, { error: "Incorrect username or password." });

  const token = sign({ username });
  return json(200, { token, username });
};
