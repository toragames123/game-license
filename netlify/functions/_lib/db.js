const { getStore } = require("@netlify/blobs");
const crypto = require("crypto");

const STORE_NAME = "license-admin";
const KEY = "db";

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return { salt, hash };
}

function verifyPassword(password, salt, hash) {
  const check = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return check === hash;
}

function seed() {
  const { salt, hash } = hashPassword("admin123");
  return {
    admin: { username: "Tora", salt, hash },
    tiktok: { provider: "TikTool", apiKey: "" },
    licenses: [],
  };
}

async function loadDB() {
  const store = getStore(STORE_NAME);
  const data = await store.get(KEY, { type: "json" });
  if (!data) {
    const initial = seed();
    await store.setJSON(KEY, initial);
    return initial;
  }
  return data;
}

async function saveDB(data) {
  const store = getStore(STORE_NAME);
  await store.setJSON(KEY, data);
}

module.exports = { loadDB, saveDB, hashPassword, verifyPassword };
