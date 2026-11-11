# Proposta de design — 2026-11-11 (NÃO está no ar)

- **Como foi feita:** Hallmark (lê o código) e `unslop` (vê a imagem), em modo polimento. O coelho, o vídeo, o fundo escuro e o violeta ficam.
- **Imagens `*-*.jpg`:** à esquerda o site no ar a 11-11, à direita a proposta.
- **Hallmark na página inicial:** 218 → 188 FAIL. Degradês roxo-azul 14 → 0, emojis 3 → 0. Detalhe em `hallmark-antes.txt` e `hallmark-depois.txt`.

## O que muda

- **Cor:** um só destaque, o violeta do fato do coelho. Sai o texto em degradê.
- **Botões:** o principal passa a claro sobre o escuro, sem brilho colorido.
- **Etiquetas:** frase normal, em vez de MAIÚSCULAS ESPAÇADAS, e sem o ponto colorido.
- **Pormenores:** traço simples em vez da estrela dourada nas listas; o botão do WhatsApp deixa de pulsar.
- **Topo da página:** sai o «Definição direta:» e a data de julho. Isto obriga a mudar o `scripts/validate-seo.mjs`, porque o verificador exige o rótulo na home.

## Para pôr no ar

- Com o OK do Mateus, juntar este ramo ao `main`.
- Nesse passo, ajustar o verificador e repetir a suite completa.
