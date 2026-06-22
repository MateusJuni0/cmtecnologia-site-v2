# Arrumar o site — resposta à auditoria Manus (honesta) — Plano de Implementação

> **Para workers agênticos:** usar `superpowers:subagent-driven-development` ou `superpowers:executing-plans`. Steps usam checkbox (`- [ ]`).

**Goal:** Reduzir fricção de conversão e melhorar performance mobile do site live `cmtecnologia.pt`, SEM inventar provas sociais que não temos (pré-receita).

**Architecture:** Site estático HTML/CSS/JS servido por Express (`server.js`) na VPS via Docker (GitHub Actions → GHCR). Três frentes independentes: (1) Pacotes de entrada, (2) Calculadora de ROI, (3) Performance mobile. Cada frente é testável e deployável sozinha. Nada de frameworks novos — vanilla JS + o CSS existente (`styles.css`).

**Tech Stack:** HTML5, CSS (vars já definidas em `styles.css`), JavaScript vanilla (sem build step), Express 4, GSAP/Lenis (já via CDN). Verificação: `npm start` local + Lighthouse CLI + inspeção visual.

---

## Princípios inegociáveis (contexto que a Manus NÃO tinha)

1. **HONESTIDADE ACIMA DE TUDO.** Pré-receita, zero clientes. **PROIBIDO:** números de clientes, "+1M diagnósticos", "Clínica X reduziu 40%", testemunhos inventados. A prova é: **demos que funcionam a sério** (Madalena WhatsApp, Inês voz, feed IG auto) + transparência ("software house nova — e diferente", já no site).
2. **Não partir o SEO/GEO de 15 jun.** O `<head>`, JSON-LD `@graph` (Organization+ProfessionalService+5×Service+FAQPage), `llms.txt`, `robots.txt`, `sitemap.xml` foram feitos com cuidado. Qualquer página nova entra no sitemap + ganha o seu JSON-LD. Não remover schema existente.
3. **Stack real = HTML estático.** Recomendações da Manus assumindo Next.js são ruído. Ficheiros novos = `.html` na raiz (Express resolve `/<slug>` via `extensions:['html']`).
4. **Site em PRODUÇÃO.** Testar local (`npm start`) antes de qualquer push. Deploy é git → CI → container; mudanças só ficam live depois do pipeline.
5. **DRY / YAGNI.** Reutilizar CSS vars e componentes existentes. Não criar design system novo.

---

## File Structure

| Ficheiro | Responsabilidade | Ação |
|---|---|---|
| `index.html` | Home — nova secção "Pacotes" + link no footer/nav; lazy-load do vídeo/demos | Modificar |
| `pacotes.html` | Página dedicada de pacotes de entrada (3 packs) + JSON-LD | Criar |
| `calculadora-roi.html` | Calculadora de ROI (lead magnet) + JSON-LD | Criar |
| `assets/roi-calc.js` | Lógica vanilla da calculadora (sem libs) | Criar |
| `styles.css` | Estilos das novas secções (cards de pacotes, calculadora) | Modificar |
| `app.js` | Lazy-load/defer dos media pesados na Home | Modificar |
| `sitemap.xml` | + 2 URLs novas (`/pacotes`, `/calculadora-roi`) | Modificar |
| `llms.txt` | Listar as 2 páginas novas | Modificar |
| `index.html` footer "O que fazemos" | Linkar Pacotes + Calculadora | Modificar |

**Ordem de execução:** Frente C (Performance, baixo risco, mensurável) → Frente A (Pacotes) → Frente B (ROI). Razão: performance é a base do "uau" mobile que sustenta as outras; pacotes informam o copy da calculadora.

---

## Chunk 1: Baseline + Frente C (Performance mobile)

### Task 1: Medir baseline (antes de tocar em nada)

**Files:**
- Nenhum (só medição)

- [ ] **Step 1: Correr o site local**

```bash
cd "C:/Users/mjnol/.openclaw/workspace/projects/cmtecnologia-site-v2"
npm install
npm start
```
Esperado: `listening on :3000`, `/healthz` → `{ok:true}`.

- [ ] **Step 2: Lighthouse mobile baseline**

```bash
npx lighthouse http://localhost:3000 --only-categories=performance --form-factor=mobile --screenEmulation.mobile --throttling-method=simulate --output=json --output-path=docs/plans/lh-baseline-mobile.json --quiet --chrome-flags="--headless"
```
Esperado: ficheiro gerado. **Anotar** LCP, TBT, Total Byte Weight, Performance score. Estes são os números a bater.

