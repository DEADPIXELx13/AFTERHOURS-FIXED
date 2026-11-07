import { escapeHtml, html, loginPage, signedIn } from "../admin-lib.js";

export async function onRequestGet({ request, env }) {
  if (!env.ADMIN_PASSWORD) return html("<h2>ADMIN LOGIN</h2><p class=\"small\">Admin password has not been set up yet.</p>", 503);
  if (!await signedIn(request, env)) return loginPage();
  if (!env.DB) return html("<h2>GUESTBOOK CLEANUP</h2><p class=\"small\">Guestbook database is not connected yet.</p>", 503);

  try {
    const { results = [] } = await env.DB.prepare("SELECT id, name, message, date FROM guestbook ORDER BY id DESC LIMIT 500").all();
    const entries = results.length
      ? results.map((entry) => `<div class="comment"><b>${escapeHtml(entry.name)} — ${escapeHtml(entry.date)}</b><br>${escapeHtml(entry.message)}<form method="post" action="/admin/delete"><input type="hidden" name="id" value="${Number(entry.id)}"><p><button type="submit">DELETE THIS ENTRY</button></p></form></div>`).join("")
      : "<p>no saved guestbook entries yet.</p>";
    return html(`<p><a href="/admin/logout">log out</a></p><h2>DELETE GUESTBOOK ENTRIES</h2><p class="small">Only saved guestbook entries are shown here.</p>${entries}`);
  } catch {
    return html("<h2>GUESTBOOK CLEANUP</h2><p class=\"small\">Could not load saved entries.</p>", 500);
  }
}
