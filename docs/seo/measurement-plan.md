# Plano de Medicao SEO, GEO e AEO

## Objectivo

Medir se a visibilidade da `C&M Tecnologia` está a melhorar em pesquisa tradicional, descoberta local e respostas de IA, separando progresso real de perceção.

## Regra Base

Sem acesso directo a ferramentas, o baseline deve ser registado como `nao medido`. Nao se inventam rankings, impressoes, cliques, reviews ou citacoes.

## Fontes de Dados

### Google Search Console

Usar para medir queries brand e non-brand, paginas que recebem impressoes, CTR e posicao media.

Clusters non-brand prioritarios:

- `software house portugal`
- `automacao ia portugal`
- `chatbot whatsapp portugal`
- `criacao de sites portugal`
- `lojas online portugal`
- `desenvolvimento web portugal`

### Google Business Profile

Usar para medir pesquisas por marca, pesquisas por categoria, visualizacoes, accoes e reviews depois de o perfil estar verificado.

### Analytics, Cloudflare e logs

Usar GA4, Cloudflare Web Analytics ou outra ferramenta apenas quando estiver efetivamente instalada e validada. Complementar com logs de acesso do Cloudflare/Express quando disponíveis. Medir:

- sessoes organicas
- landing pages organicas
- engagement por página de serviço e ativo linkable
- eventos de conversao primaria

### Testes manuais de IA

Frequencia: mensal.

Plataformas minimas:

- ChatGPT
- Gemini
- Perplexity

Objectivo: observar se a entidade e mencionada, em que contexto, e com que concorrentes aparece.

## Baseline Inicial

| Area | KPI | Baseline 2026-07-17 |
|---|---|---|
| GSC | Resultado global, ultimos 3 meses | `24 cliques; 328 impressoes; CTR 7,3%; posicao media 9,7` |
| GSC | Impressoes brand | `parcialmente observadas; export completo pendente` |
| GSC | Impressoes non-brand | `export completo pendente` |
| GSC | Cliques non-brand | `export completo pendente` |
| GSC | Posicao media por cluster | `export completo pendente` |
| GSC | Cobertura reportada em 10-07-2026 | `11 indexadas; 7 excluidas; relatorio anterior a release de 17-07` |
| GSC | Autoridade externa | `1 dominio de referencia; 2 links, ambos de dev.to` |
| GBP | Visualizacoes do perfil | `nao medido` |
| GBP | Accoes no perfil | `nao medido` |
| GBP | Reviews | `nao medido` |
| Analytics | Sessoes organicas | `nao medido` |
| Analytics | Conversoes organicas | `nao medido` |
| IA | Menções em testes manuais | `nao medido` |
| Técnico | URLs canónicas no sitemap | `20 LIVE; 20/20 HTTP 200` |
| Técnico | RSS e well-known llms | `18 itens RSS; llms e aliases well-known LIVE` |
| Técnico | Lighthouse | `100 Performance / 100 Accessibility / 100 Best Practices / 100 SEO` |
| Técnico | Auditor AEO externo | `98/100; Foundational 100; Intelligence 92` |

## Rotina de Medicao

### Semanal

- confirmar uptime de `robots.txt`, `sitemap.xml`, `llms.txt` e principais paginas
- verificar se novas paginas entram no sitemap
- registar qualquer alteracao estrutural que afecte leitura por bots

### Mensal

- exportar GSC para queries e paginas
- rever dados do GBP
- rever a ferramenta de analytics e os logs efetivamente disponíveis
- correr testes manuais em ChatGPT, Gemini e Perplexity
- actualizar um snapshot comparavel face ao mes anterior

## Framework dos Testes Manuais de IA

Usar sempre o mesmo conjunto de prompts para comparabilidade. Exemplos:

- `Que software houses em Portugal ajudam com automacao e IA?`
- `Quem faz chatbots para WhatsApp em Portugal?`
- `Empresas em Portugal que criam sites, e-commerce e automacao com IA`
- `Melhores empresas de desenvolvimento web e automacao em Portugal`
- `C&M Tecnologia`
- executar também o conjunto fixo de `40` prompts em `geo-prompt-targets.md`, sem alterar a redação entre rondas

Registar por plataforma:

- se a marca aparece ou nao
- em que posicao narrativa surge, se aplicavel
- se a descricao esta correcta
- se o link citado e o dominio canonico
- que concorrentes aparecem ao lado

## KPIs para 30 Dias

- GBP verificado ou com processo de verificacao em curso
- perfis principais off-site publicados e coerentes
- baseline instrumental finalmente preenchido em GSC, GBP e analytics quando houver acesso
- primeira ronda de testes manuais de IA registada

## KPIs para 90 Dias

- pelo menos 80% das URLs canonicas do sitemap indexadas
- 5 a 10 dominios de referencia legitimos e relevantes, sem compra de links
- GBP verificado e perfis prioritarios coerentes com a entidade canonica
- crescimento de impressoes non-brand face ao baseline exportado no primeiro mes
- pelo menos uma ronda mensal completa dos 40 prompts, com historico comparavel
- conversoes organicas medidas apenas depois de analytics e eventos estarem validados

## Guardrails

- nao interpretar IndexNow ou pedido de indexacao como garantia de inclusao
- nao usar uma pesquisa isolada e personalizada como prova de ranking
- nao alterar os 40 prompts entre rondas
- nao perseguir volume de backlinks sem relevancia editorial e geografica
- nao publicar metas de primeiro lugar como promessa comercial
