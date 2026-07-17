# Runbook de Indexação e Autoridade

## Estado em 17 de julho de 2026

- Google Search Console: 24 cliques, 328 impressões, CTR 7,3% e posição média 9,7 nos últimos 3 meses.
- O relatório de cobertura, atualizado em 10 de julho, ainda mostra 11 indexadas e 7 excluídas; ele antecede a release de 17 de julho.
- URLs solicitadas manualmente à fila prioritária do Google:
  - `/base-conhecimento-sites-ia-automacao.html`
  - `/automacao-ia-clinicas-portugal.html`
  - `/software-a-medida-portugal.html`
  - `/automacao-empresarial-ia.html`
- Sitemap: 20 URLs canónicas.
- Autoridade externa: 1 domínio de referência e 2 links, ambos de `dev.to`.

## Canais de descoberta

### Google

- Sitemap canónico declarado em `robots.txt` e submetido no Search Console.
- Pedidos manuais reservados para novas páginas comerciais prioritárias; não desperdiçar quota em todas as URLs.
- Rever cobertura 7–14 dias após cada release material.

### IndexNow

- Chave pública: `/de58e4308119421199d0387b93c0a9ad.txt`.
- Script: `npm run submit:indexnow`.
- Validação sem pedido externo: `npm run validate:indexnow`.
- O script extrai as URLs diretamente do sitemap, exige o mesmo origin e rejeita duplicados, query strings e fragmentos.
- O deploy só envia o pedido depois do novo container ficar saudável. Falha de IndexNow não derruba produção e pode ser repetida.

IndexNow acelera descoberta em motores participantes; não garante indexação nem posição.

## Gatilhos de release

Executar IndexNow quando:

- uma URL canónica for criada, alterada de forma material ou removida
- títulos, conteúdo principal ou dados estruturados mudarem materialmente
- o sitemap mudar

Não executar por alterações apenas em documentação interna.

## Monitorização

### Semanal

- verificar HTTP 200 de `/robots.txt`, `/sitemap.xml`, `/llms.txt` e da chave IndexNow
- confirmar que não existe `noindex` nas 20 páginas canónicas
- rever páginas e queries no Search Console
- registar URLs descobertas, rastreadas e indexadas

### Mensal

- exportar cliques, impressões, CTR e posição por query/página
- atualizar auditoria CITE
- rever domínios de referência e âncoras
- executar os 40 prompts GEO sem mudar a redação
- comparar menção, descrição, link citado e concorrentes por motor

## Critérios de decisão

- `>=80%` do sitemap indexado: pode testar um novo ativo editorial baseado em procura real.
- `<80%` indexado: melhorar distribuição, links internos, cobertura e autoridade; não aumentar volume de páginas.
- Página rastreada e não indexada por mais de 30 dias: comparar intenção, duplicação, valor informativo e links internos antes de reescrever.
- Queda técnica ou manual action: congelar publicação, diagnosticar e corrigir antes de outreach.

## Limites

Nenhum sistema permite garantir primeiro lugar universal ou recomendação obrigatória por IAs. O objetivo controlável é tornar a C&M Tecnologia tecnicamente legível, factualmente consistente e externamente corroborada, aumentando a probabilidade de descoberta e recomendação legítima.