- [ ] **Step 3: Confirmar o gargalo**

Ler no relatório: confirmar que `scenes/bg-master.mp4` (3.5MB) e/ou `bg-mobile.mp4` (1.8MB) e fontes/JS bloqueiam o LCP. Anotar os "Opportunities" do Lighthouse.

- [ ] **Step 4: Commit do baseline**

```bash
git checkout -b feat/arruma-manus
git add docs/plans/lh-baseline-mobile.json docs/plans/2026-06-22-arruma-site-manus.md
git commit -m "chore(site): lighthouse baseline mobile + plano arruma-manus"
```

### Task 2: Lazy-load dos media pesados na Home

**Files:**
- Modify: `index.html` (tags de vídeo de fundo)
- Modify: `app.js` (lógica de scroll-scrub do vídeo)

- [ ] **Step 1: Localizar as tags de vídeo**

```bash
grep -n "bg-master\|bg-mobile\|preload\|music.mp3" index.html app.js
```
Esperado: encontrar `<video>` desktop/mobile e o `music.mp3`.

- [ ] **Step 2: Diferir o vídeo de fundo até interação/idle**

Em `index.html`: trocar `preload="auto"` → `preload="none"` no(s) `<video>` de fundo. Garantir `poster="scenes/bg-poster.jpg"` (criar poster leve <60KB a partir do 1º frame se não existir — usar ffmpeg: `ffmpeg -i scenes/bg-mobile.mp4 -vframes 1 -q:v 4 scenes/bg-poster.jpg`).

Em `app.js`: arrancar o carregamento/scrub do vídeo só após `requestIdleCallback` (ou `window.load` + 1ª interação de scroll), não no parse inicial. Mobile: se `prefers-reduced-data` ou `navigator.connection.saveData`, NÃO carregar o vídeo — ficar no poster.

- [ ] **Step 3: Confirmar que demos (Inês/Madalena) só carregam on-demand**

```bash
grep -n "voice-live.js\|/api/ines\|/api/madalena" index.html app.js voice-live.js
```
Garantir que `voice-live.js` e qualquer fetch a `/api/ines` só disparam ao clicar no botão de voz (já é o padrão — confirmar, não regredir). `music.mp3` continua user-triggered.

- [ ] **Step 4: Verificar local (visual + rede)**

`npm start`, abrir `http://localhost:3000` em DevTools mobile + Network throttling "Fast 3G". Confirmar: poster aparece imediato, vídeo entra depois sem bloquear o hero, botão de voz funciona ao clicar.

- [ ] **Step 5: Lighthouse pós-fix**

```bash
npx lighthouse http://localhost:3000 --only-categories=performance --form-factor=mobile --screenEmulation.mobile --throttling-method=simulate --output=json --output-path=docs/plans/lh-after-lazy-mobile.json --quiet --chrome-flags="--headless"
```
Esperado: LCP melhor que baseline; Total Byte Weight inicial cai (vídeo fora do caminho crítico). Se não melhorou, parar e investigar antes de seguir.

- [ ] **Step 6: Commit**

```bash
git add index.html app.js scenes/bg-poster.jpg docs/plans/lh-after-lazy-mobile.json
git commit -m "perf(site): lazy-load video de fundo + poster, respeita saveData (LCP mobile)"
```

---

## Chunk 2: Frente A (Pacotes de entrada)

> Resolve o "paradoxo da escolha". 3 packs claros, alinhados ao ICP (clínicas/PMEs). **Sem preços de tabela** (mantém o modelo "diagnóstico → proposta gratuita" do `pricing.md`) — os packs descrevem ESCOPO, não valor em €.

### Task 3: Página `pacotes.html`

**Files:**
- Create: `pacotes.html`
- Modify: `sitemap.xml`, `llms.txt`, `index.html` (footer)

- [ ] **Step 1: Criar `pacotes.html` a partir do molde de página de serviço**

