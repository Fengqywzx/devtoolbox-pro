// Test ofox.ai Anthropic compatibility
// Usage: node scripts/test-ofox.mjs

import https from "node:https";
import http from "node:http";

// Read key from CC Switch database
import { Database } from "node:sqlite3";
// Fallback: read from settings.json
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function getKey() {
  // Try reading from settings.json
  try {
    const settings = JSON.parse(
      readFileSync(resolve(process.env.HOME || "~", ".claude/settings.json"), "utf-8")
    );
    return settings.env?.ANTHROPIC_AUTH_TOKEN || "";
  } catch {
    return "";
  }
}

function testModel(modelName) {
  return new Promise((resolve) => {
    const body = JSON.stringify({
      model: modelName,
      max_tokens: 20,
      messages: [{ role: "user", content: "Say OK" }],
    });

    const url = new URL("https://api.ofox.io/anthropic/v1/messages");
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": KEY,
        "anthropic-version": "2023-06-01",
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          if (json.error) {
            console.log(`  ${modelName} -> ERROR: ${json.error.message}`);
          } else {
            const text = json.content?.[0]?.text?.slice(0, 50) || "";
            console.log(`  ${modelName} -> OK (${json.model}): ${text}`);
          }
        } catch {
          console.log(`  ${modelName} -> PARSE FAIL: ${data.slice(0, 100)}`);
        }
        resolve();
      });
    });
    req.on("error", (e) => {
      console.log(`  ${modelName} -> NET FAIL: ${e.message}`);
      resolve();
    });
    req.write(body);
    req.end();
  });
}

const KEY = getKey();
if (!KEY) {
  console.log("ERROR: No API key found in settings.json");
  process.exit(1);
}
console.log(`Key prefix: ${KEY.slice(0, 10)}...${KEY.slice(-4)}`);

const models = [
  "claude-sonnet-4-6",
  "claude-haiku-4-5",
  "claude-opus-4-8",
  "claude-sonnet-4-5",
];

console.log("\nTesting models via ofox /anthropic/v1/messages:\n");
await Promise.all(models.map(testModel));
console.log("\nDone.");
