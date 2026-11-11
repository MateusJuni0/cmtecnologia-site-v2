# Factos de marketing — C&M Tecnologia (cmtecnologia.pt)

> Criado a 2026-11-11. Regra: **nenhum texto público** (site, anúncio, post, email) diz uma coisa que não esteja aqui.
> Na dúvida, perguntar ao Mateus. Detalhe de posicionamento e concorrência: [`seo/brand-dna.md`](seo/brand-dna.md).

## 1. Quem somos (pode dizer-se)

| Facto | Valor | Fonte |
|---|---|---|
| Nome | C&M Tecnologia | site e perfil Google |
| O que somos | **software house** portuguesa de IA, automação e presença digital | Mateus, 2026-06-22: «NÃO somos agência de marketing digital» |
| Onde | Lisboa, Portugal (atendemos todo o país, à distância) | site, perfil Google |
| Horário | Segunda a sexta, 9h–18h | site |
| WhatsApp | +351 964 977 047 (`https://wa.me/351964977047`) | site |
| Site | https://cmtecnologia.pt | — |
| Instagram | @cm.tecnologia | perfil real, link na bio para o site |
| Produtos nossos | Madalena (assistente de WhatsApp), Inês (assistente de voz), painel de gestão, Cronos Game (loja nossa, no Brasil) | site |

## 2. O que vendemos (pode dizer-se)

Sites e lojas online · chatbot de WhatsApp com IA · atendimento por voz com IA · automação de redes sociais · painel único de gestão · automações e integrações (CRM, WhatsApp, n8n, Supabase) · software à medida · SEO semântico e GEO.
Pacotes de entrada por âmbito, **sem preço de tabela** publicado (`/pacotes.html`).

### Agentes de voz (verificado a 2026-11-11 no molde `cmtec-agent-skeleton-template`)

- Falam português de Portugal.
- Dizem que são «assistente virtual» logo na saudação. É imposto por código (art. 50.º do AI Act): `has_disclosure` e a reposição da frase quando a saudação é cortada.
- Antes do número real, passam por testes de conversa, por chamadas de teste automáticas pela linha telefónica (o nosso «Provador») e por 1 chamada de uma pessoa. Também é dito nos reels públicos do @cm.tecnologia.
- Marcam, remarcam e desmarcam na agenda **quando o software da clínica tem API**. Sem API, registam o pedido e a equipa confirma.
- Não fazem triagem clínica: o que é clínico ou urgente passa para a equipa.
- O número da clínica não muda: o operador reencaminha as chamadas segundo a regra combinada.
- RGPD: a C&M **propõe** à clínica um acordo de subcontratação de dados antes do primeiro paciente.
  - ⚠️ Não dizer «assinamos sempre». Nos clientes em marca branca, o acordo pode passar pela Telecof.

## 3. Proibido dizer

- Clientes, testemunhos, avaliações, casos de estudo ou logótipos de clientes **sem autorização escrita do cliente**. Os agentes que fazemos para clientes da Telecof são em marca branca: a CMTec não aparece.
- Percentagens de resultado, ROI, «aumenta as vendas X%» sem fonte.
- «Líder», «número 1», «primeiro lugar no Google garantido», «as IAs recomendam-nos».
- Preços que não estejam aprovados pelo Mateus.
- «Agência de marketing digital».

## 4. Por confirmar com o Mateus antes de usar

| Item | Porquê |
|---|---|
| Email `geral@cmtecnologia.pt` | O domínio **não tem MX** (verificado a 2026-11-11): este endereço não recebe email. Está na política de privacidade. |
| Telefone para **chamadas** | O +351 964 977 047 é o WhatsApp. Não sabemos se alguém atende chamadas nesse número, por isso o `tel:` ainda não está no site. |
| TikTok `@cmtecnologia` e LinkedIn `company/cmtecnologia` | Estão no rodapé e no `sameAs`, mas a 2026-06-06 o Mateus disse que só tem o Instagram. Se as contas não forem nossas, há que tirar os links. |

## 5. Validador

Ainda não há validador de copy para a CMTec (a Cronos usa `skills/rsa-cronos/validar.py`). Até haver: `npm run validate:seo` + Hallmark para a «cara de IA».
