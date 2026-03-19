#!/usr/bin/env node
/**
 * LinkedIn OAuth 2.0 Setup Helper
 * Run this once to get your access token, then add it to .env
 *
 * Usage:
 *   node mcp/oauth-setup.js
 *
 * Prerequisites:
 *   1. Create a LinkedIn App: https://www.linkedin.com/developers/apps
 *   2. Set Authorized Redirect URL to: http://localhost:3000/callback
 *   3. Enable: r_liteprofile, r_emailaddress, w_member_social, rw_company_admin
 *   4. Copy your Client ID and Client Secret into .env
 */

const http = require("http");
const { exec } = require("child_process");
require("dotenv").config();

const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:3000/callback";
const SCOPES = ["r_liteprofile", "r_emailaddress", "w_member_social", "rw_company_admin", "r_1st_connections_size"];

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET in your .env file first.");
  process.exit(1);
}

const STATE = Math.random().toString(36).substring(2);
const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${STATE}&scope=${SCOPES.join("%20")}`;

console.log("\n=== LinkedIn OAuth Setup ===\n");
console.log("Opening browser to authorize...\n");
console.log("Auth URL:", authUrl, "\n");

// Try to open browser
exec(`xdg-open "${authUrl}" 2>/dev/null || open "${authUrl}" 2>/dev/null || echo "Please open the URL above manually"`);

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost:3000");
  if (url.pathname !== "/callback") {
    res.end("Not found");
    return;
  }

  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");

  if (returnedState !== STATE) {
    res.end("State mismatch — possible CSRF. Try again.");
    server.close();
    return;
  }

  // Exchange code for token
  const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });

  const token = await tokenRes.json();

  if (token.access_token) {
    console.log("\n=== SUCCESS ===");
    console.log("Access Token:", token.access_token);
    console.log("Expires in:", token.expires_in, "seconds");
    console.log("\nAdd this to your .env file:");
    console.log(`LINKEDIN_ACCESS_TOKEN=${token.access_token}`);

    res.end(`
      <h2>Success!</h2>
      <p>Your LinkedIn access token has been printed in the terminal.</p>
      <p>Add it to your .env file as <code>LINKEDIN_ACCESS_TOKEN</code></p>
      <p>You can close this window.</p>
    `);
  } else {
    console.error("Token exchange failed:", JSON.stringify(token, null, 2));
    res.end("<h2>Error — check your terminal for details</h2>");
  }

  server.close();
  process.exit(0);
});

server.listen(3000, () => {
  console.log("Waiting for OAuth callback on http://localhost:3000/callback ...");
});
