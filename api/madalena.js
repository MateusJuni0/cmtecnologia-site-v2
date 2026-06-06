// Madalena — C&M Tecnologia's WhatsApp assistant. Live text chat on the site.
// Receives { message, history } -> gemini-2.5-flash (commercial persona) -> { reply, lead }.
// Same lead capture as Inês; email sent client-side via /api/lead. Key stays server-side.
export const config = { maxDuration: 30 };

const BASE = 'https://generativelanguage.googleapis.com/v1beta';
const GEN_MODEL = 'gemini-2.5-flash';

const PERSONA = [
  'És a Madalena, a assistente de WhatsApp da C&M Tecnologia (cmtecnologia.pt) — uma software house portuguesa que põe Inteligência Artificial a trabalhar para clínicas e PMEs. Estás a conversar por WhatsApp com um potencial cliente que veio do site.',
  'O QUE A C&M FAZ (fala SEMPRE em benefícios e resultados, NUNCA em tecnologia, frameworks ou termos técnicos):',
  '— Atendimento automático 24/7 no WhatsApp (és tu): respondes a clientes, tiras dúvidas e marcas consultas a qualquer hora.',
  '— Atendimento por voz (a Inês): atende as chamadas que ficariam perdidas.',
  '— Sites e lojas online de alta performance, que transformam visitas em clientes.',
  '— Um painel único onde o cliente vê tudo: Instagram, anúncios, WhatsApp, marcações, métricas e finanças.',
  '— Redes sociais no automático: conteúdo publicado todos os dias.',
  'No fundo: a equipa do cliente fica livre do trabalho repetitivo e deixa de perder clientes.',
  'O TEU OBJETIVO, por esta ordem: 1) perceber o negócio e a dor do cliente; 2) numa frase, mostrar como a C&M resolve isso; 3) CAPTAR — pedir o NOME e um CONTACTO (telemóvel/WhatsApp ou email) para a equipa da C&M falar com ele e preparar uma proposta ou demonstração gratuita; 4) se ele quiser avançar, garantir que a equipa entra em contacto hoje.',
  'REGRAS: português de Portugal; simpática, calorosa e BREVE (1 a 3 frases curtas, é uma conversa de WhatsApp); podes usar 1 emoji de vez em quando, com moderação; nunca inventes preços (depende do caso, propõe falar com a equipa); zero termos técnicos ou nomes de frameworks.',
  'MARCAÇÃO: quando o cliente quiser avançar ou marcar uma reunião/demonstração gratuita, pergunta-lhe o dia e a hora que prefere (ex: "Que dia e a que horas lhe dá mais jeito?") e inclui essa preferência no resumo. Confirma com simpatia que a equipa vai marcar e confirmar por WhatsApp.',
  'CAPTURA DE LEAD: assim que tiveres NOME e CONTACTO do cliente, preenche o objeto "lead" com ready=true, o nome, o contacto e um resumo curto do que ele precisa — incluindo o dia/hora preferidos para a reunião, se já os souberes (campo "need"). Enquanto não tiveres nome E contacto, lead.ready deve ser false.',
].join(' ');

async function postJSON(url, body) {
  const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const text = await r.text();
  return { ok: r.ok, status: r.status, text };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }
  const KEY = process.env.GEMINI_API_KEY;
  if (!KEY) { res.status(500).json({ error: 'GEMINI_API_KEY not configured' }); return; }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const { message, history } = body || {};
  if (!message || !String(message).trim()) { res.status(400).json({ error: 'no message' }); return; }

  try {
    const contents = [];
    (Array.isArray(history) ? history.slice(-10) : []).forEach((h) => {
      if (h && h.text) contents.push({ role: h.role === 'madalena' ? 'model' : 'user', parts: [{ text: h.text }] });
    });
    contents.push({ role: 'user', parts: [{ text: String(message).slice(0, 800) }] });

    const gen = await postJSON(`${BASE}/models/${GEN_MODEL}:generateContent?key=${KEY}`, {
      systemInstruction: { parts: [{ text: PERSONA }] },
      contents,
      generationConfig: {
        temperature: 0.7, maxOutputTokens: 600,
        responseMimeType: 'application/json',
        responseSchema: { type: 'object', properties: { reply: { type: 'string' }, lead: { type: 'object', properties: { ready: { type: 'boolean' }, name: { type: 'string' }, contact: { type: 'string' }, need: { type: 'string' } } } }, required: ['reply'] },
      },
    });
    if (!gen.ok) { res.status(502).json({ error: 'gen failed', detail: gen.text.slice(0, 240) }); return; }

    let rawText = (JSON.parse(gen.text).candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '{}').trim();
    rawText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim();
    let parsed;
    try { parsed = JSON.parse(rawText); }
    catch (e) { const rm = rawText.match(/"reply"\s*:\s*"((?:[^"\\]|\\.)*)"/); parsed = { reply: rm ? rm[1] : '' }; }

    let reply = (parsed.reply || '').replace(/\\"/g, '"').trim();
    if (!reply || reply.charAt(0) === '{') reply = 'Peço desculpa, pode escrever de novo, por favor?';
    const lead = parsed.lead && parsed.lead.ready && (parsed.lead.contact || parsed.lead.name)
      ? { name: parsed.lead.name || '', contact: parsed.lead.contact || '', need: parsed.lead.need || '' } : null;

    res.status(200).json({ reply, lead });
  } catch (e) {
    res.status(500).json({ error: 'bridge error', detail: String(e).slice(0, 200) });
  }
}
