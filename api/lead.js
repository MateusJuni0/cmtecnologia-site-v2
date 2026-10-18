// Lead notification — emails C&M when Inês (voice) captures a qualified visitor.
// Called by voice-live.js once per session when the assistant returns lead.ready.
// Uses Resend (env RESEND_API_KEY). Recipient: env LEAD_EMAIL (fallback below).
// Every lead is also kept in leads.jsonl (SITE_DATA_DIR) with its origin: the marketing pipeline counts
// the ones that came from the Instagram bio link (/ig adds ?origem=instagram).
import { randomUUID } from 'node:crypto';
import { cortar, origemValida, registar } from './registo.js';

export const config = { maxDuration: 20 };

const TO = process.env.LEAD_EMAIL || 'mjnoliveira.mateus@gmail.com';
// Resend test sender works without a verified domain (delivers to the account owner's email).
const FROM = process.env.LEAD_FROM || 'Ines C&M <onboarding@resend.dev>';

function esc(s) {
  return String(s == null ? '' : s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const { name, contact, need, transcript, source } = body || {};
  if (!name && !contact) { res.status(400).json({ error: 'empty lead' }); return; }
  const origem = origemValida(body.origem);
  // Kept first, with an id: if every alert below fails, the marketing pipeline on the VPS re-sends the lead to
  // the owner from this record (avisos.jsonl says which ones already reached him). Codex review 18-10, F2.
  const id = randomUUID();
  const guardado = registar('leads.jsonl', { id, ts: new Date().toISOString(), source: cortar(source || 'site', 40),
    origem, name: cortar(name, 120), contact: cortar(contact, 120), need: cortar(need, 500) });
  // 200 means "kept": the page only retries when this is not 2xx, so an email failure never duplicates a lead
  const estado = guardado ? 200 : 500;
  const veio = origem ? ` · veio do ${origem === 'instagram' ? 'Instagram' : origem}` : '';

  // Instant alert to Telegram (independent of email); the result is recorded, never assumed
  const TG_TOKEN = process.env.TG_BOT_TOKEN, TG_CHAT = process.env.TG_LEAD_CHAT_ID;
  let tgOk = false;
  if (TG_TOKEN && TG_CHAT) {
    const tgText = `🐰 Novo lead — ${source || 'site'}${veio}\n👤 ${name || '—'}\n📞 ${contact || '—'}\n📝 ${need || '—'}`;
    try {
      const r = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chat_id: TG_CHAT, text: tgText, disable_web_page_preview: true }),
      });
      tgOk = r.ok && (await r.json().catch(() => ({}))).ok === true;
    } catch (e) { /* recorded below as not delivered */ }
  }
  registar('avisos.jsonl', { id, ts: new Date().toISOString(), tg_ok: tgOk });

  const KEY = process.env.RESEND_API_KEY;
  if (!KEY) { res.status(estado).json({ ok: guardado, guardado, tg_ok: tgOk, email: 'not configured' }); return; }

  const convo = Array.isArray(transcript)
    ? transcript.map((t) => `${t && t.role === 'ines' ? 'Inês' : 'Cliente'}: ${esc(t && t.text)}`).join('<br/>')
    : '';

  const html = [
    '<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:auto;color:#1a1330">',
    `<h2 style="color:#6d28d9;margin:0 0 4px">🐰 Novo lead — ${esc(source) || 'Inês (voz)'}${esc(veio)}</h2>`,
    '<p style="color:#666;margin:0 0 18px">Um visitante falou consigo em cmtecnologia.pt e deixou contacto.</p>',
    '<table style="width:100%;border-collapse:collapse;font-size:15px">',
    `<tr><td style="padding:8px 0;color:#888;width:110px">Nome</td><td style="padding:8px 0;font-weight:600">${esc(name) || '—'}</td></tr>`,
    `<tr><td style="padding:8px 0;color:#888">Contacto</td><td style="padding:8px 0;font-weight:600">${esc(contact) || '—'}</td></tr>`,
    `<tr><td style="padding:8px 0;color:#888;vertical-align:top">Precisa de</td><td style="padding:8px 0">${esc(need) || '—'}</td></tr>`,
    '</table>',
    convo ? `<h3 style="margin:22px 0 8px;color:#1a1330">Conversa</h3><div style="background:#f6f4fc;border-radius:10px;padding:14px;font-size:14px;line-height:1.6">${convo}</div>` : '',
    '<p style="color:#aaa;font-size:12px;margin-top:22px">Enviado automaticamente por cmtecnologia.pt — entra em contacto com o cliente.</p>',
    '</div>',
  ].join('');

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${KEY}` },
      body: JSON.stringify({
        from: FROM,
        to: [TO],
        subject: `Novo lead C&M${source ? ' (' + source + ')' : ''}${veio}: ${name || contact}`,
        html,
        reply_to: /@/.test(contact || '') ? contact : undefined,
      }),
    });
    const text = await r.text();
    res.status(estado).json({ ok: guardado, guardado, tg_ok: tgOk, email_ok: r.ok,
      detail: r.ok ? undefined : text.slice(0, 200) });
  } catch (e) {
    res.status(estado).json({ ok: guardado, guardado, tg_ok: tgOk, email_ok: false, error: String(e).slice(0, 200) });
  }
}