Copiar a estrutura de `chatbot-whatsapp-ia.html` (mesmo `<head>`, header, footer, CTA WhatsApp). Conteúdo: 3 cards de pacote. Proposta (rever copy com Mateus antes de finalizar):
- **Pack Clínica Digital** — Atendimento WhatsApp (Madalena) + Marcações automáticas + Lembretes. Para clínicas/consultórios.
- **Pack Presença Total** — Site/loja + Automação de redes sociais (IA) + WhatsApp. Para PMEs que querem aparecer e vender.
- **Pack Operação 360** — Tudo: voz (Inês) + WhatsApp + redes + Painel único de gestão. Para quem quer piloto automático completo.

Cada card: nome, 1 frase de para-quem, 3-4 bullets de escopo, CTA "Pedir proposta" (WhatsApp + `#contacto`). Rodapé da secção: "Sem preço de tabela — proposta personalizada e gratuita após diagnóstico de 30 min." (consistente com FAQ existente).

- [ ] **Step 2: JSON-LD da página**

Adicionar `@graph` com `BreadcrumbList` (Home → Pacotes) + 3× `Offer`/`Service` (um por pack, `areaServed` Portugal) + reutilizar `FAQPage` relevante. NÃO inventar `price`; usar `priceSpecification` ausente ou `"price":"0"` só no diagnóstico gratuito se fizer sentido — preferir omitir preço.

- [ ] **Step 3: Registar no sitemap + llms.txt**

`sitemap.xml`: adicionar `<url>` para `https://cmtecnologia.pt/pacotes` (priority 0.9, monthly, lastmod 2026-06-22).
`llms.txt`: adicionar linha da página de pacotes.

- [ ] **Step 4: Linkar a partir da Home**

Em `index.html`, footer coluna "O que fazemos": adicionar link `Pacotes` → `/pacotes`. Opcional (rever com Mateus): mini-secção na Home antes do Contacto com os 3 packs em resumo + link "Ver pacotes".

- [ ] **Step 5: Verificar local**

`npm start`, abrir `http://localhost:3000/pacotes` (sem `.html` — testa o `extensions:['html']`). Validar JSON-LD em https://validator.schema.org/ (colar o bloco). Confirmar CTAs e links internos.

- [ ] **Step 6: Commit**

```bash
git add pacotes.html sitemap.xml llms.txt index.html styles.css
git commit -m "feat(site): pagina de Pacotes de entrada (3 packs ICP) + schema + sitemap"
```

---

## Chunk 3: Frente B (Calculadora de ROI)

> Lead magnet **honesto**: usa inputs do próprio cliente (nº colaboradores, horas/semana em tarefas repetitivas, custo/hora). Calcula a poupança estimada. Não promete nada — mostra a matemática do cliente. Sem libs, sem backend (cálculo client-side); captura o lead reutilizando o form/`/api/lead` existente.

### Task 4: `calculadora-roi.html` + `assets/roi-calc.js`

**Files:**
- Create: `calculadora-roi.html`, `assets/roi-calc.js`
- Modify: `sitemap.xml`, `llms.txt`, `index.html` (footer), `styles.css`

- [ ] **Step 1: Criar `calculadora-roi.html` (molde de serviço)**

Mesmo `<head>`/header/footer. Conteúdo: form com inputs — `colaboradores` (number), `horasSemana` (horas/semana em tarefas repetitivas: atendimento, marcações, social), `custoHora` (€/h, default editável ex. 12). Botão "Calcular". Zona de resultado (vazia até calcular — estado loading/empty/error coberto).

- [ ] **Step 2: Lógica em `assets/roi-calc.js` (vanilla)**

```js
// Estimativa honesta: poupança = horas automatizáveis * custo/hora * 4.33 semanas.
// Fator de automação conservador (não prometer 100%): 0.6.
const AUTOMATION_FACTOR = 0.6;
const WEEKS_PER_MONTH = 4.33;
function estimateMonthlySaving({ colaboradores, horasSemana, custoHora }) {
  const horasAutomatizadas = horasSemana * AUTOMATION_FACTOR;
  return Math.round(colaboradores * horasAutomatizadas * custoHora * WEEKS_PER_MONTH);
}
```
Validar inputs (>0, numéricos) antes de calcular; mensagem de erro clara. Mostrar resultado com disclaimer visível: *"Estimativa indicativa baseada nos seus números. O valor real depende do seu fluxo — confirmamos no diagnóstico gratuito."*

- [ ] **Step 3: Ligar ao lead capture existente**

