// Test DeepSeek API key validity
import https from "node:https";

const KEY = process.env.ANTHROPIC_AUTH_TOKEN || "";

if (!KEY) {
  console.log("ERROR: ANTHROPIC_AUTH_TOKEN not set");
  process.exit(1);
}

console.log("Testing key:", KEY.slice(0, 10) + "..." + KEY.slice(-4));

const req = https.request({
    hostname: "api.deepseek.com",
    path: "/v1/models",
    method: "GET",
    headers: { "Authorization": `Bearer ${KEY}` }
}, res => {
    let d = "";
    res.on("data", c => d += c);
    res.on("end", () => {
        console.log("Status:", res.statusCode);
        if (res.statusCode === 200) {
            const models = JSON.parse(d);
            console.log("Models:", models.data?.map(m => m.id).join(", ") || d.slice(0, 300));
        } else {
            console.log("Error body:", d.slice(0, 500));
        }
    });
});
req.on("error", e => console.error("Connection error:", e.message));
req.end();
