# Histórico de validações — Marcenaria Pinson

Registro das validações técnicas realizadas a cada etapa do protótipo.

## Validações realizadas (entrega 1, mantidas)

Executadas em Chrome headless via DevTools Protocol, com servidor local com Range:

- Console sem erros ou avisos; nenhuma resposta 4xx/5xx; nenhum elemento preso invisível após as entradas.
- Sem rolagem horizontal em 360, 390, 768, 1024 e 1440 px.
- Vídeo: 1920×1080 no desktop e 720×1280 no celular (metadados: 18,04 s nos dois); troca de fonte ao redimensionar preservando o ponto. (Na etapa 3 o vídeo passou a ter loop e o botão só pausa/retoma.)
- Navegação: destino alinhado ao header (76/64 px), hash e `aria-current` atualizados, foco na seção; cliques rápidos terminam no último destino; a roda do mouse interrompe a rolagem; `history.back()` volta à seção anterior.
- Menu mobile: abre/fecha, morph do ícone, cliques rápidos, Escape devolvendo o foco, fecha ao escolher um link.
- Comparador: arraste com mouse e com toque para a esquerda revela o Depois; setas do teclado; as duas imagens mantêm o mesmo tamanho durante o recorte; gesto vertical não move o divisor.
- Movimento reduzido: imagem alternativa na Hero sem baixar vídeo, navegação imediata, conteúdo visível.
- GSAP bloqueado: conteúdo visível, navegação nativa, menu funcional.
- Transições e textos (etapa 2): verificados em todas as 8 seções. Detalhes e números em `etapa_2.md`, seção 4.
- WhatsApp: 7 links com 3 mensagens pré-preenchidas decodificadas corretamente; Instagram aponta para o perfil oficial; todas as âncoras internas têm destino.

## Limitações e pendências

- **Peso das mídias**: `hero-desktop-16x9.mp4` tem 71 MB (≈32 Mbit/s) com o índice `moov` no fim do arquivo. Recomenda-se uma versão com *faststart* e menor bitrate. As fotos foram resolvidas na etapa 4: 64 versões WebP somam 3,3 MB, contra cerca de 60 MB dos PNGs, que continuam preservados.
- **Imagens do Higgsfield pendentes**: o escritório de advocacia do CTA e os cenários extras de Serviços ainda não foram gerados, porque o conector não gera mídia. O CTA usa fotos existentes provisoriamente, e o card "Salas e painéis de TV" tem 1 foto por enquanto. Ver `referencias/prompts-higgsfield.md`.
- A logo contém o texto "Desde 1982"; o site não repete esse dado em texto por não constar nos documentos aprovados.
- No comparador, os arquivos antes/depois têm o mesmo enquadramento; só o fogão aparece ligeiramente mais estreito no "depois" (diferença das imagens originais).
- A rolagem vertical por toque sobre o comparador não pôde ser observada no ambiente headless (o gesto sintético não rola a página em nenhuma área); o comportamento depende de `touch-action: pan-y`, padrão dos navegadores móveis. Testar em aparelho real.
- Não houve teste em Safari/iOS nem em aparelho físico.
- Parcerias com nomes fictícios (pedido do cliente): trocar pelos reais antes de publicar.
- O vídeo `inspiracao-guarda-roupa-3D.mp4` e os anexos de imagem citados em `etapa_3.md` não estão no projeto. O movimento do 3D seguiu a descrição textual do brief e as cinco imagens de referência.
- Medidas do guarda-roupa 3D são proporcionais às imagens, não medidas de projeto, e o modelo não exibe cotas.
- Rede lenta: a abertura espera o JavaScript (GSAP via CDN). Com 200 KB/s e latência de 300 ms, a expansão começou por volta de 5 s, com a imagem alternativa por trás; o temporizador de 6 s garante a liberação.

## Etapa 5

- **Fundo preto:** `--color-site-background` passou a `#0A0A0A` (abertura, entre painéis, faixa de parceiros, `theme-color`); as sobreposições azuladas viraram pretas.
- **Como funciona:**
  - A etapa atual fica preta (`--card-dark-bg`), com lateral laranja de 5 px, `scale` 1,04 (1,03 no celular) e 2 detalhes extras.
  - As demais etapas continuam brancas.
  - Depois da instalação (84% da trilha), o 3D some e a foto do ambiente finalizado cobre a seção, fixa na tela, com os 4 cards por cima.
  - No celular, a foto é ampliada para que a cama e o guarda-roupa fiquem acima dos cards.
