# cmtecnologia.pt 2.0 — Protótipo Imersivo · "Coelho Anfitrião"

Protótipo do novo site da **C&M Tecnologia**: experiência *scroll-driven* com um mascote-anfitrião (coelho 3D, "quiet luxury") que apresenta os nossos produtos **reais** à medida que se desce a página.

## Conceito
- 🐰 **Coelho-mascote** como anfitrião premium — aparece em cada cena a "mostrar" o que fazemos.
- **6 cenas:** Hero · Painel (iframe **ao vivo**) · Cronos (modal com **auto-scroll**) · Madalena (chat WhatsApp) · Inês (demo de voz) · CTA.
- **Lenis** (smooth scroll) + **GSAP** (reveals + crossfade do coelho) + micro-interações (magnetic, tilt, orbit).
- **Painel boutique embutido AO VIVO** (permite iframe). **Cronos** via showreel/auto-scroll (bloqueia iframe por `X-Frame-Options`).

## Stack
Site estático (HTML + CSS + JS), Lenis + GSAP via CDN. Deploy: **Vercel (preview)**.

## Estrutura
```
index.html   · estrutura + 6 cenas
styles.css   · design system (dark · violeta/cyan/gold · glass)
app.js       · Lenis, crossfade, demos, modal premium
scenes/      · keyframes do coelho + screenshots reais (Cronos/painel)
```

## Notas
- Imagens do coelho = **placeholder de conceito** (Gemini). Produção → fal.ai + animação/vídeo.
- Execução final pretendida: **scroll-driven vídeo** + migração para Next.js.

> Build: C&M Tecnologia · 2026-06 · *não toca no site live (cmtecnologia.pt)*.
