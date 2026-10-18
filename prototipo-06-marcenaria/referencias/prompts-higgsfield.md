# Imagens para gerar no Higgsfield — Marcenaria Pinson

O conector do Higgsfield usado no desenvolvimento só consulta créditos, modelos e histórico; ele **não gera imagens**. Por isso o site já está montado com fotos existentes, e as imagens abaixo entram quando você gerá-las no site do Higgsfield.

## Configuração para economizar créditos

- **Uma variação por prompt** (batch 1). São 6 imagens no total.
- **Modelo:** GPT Image 2, o mesmo motor das imagens da casa já geradas. Mantém o estilo e permite escolher resolução e qualidade. Alternativa econômica: Nano Banana 2.
- **Resolução:** 1K, a opção mais barata e a mais próxima de 1080p (em 16:9 sai perto de 1344×768). É suficiente para os cards e, com as versões responsivas, para o CTA. Use 2K só se quiser o escritório do CTA mais nítido em telas muito grandes.
- **Qualidade (GPT Image 2):** medium.
- **Antes de gerar:** confira o custo mostrado no botão de gerar. Se o seu plano liberar o modo *Unlimited* nesses modelos, ative-o para não gastar créditos.

## Estilo comum (já incluído em cada prompt)

Fotografia realista de arquitetura de interiores, marcenaria planejada em madeira natural clara e laca off-white, iluminação embutida quente, luz natural suave, linhas retas, sem pessoas, sem texto e sem logotipos.

## Prompts

### 1. CTA — escritório de advocacia (16:9)
Arquivo: `public/imagens/cta/escritorio-advocacia-16x9.png`

> Escritório de advocacia contemporâneo totalmente mobiliado com marcenaria planejada: estante de piso a teto em madeira natural com livros jurídicos e iluminação embutida quente, mesa de reunião em madeira para seis pessoas com cadeiras estofadas em couro caramelo, painel ripado em madeira atrás da mesa principal, armários fechados em laca off-white, piso claro, janelas amplas com cortinas de linho e luz de fim de tarde. Composição horizontal com o terço esquerdo mais calmo e escuro, para receber texto. Fotografia realista de arquitetura de interiores, lente 24 mm, sem pessoas, sem texto, sem logotipos.

### 2. CTA — escritório de advocacia (9:16)
Arquivo: `public/imagens/cta/escritorio-advocacia-9x16.png`

> O mesmo escritório de advocacia contemporâneo com marcenaria planejada (estante de piso a teto em madeira natural com iluminação embutida, mesa de reunião em madeira, cadeiras em couro caramelo, painel ripado e armários off-white), em enquadramento vertical. Metade inferior mais escura e simples, para receber texto. Fotografia realista de arquitetura de interiores, sem pessoas, sem texto, sem logotipos.

### 3. Salas e painéis de TV (16:9)
Arquivo: `public/imagens/servicos/salas-painel-2.png`

> Sala de estar com painel de TV planejado em madeira natural ripada de piso a teto, rack suspenso em laca off-white com portas sem puxador, nichos iluminados com fita de LED quente, sofá claro e tapete bege. Fotografia realista de arquitetura de interiores, sem pessoas, sem texto, sem logotipos.

### 4. Salas e painéis de TV (16:9)
Arquivo: `public/imagens/servicos/salas-painel-3.png`

> Living integrado com estante planejada em madeira natural que envolve a TV, prateleiras com iluminação embutida, aparador suspenso off-white e bancada de madeira junto à janela, luz natural suave. Fotografia realista de arquitetura de interiores, sem pessoas, sem texto, sem logotipos.

### 5. Cozinhas planejadas (16:9)
Arquivo: `public/imagens/servicos/cozinhas-3.png`

> Cozinha planejada em L com armários superiores off-white até o teto, armários inferiores em madeira natural, bancada de pedra clara, torre de fornos embutidos e iluminação de LED sob os armários. Fotografia realista de arquitetura de interiores, sem pessoas, sem texto, sem logotipos.

### 6. Home office (16:9)
Arquivo: `public/imagens/servicos/home-office-3.png`

> Home office planejado com bancada suspensa em madeira natural, gaveteiro off-white, estante com nichos iluminados, painel ripado em madeira e cadeira ergonômica clara, ao lado de uma janela com luz natural. Fotografia realista de arquitetura de interiores, sem pessoas, sem texto, sem logotipos.

## Depois de gerar

Avise no chat. O processo é este:
1. Localizo as imagens novas pelo histórico do Higgsfield (`show_generations`) e baixo-as para os caminhos indicados acima.
2. Rodo `node ferramentas/gerar-imagens-responsivas.mjs` para criar as versões WebP (480/960/1440/1920 px).
3. Encaixo cada imagem:
   - **Escritório:** na `<picture class="cta__media">` do CTA (16:9 no `<img>`, 9:16 no `<source>` do celular).
   - **Demais:** como um novo `<figure data-photo-slide>` no card correspondente de Serviços. O carrossel de fotos passa a trocar entre elas a cada 3 s.

Para fazer o mesmo sem mim, siga a seção "Fotos responsivas" do `README.md`.
