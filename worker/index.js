const MAX_BYTES = 50 * 1024 * 1024;
const MAX_LIFETIME_SECONDS = 24 * 60 * 60;
const QUICK_LIFETIME_SECONDS = 10 * 60;

function json(value, status = 200, headers = {}) {
  return new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json; charset=utf-8", ...headers } });
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin");
  if (!origin || origin !== env.ALLOWED_ORIGIN) return {};
  return { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, X-Share-Mode, X-Share-Expiry, X-Share-Password, X-Share-Downloads, X-File-Name, X-Delete-Token", "Access-Control-Expose-Headers": "X-Share-Name", "Vary": "Origin" };
}

function withCors(response, request, env) {
  const headers = new Headers(response.headers); for (const [name, value] of Object.entries(corsHeaders(request, env))) headers.set(name, value); return new Response(response.body, { status: response.status, headers });
}

function randomBytes(length) { const bytes = new Uint8Array(length); crypto.getRandomValues(bytes); return bytes; }
function base64Url(bytes) { let value = ""; for (const byte of bytes) value += String.fromCharCode(byte); return btoa(value).replace(/\+/gu, "-").replace(/\//gu, "_").replace(/=+$/u, ""); }
async function sha256(value) { return base64Url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)))); }
function newId() { return base64Url(randomBytes(18)); }
function cleanName(value) { try { value = decodeURIComponent(value || "shared-file"); } catch { value = "shared-file"; } return value.replace(/[\\/\r\n\0]/gu, "_").slice(0, 120) || "shared-file"; }
function ttlFor(expiry) { return Math.max(60, Math.min(MAX_LIFETIME_SECONDS, Math.ceil((expiry - Date.now()) / 1000))); }
async function readJson(request) { try { return await request.json(); } catch { return null; } }

async function rateLimit(request, env) {
  const ip = request.headers.get("CF-Connecting-IP");
  if (!ip) return true;
  const bucket = Math.floor(Date.now() / 3600000);
  const key = `rate:${await sha256(ip)}:${bucket}`;
  const count = Number(await env.META.get(key) || "0");
  if (count >= 5) return false;
  await env.META.put(key, String(count + 1), { expirationTtl: 3600 });
  return true;
}

async function createQuickRecord(bytes, request, env) {
  let code, key, existing;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    code = String(10000 + (new DataView(randomBytes(4).buffer).getUint32(0) % 90000)); key = `code:${code}`; existing = await env.META.get(key); if (!existing) break;
  }
  if (existing) throw new Error("Could not reserve a sharing code. Try again.");
  const id = newId(); const exp = Date.now() + QUICK_LIFETIME_SECONDS * 1000; const name = cleanName(request.headers.get("X-File-Name"));
  await env.FILES.put(`f/${id}`, bytes);
  await env.META.put(key, JSON.stringify({ kind: "quick", id, exp, hasPassword: request.headers.get("X-Share-Password") === "true", attempts: 0, size: bytes.byteLength, name }), { expirationTtl: QUICK_LIFETIME_SECONDS });
  return { code };
}

async function createLinkRecord(bytes, request, env) {
  const minutes = Number(request.headers.get("X-Share-Expiry")); if (![10, 60, 1440].includes(minutes)) throw new Error("Choose an expiry of 10 minutes, 1 hour or 24 hours.");
  const id = newId(); const exp = Date.now() + minutes * 60000; const deleteToken = base64Url(randomBytes(24)); const name = cleanName(request.headers.get("X-File-Name")); const deleteTokenHash = await sha256(deleteToken);
  await env.FILES.put(`f/${id}`, bytes); await env.META.put(`link:${id}`, JSON.stringify({ kind: "link", id, exp, hasPassword: request.headers.get("X-Share-Password") === "true", dlLeft: request.headers.get("X-Share-Downloads") === "1" ? 1 : null, deleteTokenHash, size: bytes.byteLength, name }), { expirationTtl: ttlFor(exp) });
  return { id, deleteToken };
}

async function upload(request, env) {
  if (!(await rateLimit(request, env))) return json({ error: "Upload limit reached for this network. Try again later." }, 429);
  const declared = Number(request.headers.get("Content-Length") || "0"); if (declared > MAX_BYTES) return json({ error: "That file is over 50 MB. Choose a smaller one." }, 413);
  const bytes = new Uint8Array(await request.arrayBuffer()); if (bytes.byteLength === 0) return json({ error: "Choose a file before uploading." }, 400); if (bytes.byteLength > MAX_BYTES) return json({ error: "That file is over 50 MB. Choose a smaller one." }, 413);
  const mode = request.headers.get("X-Share-Mode"); if (mode !== "quick" && mode !== "link") return json({ error: "Choose quick share or link share." }, 400);
  try { return json(mode === "quick" ? await createQuickRecord(bytes, request, env) : await createLinkRecord(bytes, request, env), 201); } catch (error) { return json({ error: error.message || "The upload could not be completed." }, 400); }
}

