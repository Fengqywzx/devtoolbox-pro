// DeepSeek Anthropic-compatible proxy
// Fixes: strips "system" role from messages array for DeepSeek compatibility
// Usage: node scripts/deepseek-proxy.mjs
// Then set ANTHROPIC_BASE_URL=http://localhost:9876

import http from "node:http";

const DEEPSEEK_URL = "https://api.deepseek.com";
const PORT = 9876;

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    return res.end();
  }

  // Collect body
  let body = "";
  req.on("data", (chunk) => (body += chunk));

  req.on("end", async () => {
    try {
      let payload = JSON.parse(body);

      // FIX: If system prompt is inside messages array, move it to top-level
      if (payload.messages && Array.isArray(payload.messages)) {
        const systemMsgs = payload.messages.filter(
          (m) => m.role === "system"
        );
        const nonSystemMsgs = payload.messages.filter(
          (m) => m.role !== "system"
        );

        if (systemMsgs.length > 0) {
          // Extract system content to top-level
          const systemContent = systemMsgs.map((m) => m.content).join("\n\n");
          if (!payload.system) {
            payload.system = systemContent;
          } else if (Array.isArray(payload.system)) {
            payload.system.push({ type: "text", text: systemContent });
          }
          payload.messages = nonSystemMsgs;
          console.log(
            `[proxy] Moved ${systemMsgs.length} system message(s) to top-level`
          );
        }
      }

      // Convert model name: strip [1M] suffix if present
      if (payload.model && payload.model.includes("[1M]")) {
        payload.model = payload.model.replace("[1M]", "");
      }

      // Forward to DeepSeek
      const targetPath = req.url || "/anthropic/messages";
      const resp = await fetch(`${DEEPSEEK_URL}${targetPath}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: req.headers["authorization"] || "",
          "x-api-key": req.headers["x-api-key"] || "",
        },
        body: JSON.stringify(payload),
      });

      res.writeHead(resp.status, {
        "Content-Type": resp.headers.get("content-type") || "application/json",
      });

      const respBody = await resp.text();
      res.end(respBody);

      console.log(
        `[proxy] ${req.url} → ${resp.status} (${(body.length / 1024).toFixed(1)}KB → ${(respBody.length / 1024).toFixed(1)}KB)`
      );
    } catch (e) {
      console.error("[proxy] Error:", e.message);
      res.writeHead(500);
      res.end(JSON.stringify({ error: e.message }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`[proxy] DeepSeek Anthropic proxy on http://localhost:${PORT}`);
  console.log(`[proxy] Set ANTHROPIC_BASE_URL=http://localhost:${PORT}`);
});
