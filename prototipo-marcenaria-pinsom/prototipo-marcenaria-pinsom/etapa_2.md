# Etapa 2 — Requisitos e estado

Este documento reúne os requisitos da etapa 2 e as decisões de animação que valem para o site inteiro a partir de agora. Leia também `AGENTS.md`, `site.md` e `README.md`.

## 1. Transição entre seções (implementado)

Aplica-se a **todas** as seções principais: Hero, Antes e depois, Serviços, Projetos, Como funciona, Diferenciais, Sobre e Contato.

- Ao rolar para baixo, a seção que sai sobe e a seção que entra sobe e se aproxima, com escala de cerca de **0,94 → 1**. Ao rolar para cima, o movimento se inverte naturalmente, porque fica ligado à rolagem (`scrub`).
- Uma única implementação compartilhada: `js/section-transitions.js`, com GSAP + ScrollTrigger.
- Cada seção tem um painel interno `.section__panel` com `[data-section-panel]`. **Só o painel é transformado.** A `<section>` mantém altura natural, âncoras e posição real para a navegação.
- Não há pin nem bloqueio de rolagem. A rolagem por toque continua nativa.
- No celular a intensidade é menor, mas o efeito continua em todas as seções. Valores em `MOTION.sections` (`js/gsap-config.js`):

| Faixa | Escala inicial | Subida de entrada | Subida de saída | Raio das bordas |
|---|---|---|---|---|
| ≥ 768px | 0,94 | 80px | 56px | 28px |
| < 768px | 0,97 | 40px | 28px | 16px |

- A entrada usa `y`/`scale` e a saída usa `yPercent`: componentes de transform independentes, sem disputa entre os dois tweens.
- A Hero só tem a saída, porque já está na tela ao carregar.
- O fundo estrutural (`--color-site-background`; azul #0B2447 na etapa 3, preto #0A0A0A desde a etapa 5) aparece nas bordas dos painéis durante a transição.

## 2. Revelação de textos com máscara (implementado)

Reproduz a entrada de texto do vídeo de referência: linhas que sobem de dentro de uma máscara, em cascata.

- **SplitText 3.13.0**, mesma versão e CDN do GSAP, carregado e registrado uma única vez em `js/gsap-config.js`.
- Linhas animadas de `yPercent: 110` a `0` dentro de máscaras (`mask: "lines"`), com **0,8 s**, **stagger 0,1 s** e **power3.out**.
- Implementação em `js/text-reveal.js`, aplicada por seletores centralizados em `TEXT_REVEAL_TARGETS`:
  - **Títulos e subtítulos** (`h1`, `h2`, `h3`): revelação por linha.
  - **Parágrafos e descrições de cards** (`p`): revelação curta por linha.
  - **Rótulos, botões, links de texto e números das etapas**: o elemento inteiro sobe dentro de uma máscara (`clip-path`), sem alterar o DOM. Foco, cliques e hover ficam preservados, e os estilos inline são limpos ao fim.
- Cada texto revela uma vez ao entrar na tela e permanece legível.
- A Hero revela em sequência quando a abertura expansiva termina (etapa 3): rótulo → texto → botões. O título faz parte das legendas.
- `autoSplit` refaz a divisão quando as fontes carregam ou a largura muda, sem wrappers duplicados (verificado após redimensionamento).
- Acessibilidade: o SplitText mantém a frase completa em `aria-label` e marca as linhas com `aria-hidden`. Textos com `aria-live` (status da galeria) não são divididos. `data-no-split` cria exceções.
- Com `prefers-reduced-motion: reduce`, nada é dividido nem transformado. Se GSAP ou SplitText não carregarem, todo o texto continua visível.

### Legendas da Hero (implementado na etapa 3)

As legendas existem desde a etapa 3 (`js/hero-captions.js`), e o vídeo voltou a ter loop infinito:

- A agenda segue `video.currentTime` (`requestVideoFrameCallback`, com `timeupdate`/`seeked` como apoio), sem temporizadores independentes. Acompanha pausa, busca e troca de versão do vídeo.
- 0–4 s título (h1); 4–6 s sem legenda; 6–12 s e 12–18 s, as duas frases de `conteudo.md`. A agenda reinicia sozinha a cada loop, quando o tempo volta a zero.
- Entrada com a mesma linguagem (linhas de 110 → 0 dentro da máscara) e saída para cima. Com movimento reduzido ou sem SplitText, a troca é imediata.

## 3. Guarda-roupa 3D (implementado na etapa 3 — ver `etapa_3.md` e `README.md`)

- Modelo procedural em `js/guarda-roupa-modelo.js`, com grupos nomeados (estrutura, laterais, base, topo, fundo, divisórias, prateleiras, cabideiros, gavetas, trilhos e portas; puxadores como filhos de portas e gavetas).
- As referências mostram **portas de correr**: elas deslizam em dois trilhos, e as gavetas se deslocam como conjuntos completos.
- Sem OrbitControls nesta versão: a câmera é controlada só pelo progresso da narrativa.

### Convivência com as transições de seção

- A narrativa **não usa pin do ScrollTrigger**. A trilha `.process.is-narrative` tem altura própria (CSS) e o palco usa `position: sticky` abaixo do header. O sticky funciona dentro do painel transformado e não precisa de `pinReparent` nem de pin-spacer.
- A entrada do painel de `#como-funciona` termina (`top 30%`) antes de o palco fixar, e a saída só começa quando o fim da seção chega à base da tela. Durante a fixação o painel fica em identidade (verificado: `matrix(1, 0, 0, 1, 0, 0)`).
- As posições do gatilho da narrativa são calculadas por `offsetTop` (layout), imunes aos transforms da transição.
- As animações internas (câmera, portas, gavetas, card ativo) atuam em elementos filhos, nunca no `[data-section-panel]`.

## 4. Verificação desta etapa

Executada em Chrome headless via DevTools Protocol:

- As 8 seções têm transição: 2 gatilhos por seção e 1 na Hero, que só tem saída.
- 38 títulos/parágrafos divididos em 65 linhas; todos os rótulos, botões, links e números com revelação de elemento.
- Depois de percorrer a página: 0 linhas fora do lugar, 0 elementos com recorte ou transform residual, 0 máscaras duplicadas, inclusive após redimensionar 1440 → 1100 → 1440.
- Ao rolar para cima, o painel volta a se reduzir e a descer (efeito reverso confirmado).
- Movimento reduzido: 0 linhas divididas e 0 painéis transformados.
- Sem SplitText: textos visíveis e transições mantidas. Sem GSAP: conteúdo integral visível.
- Sem rolagem horizontal em 360, 390, 768, 1024 e 1440 px.
- Navegação, cliques rápidos, interrupção manual, histórico e comparador (mouse, toque e teclado) continuam funcionando.
- Console sem erros e sem respostas 4xx/5xx.
