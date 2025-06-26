import { SignJWT, importPKCS8 } from "jose";
import fs from "fs";
// use .env file to set the following variables
import "dotenv/config";

// script to generate a new apple jwt, needs to be generated every 180 days

const privateKey = fs.readFileSync(process.env.APPLE_PRIVATE_KEY_PATH, "utf8");
const teamId = process.env.APPLE_TEAM_ID;
const clientId = process.env.APPLE_CLIENT_ID;
const keyId = process.env.APPLE_KEY_ID;

const jwt = await new SignJWT({
  iss: teamId,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 86400 * 180, // 180 days max
  aud: "https://appleid.apple.com",
  sub: clientId,
})
  .setProtectedHeader({ alg: "ES256", kid: keyId })
  .sign(await importPKCS8(privateKey, "ES256"));

console.log(jwt);
