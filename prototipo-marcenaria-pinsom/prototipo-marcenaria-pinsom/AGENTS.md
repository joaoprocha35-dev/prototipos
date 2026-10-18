Regras para agentes — Marcenaria Pinson
Antes de alterar qualquer código, leia por completo contexto.md, site.md, conteudo.md, etapa_2.md e etapa_3.md.
Stack obrigatória
- HTML5, CSS3 e JavaScript puro.
- Three.js r170 por CDN (jsDelivr, import map no index.html) para a seção 3D, carregado por import() dinâmico.
- GSAP 3.13.0 por CDN (ScrollTrigger, ScrollToPlugin, CustomEase, MorphSVG e SplitText; todos registrados uma única vez em js/gsap-config.js) para animações e navegação — aprovado no briefing de implementação. O site deve continuar utilizável se o CDN falhar.
- Sem React, Vite, Bootstrap ou bibliotecas de interface.
- Sem backend, pagamento, login ou banco de dados nesta fase. O painel administrativo (admin.html, etapa 5) é uma demonstração com dados fictícios salvos só no navegador (localStorage); não é um sistema de gestão real e não tem segurança.
Regras de implementação
1. Preserve a estrutura de arquivos definida em site.md.
2. Não apague, mova ou renomeie assets sem atualizar a documentação.
3. Use os vídeos desktop e mobile corretos na hero; vídeo mudo, autoplay (iniciado por js/hero-video.js), playsinline e em loop infinito, com controle só de pausar/retomar (etapa 3). As legendas seguem video.currentTime (js/hero-captions.js) e se repetem a cada loop.
4. O menu e todos os CTAs de orçamento devem abrir o WhatsApp oficial com mensagem pré-preenchida.
5. O site deve funcionar em desktop e celular, sem barra horizontal.
6. Não invente depoimentos, endereço, e-mail, anos de experiência ou serviços não documentados. Exceção registrada: os nomes da faixa "Parcerias" (seção Sobre) são fictícios por pedido do cliente para o protótipo, aparecem como "Marcas ilustrativas" e devem ser trocados pelas parcerias reais antes de publicar.
7. Transição entre seções em TODAS as seções principais (js/section-transitions.js): transformar apenas o painel interno [data-section-panel], nunca a <section>; sem pin; intensidade menor no celular. Detalhes em etapa_2.md.
8. Textos com revelação mascarada em todo o site (js/text-reveal.js, SplitText): títulos e parágrafos por linha (yPercent 110 → 0, 0,8 s, stagger 0,1 s, power3.out); rótulos e botões como elemento inteiro. Conteúdo sempre visível com movimento reduzido ou falha das dependências.
9. Abertura da Hero (js/hero-intro.js): fundo preto, quadrado central com o mesmo vídeo e expansão automática uma vez por carregamento. Anima só o clip-path de [data-hero-intro-frame]; o transform do painel continua exclusivo da transição de seções. O estado inicial é aplicado no <head> só com JS e removido por segurança após 6 s.
10. Fundo estrutural preto (etapa 5, pedido do cliente): --color-site-background (#0A0A0A), também na abertura da Hero e na faixa de parceiros. Não reintroduzir azul nem fundos marrons em html, body, wrappers ou áreas entre painéis.
11. Cards usam a base .card-ref (fundo branco, borda #E2D5CD, lateral laranja #E8802F, cantos de 12px). Não criar estilos divergentes por card. Único destaque permitido: a etapa atual de "Como funciona" (e o indicador principal do painel) fica preta (--card-dark-bg), com lateral laranja mais larga, levemente ampliada (propriedade scale) e com detalhes extras.
12. Fotos: o HTML usa as versões WebP de public/imagens/responsivas/ com srcset/sizes (gere com node ferramentas/gerar-imagens-responsivas.mjs). Não referenciar os PNGs originais diretamente no HTML. Os PNGs originais das fotos em uso ficam em public/imagens/ (o script precisa deles); arquivos novos não ficam soltos na raiz do projeto. Imagens sem uso são apagadas, e o script remove as variantes WebP órfãs.
13. Higgsfield: o conector disponível só consulta créditos, modelos e histórico — não gera mídia. Imagens novas são geradas pelo cliente com os prompts de referencias/prompts-higgsfield.md (1K, uma variação por prompt) e depois importadas pelo histórico.
14. Carrosséis e faixas em movimento precisam de pausa (botão, hover/foco) e não se movem sozinhos com prefers-reduced-motion. O pulso do botão flutuante de WhatsApp pausa no hover/foco e é desligado com movimento reduzido.
15. Botões "Falar no WhatsApp" do CTA final são verdes (--color-whatsapp #1A7F45, texto branco com contraste AA).
16. Cursor de mãozinha (cursor: pointer) em todo o site público (body.site, pedido do cliente); o comparador usa grab/grabbing. O painel administrativo mantém os cursores padrão.
17. Rolagem suave da roda do mouse (js/navigation.js, ScrollToPlugin, MOTION.wheel): a rolagem continua nativa. Não trocar por ScrollSmoother, que move o conteúdo com transform e quebra o palco sticky das etapas e a foto final. Toque, teclado e movimento reduzido ficam nativos.
18. Pontos de material nos comparadores ([data-hotspot] no lado "Depois"): posições em % da foto. Por isso o quadro do comparador mantém a proporção da foto em todas as telas. Textos descritivos e marcados como ilustrativos; não inventar marcas.
Guarda-roupa 3D
- Implementado (etapa 3): modelo procedural em js/guarda-roupa-modelo.js, cena em js/guarda-roupa-3d.js e narrativa em js/etapas-narrativa.js. As cinco imagens de referência estão em public/imagens/etapas-marcenaria/ (a cópia duplicada de referencias/guarda-roupa/ foi apagada na etapa 5).
- As referências mostram portas DE CORRER: elas deslizam em dois trilhos (não giram em dobradiças). Por escolha do cliente (etapa 4): portas externas em madeira e centrais em vidro fumê (MeshPhysicalMaterial, opacidade sempre 1).
- Materiais: metadados apenas em js/guarda-roupa-materiais.js (cada malha guarda só o ID). Sem especificação real confirmada, os rótulos devem continuar honestos ("acabamento ilustrativo — especificação a confirmar").
- A narrativa é controlada só pelo progresso da rolagem (ScrollTrigger com scrub e palco position: sticky abaixo do header, sem pin do ScrollTrigger). Não criar um segundo controlador nem autoplay da história.
- Final (etapa 5): o 3D ocupa a trilha até MOTION.narrative.modelEnd (84%). Depois some, e a foto do ambiente finalizado (image-final-instalacao-computador em telas deitadas, -celular em pé) cobre a seção inteira, com os 4 cards mantidos. Com movimento reduzido ou sem 3D, a etapa 4 mostra essa foto na galeria.
- Computador (≥ 901px, etapa 6): com a narrativa e o 3D ativos, o canvas cobre o palco inteiro (largura da tela), os cards ficam por cima à esquerda e a câmera enquadra o móvel na área livre à direita (setFraming + setViewOffset). No celular, o 3D continua acima dos cards.
- OrbitControls não é usado nesta versão para não disputar o gesto de rolagem. Se for adicionado, deve ficar separado da câmera da timeline.
- As animações internas atuam em elementos filhos, nunca no painel [data-section-panel] da seção.
- Se houver um plugin/conector 3D já disponível no ambiente, ele pode gerar um arquivo GLB como melhoria futura. Nunca tentar instalar, baixar ou inventar plugins automaticamente.
- Se o WebGL ou o CDN falharem, ou com movimento reduzido, mostrar a galeria de imagens de public/imagens/etapas-marcenaria/. O canvas só substitui a galeria depois do primeiro frame válido.
Verificação obrigatória
- Testar abertura (estados pequeno, intermediário e expandido), navegação, menu mobile, hero desktop/mobile, legendas, links de WhatsApp, carregamento de imagens e narrativa 3D.
- Manter HTML semântico, alt nas imagens e botões acessíveis por teclado.
