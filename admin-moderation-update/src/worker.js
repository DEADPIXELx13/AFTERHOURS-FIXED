const textEncoder = new TextEncoder();

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "Content-Type": "application/json; charset=utf-8" }
});

function unavailable() {
  return json({ error: "Guestbook is not set up yet." }, 503);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function cookie(request, name) {
  const match = request.headers.get("Cookie")?.match(new RegExp("(?:^|;\\s*)" + name + "=([^;]+)"));
  return match ? match[1] : "";
}

function base64url(bytes) {
  const string = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(string).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64url(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - value.length % 4) % 4);
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
}

async function signingKey(password) {
  return crypto.subtle.importKey("raw", textEncoder.encode(password), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

async function makeSession(password) {
  const key = await signingKey(password);
  const signature = await crypto.subtle.sign("HMAC", key, textEncoder.encode("afterhours-admin-v1"));
  return base64url(signature);
}

async function signedIn(request, env) {
  if (!env.ADMIN_PASSWORD) return false;
  const value = cookie(request, "afterhours_admin");
  if (!value) return false;
  try {
    const key = await signingKey(env.ADMIN_PASSWORD);
    return crypto.subtle.verify("HMAC", key, fromBase64url(value), textEncoder.encode("afterhours-admin-v1"));
  } catch {
    return false;
  }
}

async function correctPassword(attempt, realPassword) {
  try {
    const realKey = await signingKey(realPassword);
    const proof = await crypto.subtle.sign("HMAC", realKey, textEncoder.encode("afterhours-login-check"));
    const attemptKey = await signingKey(attempt);
    return crypto.subtle.verify("HMAC", attemptKey, proof, textEncoder.encode("afterhours-login-check"));
  } catch {
    return false;
  }
}

function adminShell(contents) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AFTERHOURS ADMIN</title><link rel="stylesheet" href="/style.css"></head><body><div id="site"><header><h1>AFTERHOURS</h1><div>GUESTBOOK CLEANUP</div></header><main>${contents}</main><footer><a href="/index.html">back home</a></footer></div></body></html>`;
}

function loginPage(message = "") {
  const note = message ? `<p class="small">${escapeHtml(message)}</p>` : "";
  return new Response(adminShell(`<h2>ADMIN LOGIN</h2>${note}<form method="post" action="/admin/login"><p>password:<br><input type="password" name="password" required autofocus></p><button type="submit">LOG IN</button></form>`), {
    status: message ? 401 : 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" }
  });
}

async function adminPage(request, env) {
  if (!env.ADMIN_PASSWORD) {
    return new Response(adminShell("<h2>ADMIN LOGIN</h2><p class=\"small\">Admin password has not been set up yet.</p>"), { status: 503, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
  }
  if (!await signedIn(request, env)) return loginPage();
  if (!env.DB) return new Response(adminShell("<h2>GUESTBOOK CLEANUP</h2><p class=\"small\">Guestbook database is not connected yet.</p>"), { status: 503, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });

  try {
    const { results = [] } = await env.DB.prepare("SELECT id, name, message, date FROM guestbook ORDER BY id DESC LIMIT 500").all();
    const entries = results.length ? results.map((entry) => `<div class="comment"><b>${escapeHtml(entry.name)} — ${escapeHtml(entry.date)}</b><br>${escapeHtml(entry.message)}<form method="post" action="/admin/delete"><input type="hidden" name="id" value="${Number(entry.id)}"><p><button type="submit">DELETE THIS ENTRY</button></p></form></div>`).join("") : "<p>no saved guestbook entries yet.</p>";
    return new Response(adminShell(`<p><a href="/admin/logout">log out</a></p><h2>DELETE GUESTBOOK ENTRIES</h2><p class="small">Only saved guestbook entries are shown here.</p>${entries}`), { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
  } catch {
    return new Response(adminShell("<h2>GUESTBOOK CLEANUP</h2><p class=\"small\">Could not load saved entries.</p>"), { status: 500, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
  }
}

async function guestbook(request, env) {
  if (!env.DB) return unavailable();

  if (request.method === "GET") {
    try {
      const { results = [] } = await env.DB.prepare("SELECT name, message, date FROM guestbook ORDER BY id DESC LIMIT 500").all();
      return json(results);
    } catch {
      return unavailable();
    }
  }

  if (request.method === "POST") {
    try {
      const input = await request.json();
      const name = String(input.name || "").trim().slice(0, 30);
      const message = String(input.message || "").trim().slice(0, 300);
      if (!name || !message) return json({ error: "Name and message are required." }, 400);
      if (name.toUpperCase() === "DEADPIXEL") return json({ error: "That name is taken." }, 400);
      const now = new Date();
      const date = (now.getMonth() + 1) + "/" + now.getDate() + "/" + String(now.getFullYear()).slice(-2);
      await env.DB.prepare("INSERT INTO guestbook (name, message, date) VALUES (?, ?, ?)").bind(name, message, date).run();
      return json({ name, message, date }, 201);
    } catch {
      return json({ error: "Could not save the entry." }, 500);
    }
  }

  return json({ error: "Method not allowed." }, 405);
}

export default {
  async fetch(request, env) {
    const pathname = new URL(request.url).pathname;
    if (pathname === "/api/guestbook") return guestbook(request, env);
    if (pathname === "/admin" && request.method === "GET") return adminPage(request, env);
    if (pathname === "/admin/login" && request.method === "POST") {
      if (!env.ADMIN_PASSWORD) return loginPage("Admin password has not been set up yet.");
      const data = await request.formData();
      if (!await correctPassword(String(data.get("password") || ""), env.ADMIN_PASSWORD)) return loginPage("Wrong password.");
      const session = await makeSession(env.ADMIN_PASSWORD);
      return new Response(null, { status: 303, headers: { "Location": "/admin", "Set-Cookie": `afterhours_admin=${session}; Path=/; Max-Age=604800; HttpOnly; Secure; SameSite=Strict` } });
    }
    if (pathname === "/admin/delete" && request.method === "POST") {
      if (!await signedIn(request, env)) return loginPage("Log in first.");
      const data = await request.formData();
      const id = Number(data.get("id"));
      if (env.DB && Number.isInteger(id) && id > 0) await env.DB.prepare("DELETE FROM guestbook WHERE id = ?").bind(id).run();
      return Response.redirect(new URL("/admin", request.url), 303);
    }
    if (pathname === "/admin/logout") {
      return new Response(null, { status: 303, headers: { "Location": "/admin", "Set-Cookie": "afterhours_admin=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict" } });
    }
    return env.ASSETS.fetch(request);
  }
};
