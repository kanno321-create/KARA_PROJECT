// scripts/health_probe.mjs
const BASE = process.env.BASE_URL || "http://127.0.0.1:7000";
const URL = `${BASE}/health`;

const ok = (res) => res && (res.ok || res.status === 200);

try {
  const res = await fetch(URL, { method: "GET" });
  if (!ok(res)) {
    console.error(`[health] HTTP=${res.status} ${res.statusText}`);
    process.exit(1);
  }
  const body = await res.json().catch(() => ({}));
  console.log(`[health] OK ${res.status}`, body);
} catch (e) {
  console.error(`[health] Failed: ${e.message}`);
  process.exit(1);
}
