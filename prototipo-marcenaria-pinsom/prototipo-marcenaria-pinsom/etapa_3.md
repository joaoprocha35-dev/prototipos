Etapa 3 — Abertura animada, fundo azul, cards e guarda-roupa 3D
Marcenaria Pinson • Revisão de 17/10/2026
1. Instrução para o Claude
Implemente esta etapa no projeto existente. Leia as orientações do projeto e inspecione o código antes de alterar. Esta revisão substitui a etapa 3 anterior e atualiza as regras conflitantes sobre abertura, fundo geral, cards e transições.
Mantenha HTML, CSS e JavaScript, reutilizando GSAP e seus módulos. Tome as decisões de implementação sem solicitar confirmação para ajustes comuns. Todo conteúdo do site, documentação e relatório final deve ser em português brasileiro.
Execute nesta ordem: corrigir a abertura, aplicar o fundo azul e os cards, conferir as transições/textos e implementar o guarda-roupa Three.js. Preserve menu, WhatsApp, navegação, comparador e responsividade.
2. Referências e mudanças solicitadas
Referência anexada	Aplicação
1 — image(20261017-222731).png	Hero atual. O usuário relata que o vídeo toca, mas a abertura expansiva não aparece.
2 — image(20261017-222654).png	Fundo marrom externo aos painéis: deve passar a azul.
3 — image(20261017-222702).png	Etapas atuais: transformar a lista em cards com acabamento definido.
4 — image(20261017-222709).png	Card de referência: branco, borda bege fina, lateral laranja e cantos arredondados.
5 e 6 — image(20261017-222810).png e image(20261017-222846).png	Estados da abertura: mídia pequena e centralizada, depois ampliada. Usar fundo azul no projeto.


Os anexos 5 e 6 recebidos são imagens estáticas de dois momentos da animação. Eles orientam os estados visuais; a duração abaixo é uma decisão de implementação. A captura da Hero, isoladamente, não identifica a causa da falha relatada.
3. Corrigir a abertura automática da Hero
Resultado obrigatório: ao abrir/recarregar a página no topo, aparecer um fundo azul ocupando a viewport e uma pequena janela quadrada de vídeo no centro. Ela cresce automaticamente até a Hero ocupar a tela inteira, enquanto o vídeo continua tocando.
Nome descritivo do efeito: Expanding Mask Reveal / Hero Intro Reveal.
- Começar com quadrado central de aproximadamente 160–220 px no desktop, adaptado ao celular.
- Tornar o estado pequeno perceptível por aproximadamente 0,25 s; expandir em cerca de 1,6–2 s com curva suave.
- Usar o mesmo elemento de vídeo e fonte durante toda a abertura. Não reiniciar reprodução, trocar para uma cópia nem mostrar um vídeo separado no loader.
- Animar uma máscara ou janela de recorte da composição da Hero, preservando proporção com object-fit: cover. Não esticar a imagem.
- Manter o fundo azul visível em toda a área fora da janela; ao concluir, a Hero preenche a viewport.
- A abertura é automática, independente de scroll ou clique, e ocorre uma vez por carregamento. Não repeti-la a cada loop do vídeo.
- Definir o estado inicial antes da primeira pintura para evitar um flash da Hero já expandida. Aplicar esse estado somente no caminho com JavaScript e prever sua remoção em caso de falha.
- Disparar quando o primeiro frame estiver disponível. Tratar tanto evento de carregamento quanto mídia já pronta em cache; não esperar o arquivo inteiro baixar.
- Se autoplay falhar, concluir a expansão com a imagem alternativa e permitir reprodução voluntária.
- Incluir recuperação com tempo limite para que CDN, vídeo ou JavaScript de animação não deixem a página bloqueada.
- Com movimento reduzido, mostrar diretamente o estado final estático.
Inspecionar a causa real antes de corrigir: ordem de inicialização, estado inicial do CSS, evento perdido em mídia já carregada, erro de GSAP, flag persistente que pula a abertura ou conflito com ScrollTrigger. Registrar somente a causa comprovada.
Separar os elementos responsáveis pela abertura e pela transição de scroll. As duas animações não devem escrever no mesmo transform/máscara. Atualizar as medidas dos ScrollTriggers após a abertura quando necessário.
Reprodução e textos
Preservar vídeos de 18 s: desktop 1920×1080 e celular 720×1280. Carregar somente a fonte adequada, com loop infinito, muted e playsinline. Controle apenas de pausar/retomar.
Manter a sincronização com video.currentTime e repetir as legendas a cada loop:
Tempo do vídeo	Texto
0–4 s	Marcenaria planejada para transformar o seu ambiente.
4–6 s	Saída do título para valorizar a imagem.
6–12 s	Acabamentos que valorizam cada detalhe.
12–18 s	Funcionalidade e beleza, sob medida para você.


