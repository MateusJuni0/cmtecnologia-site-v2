# Auditoria externa SEO, GEO e AEO — 17 de julho de 2026

## Objetivo

Avaliar o site como um crawler e um utilizador externo, distinguir problemas técnicos de falta de autoridade e implementar apenas melhorias sustentadas por evidência. Esta auditoria não promete primeiro lugar no Google nem recomendação automática por modelos de IA: ambos dependem de concorrência, intenção, histórico, fontes externas e sistemas que a C&M não controla.

## Baseline observado

- Produção antes desta ronda: commit de aplicação e084197053c79fc6a1f0a1f17f436df4224ebe97.
- Sitemap: 20 URLs canónicas.
- Search Console, janela de três meses: 24 cliques, 328 impressões, CTR de 7,3% e posição média de 9,7.
- Relatório de indexação disponível em 10 de julho: 11 URLs indexadas e 7 excluídas; o relatório antecede a release técnica de 17 de julho.
- Autoridade externa observada: 1 domínio de referência e 2 links, ambos associados a dev.to.

## Como os crawlers recebem o site

Foram testadas a página inicial, a base de conhecimento, a página de chatbot e a página de automação empresarial com seis agentes:

- navegador comum;
- Googlebot;
- GPTBot;
- OAI-SearchBot;
- PerplexityBot;
- ClaudeBot.

Todos receberam HTTP 200 e exatamente o mesmo corpo por URL, com o mesmo número de bytes e o mesmo hash. Não foi detetado bloqueio a crawlers de IA, noindex, noai, cloaking ou conteúdo dependente de JavaScript para a resposta principal.

O crawl das 20 URLs como Googlebot confirmou:

- HTTP 200 em todas as páginas canónicas;
- canonical próprio e coerente;
- um único H1;
- title e description dentro dos limites definidos pelo projeto;
- JSON-LD válido;
- Open Graph;
- data de atualização visível;
- nenhum bloqueio de indexação.

## Renderização e experiência

Foram executados 40 cenários, correspondentes às 20 páginas em desktop (1440 × 900) e mobile (390 × 844).

Resultado depois das correções:

- 40/40 respostas HTTP 200;
- zero overflow horizontal;
- zero erros de JavaScript;
- zero pedidos não multimédia falhados;
- zero imagens visíveis quebradas;
- zero IDs duplicados;
- zero headings vazios;
- um H1 e um elemento main por página;
- zero controlos de formulário sem nome acessível.

A imagem sem src observada no primeiro diagnóstico pertence ao modal de portefólio oculto e só recebe uma imagem quando o modal abre; não é um recurso visível quebrado.

## Descoberta de marca e de categoria

Uma pesquisa externa de recuperação, usada como proxy de descoberta e não como medição oficial do Google, testou oito intenções com dez resultados por intenção.

| Intenção | C&M recuperada |
| --- | --- |
| C&M Tecnologia Portugal / cmtecnologia | sim, primeira resposta |
| software house Portugal + IA + sites + chatbots | não no top 10 observado |
| automação com IA para PMEs em Portugal | não no top 10 observado |
| criação de sites e lojas online Portugal | não no top 10 observado |
| agente de voz com IA Portugal | não no top 10 observado |
| software à medida Portugal | não no top 10 observado |
| n8n e Supabase automação Portugal | não no top 10 observado |
| SEO, GEO e AEO Portugal | não no top 10 observado |

Conclusão: a entidade de marca já é recuperável pelo nome, mas a autoridade para consultas genéricas ainda é baixa. Isto coincide com o número reduzido de domínios de referência no Search Console.

Uma tentativa de medir diretamente resultados Google sem personalização foi bloqueada pela página de proteção contra tráfego automatizado (/sorry/index). Esse teste é registado como **não executado**; não foi inferida nem fabricada qualquer posição.

## Lacunas comprovadas

