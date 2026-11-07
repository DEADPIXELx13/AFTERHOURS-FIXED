export async function onRequestGet({ request }) {
  return new Response(null, { status: 303, headers: { Location: new URL("/admin", request.url).toString(), "Set-Cookie": "afterhours_admin=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict" } });
}
