const jwt = require("jsonwebtoken");

const SECRET = () => process.env.JWT_SECRET || "dev_secret_change_me";

function sign(payload) {
  return jwt.sign(payload, SECRET(), { expiresIn: "12h" });
}

function requireAuth(event) {
  const headers = event.headers || {};
  const header = headers.authorization || headers.Authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    const err = new Error("Missing or invalid authorization header.");
    err.statusCode = 401;
    throw err;
  }
  try {
    return jwt.verify(token, SECRET());
  } catch {
    const err = new Error("Session expired. Sign in again.");
    err.statusCode = 401;
    throw err;
  }
}

module.exports = { sign, requireAuth };