Após mostrar resultado, CTA "Quero esta poupança — pedir proposta" que abre o form de contacto (`#contacto`) ou envia via `/api/lead` (reutilizar handler `api/lead.js` — confirmar campos que aceita: `grep -n "req.body" api/lead.js`). Não duplicar lógica de email/lead.

- [ ] **Step 4: JSON-LD**

`BreadcrumbList` (Home → Calculadora) + `WebApplication`/`Service` simples. Sem claims numéricos no schema.

- [ ] **Step 5: Sitemap + llms.txt + link na Home**

Adicionar `/calculadora-roi` ao `sitemap.xml` (0.8, monthly) e `llms.txt`. Link no footer.

- [ ] **Step 6: Verificar local**

`npm start`, `http://localhost:3000/calculadora-roi`. Testar: inputs válidos → resultado coerente; inputs vazios/negativos → erro claro; CTA leva ao lead. Validar JSON-LD.

- [ ] **Step 7: Commit**

```bash
git add calculadora-roi.html assets/roi-calc.js sitemap.xml llms.txt index.html styles.css
git commit -m "feat(site): calculadora de ROI honesta (lead magnet) + schema + sitemap"
```

---

## Chunk 4: Verificação final + handoff de deploy

### Task 5: Regressão + Lighthouse final

- [ ] **Step 1: Lighthouse SEO + Performance nas páginas novas**

```bash
npx lighthouse http://localhost:3000/pacotes --only-categories=performance,seo --form-factor=mobile --quiet --chrome-flags="--headless" --output=json --output-path=docs/plans/lh-pacotes.json
npx lighthouse http://localhost:3000/calculadora-roi --only-categories=performance,seo --form-factor=mobile --quiet --chrome-flags="--headless" --output=json --output-path=docs/plans/lh-roi.json
```
Esperado: SEO ~100 (schema + meta ok), Performance não pior que a Home.

- [ ] **Step 2: Não-regressão do existente**

Confirmar Home, 5 páginas de serviço e `guia-automacao-ia` ainda 200 e com schema intacto:
```bash
for p in / /chatbot-whatsapp-ia /atendimento-por-voz-ia /criacao-sites-lojas-online /automacao-redes-sociais-ia /painel-gestao-negocio /guia-automacao-ia /pacotes /calculadora-roi; do curl -s -o /dev/null -w "%{http_code} $p\n" http://localhost:3000$p; done
```
Esperado: todos `200`.

- [ ] **Step 3: Checklist de honestidade (BLOQUEANTE)**

Grep final anti-fabricação:
```bash
grep -niE "milhão|milhao|clientes satisfeitos|[0-9]+%|case stud|reduziu|aumentou [0-9]" pacotes.html calculadora-roi.html index.html
```
Rever cada match: NENHUM pode ser uma métrica/resultado inventado. Disclaimers da calculadora são OK. Se houver claim falso → remover antes de continuar.

- [ ] **Step 4: Push + PR (NÃO fazer merge sem aprovação do Mateus)**

```bash
git push -u origin feat/arruma-manus
gh pr create --title "Arruma site: pacotes + ROI calc + perf mobile (resposta Manus, honesta)" --body "Ver docs/plans/2026-06-22-arruma-site-manus.md. Pré-receita: zero métricas inventadas. Deploy só após aprovação."
```

- [ ] **Step 5: Deploy**

Site é prod via GitHub Actions → GHCR → container VPS. Após Mateus aprovar o PR e merge em `main`, seguir `docs/DEPLOY.md`. Confirmar live: apex/www `200`, `/pacotes` e `/calculadora-roi` `200`, re-submeter `sitemap.xml` no Google Search Console.

---

## Fora de scope deste plano (gargalo real — tratar à parte)

O nosso `BRAIN.md` já diz: on-page está feito; o que falta é **autoridade off-site**. Estes itens NÃO são código do site e ficam para um plano próprio:
- **Google Business Profile PT** (sinal local forte, em falta).
- **Backlinks** (diretórios PT, parcerias, guest content).
- **Conteúdo de cauda longa** — expandir o `guia-automacao-ia` numa central (1 guia ≠ hub). Vale, mas é esforço de conteúdo contínuo, não um sprint de site.
- **Autoridade do fundador** — ligar perfil LinkedIn do Mateus (já em `sameAs`); página/secção "Equipa" honesta.

Estes movem mais o ponteiro de descoberta do que qualquer tweak de Home — mas são maratona, não sprint.
