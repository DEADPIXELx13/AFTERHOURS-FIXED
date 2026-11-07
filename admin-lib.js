const encoder = new TextEncoder();

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function readCookie(request, name) {
  const match = request.headers.get("Cookie")?.match(new RegExp("(?:^|;\\s*)" + name + "=([^;]+)"));
  return match ? match[1] : "";
}

function toBase64url(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64url(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - value.length % 4) % 4);
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
}

async function keyFrom(password) {
  return crypto.subtle.importKey("raw", encoder.encode(password), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function passwordIsCorrect(attempt, password) {
  try {
    const realKey = await keyFrom(password);
    const proof = await crypto.subtle.sign("HMAC", realKey, encoder.encode("afterhours-login-check"));
    return crypto.subtle.verify("HMAC", await keyFrom(attempt), proof, encoder.encode("afterhours-login-check"));
  } catch {
    return false;
  }
}

export async function sessionCookie(password) {
  const signature = await crypto.subtle.sign("HMAC", await keyFrom(password), encoder.encode("afterhours-admin-v1"));
  return `afterhours_admin=${toBase64url(signature)}; Path=/; Max-Age=604800; HttpOnly; Secure; SameSite=Strict`;
}

export async function signedIn(request, env) {
  if (!env.ADMIN_PASSWORD) return false;
  const value = readCookie(request, "afterhours_admin");
  if (!value) return false;
  try {
    return crypto.subtle.verify("HMAC", await keyFrom(env.ADMIN_PASSWORD), fromBase64url(value), encoder.encode("afterhours-admin-v1"));
  } catch {
    return false;
  }
}

export function page(contents) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AFTERHOURS ADMIN</title><link rel="stylesheet" href="/style.css"></head><body><div id="site"><header><h1>AFTERHOURS</h1><div>GUESTBOOK CLEANUP</div></header><main>${contents}</main><footer><a href="/index.html">back home</a></footer></div></body></html>`;
}

export function html(contents, status = 200) {
  return new Response(page(contents), { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

export function loginPage(message = "") {
  const note = message ? `<p class="small">${escapeHtml(message)}</p>` : "";
  return html(`<h2>ADMIN LOGIN</h2>${note}<form method="post" action="/admin/login"><p>password:<br><input type="password" name="password" required autofocus></p><button type="submit">LOG IN</button></form>`, message ? 401 : 200);
}