async function findRecord(value, env) { if (/^\d{5}$/u.test(value)) return { key: `code:${value}`, record: await env.META.get(`code:${value}`, "json") }; return { key: `link:${value}`, record: await env.META.get(`link:${value}`, "json") }; }
async function removeFile(record, key, env) { await env.FILES.delete(`f/${record.id}`); await env.META.delete(key); }

async function meta(request, env, value) {
  const found = await findRecord(value, env); if (!found.record) return json({ error: "That file was not found or has expired." }, 404); if (found.record.exp <= Date.now()) { await removeFile(found.record, found.key, env); return json({ error: "This file has expired." }, 410); }
  return json({ id: found.record.kind === "link" ? found.record.id : undefined, size: found.record.size, hasPassword: found.record.hasPassword, exp: found.record.exp });
}

async function download(request, env) {
  const body = await readJson(request); const value = body?.code || body?.id; if (!value) return json({ error: "Enter a code or link." }, 400);
  const found = await findRecord(String(value), env); const attemptKey = `attempt:${await sha256(request.headers.get("CF-Connecting-IP") || "unknown")}:${String(value).slice(0, 80)}`; const attempts = Number(await env.META.get(attemptKey) || "0"); if (attempts >= 5) return json({ error: "Too many attempts. This code is locked for a while." }, 429); await env.META.put(attemptKey, String(attempts + 1), { expirationTtl: 600 });
  if (!found.record) return json({ error: "That code or link was not found. Check it and try again." }, 404); if (found.record.exp <= Date.now()) { await removeFile(found.record, found.key, env); return json({ error: "This file has expired." }, 410); }
  const object = await env.FILES.get(`f/${found.record.id}`); if (!object) { await env.META.delete(found.key); return json({ error: "This file is no longer available." }, 404); }
  if (found.record.kind === "link" && found.record.dlLeft === 1) await removeFile(found.record, found.key, env); else if (found.record.kind === "link" && found.record.dlLeft !== null) { found.record.dlLeft -= 1; await env.META.put(found.key, JSON.stringify(found.record), { expirationTtl: ttlFor(found.record.exp) }); }
  await env.META.delete(attemptKey); const headers = { "Content-Type": "application/octet-stream", "Content-Length": String(object.size), "Cache-Control": "no-store", "X-Share-Name": encodeURIComponent(found.record.name || "shared-file") }; return new Response(object.body, { headers });
}

async function deleteFile(request, env, id) {
  const key = `link:${id}`; const record = await env.META.get(key, "json"); if (!record) return json({ error: "That link was not found or has expired." }, 404); const token = request.headers.get("X-Delete-Token"); if (!token || (await sha256(token)) !== record.deleteTokenHash) return json({ error: "The delete token is not valid." }, 403); await removeFile(record, key, env); return json({ deleted: true });
}

async function cleanup(env) {
  for (const prefix of ["code:", "link:"]) { let cursor; do { const page = await env.META.list({ prefix, cursor, limit: 100 }); for (const item of page.keys) { const record = await env.META.get(item.name, "json"); if (record?.exp <= Date.now()) await removeFile(record, item.name, env); } cursor = page.list_complete ? undefined : page.cursor; } while (cursor); }
}

export default { async fetch(request, env) { if (!env.ALLOWED_ORIGIN) return json({ error: "Share API is not configured." }, 503); const origin = request.headers.get("Origin"); if (origin && origin !== env.ALLOWED_ORIGIN) return new Response("Forbidden", { status: 403 }); const url = new URL(request.url); let response; if (request.method === "OPTIONS") response = new Response(null, { status: 204 }); else if (request.method === "POST" && url.pathname === "/api/upload") response = await upload(request, env); else if (request.method === "GET" && url.pathname.startsWith("/api/meta/")) response = await meta(request, env, decodeURIComponent(url.pathname.slice("/api/meta/".length))); else if (request.method === "POST" && url.pathname === "/api/download") response = await download(request, env); else if (request.method === "DELETE" && url.pathname.startsWith("/api/file/")) response = await deleteFile(request, env, decodeURIComponent(url.pathname.slice("/api/file/".length))); else response = json({ error: "Route not found." }, 404); return withCors(response, request, env); }, async scheduled(_event, env) { await cleanup(env); } };