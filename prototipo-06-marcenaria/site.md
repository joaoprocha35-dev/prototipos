Estrutura e implementação do site
Estrutura de arquivos
prototipo-marcenaria-pinsom/
|-- css/
|   |-- admin.css      (painel administrativo)
|   |-- reset.css
|   |-- responsive.css
|   \-- style.css
|-- ferramentas/
|   \-- gerar-imagens-responsivas.mjs   (gera as versões WebP responsivas das fotos)
|-- js/
|   |-- admin/         (painel administrativo — demonstração)
|   |   |-- dados.js      (dados fictícios + localStorage)
|   |   |-- graficos.js   (gráficos em SVG/HTML puro)
|   |   \-- painel.js     (indicadores, tabelas e formulários)
|   |-- animations.js
|   |-- antes-depois.js
|   |-- etapas-galeria.js
|   |-- etapas-narrativa.js
|   |-- gsap-config.js
|   |-- guarda-roupa-3d.js
|   |-- guarda-roupa-inspecao.js
|   |-- guarda-roupa-materiais.js
|   |-- guarda-roupa-modelo.js
|   |-- hero-captions.js
|   |-- hero-intro.js
|   |-- hero-video.js
|   |-- main.js
|   |-- marquee.js
|   |-- menu-mobile.js
|   |-- navigation.js
|   |-- section-transitions.js
|   |-- servicos-carrossel.js
|   \-- text-reveal.js
|-- public/
|   |-- imagens/
|   |   |-- responsivas/   (gerada: versões WebP 480–1920 px + manifesto.json; originais preservados)
|   |   |-- antes-depois/
|   |   |   |-- cozinha-antes.png
|   |   |   |-- cozinha-depois.png
|   |   |   |-- escritorio-antes.png    (etapa 5, movida da raiz)
|   |   |   \-- escritorio-depois.png   (etapa 5, movida da raiz)
|   |   |-- etapas-marcenaria/
|   |   |   |-- 01-frente-fechado.png
|   |   |   |-- 02-lateral.png
|   |   |   |-- 03-perspectiva.png
|   |   |   |-- 04-portas-abertas.png
|   |   |   |-- 05-gavetas-abertas.png
|   |   |   |-- image-final-instalacao-celular.png      (etapa 5: ambiente finalizado, 752x1344)
|   |   |   \-- image-final-instalacao-computador.png   (etapa 5: ambiente finalizado, 1344x752)
|   |   |-- hero/
|   |   |-- projetos/
|   |   |   |-- cozinha.png
|   |   |   |-- projeto-home-office.png
|   |   |   |-- projeto-painel-tv.png
|   |   |   \-- quarto.png
|   |   |-- servicos/
|   |   |   |-- home-office-quarto.png          (etapa 5, vinda de referencias/casa/)
|   |   |   \-- quartos-corredor-armarios.png   (etapa 5, vinda de referencias/casa/)
|   |   |-- sobre/
|   |   |   |-- marcenaria-sobre-celular.png      (etapa 5, 752x1344, fundo da seção Sobre)
|   |   |   \-- marcenaria-sobre-computador.png   (etapa 5, 960x540, fundo da seção Sobre)
|   |   |-- logo.png
|   |   \-- m.md
|   |-- videos/
|   |   |-- hero-desktop-16x9.mp4
|   |   \-- hero-mobile-9x16.mp4
|   \-- m.md
|-- referencias/
|   |-- evidencias-etapa-3/      (capturas da abertura, do 3D e das seções)
|   |-- evidencias-etapa-4/      (capturas de serviços, materiais 3D, parceiros, CTA e rodapé)
|   |-- evidencias-etapa-5/      (capturas da etapa 5: foto final, Sobre, comparadores e painel)
|   |-- evidencias-etapa-6/      (capturas da etapa 6: pontos de material e 3D de tela cheia)
|   |-- prompts-higgsfield.md    (imagens a gerar: escritório do CTA e cenários de Serviços)
|   \-- i.md
|-- admin.html                   (painel administrativo — demonstração, sem login)
|-- AGENTS.md
|-- conteudo.md
|-- contexto.md
|-- etapa_2.md
|-- etapa_3.md
|-- index.html
|-- README.md
\-- site.md

Etapa 5: fundo estrutural preto; foto do ambiente finalizado depois da instalação 3D; etapa atual em card preto com detalhes; Sobre com foto de fundo; comparador do escritório; botão verde no CTA; WhatsApp pulsante; painel administrativo (admin.html); arquivos da raiz organizados e imagens sem uso apagadas (referencias/casa e referencias/guarda-roupa, cópias de servicos/ e as fotos antigas da equipe).