1. **Autoridade fora do site:** apenas um domínio de referência. É o maior limitador atual e não pode ser resolvido apenas com meta tags ou schema.
2. **Páginas comerciais antigas sem fontes temáticas:** cinco páginas de serviços, a calculadora e o guia apontavam sobretudo para páginas internas e para o Livro de Reclamações, sem documentação oficial do tema.
3. **Entidade fragmentada:** cinco serviços e a calculadora descreviam uma nova Organization sem o identificador canónico https://cmtecnologia.pt/#org.
4. **Malha interna desigual:** a página de clínicas tinha apenas uma entrada interna; painel e guia tinham poucas saídas para clusters relacionados.
5. **Premissas não demonstradas:** a calculadora fixava 60% como parte “conservadora” automatizável e a página de voz afirmava um retorno típico sem dados próprios.
6. **Duplicados técnicos:** o servidor entregava /pagina, /pagina/ e /pagina.html com o mesmo HTML, apesar de sitemap e canonical escolherem .html.
7. **Acessibilidade:** três controlos do formulário principal dependiam apenas de placeholder.

## Melhorias implementadas nesta ronda

- unificação da entidade C&M pelo @id canónico em todas as 20 páginas;
- fontes oficiais e texto contextual em sites, chatbot, voz, redes sociais, painel, guia e calculadora;
- ligações internas adicionais para clínicas, CRM, software à medida, automação empresarial, base de conhecimento e critérios de escolha;
- substituição das alegações de retorno não demonstradas por hipóteses mensuráveis;
- percentagem automatizável escolhida pelo utilizador na calculadora, com fórmula, exemplo, limitações e valor incluído no pedido;
- nomes acessíveis nos formulários;
- redirecionamento 301 de variantes sem extensão e /index.html para a URL canónica;
- validador reforçado para entidade, fontes, malha interna, transparência da calculadora e contratos de acessibilidade/redirect.

Depois da alteração, todas as páginas não legais têm pelo menos cinco ligações para outras páginas canónicas. As 15 páginas editoriais ou comerciais sujeitas ao novo controlo têm pelo menos duas fontes externas; todas as páginas contêm o identificador canónico da organização.

## Verificação local

- npm run validate:seo: 20 páginas, 18 itens de feed, zero erros e zero avisos.
- npm run validate:indexnow: 20 URLs canónicas.
- node --check: servidor e validador válidos.
- git diff --check: sem erros.
- npm audit --omit=dev: zero vulnerabilidades conhecidas.
- Smoke test: 20/20 URLs do sitemap com HTTP 200; desconhecida e documentação interna com 404; redirects canónicos com 301.
- Calculadora: 40% produz 416 € no exemplo documentado; 60% produz 624 € e a premissa visível acompanha a seleção.
- Browser: 40/40 cenários desktop/mobile sem falhas.

## Verificação em produção

- Release de aplicação: f072fb41423a07e43eb041bd08b438a4d5d33499.
- GitHub Actions: run 29614670984 concluído com sucesso.
- Contentor LIVE: imagem sha256:f12f69516f757b64157de7dbc090e1e75c890c46d6f62b665181b9ed22a95dac, estado running, zero reinícios.
- Rollback: Compose anterior preservado e fixado à release e084197053c79fc6a1f0a1f17f436df4224ebe97.
- Crawl público: 20/20 URLs HTTP 200 e 26 blocos JSON-LD válidos.
- Paridade: navegador, Googlebot, GPTBot, OAI-SearchBot, PerplexityBot e ClaudeBot receberam o mesmo hash em quatro páginas de controlo.
- Browser público: 40/40 cenários desktop/mobile sem falhas; calculadora confirmada em 416 € para o exemplo de 40%.
- Canonicalização: /calculadora-roi, /calculadora-roi/ e /index.html respondem 301 para as URLs canónicas.
- IndexNow: 20 URLs aceites com HTTP 200.
- Uma medição PageSpeed pública fresca foi tentada depois do deploy e recebeu HTTP 429. O Lighthouse 100/100/100/100 da release anterior continua histórico e não é apresentado como resultado novo.

## Próximas alavancas

O próximo crescimento não virá de repetir keywords. As prioridades são:

1. concluir e otimizar o Google Business Profile;
2. obter menções editoriais e links portugueses relevantes, sem compra de links;
3. publicar evidência própria verificável: estudos de processo, screenshots autorizados, método e resultados de pilotos;
4. criar páginas locais apenas quando houver presença e prova reais;
5. acompanhar mensalmente consultas não-marca no Search Console e menções em respostas de IA com prompts fixos;
6. atualizar conteúdo quando fontes, APIs ou regras mudarem.

As três ações que exigem intervenção humana ficaram adiadas no BRAIN.md: verificação em vídeo do Google Business Profile; confirmação de dados legais/empresariais para diretórios; autorização específica antes de outreach ou publicação em contas externas.
