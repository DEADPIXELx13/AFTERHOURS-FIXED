import { loginPage, passwordIsCorrect, sessionCookie } from "../../admin-lib.js";

export async function onRequestPost({ request, env }) {
  if (!env.ADMIN_PASSWORD) return loginPage("Admin password has not been set up yet.");
  const data = await request.formData();
  if (!await passwordIsCorrect(String(data.get("password") || ""), env.ADMIN_PASSWORD)) return loginPage("Wrong password.");
  return new Response(null, { status: 303, headers: { Location: "/admin", "Set-Cookie": await sessionCookie(env.ADMIN_PASSWORD) } });
}
