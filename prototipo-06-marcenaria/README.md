# Marcenaria Pinson — Site Institucional

Site de apresentação profissional para empresa de marcenaria planejada. Desenvolvido como protótipo estático de alta fidelidade, sem etapa de build, pronto para publicação na Vercel.

---

## Visão geral

O site apresenta os serviços, projetos e diferenciais da Marcenaria Pinson com uma experiência visual cuidadosa: Hero em vídeo com abertura cinematográfica, comparador antes/depois interativo, narrativa 3D do processo de fabricação, seção institucional com foto da equipe e CTA direto para o WhatsApp.

**Stack:** HTML5, CSS3 e JavaScript puro (módulos ES). GSAP 3.13.0 e Three.js r170 via CDN. Sem React, Vite, Bootstrap ou etapa de compilação.

---

## Funcionalidades

| Recurso | Detalhes |
|---|---|
| **Hero em vídeo** | Vídeo mudo em loop, 16:9 no desktop e 9:16 no celular. Abertura expansiva com clip-path animado (GSAP). Legendas sincronizadas com `currentTime`, repetidas a cada loop. Botão pausar/retomar. |
| **Comparador antes/depois** | Dois comparadores empilhados (cozinha e escritório). Arraste, toque e setas do teclado. Pontos "+" no lado "Depois" revelam nome e material de cada elemento (5 na cozinha, 4 no escritório). |
| **Serviços** | Carrossel de cards com fotos que trocam a cada 3 s. Pausa manual e estático com `prefers-reduced-motion`. |
| **Projetos** | Galeria de cards com imagens responsivas (WebP + `srcset`). |
| **Como funciona (3D)** | Guarda-roupa procedural em Three.js r170. Portas de correr: externas em madeira, centrais em vidro fumê. Narrativa controlada pela rolagem (ScrollTrigger + scrub, palco `sticky`). No desktop, o canvas cobre toda a largura da tela. Clique numa peça abre o painel de materiais. Fallback: galeria de imagens caso o WebGL ou o CDN falhem. |
| **Sobre** | Foto de fundo da equipe com texto posicionado na coluna direita (não sobrepõe os rostos em nenhuma largura). |
| **Parcerias** | Faixa em movimento contínuo. Nomes **fictícios** por pedido do cliente — trocar pelos reais antes de publicar. |
| **CTA e WhatsApp** | Todos os botões de orçamento abrem o WhatsApp com mensagem pré-preenchida. Botão flutuante com pulso verde. |
| **Painel administrativo** | `admin.html`: demonstração editável (dados fictícios em localStorage). Indicadores, gráficos, tabela de projetos e controle de funcionários. Responsivo. Sem login. |
| **Acessibilidade** | HTML semântico, `alt` em todas as imagens, botões acessíveis por teclado, `aria-current`, `aria-expanded`, skip link, foco gerenciado na navegação. |
| **Desempenho** | Imagens em WebP responsivo (`srcset`/`sizes`); Three.js carregado sob demanda; render do 3D suspenso fora da tela. |

---

## Seções do site

1. **Hero** — vídeo de abertura com abertura expansiva e legendas sincronizadas
2. **Antes e Depois** — comparador interativo com pontos de material
3. **Serviços** — cozinhas, quartos, salas e home office
4. **Projetos** — galeria de referências
5. **Como funciona** — etapas da marcenaria com guarda-roupa 3D
6. **Sobre** — história e equipe
7. **CTA** — orçamento pelo WhatsApp

---

## Painel administrativo

Acessível pelo link "Painel administrativo" no rodapé do site. Endereço: `/admin`.

- Dados **fictícios**, para demonstração. Edições ficam só no navegador (localStorage).
- "Restaurar dados de exemplo" volta ao estado inicial.
- Não há login: qualquer pessoa com o link acessa. **Não inserir dados reais.**
- Marcado com `X-Robots-Tag: noindex` e listado em `robots.txt`.

---

## Stack e dependências

| Recurso | Versão | Origem |
|---|---|---|
| GSAP (core, ScrollTrigger, ScrollToPlugin, CustomEase, MorphSVGPlugin, SplitText) | 3.13.0 | `cdn.jsdelivr.net/npm/gsap@3.13.0/dist/` |
| Three.js | r170 (0.170.0) | import map — `cdn.jsdelivr.net/npm/three@0.170.0/` |
| Cormorant Garamond + Manrope | — | Google Fonts |

Se o CDN falhar: `getMotionTools()` devolve `null`, o conteúdo fica visível, a navegação usa rolagem nativa e o menu funciona sem animação. O Three.js não é baixado e a galeria de imagens ocupa o lugar do 3D.

A rolagem suave da roda do mouse usa o `ScrollToPlugin` (`js/navigation.js`) — **não** o ScrollSmoother, que quebraria o palco `sticky` das etapas.

