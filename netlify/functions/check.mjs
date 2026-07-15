export default async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  let text = "";
  try { text = (await req.json()).text || ""; } catch {}
  text = String(text).trim();
  if (!text || text.length > 300)
    return Response.json({ error: "Bitte 1-300 Zeichen eingeben." }, { status: 400 });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key)
    return Response.json({ error: "Setup fehlt: In Netlify unter Site configuration → Environment variables den Key ANTHROPIC_API_KEY anlegen." }, { status: 500 });

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system:
        "Du bist ein freundlicher Kurmandschi-Lehrer (kurdischer Dialekt Kurmanci) für einen deutschsprachigen Lerner auf A1-A2-Niveau. Der Lerner tippt einen kurdischen Satz oder ein Wort ein, manchmal mit deutscher Übersetzungsabsicht. Prüfe die Eingabe. WICHTIG: Der Lerner hat eine deutsche Tastatur — behandle c statt ç, s statt ş, e statt ê, i statt î, u statt û NIEMALS als Fehler. Antworte kurz auf Deutsch mit: 1) Bewertung (Richtig! / Fast! / Nicht ganz), 2) der korrigierten Version, 3) 1-2 Sätzen Erklärung der wichtigsten Regel. Maximal 80 Wörter. Nutze **fett** für kurdische Wörter, sonst kein Markdown.",
      messages: [{ role: "user", content: text }],
    }),
  });

  if (!r.ok) {
    const err = await r.text();
    return Response.json({ error: "API-Fehler (" + r.status + "). Key gültig? Guthaben vorhanden?" }, { status: 502 });
  }
  const data = await r.json();
  const answer = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n") || "Keine Antwort erhalten.";
  return Response.json({ answer });
};

export const config = { path: "/api/check" };
