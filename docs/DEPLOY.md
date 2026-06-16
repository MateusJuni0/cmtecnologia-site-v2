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
- **Imagem:** `ghcr.io/mateusjuni0/cmtecnologia-site-v2:latest` — **privada** (não contém secrets). O cutover foi feito via **tarball** (CI exporta a imagem como artifact → `gh run download` → `scp` → `docker load`), porque o pull anónimo do GHCR não ficou destrancado a tempo. O pull direto ainda está **pendente** (ver Pendências).
- **Secrets (runtime):** `/opt/cmtec-site/cmtec-site.env` (chmod 600, **NUNCA** em git):
  `GEMINI_API_KEY`, `RESEND_API_KEY`, `TG_BOT_TOKEN`, `TG_LEAD_CHAT_ID`, `LEAD_FROM`.
- **VPS:** pasta `/opt/cmtec-site/` · porta interna `127.0.0.1:3002` (3000=supabase-studio, 3001=cronos-web).
- **Túnel:** `cmtec-site` id `054ea5c4-c15e-44cd-bae4-5720418f2083`,
  config `/etc/cloudflared/cmtec-site.yml`, serviço `cloudflared-cmtec-site.service`.
  Cert `/root/.cloudflared/cert.pem` cobre a zona `cmtecnologia.pt`.
- **DNS (Cloudflare, zona cmtecnologia.pt):**
  - `www.cmtecnologia.pt` → Tunnel `cmtec-site` (via `cloudflared tunnel route dns`, **com UUID** — ver gotcha).
  - `cmtecnologia.pt` (apex) → era `CNAME cname.vercel-dns.com (Proxied)`; **editado no dashboard CF** para `CNAME 054ea5c4-…cfargotunnel.com (Proxied)` → aparece como Tunnel `cmtec-site`. (O `route dns` não consegue o apex porque já havia um CNAME proxied.)
  - `vps.cmtecnologia.pt` → Tunnel `cmtec-site` (hostname de teste/staging).
- **Vercel:** mantido como **fallback** (deploy em `main`) por 1–2 semanas; depois decommission.

---

## B. Como mexer

### Deploy de uma alteração
1. `git push` para `main` → o workflow `deploy.yml` builda, faz push para o GHCR **e** exporta a imagem como artifact `cmtec-site-image`.
2. **Enquanto o pull do GHCR não estiver destrancado** (ver Pendências), o deploy é via tarball:
   ```
   gh run download <run-id> -n cmtec-site-image -D /tmp/img
   scp /tmp/img/cmtec-site-image.tar.gz root@72.60.88.137:/tmp/
   ssh root@72.60.88.137 'docker load -i /tmp/cmtec-site-image.tar.gz && cd /opt/cmtec-site && docker compose up -d && rm /tmp/cmtec-site-image.tar.gz'
   ```
   Quando o pull estiver resolvido: `cd /opt/cmtec-site && docker compose pull && docker compose up -d`.
3. Smoke: `curl -s localhost:3002/healthz` (na VPS) e `curl -s https://cmtecnologia.pt/healthz`.

### Gotchas (aprendidos no cutover 2026-06-13)
- **`cloudflared tunnel route dns` — usar SEMPRE o UUID, nunca o nome.** A versão 2026.3.0 (outdated) resolve o nome mal e aponta para o túnel mais antigo (`cm-templates`). `route dns 054ea5c4-… <host>` funciona; `route dns cmtec-site <host>` aponta errado.
- **Apex não dá pelo `route dns`** se já houver um CNAME/A proxied — editar o registo no dashboard CF (trocar o Target para `<uuid>.cfargotunnel.com`, manter Proxied).
- **Porta interna 3000, host `127.0.0.1:3002`** (3000=supabase-studio, 3001=cronos-web já ocupadas).

### Resolvido (2026-06-13, pós-cutover)
- ✅ **Deploy reproduzível:** `scripts/deploy-vps.sh` (1 comando, método tarball). O pull GHCR continua privado — tornar público (UI) é opcional/futuro.
- ✅ **Alertas de lead no Telegram:** `TG_BOT_TOKEN`/`TG_LEAD_CHAT_ID` estavam inválidos (token vazio + o chat id era o comando `vercel env add …` colado por engano). Agora reusam o bot+chat do **Lince** (`TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID` de `/opt/hermes/.env`) → leads chegam ao TG do Mateus. Email Resend continua a funcionar (testado, `ok:true`).
- ✅ **DNS limpo:** `staging.cmtecnologia.pt` → cmtec-site (staging oficial); `vps.cmtecnologia.pt` e o lixo `staging.cronosgame.com.br.cmtecnologia.pt` apagados. Ingress = apex+www+staging+catch-all.

### Em aberto (salvaguarda deliberada, não falha)
- **Vercel = fallback ativo:** `feat/vps-migration` mantida fora de `main` de propósito, para o deploy Vercel servir de rollback nas primeiras 24–48h. Ao fechar: merge → `main`, remover a branch do trigger + o step de export-tarball, e **decommission do projeto Vercel**.

### Gotcha extra
- **Editar o ingress determinísticamente** (reescrever o ficheiro inteiro). Remover linhas com skip-logic apagou o catch-all `http_status:404` por engano → túnel inválido (erro 1033). Validar sempre com um smoke test aos 3 hosts após restart.

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