Preservar CTA, contraste e preferências de pausa. A legenda acompanha o vídeo, inclusive após pausa, busca e troca de versão; não usar temporizadores independentes.
4. Fundo geral azul
Adotar inicialmente #0B2447 como azul profundo. Centralizar em --color-site-background.
Aplicar o azul ao fundo estrutural da página, abertura, espaços entre seções e áreas expostas pelas animações de escala. Conferir html, body, wrappers e pseudo-elementos para eliminar as faixas marrons mostradas no segundo anexo.
Os painéis internos podem continuar claros/bege para leitura, como na referência. As fotografias mantêm suas cores naturais. A seção Sobre conserva seu painel bege, agora sobre a base azul.
Verificar o azul em todos os estados: antes da abertura, durante a expansão, entre seções, no scroll reverso e no celular. Evitar flashes de branco ou marrom provenientes de wrappers com cores antigas.
5. Cards iguais à quarta referência
Aplicar aos quatro cards das etapas e padronizar a mesma base de borda nos cards existentes de Serviços, Projetos e Diferenciais, preservando imagens e conteúdo.
Valores iniciais baseados na referência:
Propriedade	Valor
Fundo	#FFFFFF
Borda externa	1px solid #E2D5CD
Borda esquerda	3px solid #E8802F
Cantos	Aproximadamente 12 px
Espaço interno	20–24 px, adaptado à tela
Número da etapa	Pequeno, destacado em laranja
Título	Escuro, com peso evidente
Descrição	Escura e legível, com entrelinha confortável


A borda bege e a lateral laranja precisam aparecer no estado normal, sem depender de hover. Criar uma classe/base reutilizável, evitando estilos divergentes por card.
Nos Diferenciais, manter a interação de fundo marrom e texto claro no hover/foco/toque, conservando o detalhe laranja. Nos cards das etapas, destacar o ativo com fundo creme suave e indicador acessível, sincronizado com a narrativa 3D.
Usar botões reais para controles clicáveis. Preservar o conteúdo da Pinson; o texto “Reunião inicial” do exemplo de arquitetura é apenas referência de composição.
6. Transições e textos em todas as seções
Aplicar a linguagem de deslocamento vertical e aproximação a todas as seções principais: Hero, Antes e depois, Serviços, Projetos, Etapas, Diferenciais, Sobre e Contato, conforme existirem.
Ao descer, a seção anterior sobe e a seguinte se aproxima, passando aproximadamente de escala 0,94 para 1. Ao subir, o movimento se reverte. O azul fica visível ao redor dos painéis durante a transição.
Usar GSAP + ScrollTrigger, com intensidade adaptada ao celular, mantendo alturas naturais e leitura integral. Na seção 3D, animar a entrada/saída separadamente do pin interno; não aninhar pins nem transformar seu ancestral durante a fixação.
Aplicar Masked Line Reveal com Stagger aos textos:
- Títulos: entrada de linhas/palavras por trás de uma máscara.
- Parágrafos e descrições: revelação breve por linhas.
- Rótulos e botões: entrada do elemento inteiro, preservando interação.
- Referência inicial: yPercent: 110 → 0, duração de 0,8 s e stagger de 0,1 s.
Reutilizar SplitText, se disponível, ou carregar uma versão compatível com o GSAP existente. Recalcular quebras após fontes/resize sem duplicar wrappers. Manter conteúdo acessível, visível sem dependências e estático em movimento reduzido.
Preservar a seção Sobre com equipe-celular em telas menores e equipe-computador nas maiores, usando as extensões reais e picture/source. Foto à esquerda no desktop e acima do texto no celular.
7. Implementar o guarda-roupa Three.js
Construir um modelo procedural real, sem depender de Blender, plugin pago ou serviço externo.
Aparência e referências
Inspecionar as cinco imagens existentes, localizando pelos nomes:
01-frente-fechado.png, 02-lateral.png, 03-perspectiva.png, 04-portas-abertas.png e 05-gavetas-abertas.png.
Reproduzir proporções, acabamento bege/taupe, divisórias, prateleiras, cabideiros, portas e gaveteiros. Confirmar o mecanismo das portas nas referências; portas de correr devem deslizar em trilhos. Usar grupos separados, espessuras e folgas plausíveis.
O vídeo inspiração-guarda-roupa-3D.mp4 orienta o movimento: desenho técnico, volume/material, peças separadas e montagem. O móvel baixo do vídeo não substitui o guarda-roupa das imagens. Não copiar as promessas comerciais daquele site.
Composição e narrativa
No desktop, cards/narrativa à esquerda e modelo grande à direita; no celular, composição vertical. Integrar o canvas ao painel, com luz e sombra suaves e sem cortes no móvel.
Progresso sugerido	Etapa	Movimento
0–25%	Conversa e medição	Desenho técnico e contornos.
25–50%	Projeto e aprovação	Volume, materiais e perspectiva revelam o projeto.
50–75%	Fabricação	Painéis, portas e gavetas se separam em vista explodida controlada.
75–90%	Montagem e instalação	Peças voltam às posições e o móvel fica completo.
90–100%	Final da montagem	Breve permanência montado e liberação para a próxima seção.