---

## Estrutura de arquivos

```
prototipo-marcenaria-pinsom/
├── index.html              # Estrutura semântica e conteúdo
├── admin.html              # Painel administrativo (demonstração)
├── 404.html                # Página de erro personalizada
├── robots.txt              # Bloqueia /admin dos rastreadores
├── vercel.json             # Configuração de deploy (Vercel)
├── .vercelignore           # Exclui referencias/, ferramentas/ e docs .md
├── .gitignore
├── package.json            # Scripts: npm run dev / npm run imagens
├── css/
│   ├── reset.css
│   ├── style.css           # Tokens, componentes e seções
│   ├── responsive.css      # Breakpoints: 1079 / 900 / 767 / 420 px
│   └── admin.css           # Estilos do painel administrativo
├── js/
│   ├── main.js             # Inicialização com safeInit
│   ├── gsap-config.js      # Registro de plugins e tokens de movimento (MOTION)
│   ├── navigation.js       # Rolagem animada, hash, foco, header, rolagem suave
│   ├── menu-mobile.js      # Menu compacto: aria, Escape, MorphSVG
│   ├── hero-video.js       # Autoplay, loop, pausar/retomar, fallback
│   ├── hero-intro.js       # Abertura expansiva com clip-path
│   ├── hero-captions.js    # Legendas sincronizadas com currentTime
│   ├── antes-depois.js     # Comparadores e pontos de material (hotspots)
│   ├── section-transitions.js  # Transições de seção via painel interno
│   ├── text-reveal.js      # Revelação mascarada com SplitText
│   ├── animations.js       # Entradas de imagens e cards (ScrollTrigger)
│   ├── servicos-carrossel.js   # Carrossel de serviços e fotos
│   ├── etapas-galeria.js   # Galeria de referências do 3D (fallback)
│   ├── etapas-narrativa.js # Narrativa das etapas (ScrollTrigger + scrub)
│   ├── guarda-roupa-3d.js  # Renderer, cena, luzes e redimensionamento
│   ├── guarda-roupa-modelo.js  # Modelo procedural e poses
│   ├── guarda-roupa-materiais.js  # Catálogo de materiais
│   ├── guarda-roupa-inspecao.js   # Clique/hover nas peças
│   ├── marquee.js          # Faixa de parceiros em movimento
│   └── admin/
│       ├── dados.js        # Dados fictícios e localStorage
│       ├── graficos.js     # Gráficos em SVG/HTML
│       └── painel.js       # Indicadores, tabelas e formulários
├── css/admin.css
├── public/
│   ├── imagens/            # Originais (PNG/JPG)
│   │   └── responsivas/    # WebP gerados (servidos no ar)
│   └── videos/
│       ├── hero-desktop-16x9.mp4
│       └── hero-mobile-9x16.mp4
├── ferramentas/
│   └── gerar-imagens-responsivas.mjs  # Gera WebP responsivos (Chrome/Edge)
├── docs/
│   └── historico-de-entregas.md  # Validações técnicas de cada etapa
└── referencias/            # Prompts, referências e evidências (não vai ao ar)
```

---

## Executar localmente

Use um servidor HTTP com suporte a requisições **Range** (necessário para o vídeo MP4):

```bash
# Opção 1 — http-server (npx, sem instalar globalmente)
npx http-server -p 5173 -c-1

# Opção 2 — extensão Live Server do VS Code
# Clique em "Go Live" na barra inferior do VS Code
```

> **Não abra o `index.html` direto no navegador (`file://`)** — módulos ES não carregam assim.
> Evite `python -m http.server`: não responde a Range e o vídeo de 71 MB só tocaria após o download completo.

---

## Imagens responsivas

O HTML serve apenas as versões WebP em `public/imagens/responsivas/` — os PNGs originais nunca chegam ao navegador. Para adicionar ou trocar uma foto:

1. Coloque o PNG/JPG em `public/imagens/<pasta>/`.
2. Rode:
   ```bash
   node ferramentas/gerar-imagens-responsivas.mjs
   ```
   (Node 18+ e Chrome ou Edge instalados.) O script é incremental e remove variantes de originais apagados.
3. No HTML, use as variantes do manifesto (`public/imagens/responsivas/manifesto.json`) com `srcset` e `sizes`.

---

## Deploy na Vercel

O projeto está pronto para deploy direto na Vercel, **sem etapa de build**.

### Via painel da Vercel

1. Suba o código em um repositório GitHub (ou GitLab/Bitbucket).
2. No painel da Vercel, clique em **Add New → Project** e importe o repositório.
3. Na tela de configuração, **não altere nada** — o `vercel.json` já define:
   - `"framework": null` (site estático puro)
   - `"outputDirectory": "."` (raiz do repositório)
