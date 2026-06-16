# BRAIN.md — cmtecnologia-site-v2

## Status (2026-06-13)
- **EM PRODUÇÃO NA VPS** — migrado da Vercel hoje. `cmtecnologia.pt` + `www` servem o container `cmtec-site` (VPS 72.60.88.137, `127.0.0.1:3002`) atrás do túnel Cloudflare dedicado `cmtec-site`. Vercel = fallback (deploy em `main`, intacto).
- Verificado em produção: apex/www HTTP 200 `{ok:true}` em `/healthz`, **sem** `x-vercel-id`; `/api/madalena` responde com Gemini real.

## Stack
- Site estático (HTML/JS/CSS + `scenes/` vídeos) + 3 funções ex-Vercel (`api/ines|madalena|lead.js`) servidas por **Express** (`server.js`) — funções reutilizadas verbatim.
- Imagem Docker buildada no GitHub Actions → GHCR (nunca na VPS). Secrets só no runtime (`/opt/cmtec-site/cmtec-site.env`, chmod 600).

## Decisões / gotchas
- Espelha o playbook do **Cronos Game** (`../cronos-game/docs/DEPLOY.md`).
- `cloudflared tunnel route dns` → **usar UUID, nunca o nome** (bug 2026.3.0 aponta para `cm-templates`).
- Apex cortado **editando o CNAME no dashboard CF** (`cname.vercel-dns.com` → `054ea5c4-…cfargotunnel.com`).
- Deploy atual via **tarball** (`docker load`) — pull GHCR ainda privado (pendente).

## Pendências
Ver `docs/DEPLOY.md` → secção Pendências (pull GHCR, `TG_BOT_TOKEN=""`, lixo DNS, merge da branch, decommission Vercel).

## Detalhe completo
→ **`docs/DEPLOY.md`** (A=real / B=como mexer / C=rollback).
