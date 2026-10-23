# Portfólio Videomaker

HTML, CSS e JavaScript, com GSAP, ScrollToPlugin, ScrollTrigger e Animate.css locais. Não há compilação nem dependências necessárias para iniciar o site.

## Executar

Na pasta do projeto, com Node.js 18 ou superior:

```powershell
npm.cmd run dev
```

Abra http://127.0.0.1:8088. Outra opção: `node ferramentas/servidor-local.mjs`.

## Comportamento atual

- Seções em fluxo normal, sem pinagem, escala, desaparecimento ou deslocamento interno artificial.
- Links usam GSAP ScrollToPlugin, com curva power2.inOut, duração entre 1,1 e 1,9 segundo conforme a distância e margem superior de 120 px. Uma nova navegação substitui o movimento anterior; toque, teclado e interação do visitante podem interrompê-lo.
- A roda do mouse desliza por 0,95 segundo em computadores, acumulando movimentos sucessivos e respondendo à inversão de direção. Toque, trackpads e áreas com rolagem própria mantêm o comportamento nativo.
- A preferência por redução de movimento desativa animações e deslizamento.
- PORTFÓLIO e os textos da hero entram com Animate.css fadeInDown, em uma timeline GSAP única. Os links usam o mesmo efeito em cascata de 90 ms. A cliente permanece estática.
- Os demais títulos (h2/h3) usam fadeInDown uma vez ao entrar na tela, com gatilhos ScrollTrigger sem pinagem. Títulos dos depoimentos e do modal também recebem o efeito ao aparecer.
- A chamada “ROLE PARA BAIXO” fica disponível em computadores e celulares; sua seta faz um movimento vertical suave com GSAP, pausado fora da hero e desativado com movimento reduzido.
- Textos em Arial/Helvetica; o título usa Anton, pesada e condensada, com a imagem da cliente sobreposta. A fonte Anton está incluída localmente com licença OFL.
- Cursor pointer global, conforme solicitado.
- Os mesmos fundo-hero.png e imagem-cliente.png são usados no computador e no celular. Os nomes originais dos assets foram preservados.
- As seções ocupam toda a largura, com navegação transparente sobre o conteúdo. A barra visual de rolagem é oculta, mantendo a rolagem da página; não há rolagem horizontal no celular.
- O fundo da página e das seções é preto, sem os antigos gradientes roxos; as cores das fotos e os detalhes roxos foram preservados.
- Sobre mim e Vamos conversar selecionam suas imagens `secao-…-computador.png` acima de 800 px e `secao-…-celular.png` até 800 px, usando `<picture>`. No celular, os retratos mantêm a proporção original e os textos começam abaixo do rosto, com transição para preto e espaço livre para o conteúdo crescer.
- A lâmpada aparece inteira em um quadro preto uniforme, sem cortes.
- Depoimentos: três cards explicitamente provisórios, alternados a cada 3 segundos. Hover, pressão/toque, foco por teclado, pausa manual, aba em segundo plano e preferência por movimento reduzido interrompem a troca. Ao liberar a interação, o intervalo recomeça completo. Botões e setas do teclado também navegam pelos cards. Substituir os cards por avaliações reais autorizadas antes da publicação.

## Conteúdo real

Preencha `js/config.js` com os arquivos/URLs diretos dos vídeos e os canais reais de WhatsApp, Instagram e e-mail. O campo `hero.duration` ajusta a entrada dos textos; `scroll` reúne duração, duração máxima, suavização da roda e margem da navegação. Biografia, avaliações autorizadas, detalhes dos trabalhos e condições comerciais ainda precisam ser confirmados com a cliente. A interface identifica esses conteúdos provisórios.

## Verificação atual

Com o servidor aberto, Node.js 20+ e o Chrome instalado:

```powershell
npm.cmd ci
npm.cmd run verificar
```

O teste usa o Chrome em `C:/Program Files/Google/Chrome/Application/chrome.exe`; defina CHROME_PATH se necessário. O script atual é `ferramentas/verificar-fluxo.mjs`.

Resultados: [relatório atual](docs/verificacao/verificacao-fluxo.md), [JSON](docs/verificacao/relatorio-fluxo.json) e capturas `fluxo-*.png` / `fluxo-completo-*.png`. Os relatórios anteriores documentam versões antigas com pinagem e não representam o comportamento atual.