4. Clique em **Deploy**. O site estará no ar em menos de 1 minuto.

### Via CLI da Vercel

```bash
npm i -g vercel
vercel login
vercel --prod
```

### O que o `vercel.json` configura

- Cache de 7 dias para imagens responsivas e vídeos.
- Headers de segurança (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`).
- `noindex` para `/admin`.
- Rewrite de `/admin` → `/admin.html` (URL limpa).
- `.vercelignore` exclui `referencias/`, `ferramentas/` e os arquivos `.md` de documentação.

---

## Personalização

### Animações

Todos os parâmetros de animação ficam em `js/gsap-config.js` (objeto `MOTION`):
- `MOTION.duration` — velocidade da navegação por seção.
- `MOTION.wheel` — rolagem suave da roda do mouse (duração, easing, multiplicador).
- `MOTION.sections` — transição entre painéis (escala, subida, scrub).
- `MOTION.text` — revelação mascarada de textos (yPercent, stagger, duração).
- `MOTION.narrative` — faixas da narrativa 3D e quando a foto final aparece.

### Textos e links

- Mensagem do WhatsApp: atributo `href` dos botões `[data-whatsapp]` (já codificado em URL).
- Legendas da Hero: atributos `data-caption-start`/`data-caption-end` e texto dos `<span>` em `[data-hero-captions]`.
- Conteúdo de cada seção: `index.html`, estrutura documentada em `conteudo.md`.

### Guarda-roupa 3D

- Materiais: `js/guarda-roupa-materiais.js` (nome, acabamento, descrição, cor da amostra).
- Poses e fases: `js/guarda-roupa-modelo.js` (`applyProgress`, `CAMERA_KEYS`).
- Comprimento da rolagem: variável CSS `--narrative-scroll` (padrão `380svh`).

---

## Acessibilidade e desempenho

- `prefers-reduced-motion`: nenhuma entrada é criada, rolagem é imediata, vídeo não inicia, faixa de parceiros fica estática.
- GSAP bloqueado: conteúdo visível, navegação nativa, menu funcional.
- Three.js bloqueado: galeria de imagens ocupa o lugar do 3D.
- Imagens: WebP responsivo com `srcset` + `sizes`; `<picture>` com direção de arte no CTA.
- Vídeo: mudo, `autoplay`, `playsinline`, `loop`; alternativa visual com imagem se o vídeo falhar.
- Render 3D: sob demanda, pixel-ratio limitado, suspenso fora da tela, `dispose()` ao sair.

---

## Lista de verificação pré-publicação

Itens a confirmar com o cliente antes de colocar o site no ar:

- [ ] **Parcerias:** substituir os nomes fictícios (Casa Aurora, Atelier Norte, etc.) pelos reais nos `<li class="marquee__card">` e remover a nota "Marcas ilustrativas."
- [ ] **Hotspots:** revisar os textos dos pontos de material nos comparadores (`data-hotspot` no `index.html`) — atualmente ilustrativos.
- [ ] **Painel administrativo:** confirmar se `admin.html` ficará no ar ou será removido; adicionar proteção de acesso se necessário.
- [ ] **Vídeo da Hero:** `hero-desktop-16x9.mp4` tem **71 MB**. Recomenda-se recodificar com faststart:
  ```bash
  ffmpeg -i hero-desktop-16x9.mp4 -c copy -movflags +faststart hero-desktop-16x9-opt.mp4
  ```
  E reduzir o bitrate se necessário (alvo: < 20 MB para 18 s).
- [ ] **Texto na imagem do escritório:** "PINSON MARMORARIA / DESDE 1982" está na própria foto — confirmar se deve ser removido ou corrigido.
- [ ] **Foto da seção Sobre no desktop:** verificar resolução — a imagem pode parecer levemente suave em telas de alta densidade (4K).
- [ ] **Open Graph:** atualizar `og:image` no `<head>` do `index.html` com a URL definitiva do site.
- [ ] **Domínio personalizado:** configurar no painel da Vercel em Domains → Add Domain.

---

## Documentação interna

| Arquivo | Conteúdo |
|---|---|
| `conteudo.md` | Todos os textos do site (títulos, parágrafos, CTAs, legendas). |
| `contexto.md` | Briefing do projeto, público-alvo e decisões de design. |
| `site.md` | Árvore de arquivos e descrição de cada seção. |
| `etapa_2.md` | Detalhes das transições e revelação de textos. |
| `etapa_3.md` | Detalhes da narrativa 3D e da abertura da Hero. |
| `AGENTS.md` | Regras para agentes de IA que trabalham neste projeto. |
| `docs/historico-de-entregas.md` | Validações técnicas de cada etapa de desenvolvimento. |
| `referencias/prompts-higgsfield.md` | Prompts para geração de imagens com a IA Higgsfield. |