- **Sobre:** foto de fundo cobrindo a seção, com sobreposição escura e textos com `z-index` maior.
- **Antes e depois:** segundo comparador, do escritório, empilhado abaixo da cozinha.
- **CTA:** botão "Falar no WhatsApp" verde, com ícone.
- **Botão flutuante:** pulso verde.
- **Painel administrativo:** `admin.html`, com acesso pelo botão no rodapé. Detalhes abaixo.
- **Arquivos:**
  - As imagens soltas na raiz foram movidas para `public/imagens/`.
  - Foram apagados `referencias/casa/` (10 imagens sem uso, cerca de 100 MB), `referencias/guarda-roupa/` (cópias), as cópias de `public/imagens/servicos/` e as fotos antigas da equipe, além das variantes WebP correspondentes.
  - As duas fotos de `referencias/casa/` usadas em Serviços foram movidas para `public/imagens/servicos/`.
- **Script de imagens:** agora espera a página local carregar (antes o Chrome bloqueava a leitura e falhava) e remove as variantes órfãs.

### Painel administrativo (demonstração)

Página separada (`admin.html`, com `noindex`) na mesma identidade do site: fundo preto, painéis creme, cards `.card-ref`, Cormorant e Manrope.

- **Visão geral:** mês de referência; faturamento do mês com variação; projetos fechados; ticket médio; projetos em andamento; funcionários ativos; folha mensal.
- **Faturamento:**
  - Colunas dos últimos 12 meses, com o mês escolhido em laranja.
  - Rosca de projetos por ambiente.
  - Barras de projetos em andamento por etapa (as mesmas etapas do site).
- **Projetos:** filtros de mês, etapa e busca; cadastrar, editar e excluir.
- **Funcionários:** resumo (ativos, férias, afastados, folha) e cadastrar, editar e excluir. Ao excluir alguém, os projetos dessa pessoa ficam sem responsável.
- **Dados:** são **fictícios**, gerados de forma fixa em `js/admin/dados.js`. As edições ficam só no navegador (localStorage), e "Restaurar dados de exemplo" volta ao início.
- **Acesso:** não há login nem servidor (regra da fase), então qualquer pessoa com o link abre o painel. Não use dados reais nele.
- **Celular:** abas roláveis, indicadores em 2 colunas, tabelas viram cards e formulários em coluna única.

## Etapa 6

- **Pontos de material:**
  - Pontos "+" no lado "Depois" dos dois comparadores: 5 na cozinha (incluindo a torneira) e 4 no escritório.
  - Clique ou toque abre o cartão com o nome e o material; o hover também mostra no mouse. Escape ou clique fora fecham.
  - O ponto some quando o divisor o cobre e não move o divisor ao ser tocado.
  - Os textos estão no HTML (`data-hotspot`), com posição em % da foto; o quadro mantém a proporção da foto em todas as telas. No celular, o cartão aparece na base da foto.
- **3D de fundo inteiro (computador):**
  - O canvas cobre o palco das etapas na largura da tela; parede, piso e grade ficaram maiores para não mostrar bordas.
  - Os cards ficam por cima, à esquerda. `setFraming()` (em `js/guarda-roupa-3d.js`) enquadra o móvel na área livre à direita com `setViewOffset`, recalculado ao redimensionar.
  - O celular continua como antes.
- **Rolagem suave:** com a roda do mouse, a página desliza um pouco mais (×1,15) e desacelera em cerca de 1 s. Menu e cards das etapas interrompem a rolagem suave; toque e teclado continuam nativos.
- **Cursor:** mãozinha em todo o site; no comparador, a mão de arrastar.

## Validações da etapa 6

- **Rolagem suave:** um giro real de roda (+300 px) desliza 137 → 238 → 297 → 327 → 345 px em cerca de 1 s. Três giros rápidos acumulam (414 px). O clique no menu durante a rolagem suave chega certo (Sobre a 76 px do topo).
- **3D:**
  - Canvas com a largura da tela em 1440 e 1889 px, com o móvel à direita dos cards em todas as etapas e sem bordas da parede na vista inclinada.
  - O clique numa peça abre o painel ("Porta de correr 3 — vidro"), e o card 2 continua clicável por cima do canvas.
- **Pontos de material:**
  - Com o divisor em 75%, 1 ponto visível por comparador; em 8%, todos (5 e 4).
  - Abrir não move o divisor. Escape fecha e devolve o foco. Só um cartão fica aberto por vez, mesmo entre os dois comparadores. Um ponto coberto pelo divisor fecha.
- **Geral:** cursor `pointer` no site e `grab` no comparador; sem erros, sem 4xx e sem rolagem horizontal em 360 a 1889 px.

