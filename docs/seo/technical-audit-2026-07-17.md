# Auditoria Tecnica SEO, GEO e AEO - 2026-07-17

> Este documento separa o baseline observado em produção das correções implementadas localmente. Enquanto não houver deploy autorizado, a coluna de produção continua a refletir o baseline.

## Estado Pós-Implementação Local

- `17` páginas públicas canónicas no `sitemap.xml`, face a `10` no baseline de produção
- `6` páginas novas de alta intenção: software à medida, automação empresarial, CRM + WhatsApp, n8n + Supabase, SEO/GEO/AEO e Sobre
- `feed.xml` criado e descoberto por `rel="alternate"` nas `17` páginas
- `/.well-known/llms.txt` servido pelo Express como alias do `/llms.txt`
- leituras `GET/HEAD` no host `www` redirecionadas por `301` para o apex, preservando path e query
- schema `WebPage` adicionado à Política de Privacidade e aos Termos
- identificador da organização normalizado para `https://cmtecnologia.pt/#org`
- produção: **pendente de deploy e nova verificação HTTP**

## Escopo do Baseline de Produção

- Dominio auditado: `https://cmtecnologia.pt`
- Variantes verificadas: apex e `www`
- Camada de entrega observada: Cloudflare na frente da aplicacao
- Universo auditado: `12` documentos HTML no projecto, ignorando o ficheiro de verificacao Google
- Universo indexavel confirmado no `sitemap.xml`: `10` URLs

## Resumo Executivo do Baseline

O site ja cumpre a base tecnica minima para descoberta por motores de busca e bots de IA: apex e `www` respondem com `200`, `robots.txt`, `sitemap.xml` e `llms.txt` respondem com `200`, e os bots `GPTBot`, `ClaudeBot`, `PerplexityBot`, `OAI-SearchBot` e `Googlebot` recebem `200` sem sinal `X-Robots-Tag` bloqueante.

Os maiores gaps estruturais estão nos sinais de autoridade externos. A ausência de `/.well-known/llms.txt`, `feed.xml`, schema legal e canonicalização do host foi corrigida localmente. O Google Business Profile conhecido continua por verificar, e a marca continua vulnerável a confusão semântica com referências brasileiras quando o nome não é acompanhado por Portugal, Lisboa e a categoria software house.

## Evidencia Confirmada

### Infraestrutura e disponibilidade

- `https://cmtecnologia.pt` responde `200`
- `https://www.cmtecnologia.pt` responde `200`
- A entrega publica passa por Cloudflare

### Superficies de descoberta

- `/robots.txt` responde `200`
- `/sitemap.xml` responde `200`
- `/llms.txt` responde `200`
- `/.well-known/llms.txt` responde `404`
- `/feed.xml` responde `404`

### Bots e indexabilidade para IA

- `GPTBot` recebe `200`
- `ClaudeBot` recebe `200`
- `PerplexityBot` recebe `200`
- `OAI-SearchBot` recebe `200`
- `Googlebot` recebe `200`
- Nao foi observado `X-Robots-Tag` bloqueante para estes agentes

### Cobertura do sitemap

- O `sitemap.xml` expoe `10` URLs
- As `10` URLs do sitemap respondem `200`
- As `10` URLs auditadas no sitemap apresentam exactamente `1` `h1`
- As `10` URLs auditadas no sitemap apresentam JSON-LD, excepto `politica-privacidade.html`

### HTML, canonical e word count

- A auditoria tecnica percorreu `12` ficheiros HTML do projecto, excluindo o ficheiro de verificacao Google do escopo analitico
- `canonical` foi verificado a nivel de pagina na amostra auditada como parte da checklist tecnica
- `word count` foi verificado a nivel de pagina na amostra auditada como parte da checklist tecnica
- Este relatorio fixa apenas os achados consolidados; os valores brutos por pagina nao ficaram materializados aqui e devem ser preservados na proxima ronda de auditoria se o objectivo for comparacao longitudinal

## Achados Priorizados

### P1 - Falta de `/.well-known/llms.txt` — corrigido localmente

Impacto: varios agentes e ferramentas de auditoria procuram primeiro a convencao `/.well-known/llms.txt`. Ter apenas `/llms.txt` reduz compatibilidade e cria friccao desnecessaria para descoberta automatica.

Estado do baseline: `200` em `/llms.txt`; `404` em `/.well-known/llms.txt`. Estado local: alias implementado; produção pendente.

### P1 - Falta de feed RSS/Atom — corrigido localmente

Impacto: a ausencia de `feed.xml` remove um sinal classico de frescura, subscricao e sindicao que continua util para motores, agregadores e pipelines de ingestao por IA.

Estado do baseline: `/feed.xml` responde `404`. Estado local: feed criado e ligado em todas as páginas públicas; produção pendente.

### P1 - Perfil de autoridade externa insuficiente

Impacto: o site pode ser tecnicamente rastreavel, mas a capacidade de ser citado ou recomendado por motores e LLMs depende tambem de corroboracao externa. Neste momento a autoridade off-site e fraca.

Estado actual:

- GBP conhecido, mas nao verificado
- sem evidencias consolidadas de perfis fortes em plataformas de avaliacao B2B
- risco de ambiguidade de marca fora do contexto de Portugal

### P2 - JSON-LD incompleto numa pagina institucional critica — corrigido localmente

Impacto: a ausencia de schema na politica de privacidade nao bloqueia o ranking por si so, mas cria uma lacuna de consistencia semantica num documento institucional que suporta confianca e compliance.

Estado do baseline: `politica-privacidade.html` sem JSON-LD. Estado local: `WebPage` adicionado à privacidade e aos termos; produção pendente.
