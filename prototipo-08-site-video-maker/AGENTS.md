# Instruções do projeto — Portfólio para Videomaker

## Contexto

Este projeto é um protótipo de site de portfólio para uma videomaker. O objetivo é apresentar os trabalhos, explicar os serviços e o processo de produção e facilitar o contato de possíveis clientes.

O site deve seguir a identidade visual roxa, preta e branca definida nas referências. Todo o conteúdo deve estar em português. Não inclua o nome da cliente.

## Antes de alterar o projeto

- Leia este arquivo e também `DOCUMENT.md` e `HTML.md`, se estiverem disponíveis.
- Inspecione a estrutura e os arquivos existentes antes de modificar ou criar código.
- Use `referencia-secoes/secoes.png` como referência visual principal para a ordem e a organização das seções.
- Mantenha a stack e os padrões já usados no projeto. Não migre para outra tecnologia sem necessidade.
- Preserve os arquivos existentes. Não renomeie, mova ou apague imagens sem uma instrução explícita.

## Seções do site

A navegação deve seguir esta ordem:

1. Início
2. Portfólio
3. Sobre mim
4. Serviços
5. Como trabalho
6. Depoimentos
7. Dúvidas
8. Vamos conversar

A seção **Portfólio** reúne o showreel — “Assista agora” — e os vídeos em destaque — “Meus trabalhos” — dentro de uma única seção.

A seção **Sobre mim** deve ter fundo preto e detalhes roxos em curvas. Use textos provisórios claramente identificados quando ainda não houver informações reais.

Não invente biografia, avaliações de clientes, preços, prazos, localização, número de WhatsApp, e-mail ou perfis sociais.

## Imagens e adaptação por tela

As imagens ficam nas pastas `referencia-hero` e `referencia-secoes`. Inspecione cada arquivo antes de escolher onde usá-lo e mantenha os nomes originais.

- Arquivos com `computador` no nome são destinados a telas maiores.
- Arquivos com `celular` no nome são destinados a telas pequenas.
- Arquivos com `computador-celular` ou `computador-e-celular` podem ser usados nos dois formatos.
- Arquivos sem indicação de dispositivo também podem ser usados em ambos.
- Se houver uma imagem específica para cada formato, selecione a imagem adequada conforme a largura da tela.
- Preserve o enquadramento e a qualidade das imagens. Ajuste `object-fit` e `object-position` quando necessário para evitar cortes ruins.

Imagens de referência da hero:

- `referencia-hero/fundo-hero.png`: fundo da hero.
- `referencia-hero/imagem-cliente.png`: imagem da cliente, adequada para os dois formatos.
- `referencia-hero/hero-computador.png`: verificar se é a versão de computador.
- `referencia-hero/hero-celular.png`: verificar se é a versão de celular.

Antes de combinar essas imagens, confira o conteúdo de cada uma para não duplicar a cliente nem sobrepor composições completas.

Imagens de outras seções:

- `capa-do-video-computador-celular.png`
- `capa-do-video-computador.png`
- `card-briefing.png`
- `card-capitacao.png`
- `card-de-destaque-eventos-celular.png`
- `card-de-destaque-eventos-computador.png`
- `card-de-destaque-redes-sociais-computador.png`
- `card-de-destaque-marcas-celular.png`
- `card-de-destaque-marcas-computador.png`
- `card-edicao-entrega.png`
- `card-planejamento.png`
- `card-videos-para-eventos-computador-e-celular.png`
- `card-videos-para-marcas-computador-celular.png`
- `card-videos-redes-sociais-computador-celular.png`
- `secao-sobre-mim-computador.png`

O nome `card-capitacao.png` está sem acento no arquivo. Preserve essa grafia nos caminhos.

## Hero, fonte e animação inicial

Use `referencia-hero/fundo-hero.png` como fundo visível desde o carregamento da página. A imagem da cliente deve aparecer à frente do fundo, seguida pelo título **PORTFÓLIO**, pela navegação lateral e pela frase:

> Que minha câmera registre o que meus olhos enxergam, em Deus.

A sequência de entrada deve ser controlada para que cada elemento apareça depois do anterior:

1. Imagem da cliente: `animate__fadeInUp`.
2. Título “PORTFÓLIO”: `animate__fadeInDown`.
3. Navbar: `animate__fadeInLeft`.
4. Frase inferior: `animate__fadeInUp`.

Aguarde dois segundos entre as etapas, após a animação anterior terminar. Use as classes do Animate.css corretamente e evite duplicar atrasos.

Carregue a fonte Google **Pinyon Script** conforme fornecida pelo usuário. Não troque a fonte sem autorização. Ajuste tamanho, contraste e espaçamento para manter a leitura.

Na versão desktop, a navbar deve ficar à esquerda, vertical, translúcida e sem borda visível. Na versão mobile, adapte-a para um formato compacto e acessível, sem cobrir a cliente ou os elementos importantes da hero. Use os nomes das seções em vez de ícones genéricos.

## Rolagem com GSAP

Use GSAP e `ScrollTrigger` para criar transições lentas e cinematográficas durante a rolagem. Use a referência de código enviada pelo usuário como base para a lógica de `pin`, `scrub`, escala e opacidade, adaptando-a à estrutura e ao tamanho real do conteúdo.

- A rolagem deve continuar utilizável, inclusive em seções longas e em celulares.
- Não force todas as seções a terem uma altura fixa se isso esconder ou comprimir conteúdo.
- Evite saltos, sobreposições e seções que desapareçam antes de a próxima estar visível.
- Recalcule os gatilhos após o carregamento das imagens e mudanças no layout.
- Respeite `prefers-reduced-motion`, reduzindo ou desativando movimentos quando necessário.
- Mantenha links, controles e navegação por teclado acessíveis.

## Acessibilidade e SEO

- Use HTML semântico, hierarquia correta de títulos e textos alternativos descritivos.
- Mantenha textos importantes em HTML, não dentro das imagens.
- Inclua título e descrição da página com conteúdo natural sobre o portfólio de videomaker.
- Não use a meta tag `keywords`.
- Otimize o carregamento das imagens sem renomeá-las.

## Verificação e entrega

Após cada alteração:

- Confira se cada imagem aparece na seção correta.
- Teste os formatos de computador e celular.
- Verifique as animações de entrada, a rolagem e os links da navbar.
- Corrija erros encontrados no console.
- Ao concluir, resuma os arquivos alterados, as decisões de implementação, como testar o site e quais informações reais ainda faltam.