import { loginPage, signedIn } from "../../admin-lib.js";

export async function onRequestPost({ request, env }) {
  if (!await signedIn(request, env)) return loginPage("Log in first.");
  const data = await request.formData();
  const id = Number(data.get("id"));
  if (env.DB && Number.isInteger(id) && id > 0) await env.DB.prepare("DELETE FROM guestbook WHERE id = ?").bind(id).run();
  return Response.redirect(new URL("/admin", request.url), 303);
}
