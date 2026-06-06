// Serverless voice bridge — "Inês", C&M Tecnologia's live voice assistant.
// Flow: client sends recorded audio (base64 WAV) + short history.
//   1) gemini-2.5-flash listens to the audio + persona => { heard, reply }
//   2) gemini-2.5-flash-preview-tts speaks `reply` => PCM 24k => WAV
// The Google key stays server-side (Vercel env GEMINI_API_KEY). Never exposed to the browser.
export const config = { maxDuration: 60 };

const BASE = 'https://generativelanguage.googleapis.com/v1beta';
const GEN_MODEL = 'gemini-2.5-flash';
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';
const VOICE = 'Aoede'; // warm female voice for Inês

const PERSONA = [
  'És a Inês, assistente comercial de voz da C&M Tecnologia (cmtecnologia.pt) — uma software house portuguesa que põe Inteligência Artificial a trabalhar para clínicas e PMEs. Estás a falar AO TELEFONE com um potencial cliente.',
  'O QUE A C&M FAZ (fala SEMPRE em benefícios e resultados, NUNCA em tecnologia, frameworks ou termos técnicos):',
  '— Atendimento automático 24/7 no WhatsApp (a "Madalena"): responde a clientes, tira dúvidas e marca consultas a qualquer hora, sem ninguém ter de estar ao computador.',
  '— Atendimento por voz (és tu, a Inês): atendes as chamadas que ficariam perdidas.',
  '— Sites e lojas online de alta performance: bonitos, rápidos, que transformam visitas em clientes.',
  '— Um painel único onde o cliente vê tudo: Instagram, anúncios, WhatsApp, marcações, métricas e finanças.',
  '— Redes sociais no automático: conteúdo publicado todos os dias sem trabalho.',
  'No fundo: a equipa do cliente fica livre do trabalho repetitivo e deixa de perder clientes.',
  'O TEU OBJETIVO, por esta ordem: 1) perceber o negócio e a dor do cliente (perde chamadas? não tem tempo para as redes? quer um site novo?); 2) numa frase, mostrar como a C&M resolve isso; 3) CAPTAR — pedir o NOME e um CONTACTO (telemóvel/WhatsApp ou email) para a equipa da C&M falar com ele e preparar uma proposta ou demonstração gratuita; 4) se ele quiser avançar, garantir que a equipa entra em contacto hoje.',
  'REGRAS: português de Portugal; calorosa, simpática e MUITO BREVE (uma frase, no máximo duas muito curtas — é uma chamada); nunca inventes preços (depende do caso, propõe a conversa com a equipa); zero termos técnicos ou nomes de frameworks; sem emojis nem markdown (vai ser falado).',
  'MARCAÇÃO: quando o cliente quiser avançar ou marcar uma reunião/demonstração gratuita, pergunta-lhe o dia e a hora que prefere (ex: "Que dia e a que horas lhe dá mais jeito?") e inclui essa preferência no resumo. Confirma que a equipa vai marcar e confirmar por WhatsApp.',
  'CAPTURA DE LEAD: assim que tiveres NOME e CONTACTO do cliente, preenche o objeto "lead" com ready=true, o nome, o contacto e um resumo curto do que ele precisa — incluindo o dia/hora preferidos para a reunião, se já os souberes (campo "need"). Enquanto não tiveres nome E contacto, lead.ready deve ser false.',
].join(' ');

function pcmToWavBase64(pcm, rate) {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(rate, 24);
  header.writeUInt32LE(rate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]).toString('base64');
}

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
  const { audio, mime, history } = body || {};
  if (!audio) { res.status(400).json({ error: 'no audio' }); return; }

  try {
    // 1) understand the spoken turn + answer as Inês (structured: heard + reply)
    const contents = [];
    (Array.isArray(history) ? history.slice(-6) : []).forEach((h) => {
      if (h && h.text) contents.push({ role: h.role === 'ines' ? 'model' : 'user', parts: [{ text: h.text }] });
    });
    contents.push({ role: 'user', parts: [{ inlineData: { mimeType: mime || 'audio/wav', data: audio } }] });

    const gen = await postJSON(`${BASE}/models/${GEN_MODEL}:generateContent?key=${KEY}`, {
      systemInstruction: { parts: [{ text: PERSONA }] },
      contents,
      generationConfig: {
        temperature: 0.7, maxOutputTokens: 700,
        responseMimeType: 'application/json',
        responseSchema: { type: 'object', properties: { heard: { type: 'string' }, reply: { type: 'string' }, lead: { type: 'object', properties: { ready: { type: 'boolean' }, name: { type: 'string' }, contact: { type: 'string' }, need: { type: 'string' } } } }, required: ['heard', 'reply'] },
      },
    });
    if (!gen.ok) { res.status(502).json({ error: 'gen failed', detail: gen.text.slice(0, 240) }); return; }
    let rawText = (JSON.parse(gen.text).candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '{}').trim();
    rawText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim();
    let parsed;
    try { parsed = JSON.parse(rawText); }
    catch (e) {
      const hm = rawText.match(/"heard"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      const rm = rawText.match(/"reply"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      parsed = { heard: hm ? hm[1] : '', reply: rm ? rm[1] : '' };
    }
    const heard = (parsed.heard || '').replace(/\\"/g, '"').trim();
    let reply = (parsed.reply || '').replace(/\\"/g, '"').trim();
    if (!reply || reply.charAt(0) === '{') reply = 'Peço desculpa, pode repetir, por favor?';
    const lead = parsed.lead && parsed.lead.ready && (parsed.lead.contact || parsed.lead.name)
      ? { name: parsed.lead.name || '', contact: parsed.lead.contact || '', need: parsed.lead.need || '' } : null;

    // 2) speak the reply
    let audioWav = null;
    const tts = await postJSON(`${BASE}/models/${TTS_MODEL}:generateContent?key=${KEY}`, {
      contents: [{ parts: [{ text: reply }] }],
      generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } } } },
    });
    if (tts.ok) {
      const d = JSON.parse(tts.text).candidates?.[0]?.content?.parts?.find((p) => p.inlineData || p.inline_data);
      const inl = d && (d.inlineData || d.inline_data);
      if (inl) {
        const rateMatch = /rate=(\d+)/.exec(inl.mimeType || inl.mime_type || '');
        audioWav = pcmToWavBase64(Buffer.from(inl.data, 'base64'), rateMatch ? parseInt(rateMatch[1], 10) : 24000);
      }
    }

    res.status(200).json({ heard, reply, lead, audio: audioWav, mime: 'audio/wav' });
  } catch (e) {
    res.status(500).json({ error: 'bridge error', detail: String(e).slice(0, 200) });
  }
}
