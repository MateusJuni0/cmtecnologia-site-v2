# BRAIN.md — cmtecnologia-site-v2

## Status (2026-06-13)
- **EM PRODUÇÃO NA VPS** — migrado da Vercel hoje. `cmtecnologia.pt` + `www` servem o container `cmtec-site` (VPS 72.60.88.137, `127.0.0.1:3002`) atrás do túnel Cloudflare dedicado `cmtec-site`. Vercel = fallback (deploy em `main`, intacto).
- Verificado em produção: apex/www HTTP 200 `{ok:true}` em `/healthz`, **sem** `x-vercel-id`; `/api/madalena` responde com Gemini real.

## SEO/GEO — non-branded + GEO (2026-06-15)
Objetivo (Mateus): rankear em pesquisas de **serviço** (não só pela marca) e ser citável por ChatGPT/Perplexity/Gemini.
- **5 páginas de serviço dedicadas** (molde = `guia-automacao-ia.html`), live e indexáveis — criar `<slug>.html` na raiz fica em `/<slug>` (Express `extensions:['html']`):
  `/chatbot-whatsapp-ia` · `/atendimento-por-voz-ia` · `/criacao-sites-lojas-online` · `/automacao-redes-sociais-ia` · `/painel-gestao-negocio`.
  Cada uma: conteúdo answer-ready pt-PT + JSON-LD `Service`+`FAQPage`+`BreadcrumbList`, CTA WhatsApp, links internos cruzados. Commit `d26d78d` (branch `feat/vps-migration`).
- **Footer da home** (`index.html`, coluna "O que fazemos") liga as 5 páginas — antes apontava a âncoras `#`. `index.html` já tinha schema Organization+ProfessionalService+5×Service+FAQPage (sprint manhã).
- **sitemap.xml** 2→7 URLs; **llms.txt** lista as páginas.
- **GSC**: sitemap re-submetido + processado (7 págs); indexação forçada de chatbot + voz; restantes "Detectadas" via sitemap. Barra de inspeção GSC exige `find` fresco do elemento a cada URL (ref fica stale após navegação).
- **Cloudflare** (Overview → Control AI crawlers): "Manage your robots.txt" mudado de "Instruct AI bot traffic with robots.txt" → **"Disable robots.txt configuration"**. Antes injetava secção managed com `Disallow` GPTBot/ClaudeBot/CCBot/Google-Extended + `Content-Signal: ai-train=no`, em conflito com o robots permissivo do repo. Agora serve SÓ o robots do repo (Allow a todos). Verificado live. "Block AI training bots" = Do not block. Dropdown auto-guarda (sem botão Save). Dashboard CF demora ~30s a renderizar.
- **Próxima fase (non-branded real)**: on-page está feito; falta autoridade (backlinks, Google Business Profile PT) + tempo de indexação. **Cronos Games**: gap é conteúdo/autoridade (schema já forte) → guias answer-ready de intenção comercial.

## Conversão — resposta à auditoria Manus (2026-06-22)
Auditoria externa Manus avaliada criticamente (~40% aproveitável; errou stack=Next.js, inventou "templates 7000 designs" e "+1M diagnósticos"). **Pré-receita confirmado pelo Mateus → proibido métricas/case-studies inventados; prova = demos live + transparência.** Feito na branch `feat/arruma-manus` (plano em `docs/plans/2026-06-22-arruma-site-manus.md`):
- **`/pacotes`** — 3 packs de entrada (Clínica Digital, Presença Total, Operação 360) por escopo, sem preço de tabela. Mata o paradoxo da escolha. JSON-LD Service+OfferCatalog+FAQPage.
- **`/calculadora-roi`** — lead magnet honesto (cálculo client-side, fator 0.6 conservador + disclaimer), liga ao `/api/lead`.
- Ligadas no sitemap, llms.txt e footer da home. Rotas 200, JSON-LD válido. **Performance mobile: Mateus dispensou (não mexer).**
- Falta: PR + aprovação Mateus + merge + deploy. **Gargalo real (fora deste sprint) = autoridade off-site** (GBP só se houver contacto presencial; senão diretórios PT + LinkedIn + backlinks).

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