## Validações da etapa 5

Chrome headless via DevTools Protocol, servidor local com Range.

- **Console e rede:** sem erros, nenhuma resposta 4xx/5xx e nenhum PNG baixado, no site e no painel.
- **Rolagem horizontal:** nenhuma em 360, 390, 768, 1024 e 1440 px, no site e no painel.
- **Narrativa:**
  - Etapa ativa preta (`rgb(18, 17, 16)`) e ampliada em todas as etapas.
  - A foto final começa em 86% e cobre a seção em 97%, quando o 3D fica oculto (`visibility: hidden`).
  - O painel de materiais fecha sozinho.
  - Com movimento reduzido, a galeria mostra "6 de 6 · Ambiente finalizado" na etapa 4.
- **Comparadores:** dois, com textos de leitor de tela próprios ("da cozinha planejada" e "do escritório planejado").
- **CTA, pulso e fundo:** botão verde `rgb(26, 127, 69)`; pulso ativo e desligado com movimento reduzido; fundo `rgb(10, 10, 10)`.
- **Painel:**
  - Os indicadores batem com a tabela (outubro: 11 projetos, R$ 195.000).
  - Cadastro com validação; o formulário vazio mostra o erro.
  - Edição de funcionário atualiza o resumo; a troca de mês atualiza indicadores e lista.
  - O foco vai ao primeiro campo e volta ao botão ao fechar com Escape.
  - Eixo com valores redondos.
- **Corrigido durante os testes:**
  - Linha clara na base da seção Sobre.
  - Foto final no celular com a cama e o guarda-roupa atrás dos cards.
  - Rolagem horizontal no painel: tabela oculta dos gráficos, grade do painel e textos ocultos dos botões de ação.

## Validações da etapa 4

Chrome headless via DevTools Protocol, servidor local com Range. Capturas em `referencias/evidencias-etapa-4/`.

- **Console e rede:** sem erros no console, nenhuma resposta 4xx/5xx e **nenhum PNG baixado**. As fotos carregam em WebP, e o celular recebe larguras menores (CTA 9:16 em 480 px a 390 px de largura).
- **Serviços:**
  - 4 cards, com 3 por vista no desktop, 2 entre 768 e 1099 px e 1 com espiada no celular.
  - As setas avançam um card; botão "Pedir orçamento" marrom (`#7A4F2A`).
  - As fotos trocam a cada 3 s só nos cards visíveis e param com "Pausar fotos". Com movimento reduzido, não há troca automática.
- **Parceiros:** faixa azul `#0B2447`, cards brancos com texto vermelho `#C62F1C` (contraste AA), loop com cópias `aria-hidden`/`inert` e botão de pausa. Com movimento reduzido, fica estática.
- **CTA e rodapé:** foto em tela cheia com sobreposição, horizontal no desktop e vertical no celular; rodapé `#0B0B0B` com textos brancos.
- **Guarda-roupa:**
  - Madeira visível na etapa 02, vista explodida com acabamentos e vidro fumê instalado no estado final.
  - O hover mostra o cursor de clique; clique e toque selecionam ("Porta de correr 2 — vidro").
  - O botão "Vidro" abre o painel e Escape fecha, devolvendo o foco ao botão.
- **Regressão:** sem rolagem horizontal em 360, 768, 1024 e 1440 px; navegação (cliques rápidos, interrupção, histórico) correta.
- **Corrigido durante os testes:**
  - O canvas não recebia cliques (`pointer-events` herdado do estado anterior ao 3D).
  - Faltava espaço na emenda do marquee (reset `ul[role="list"]`).
  - O veio procedural estava forte e ondulado demais e foi suavizado.
  - O hover dos Diferenciais ficava preso no toque; agora vale só para mouse.

## Validações da etapa 3

Chrome headless (Chrome instalado, via DevTools Protocol), servidor local com Range. As capturas estão em `referencias/evidencias-etapa-3/`.

