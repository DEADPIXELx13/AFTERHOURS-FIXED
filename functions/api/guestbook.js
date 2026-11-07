const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8' }
});

export async function onRequestGet({ env }) {
  try {
    const { results = [] } = await env.DB
      .prepare('SELECT name, message, date FROM guestbook ORDER BY id DESC LIMIT 500')
      .all();
    return json(results);
  } catch (error) {
    return json({ error: 'Guestbook is not set up yet.' }, 503);
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const input = await request.json();
    const name = String(input.name || '').trim().slice(0, 30);
    const message = String(input.message || '').trim().slice(0, 300);
    if (!name || !message) return json({ error: 'Name and message are required.' }, 400);
    if (name.toUpperCase() === 'DEADPIXEL') return json({ error: 'That name is taken.' }, 400);

    const now = new Date();
    const date = (now.getMonth() + 1) + '/' + now.getDate() + '/' + String(now.getFullYear()).slice(-2);
    await env.DB.prepare('INSERT INTO guestbook (name, message, date) VALUES (?, ?, ?)')
      .bind(name, message, date)
      .run();
    return json({ name, message, date }, 201);
  } catch (error) {
    return json({ error: 'Could not save the entry.' }, 400);
  }
}
