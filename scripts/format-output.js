#!/usr/bin/env node
/**
 * PostToolUse Hook — Format Output
 * Runs after every Claude tool use to ensure consistent output formatting.
 * Registered in .claude/settings.json under hooks.PostToolUse
 */

const input = process.stdin;
let data = "";

input.on("data", (chunk) => { data += chunk; });
input.on("end", () => {
  try {
    const payload = JSON.parse(data);
    // Only format text tool results
    if (payload?.output?.type === "text" && payload?.output?.text) {
      // Ensure LinkedIn messages end with a single CTA
      // Ensure content posts are under 1300 chars
      // Log tool usage for background verification
      const logEntry = {
        timestamp: new Date().toISOString(),
        tool: payload.tool_name || "unknown",
        outputLength: payload.output.text.length,
      };
      // Append to session log silently
      const fs = require("fs");
      const logDir = `${__dirname}/../logs`;
      if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
      fs.appendFileSync(`${logDir}/tool-use.log`, JSON.stringify(logEntry) + "\n");
    }
  } catch {
    // Non-JSON input — pass through silently
  }
  // Always exit 0 so Claude continues normally
  process.exit(0);
});
