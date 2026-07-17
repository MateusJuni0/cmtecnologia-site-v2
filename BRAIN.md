# BRAIN.md — cmtecnologia-site-v2

## Release LIVE (2026-07-17) — SEO, GEO e AEO
- **Objetivo:** aumentar descoberta não-branded no Google e citações/recomendações em ChatGPT, Gemini, Perplexity e Google AI Overviews para os serviços reais da C&M Tecnologia em Portugal.
- **Regra factual:** não inventar clientes, avaliações, métricas, certificações, casos de estudo ou resultados. Rankings e recomendações por IA são resultados a medir, nunca garantias.
- **Release final:** commit `0f41d7a5707a8d838cbed448bb5c819701a947c3`; GitHub Actions run `29598863906` concluído com sucesso; container `50e789233003adf297464e7f333d33d7807965a7d28388848b08a4a344c07662`; image ID `sha256:9527029bbad2d23d7b2dc83bd92a3d1b97d414f0d80a01455dd069febbfb68c3`; Compose SHA-256 `78970ced7a113190812463fa12005136cac98e301ac156af0b7fa7feea85d4ed`.
- **Rollback imediato:** imagem `ghcr.io/mateusjuni0/cmtecnologia-site-v2:rollback-9f27da8c774c-20260717T171136Z`; Compose `/opt/cmtec-site/backups/docker-compose.yml.20260717T171136Z.pre-0f41d7a`.
- **Entrega:** 8 páginas novas (`software-a-medida-portugal`, `automacao-empresarial-ia`, `integracoes-crm-whatsapp`, `n8n-supabase-automacao`, `seo-geo-aeo-portugal`, `sobre`, `empresa-sites-chatbots-automacao-portugal`, `automacao-ia-clinicas-portugal`), CSS responsivo, homepage/malha interna, sitemap com 19 URLs, RSS com 17 itens, `llms.txt` + `llms-full.txt`, aliases `/.well-known/llms*.txt`, canonicalização `www → apex`, schema/proveniência, autor e metadados atualizados.
- **Robustez:** hierarquia de headings limpa nas 19 páginas e protegida pelo validador; source/docs/backups bloqueados; scripts Vercel obsoletos removidos; política de privacidade alinhada com Cloudflare + VPS e sem alegar analytics inexistente.
- **Estratégia e evidência:** documentação em `docs/seo/` (Brand DNA, keywords, 40 prompts GEO, arquitetura, auditoria, entidade, off-site e medição). Sem volume/KD inventado; concorrência e prioridades qualitativas.
- **Verificação:** `npm run validate:seo` = 19 páginas, 17 itens e 0 warnings; `npm audit --omit=dev` = 0 vulnerabilidades; smoke público integral passou; APIs rejeitam payload vazio com `400`; browser real desktop/mobile sem overflow e com 0 erros de consola; contentor saudável e restart count `0`.
- **Auditoria AEO independente:** `97/100`, Foundational `100`, Intelligence `91`, `16/16` checks; Evidence Density `100`, Structural Clarity `100`, Quotability `95`, Freshness `97`, Content Depth `85`, Answer Readiness `70`.
- **Próximo gargalo real:** submeter o sitemap de 19 URLs no GSC, pedir indexação das páginas prioritárias, concluir a verificação por vídeo do Google Business Profile e construir autoridade off-site com diretórios PT, LinkedIn, menções, reviews reais e backlinks editoriais.
- **Preservação:** os backups e `docs/google-business-profile.md` que já estavam untracked continuam intocados.

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
- **PR #2 MERGED + DEPLOYED** (2026-06-22): live em `cmtecnologia.pt/pacotes` e `/calculadora-roi` (200, container VPS recriado via `scripts/deploy-vps.sh`). Falta: re-submeter sitemap no GSC.
- **Google Business Profile CRIADO** (2026-06-22, via browser, conta Google do Mateus): C&M Tecnologia, Service-Area Business (Lisboa, morada escondida), categoria principal **Empresa de Software** + secundária **Webdesigner**, horário Seg–Sex 9–18, descrição keyword-rich, telefone +351 964 977 047, website, **3 serviços = os packs**. Estado: **NÃO VISÍVEL — só falta a verificação por VÍDEO** (Mateus faz quando puder; adiada via "Confirmar depois"). Upsells Ads/Workspace saltados.
  - ⚠️ **POSICIONAMENTO (correção Mateus 2026-06-22): NÃO somos "agência de marketing digital".** Somos software house. Não usar essa label em categorias/copy.
- **Gargalo real restante = autoridade off-site.** Falta: verificação GBP + diretórios PT + LinkedIn empresa + backlinks.

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
