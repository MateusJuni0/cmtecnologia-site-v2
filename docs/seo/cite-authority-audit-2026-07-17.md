# Auditoria de Autoridade CITE — 17 de julho de 2026

## Veredicto

`CAUTIOUS` — o domínio está tecnicamente preparado, sem penalizações ou problemas de segurança conhecidos, mas ainda não tem corroboracão externa suficiente para ser tratado como autoridade. A estimativa conservadora é `38/100` antes desta release e cerca de `40/100` após a publicação dos novos cabeçalhos de segurança.

Isto não é uma métrica oficial do Google nem uma promessa de ranking. É uma grelha operacional para separar o que está comprovado do que ainda precisa de evidência.

## Evidência instrumental

- Search Console, últimos 3 meses até 15 de julho: `24 cliques`, `328 impressões`, `CTR 7,3%`, posição média `9,7`.
- Cobertura reportada em 10 de julho: `11 URLs indexadas` e `7 não indexadas`; quatro exclusões são `noindex` legacy intencionais e uma é um 404 legacy.
- Links externos no Search Console: `2 links`, ambos a partir de `dev.to`, para a homepage; `1 domínio de referência`.
- Ações manuais: nenhuma.
- Problemas de segurança no Search Console: nenhum.
- Site: `20` URLs canónicas no sitemap, todas testadas com HTTP 200 na release anterior; Lighthouse `100/100/100/100`.
- Pesquisa pública de marca: a homepage aparece para a consulta exata, mas há várias entidades homónimas no Brasil. A geografia `Portugal` é indispensável.
- Wikidata: nenhuma entidade encontrada para `C&M Tecnologia` ou `CMTecnologia` em 17 de julho de 2026.

## Score por pilar

| Pilar | Peso | Score observado | Contribuição |
|---|---:|---:|---:|
| Citation | 25% | 25% | 6,25 |
| Identity | 30% | 31% | 9,38 |
| Trust | 25% | 67% | 16,67 |
| Eminence | 20% | 28% | 5,56 |
| **Total** | **100%** |  | **37,86 ≈ 38/100** |

Os itens `N/A` não entram no denominador. `Pass = 1`, `Partial = 0,5`, `Fail = 0`.

## Grelha completa de 40 sinais

### Citation — 25%

| ID | Estado | Evidência |
|---|---|---|
| C01 Referring domains volume | Fail | Apenas 1 domínio de referência no Search Console. |
| C02 Referring domains quality | Partial | `dev.to` é uma plataforma editorial legítima, mas uma única fonte não prova autoridade. |
| C03 Link equity distribution | N/A | Não há amostra suficiente para medir distribuição. |
| C04 Link velocity | N/A | Sem histórico mensal exportado. |
| C05 AI citation frequency | N/A | Ronda fixa de 40 prompts ainda não executada. |
| C06 AI citation prominence | N/A | Sem baseline comparável. |
| C07 Cross-engine citation | N/A | Sem baseline em ChatGPT, Gemini e Perplexity. |
| C08 Citation sentiment | N/A | Sem amostra de citações. |
| C09 Editorial link ratio | Partial | Os dois links conhecidos parecem editoriais, mas a amostra é mínima e deve ser confirmada. |
| C10 Citation diversity | Fail | Uma única plataforma, tipo de site e fonte. |

### Identity — 30%

| ID | Estado | Evidência |
|---|---|---|
| I01 Knowledge graph presence | Fail | Sem entidade Wikidata e sem knowledge panel confirmado. |
| I02 Branded search volume | Fail | Há procura de marca, mas a escala observada é inferior ao patamar de autoridade. |
| I03 Brand SERP ownership | Partial | O domínio aparece para a marca, porém existem homónimos fortes e perfis externos ainda não dominam a SERP. |
| I04 Structured data coverage | Pass | Organização, serviços, autor e FAQ presentes nas páginas canónicas e validados localmente. |
| I05 Author identity | Partial | Autoria canónica está em 20 páginas; falta maior corroboracão independente da equipa/fundador. |
| I06 Domain tenure | N/A | A consulta RDAP pública para `.pt` não devolveu registo; medir via DNS.PT/registrador. |
| I07 Cross-platform consistency | Partial | Site, LinkedIn, Instagram e TikTok estão ligados; GBP ainda aguarda verificação e as bios precisam de auditoria manual. |
| I08 Niche consistency over time | N/A | Domínio recente e sem série histórica suficiente. |
| I09 Unlinked brand mentions | Fail | Nenhuma amostra externa verificável encontrada além do próprio domínio. |
| I10 Query-brand association | Fail | O Search Console ainda não mostra associação consistente da marca às queries comerciais prioritárias. |

### Trust — 25%

| ID | Estado | Evidência |
|---|---|---|
| T01 Link profile naturalness | Partial | Perfil pequeno e sem sinal de spam, mas demasiado curto para uma conclusão forte. |
| T02 Dofollow ratio | N/A | Search Console não expõe esta divisão. |
| T03 Link-traffic coherence | Pass | Dois links e tráfego baixo são coerentes; o veto não dispara. |
| T04 Network diversity | N/A | Sem dados de IP/ASN suficientes. |
| T05 Profile uniqueness | N/A | Amostra insuficiente; não há indício de rede manipulada. |
| T06 WHOIS transparency | N/A | Dados `.pt` não confirmados por RDAP público. |
| T07 Security and HTTPS | Partial | HTTPS e Search Console limpos; HSTS não estava presente no baseline e entra nesta release. |
| T08 Content freshness | Pass | Conteúdo e sitemap atualizados em 17 de julho de 2026. |
| T09 Penalties | Pass | Nenhuma ação manual e nenhuma falha de segurança; veto não dispara. |
| T10 Reviews and reputation | Fail | Empresa em fase pré-receita; não há reviews genuínas suficientes. |

### Eminence — 20%

| ID | Estado | Evidência |
|---|---|---|
| E01 Organic keyword footprint | Fail | Pegada ainda pequena no Search Console. |
| E02 Organic traffic | Fail | 24 cliques em 3 meses. |
| E03 SERP feature presence | N/A | Sem export de features. |
| E04 Crawlability and performance | Pass | Sitemap, robots, HTML estático e Lighthouse 100 na release anterior. |
| E05 Platform presence | Partial | Três perfis oficiais ligados; GBP ainda não verificado. |
| E06 Authoritative media mentions | Fail | Nenhuma menção editorial independente confirmada. |
| E07 Topical depth | Partial | 20 páginas cobrem web, chatbots, voz, automação, integrações e software à medida. |
| E08 Topical breadth | Partial | Cobertura ampla, mas o Google ainda não indexou o conjunto completo. |
| E09 Geographic reach | Fail | Foco local intencional em Portugal e ausência de sinais internacionais. |
| E10 Share of voice | Fail | Sem evidência de participação material nas SERPs comerciais. |

## Prioridades derivadas

1. Verificar o Google Business Profile e fechar a consistência de entidade.
2. Levar as páginas prioritárias de descoberta para indexação e medir a cobertura após o relatório do Google atualizar.
3. Passar de 1 para pelo menos 5 domínios de referência editoriais/relevantes antes de perseguir volume.
4. Publicar perfis B2B completos e reais; não comprar links nem inventar clientes/reviews.
5. Executar mensalmente o conjunto fixo de 40 prompts GEO para criar baseline de citações por IA.
