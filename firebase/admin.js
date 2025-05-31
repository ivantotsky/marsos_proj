import admin from "firebase-admin";

if (!process.env.FIREBASE_CREDENTIALS_BASE64) {
  throw new Error("Missing FIREBASE_CREDENTIALS_BASE64");
}

const json = Buffer.from(
  process.env.FIREBASE_CREDENTIALS_BASE64,
  "base64"
).toString("utf8");
const creds = JSON.parse(json);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(creds),
  });
}

export default admin;