- **Causa da falha da abertura:** a abertura expansiva nunca havia sido implementada; não existia código, CSS nem estado inicial para ela. Ao implementar, encontrei e corrigi um segundo problema: o navegador normaliza `inset(a b a b round r)` para a forma curta, e o GSAP interpolava números em posições trocadas (janela fora de centro e sem cantos). Agora o tween é feito sobre números e a string é montada a cada frame.
- **Abertura:** estados pequeno (200×200 px centralizado sobre o azul), intermediário e expandido capturados em sequência, no desktop e no celular (150 px). Vídeo tocando durante toda a expansão (`currentTime` 0,05 → 2,05 s, `paused: false`). Funciona também em recarga com cache.
- **Vídeo:** dois loops completos em 38 s sem pausas; legenda ativa correta em 0–4 s (título), 4–6 s (nenhuma), 6–12 s e 12–18 s, depois de busca, pausa e loop.
- **Fundo azul:** `rgb(11, 36, 71)` em `html` e `body`, na abertura e entre os painéis durante as transições.
- **Cards:** todas as instâncias de `.card-ref` com borda de 1px `#E2D5CD`, lateral de 3px `#E8802F` e cantos de 12px no estado normal.
- **Narrativa 3D:**
  - O canvas substituiu a galeria após o primeiro frame.
  - Card ativo correto em 2%, 15%, 40%, 68%, 85% e 97%, inclusive no reverso e ao clicar no card 3.
  - Palco fixo em 76 px (64 px no celular) com o painel em identidade.
  - Liberado após o fim da trilha.
  - Na janela de 1440×700 e no celular (390×844 e 360×640), o conteúdo do palco coube inteiro.
- **Falhas:**
  - Three.js bloqueado → galeria e aviso no console.
  - GSAP bloqueado → página liberada na hora.
  - Todos os módulos bloqueados → abertura liberada em 6 s.
  - Movimento reduzido → sem abertura, galeria e nenhuma requisição ao Three.js.
- **Larguras:** 360, 390, 768, 1024, 1440 e 1440×700 sem rolagem horizontal, sem texto preso, sem máscaras duplicadas e sem erros no console ou 4xx/5xx.
- **Regressão:** menu, âncoras, foco, cliques rápidos, interrupção manual, histórico, comparador (mouse, toque e teclado) e links do WhatsApp continuam funcionando.

---

## Histórico da organização inicial (Codex)

O inventário abaixo registra a organização feita antes da implementação. A árvore atual dos arquivos está em `site.md`.


Organização de pastas e arquivos, sem implementação. HTML, CSS e JavaScript novos estão vazios.

### Árvore completa

~~~text
prototipo-marcenaria-pinsom/
|-- css/
|   |-- reset.css
|   |-- responsive.css
|   \-- style.css
|-- js/
|   |-- animations.js
|   |-- antes-depois.js
|   |-- guarda-roupa-3d.js
|   |-- hero-video.js
|   |-- main.js
|   \-- menu-mobile.js
|-- public/
|   |-- imagens/
|   |   |-- antes-depois/
|   |   |   |-- cozinha-antes.png
|   |   |   \-- cozinha-depois.png
|   |   |-- etapas-marcenaria/
|   |   |   |-- 01-frente-fechado.png
|   |   |   |-- 02-lateral.png
|   |   |   |-- 03-perspectiva.png
|   |   |   |-- 04-portas-abertas.png
|   |   |   \-- 05-gavetas-abertas.png
|   |   |-- hero/
|   |   |-- projetos/
|   |   |   |-- cozinha.png
|   |   |   |-- projeto-home-office.png
|   |   |   |-- projeto-painel-tv.png
|   |   |   \-- quarto.png
|   |   |-- servicos/
|   |   |   |-- cozinha.png
|   |   |   |-- guarda-roupa.png
|   |   |   \-- quarto.png
|   |   |-- logo.png
|   |   \-- m.md
|   |-- videos/
|   |   |-- hero-desktop-16x9.mp4
|   |   \-- hero-mobile-9x16.mp4
|   \-- m.md
|-- referencias/
|   |-- casa/
|   |   |-- cozinha.png
|   |   |-- hf_20261017_062915_4b26dad4-9ce9-4803-978a-11c2201fce63.png
|   |   |-- hf_20261017_063250_717d8984-96de-4512-8176-888137673e90.png
|   |   |-- hf_20261017_064204_234f9e99-cfb4-4087-80c5-7bb295283dc1.png
|   |   |-- hf_20261017_064611_bf070bb4-7dbc-4ee1-9747-3d6570b29f2c.png
|   |   |-- hf_20261017_064834_46e004b8-3b9c-4165-8ceb-6bc81153484f.png
|   |   |-- hf_20261017_065237_9e9b433e-52a4-430b-997a-d15f723c6c89.png
|   |   |-- hf_20261017_065421_aa8aa036-6481-4e8a-8e73-45881046304b.png
|   |   |-- hf_20261017_065550_0c89a920-e0da-4cf3-b2c5-1c838cd73236.png
|   |   |-- hf_20261017_065746_3cda234e-d79c-41c7-be11-30ac2713d30e.png
|   |   |-- hf_20261017_070028_a1c06731-4fa5-4417-841c-8786b947890f.png
|   |   \-- quarto.png
|   |-- guarda-roupa/
|   |   |-- 01-frente-fechado.png
|   |   |-- 02-lateral.png
|   |   |-- 03-perspectiva.png
|   |   |-- 04-portas-abertas.png
|   |   \-- 05-gavetas-abertas.png
|   \-- i.md
|-- AGENTS.md
|-- conteudo.md
|-- contexto.md
|-- index.html
|-- README.md
\-- site.md
~~~