Fixar a apresentação abaixo do header durante a história. Usar uma timeline GSAP/ScrollTrigger com scrub, fim finito e espaço de rolagem preservado. O progresso controla modelo, câmera, textos e card ativo.
Clique no card deve levar a rolagem à etapa correspondente. Scroll reverso e saltos rápidos devem produzir o estado correto. Não usar autoplay da história, travar a roda ou criar um segundo controlador de animação.
Em telas onde o conteúdo não cabe, reduzir a composição ou oferecer etapas acessíveis sem pin prolongado. A leitura nunca pode ficar cortada.
Arquitetura e recuperação
Reutilizar js/guarda-roupa-3d.js. Separar modelo e controle de etapas em módulos se necessário. Preservar a inicialização isolada do main.js.
- Three.js e addons com versão fixa, compatível e registrada no README.
- Importação dinâmica com tratamento de erro, sem impedir os demais módulos.
- Criar modelo/cena uma vez; renderizar quando houver mudanças e limitar densidade de pixels.
- Suspender trabalho desnecessário fora da tela; liberar recursos e eventos ao desmontar.
- Galeria existente como fallback para falha de WebGL/CDN e movimento reduzido.
- Trocar a galeria pelo canvas apenas depois do primeiro frame válido.
- Se oferecer exploração manual, separar OrbitControls da câmera controlada pela timeline e preservar a rolagem vertical.
8. Evidências e entrega
Concluir os itens abaixo antes de declarar esta etapa pronta:
- [ ] Gravar a abertura ou capturar seus estados pequeno, intermediário e expandido. Uma imagem apenas do estado final não comprova o efeito.
- [ ] Conferir abertura com mídia em cache, recarregamento e carregamento lento.
- [ ] Confirmar reprodução contínua durante a expansão e dois loops completos.
- [ ] Mostrar fundo azul na abertura e entre os painéis, sem faixas marrons residuais.
- [ ] Mostrar cards com borda bege e lateral laranja no estado normal.
- [ ] Conferir transições e textos em todas as seções, incluindo scroll reverso.
- [ ] Mostrar os quatro estados do guarda-roupa e a liberação após montagem.
- [ ] Verificar menu, âncoras, foco, comparador e WhatsApp.
- [ ] Testar larguras 360, 390, 768, 1024 e 1440 px, incluindo janela baixa.
- [ ] Testar movimento reduzido e falhas de dependências, sem conteúdo preso ou invisível.
- [ ] Registrar erros encontrados, correções, ambientes efetivamente testados e limitações.
Atualizar AGENTS.md, site.md, etapa_2.md e README somente nos pontos afetados. Descrever arquitetura, implementação e evidências reais. Esta etapa inclui a abertura e o 3D completos; não entregar apenas placeholders nem adiar essas correções para a etapa 4.
Referências técnicas
- GSAP — ScrollTrigger
- GSAP — SplitText
- Three.js — instalação
- Three.js — renderização sob demanda