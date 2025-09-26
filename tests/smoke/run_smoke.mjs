// ============================================================================
// File: tests/smoke/run_smoke.mjs   (?„ì²´ êµì²´)
// Purpose: 7ì¢??¤ëª¨??(HEALTH / ABSTAIN / SCHEMA_422Ã—2 / BAD_CONTENT_TYPE / BAD_JSON / EMPTY_JSON)
// ============================================================================
const BASE = process.env.BASE_URL || "http://127.0.0.1:7000";
const CREATE = `${BASE}/v1/estimate/create`;
const HEALTH = `${BASE}/v1/health`;
const KNOWN_MODEL = process.env.KNOWN_MODEL || ""; // ?ˆìœ¼ë©?OK ì¼€?´ìŠ¤ ?˜í–‰

const results = [];
const pass = (name, extra={}) => results.push({ name, status: "PASS", ...extra });
const fail = (name, msg, extra={}) => results.push({ name, status: "FAIL", msg, ...extra });

async function jfetch(url, init={}) {
  const res = await fetch(url, init);
  let json = null;
  try { json = await res.json(); } catch {}
  return { res, json };
}

function payloadBase() {
  return {
    brand: "SANGDO",
    form: "ECONOMIC",
    installation: { location: "INDOOR", mount: "FLUSH" },
    device: { type: "MCCB" },
    main: { enabled: true, af: 630, at: 630, poles: "3P", model: "SBS-UNKNOWN" },
    branches: [{ af: 100, at: 100, poles: "3P", qty: 4 }],
    accessories: { enabled: false }
  };
}

async function testHealth() {
  const { res, json } = await jfetch(HEALTH);
  const ok = res.status === 200 && (json?.ok === true || Object.keys(json||{}).length > 0);
  ok ? pass("HEALTH_200", { http: res.status }) : fail("HEALTH_200", `Unexpected: ${res.status}`, { json });
}

async function testAbstain() {
  const body = payloadBase();
  const { res, json } = await jfetch(CREATE, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8", "Idempotency-Key": `smoke-${Date.now()}` },
    body: JSON.stringify(body)
  });
  const ok = res.status === 200 && json?.decision === "ABSTAIN";
  ok ? pass("ABSTAIN_200", { reasons: json?.reasons }) : fail("ABSTAIN_200", `HTTP=${res.status} decision=${json?.decision}`, { json });
}

async function test422Required() {
  const bad = payloadBase();
  delete bad.brand;
  const { res, json } = await jfetch(CREATE, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(bad)
  });
  const ok = res.status === 422 && (json?.code || "").toString().toUpperCase().includes("SCHEMA");
  ok ? pass("SCHEMA_422_MISSING_BRAND", { http: res.status }) : fail("SCHEMA_422_MISSING_BRAND", `HTTP=${res.status}`, { json });
}

async function test422QtyCountConflict() {
  const bad = payloadBase();
  bad.branches[0].count = 2; // ?•ì±…??qtyë§??ˆìš©, ?™ì‹œ ?…ë ¥ ??422 ê¸°ë?
  const { res, json } = await jfetch(CREATE, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(bad)
  });
  const ok = res.status === 422;
  ok ? pass("SCHEMA_422_QTY_COUNT_CONFLICT", { http: res.status }) : fail("SCHEMA_422_QTY_COUNT_CONFLICT", `HTTP=${res.status}`, { json });
}

async function test415BadContentType() {
  const { res, json } = await jfetch(CREATE, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: "this is not json"
  });
  const ok = res.status === 415;
  ok ? pass("BAD_CONTENT_TYPE_415", { http: res.status }) : fail("BAD_CONTENT_TYPE_415", `HTTP=${res.status}`, { json });
}

async function test400BadJson() {
  // ?˜ëª»??JSON êµ¬ë¬¸ (?°ì˜´???„ë½)
  const badJson = '{ "brand": "SANGDO", "form": ECONOMIC }';
  const { res, json } = await jfetch(CREATE, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: badJson
  });
  const ok = res.status === 400 && (json?.code === "BAD_REQUEST");
  ok ? pass("BAD_JSON_400", { http: res.status }) : fail("BAD_JSON_400", `HTTP=${res.status}`, { json });
}

async function test400EmptyJson() {
  // ë³¸ë¬¸ ?„ì „ ë¹„ì? ??EMPTY_JSON ??400 ê¸°ë?
  const { res, json } = await jfetch(CREATE, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: "" // empty body
  });
  const ok = res.status === 400 && (json?.code === "BAD_REQUEST");
  ok ? pass("EMPTY_JSON_400", { http: res.status }) : fail("EMPTY_JSON_400", `HTTP=${res.status}`, { json });
}

async function testOKIfKnownModel() {
  if (!KNOWN_MODEL) {
    pass("OK_KNOWN_MODEL_SKIPPED", { note: "Set KNOWN_MODEL to enable" });
    return;
  }
  const body = payloadBase();
  body.main.model = KNOWN_MODEL;
  const { res, json } = await jfetch(CREATE, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body)
  });
  const ok = res.status === 200 && json?.decision === "OK";
  ok ? pass("OK_200_KNOWN_MODEL", { price: json?.price }) : fail("OK_200_KNOWN_MODEL", `HTTP=${res.status} decision=${json?.decision}`, { json });
}

async function main() {
  console.log(`[smoke] BASE=${BASE}`);
  await testHealth();
  await testAbstain();
  await test422Required();
  await test422QtyCountConflict();
  await test415BadContentType();
  await test400BadJson();     // NEW
  await test400EmptyJson();   // NEW
  await testOKIfKnownModel(); // optional

  const summary = {
    total: results.length,
    pass: results.filter(r=>r.status==="PASS").length,
    fail: results.filter(r=>r.status==="FAIL").length,
  };
  console.table(results.map(({name,status,http,msg})=>({name,status,http,msg:msg||""})));
  console.log(`[smoke] Summary:`, summary);
  process.exit(summary.fail === 0 ? 0 : 1);
}

main().catch(e => {
  console.error(`[smoke] FATAL`, e);
  process.exit(1);
});