### Arquivos criados na organização inicial

- index.html
- css/reset.css
- css/style.css
- css/responsive.css
- js/main.js
- js/menu-mobile.js
- js/hero-video.js
- js/antes-depois.js
- js/animations.js
- js/guarda-roupa-3d.js
- public/imagens/hero/.gitkeep (removido na revisão final)
- public/imagens/etapas-marcenaria/.gitkeep (removido na revisão final)
- public/models/.gitkeep (removido na revisão final)
- referencias/cozinha/.gitkeep (removido na revisão final)
- README.md

### Movimentações

- cozinha-antes.png -> public/imagens/antes-depois/cozinha-antes.png (SHA-256: 05192B405AB00DA2790BD874923974938627DB8EC4316A10DD7A897EB7ED4501)
- cozinha-depois.png -> public/imagens/antes-depois/cozinha-depois.png (SHA-256: EF2593B5F188BDF6ADB15137032C24B29B57533E9E4B5A683F8E9DBA298D1013)

### Verificação da organização inicial

Conteúdo de todos os arquivos preexistentes verificado por SHA-256 e preservado. As duas imagens movidas mantêm conteúdo, nomes e extensões. Nenhuma mídia fictícia foi criada.

### Pendências

- Nenhuma mídia obrigatória ausente; nenhum conflito de movimentação.
- Caminhos antigos de AGENTS.md, contexto.md e site.md corrigidos na revisão final abaixo.

### Revisão final da organização

#### Cópias verificadas por SHA-256

Cinco imagens copiadas de referencias/guarda-roupa/ para public/imagens/etapas-marcenaria/, mantendo os originais e os nomes. Conteúdos idênticos:

- 01-frente-fechado.png : 314711F911E78FC668F77388537E4A334D3798C8DBB93A6A18446A533D707134
- 02-lateral.png : A48C1869A237F610C54B2423B11338F19CDA7AF998879DAAA9EF78FB71E16AC6
- 03-perspectiva.png : 674165834DAD7A0AADD0E5A4EE42EB3F5D632F988C0141D4E9CBF25F601B6E40
- 04-portas-abertas.png : F255F8E38070008F0B72B09E87D7E15AA92973CD258269F6D3928CF850153750
- 05-gavetas-abertas.png : E6E9FE24C549B6320F747F0913B4F9D879043C3BC7A074ECC6157C5B64DE746B

#### Arquivos e pastas removidos

- Arquivo removido: public/imagens/etapas-marcenaria/.gitkeep
- Arquivo removido: public/imagens/hero/.gitkeep
- Arquivo removido: public/models/.gitkeep
- Arquivo removido: referencias/cozinha/.gitkeep
- Pasta removida após confirmação de que estava vazia: public/models/
- Pasta removida após confirmação de que estava vazia: referencias/cozinha/

#### Documentação e arquivos criados

- AGENTS.md, contexto.md e site.md: somente caminhos e informações de organização alinhados à estrutura real; demais requisitos preservados.
- conteudo.md: conferido, sem necessidade de alteração.
- README.md: inventário atualizado e histórico válido preservado.
- Nenhum HTML, CSS ou JavaScript precisou ser criado nesta revisão; arquivos existentes preservados.

#### Itens adicionais preservados para revisão

- public/m.md
- public/imagens/m.md
- referencias/i.md
- Todos os arquivos hf_ de referencias/casa/ mantidos com nomes e conteúdos originais, conforme inventário.

#### Validação e pendências

- Nenhum .gitkeep restante nas pastas do projeto; diretórios internos do Git não foram acessados.
- public/imagens/hero/ permanece vazia. Pastas vazias não são versionadas pelo Git; os vídeos permanecem diretamente em public/videos/.
- Implementação do site e do guarda-roupa 3D continua pendente; nenhuma funcionalidade ou modelo 3D foi criado.
- Nenhuma mídia obrigatória ausente, nenhum conflito de cópia e nenhum caminho local ativo quebrado encontrado.
