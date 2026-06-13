# Deploy — cmtecnologia.pt (self-hosted on the VPS)

> Autoritativo. **A = real hoje · B = como mexer · C = rollback.**
> Migrado da Vercel para a VPS em 2026-06-13, espelhando o playbook do Cronos Game.

---

## A. Arquitetura real (2026-06-13)

```
GitHub (repo cmtecnologia-site-v2, push main)
  → GitHub Actions: docker build  → GHCR  ghcr.io/mateusjuni0/cmtecnologia-site-v2:latest
      (build FORA da VPS — REGRA DURA: nunca buildar na VPS)
  → VPS 72.60.88.137: docker compose pull + up  → container `cmtec-site`  127.0.0.1:3002 (interno :3000)
  → Cloudflare Tunnel dedicado `cmtec-site` (054ea5c4-…)  → cmtecnologia.pt + www
```

- **App:** site estático (HTML/JS/CSS + `scenes/` vídeos) servido por um wrapper **Express** (`server.js`)
  que também monta as 3 antigas funções Vercel **sem alterá-las**:
  - `POST /api/ines` — assistente de voz Inês (Gemini 2.5 flash + TTS)
  - `POST /api/madalena` — chat Madalena no site (Gemini)
  - `POST /api/lead` — notificação de lead (Resend + Telegram)
  - `GET /healthz` — health check
- **Imagem:** `ghcr.io/mateusjuni0/cmtecnologia-site-v2:latest` — **pública** (pull anónimo, zero credencial na VPS). Não contém secrets.
- **Secrets (runtime):** `/opt/cmtec-site/cmtec-site.env` (chmod 600, **NUNCA** em git):
  `GEMINI_API_KEY`, `RESEND_API_KEY`, `TG_BOT_TOKEN`, `TG_LEAD_CHAT_ID`, `LEAD_FROM`.
- **VPS:** pasta `/opt/cmtec-site/` · porta interna `127.0.0.1:3002` (3000=supabase-studio, 3001=cronos-web).
- **Túnel:** `cmtec-site` id `054ea5c4-c15e-44cd-bae4-5720418f2083`,
  config `/etc/cloudflared/cmtec-site.yml`, serviço `cloudflared-cmtec-site.service`.
  Cert `/root/.cloudflared/cert.pem` cobre a zona `cmtecnologia.pt` → `cloudflared tunnel route dns` direto.
- **Vercel:** mantido como **fallback** (deploy em `main`) por 1–2 semanas; depois decommission.

---

## B. Como mexer

### Deploy de uma alteração
1. `git push` para a branch de trabalho → o workflow `deploy.yml` builda + faz push da imagem para o GHCR.
   (Para produção real: merge para `main`.)
2. Na VPS: `cd /opt/cmtec-site && docker compose pull && docker compose up -d`.
3. Smoke: `curl -s localhost:3002/healthz`.

### Regras duras
1. **NUNCA buildar na VPS** — build Next/imagem pede RAM; a VPS já faz swap e tem a DB de produção do Cronos.
2. **Secrets só no `cmtec-site.env`** (chmod 600), nunca na imagem nem em git.
3. **Porta só em localhost** (`127.0.0.1:3002`) — o túnel chega localmente; nunca expor à internet.
4. **Túnel:** cada serviço tem o seu túnel dedicado (blast-radius isolado). Não reescrever a config dos outros.

---

## C. Rollback (voltar à Vercel)

O deploy Vercel em `main` continua live enquanto não houver novo push para `main`.
Para reverter o DNS de produção para a Vercel (na Cloudflare, zona cmtecnologia.pt):
- `cmtecnologia.pt` (apex) e `www` → voltar aos registos Vercel (CNAME `cname.vercel-dns.com` / A `76.76.21.21`).
- Preservar sempre MX / TXT(SPF) / CAA.
- O container e o túnel podem ficar a correr (staging.cmtecnologia.pt) sem afetar produção.