Histórico (etapa 3): abertura expansiva da Hero, legendas sincronizadas com o vídeo, fundo azul estrutural (preto desde a etapa 5), cards de referência, seção Sobre com fotos da equipe e faixa de parcerias, e guarda-roupa 3D procedural em Three.js com narrativa ligada à rolagem. As cinco imagens de etapas são cópias das referências e servem de alternativa ao 3D. public/imagens/hero/ permanece vazia; pastas vazias não são versionadas pelo Git.

Ordem das seções
1. Header: logo, links internos e botão de orçamento.
2. Hero: abertura expansiva (quadrado central sobre fundo preto que cresce até a tela cheia), vídeo correto conforme a largura, legendas sincronizadas, texto e dois CTAs.
3. Antes e Depois: dois comparadores empilhados (no celular e no computador): a cozinha em cima e o escritório (escritorio-antes/escritorio-depois, 16:9) embaixo. No lado "Depois", pontos "+" mostram o nome e o material de cada item (5 na cozinha, incluindo a torneira; 4 no escritório). Eles somem quando o divisor os cobre.
4. Serviços: carrossel de 4 cards (Cozinhas, Quartos e closets, Salas e painéis de TV, Home office), cada um com fotos que trocam a cada 3 s, setas pequenas e botão marrom de orçamento no WhatsApp.
5. Projetos: grade com cozinha, quarto/closet, painel de TV e home office.
6. Como funciona: seção de etapas da marcenaria com o guarda-roupa 3D (no computador, o 3D cobre todo o fundo do palco e os cards ficam por cima, à esquerda). A etapa atual vira um card preto ampliado, com lateral laranja e detalhes extras. Depois da instalação, o 3D some e a foto do ambiente finalizado cobre a seção, com os 4 cards mantidos.
7. Diferenciais: projeto personalizado, acabamento, acompanhamento e funcionalidade.
8. Sobre a Marcenaria Pinson: foto de fundo cobrindo a seção inteira (marcenaria-sobre-computador a partir de 1024px, marcenaria-sobre-celular abaixo), com os textos por cima (z-index) sobre uma sobreposição escura. Inclui texto institucional, destaques com lateral laranja, CTA de WhatsApp e faixa "Parcerias" em movimento contínuo (fundo preto, cards com texto vermelho; nomes fictícios no protótipo, marcados como ilustrativos).
9. CTA final: foto em tela cheia (provisória; escritório de advocacia a gerar no Higgsfield, 16:9 e 9:16) com sobreposição, chamada e botão verde de WhatsApp.
10. Footer: fundo preto e textos brancos — logo, Instagram, WhatsApp, links rápidos e botão "Painel administrativo" (admin.html).
11. Painel administrativo (admin.html, página separada, fora dos buscadores): visão geral do mês (faturamento, projetos fechados, ticket médio, em andamento, equipe e folha), gráficos (faturamento de 12 meses, projetos por ambiente e por etapa), cadastro e edição de projetos e de funcionários. Dados fictícios salvos só no navegador; responsivo, com as tabelas virando cards no celular.
Hero
- Desktop: mostrar hero-desktop-16x9.mp4 em telas a partir de 768px.
- Mobile: mostrar hero-mobile-9x16.mp4 abaixo de 768px.
- O vídeo deve ser muted, autoplay, playsinline, em loop infinito e cobrir toda a área; botão discreto de pausar/retomar.
- Abertura (js/hero-intro.js): fundo preto e quadrado central de ~200px (150px no celular) com o mesmo vídeo; ~0,25 s parado e expansão de 1,8 s até a tela cheia, uma vez por carregamento, quando o primeiro frame estiver pronto (ou no máximo 2,5 s). Sem abertura com movimento reduzido ou ao abrir direto numa âncora.
- Legendas (js/hero-captions.js) por video.currentTime: 0–4 s título; 4–6 s sem legenda; 6–12 s "Acabamentos que valorizam cada detalhe."; 12–18 s "Funcionalidade e beleza, sob medida para você.". Repetem a cada loop.
- Não há poster em public/imagens/hero/. Quando o vídeo não pode tocar (autoplay bloqueado, erro ou prefers-reduced-motion), a classe .has-fallback mostra uma imagem existente: projetos/cozinha.png (desktop) ou projetos/projeto-home-office.png (celular). Com vídeo lento, .has-poster põe a mesma imagem por trás até o vídeo carregar.
Seção Antes e Depois
- Inserir imediatamente após a Hero e antes da seção de Serviços.
- Usar public/imagens/antes-depois/cozinha-antes.png como imagem inicial: cozinha simples, sem armários planejados.
- Usar public/imagens/antes-depois/cozinha-depois.png como sobreposição: a mesma cozinha, já mobiliada com marcenaria planejada.
- As duas imagens precisam ter o mesmo enquadramento, perspectiva, iluminação e proporção. A única mudança deve ser o projeto de marcenaria.
- Exibir etiquetas claras: Antes para a cozinha sem armários e Depois para a cozinha mobiliada.
- Escritório (etapa 5): public/imagens/antes-depois/escritorio-antes.png (sala vazia) e escritorio-depois.png (escritório planejado), num segundo comparador logo abaixo do da cozinha, com o mesmo comportamento e o texto do leitor de tela em data-compare-subject.
Comportamento do comparador
- Montar um container com as duas imagens sobrepostas e um divisor vertical com puxador circular.
- A imagem de Antes fica visível inicialmente (divisor em 75%: Antes predomina e a borda do Depois indica a interação); ao arrastar o puxador para a esquerda, revelar progressivamente a imagem de Depois.
- Implementar em js/antes-depois.js com pointerdown, pointermove e pointerup, para funcionar com mouse e toque.
- Incluir um input type="range" acessível, permitindo ajuste por teclado. O valor do range deve atualizar a área recortada da imagem de Depois e a posição do divisor.
- No mobile, manter o gesto horizontal responsivo, sem impedir a rolagem vertical quando o usuário não estiver arrastando o comparador.
- Respeitar prefers-reduced-motion: sem animações decorativas obrigatórias; o controle continua funcional.
Seção 3D — etapas da marcenaria
Etapas visuais
1. Conversa e medição.
2. Projeto e aprovação.
3. Fabricação.
4. Instalação.
Implementação com Three.js (etapa 3)
- Three.js r170 por import map (jsDelivr), carregado por import() dinâmico quando a seção se aproxima da tela.
- Modelo procedural fiel às referências: 4 módulos, portas de correr em dois trilhos (externas em madeira e centrais em vidro fumê desde a etapa 4), prateleiras, cabideiros e dois gaveteiros de 4 gavetas.
- Narrativa por rolagem (js/etapas-narrativa.js): 0–25% desenho técnico; 25–50% volume, materiais e portas correndo; 50–75% vista explodida; 75–90% montagem; 90–100% móvel montado. Esses percentuais são do modelo, que ocupa 84% da trilha. Nos últimos 16%, o 3D some e a foto do ambiente finalizado cobre a seção (fixa na tela). O palco fica fixo (sticky) abaixo do header.
- Cards das etapas (botões reais) levam a rolagem à etapa. A etapa ativa fica preta, ampliada, com lateral laranja mais larga, dois detalhes extras e aria-current="step"; as demais continuam brancas (.card-ref).
- Render sob demanda, pixel ratio limitado e nenhum trabalho com a seção fora da tela.
- Se Three.js/WebGL indisponível ou com movimento reduzido, a galeria das imagens de referência permanece no lugar do canvas.
Interações gerais
- Menu mobile abre e fecha sem travar a rolagem.
- Links do menu fazem scroll suave com GSAP ScrollToPlugin (js/navigation.js), considerando a altura do header; sem GSAP, rolagem nativa via JavaScript (o CSS não usa scroll-behavior: smooth).
- Rolagem suave da roda do mouse com GSAP (ScrollToPlugin): cada giro desliza um pouco mais e desacelera (MOTION.wheel). A rolagem segue nativa, então o sticky das etapas continua funcionando. A estrutura #smooth-wrapper/#smooth-content segue no HTML, mas o ScrollSmoother não é usado.
- Cursor de mãozinha em todo o site (body.site); no comparador, a mão de arrastar.
- Fundo estrutural preto (--color-site-background: #0A0A0A; etapa 5) visível na abertura, entre os painéis durante as transições e na faixa de parceiros.
- Botão flutuante de WhatsApp com pulso (anel verde), pausado no hover/foco e desligado com movimento reduzido.
- Cards de Etapas, Serviços, Projetos e Diferenciais usam a base .card-ref (branco, borda #E2D5CD, lateral laranja #E8802F, cantos de 12px). Diferenciais ficam marrons com texto claro no hover/foco/toque.
- Todas as seções principais têm a transição de entrada/saída (painel sobe e se aproxima de 0,94 a 1, revertendo ao subir) via js/section-transitions.js.
- Todos os títulos, parágrafos, rótulos e botões das seções usam a revelação mascarada (js/text-reveal.js). Requisitos completos em etapa_2.md.
- Cards surgem levemente ao entrar na tela, respeitando prefers-reduced-motion.
- Todos os botões de orçamento usam https://wa.me/5514998813787.