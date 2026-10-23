# Verificação automatizada do portfólio

Navegador: Chrome/Chromium 155.0.8059.85. Endereço: http://127.0.0.1:8088.

Resultado: **472 verificações passaram; 0 falharam**.

## Cenários

- desktop-1440x900: 30.7 s.
- celular-390x844: 29.6 s.
- celular-360x800: 28.6 s.
- movimento-reduzido: 0.9 s.
- celular-sem-javascript: 1.2 s.
- integracao-temporaria-sem-alterar-configuracao: 0.6 s.

## Intervalos medidos da hero

| Formato | Cliente → título | Título → menu | Menu → frase |
| --- | ---: | ---: | ---: |
| desktop-1440x900 | 2.008 s | 2.017 s | 2.000 s |
| celular-390x844 | 2.008 s | 2.012 s | 2.008 s |
| celular-360x800 | 2.008 s | 2.017 s | 2.008 s |

Cada intervalo começa no evento CSS animationend anterior. A asserção aceita 1,96 a 2,20 s para acomodar a entrega dos eventos em frames do navegador.

## Falhas

Nenhuma falha automatizada.

## Evidências

- [desktop-1440x900-inicio-transicao.png](desktop-1440x900-inicio-transicao.png)
- [desktop-1440x900-portfolio-conteudo-inicial.png](desktop-1440x900-portfolio-conteudo-inicial.png)
- [desktop-1440x900-portfolio-conteudo-final.png](desktop-1440x900-portfolio-conteudo-final.png)
- [desktop-1440x900-portfolio-transicao.png](desktop-1440x900-portfolio-transicao.png)
- [desktop-1440x900.png](desktop-1440x900.png)
- [desktop-1440x900-pagina-completa.png](desktop-1440x900-pagina-completa.png)
- [desktop-1440x900-portfolio.png](desktop-1440x900-portfolio.png)
- [desktop-1440x900-pagina-completa-reduzida.png](desktop-1440x900-pagina-completa-reduzida.png)
- [celular-390x844-inicio-transicao.png](celular-390x844-inicio-transicao.png)
- [celular-390x844-portfolio-conteudo-inicial.png](celular-390x844-portfolio-conteudo-inicial.png)
- [celular-390x844-portfolio-conteudo-final.png](celular-390x844-portfolio-conteudo-final.png)
- [celular-390x844-portfolio-transicao.png](celular-390x844-portfolio-transicao.png)
- [celular-390x844-sobre-mim-conteudo-inicial.png](celular-390x844-sobre-mim-conteudo-inicial.png)
- [celular-390x844-sobre-mim-conteudo-final.png](celular-390x844-sobre-mim-conteudo-final.png)
- [celular-390x844-servicos-conteudo-inicial.png](celular-390x844-servicos-conteudo-inicial.png)
- [celular-390x844-servicos-conteudo-final.png](celular-390x844-servicos-conteudo-final.png)
- [celular-390x844-como-trabalho-conteudo-inicial.png](celular-390x844-como-trabalho-conteudo-inicial.png)
- [celular-390x844-como-trabalho-conteudo-final.png](celular-390x844-como-trabalho-conteudo-final.png)
- [celular-390x844.png](celular-390x844.png)
- [celular-390x844-pagina-completa.png](celular-390x844-pagina-completa.png)
- [celular-390x844-menu-aberto.png](celular-390x844-menu-aberto.png)
- [celular-390x844-portfolio.png](celular-390x844-portfolio.png)
- [celular-390x844-pagina-completa-reduzida.png](celular-390x844-pagina-completa-reduzida.png)
- [celular-360x800-inicio-transicao.png](celular-360x800-inicio-transicao.png)
- [celular-360x800-portfolio-conteudo-inicial.png](celular-360x800-portfolio-conteudo-inicial.png)
- [celular-360x800-portfolio-conteudo-final.png](celular-360x800-portfolio-conteudo-final.png)
- [celular-360x800-portfolio-transicao.png](celular-360x800-portfolio-transicao.png)
- [celular-360x800-sobre-mim-conteudo-inicial.png](celular-360x800-sobre-mim-conteudo-inicial.png)
- [celular-360x800-sobre-mim-conteudo-final.png](celular-360x800-sobre-mim-conteudo-final.png)
- [celular-360x800-servicos-conteudo-inicial.png](celular-360x800-servicos-conteudo-inicial.png)
- [celular-360x800-servicos-conteudo-final.png](celular-360x800-servicos-conteudo-final.png)
- [celular-360x800-como-trabalho-conteudo-inicial.png](celular-360x800-como-trabalho-conteudo-inicial.png)
- [celular-360x800-como-trabalho-conteudo-final.png](celular-360x800-como-trabalho-conteudo-final.png)
- [celular-360x800.png](celular-360x800.png)
- [celular-360x800-pagina-completa.png](celular-360x800-pagina-completa.png)
- [celular-360x800-menu-aberto.png](celular-360x800-menu-aberto.png)
- [celular-360x800-portfolio.png](celular-360x800-portfolio.png)
- [celular-360x800-pagina-completa-reduzida.png](celular-360x800-pagina-completa-reduzida.png)
- [celular-sem-javascript.png](celular-sem-javascript.png)

O relatório JSON registra eventos de animação, intervalos medidos, caminhos de imagens e erros de console/rede.

A resposta CSS externa do Google foi interceptada somente no navegador de testes com CSS vazio. O HTML conserva o link original e a fonte utilizada é Pinyon Script do arquivo local em vendor. Não foi feita medição de velocidade da rede Google. Use --live-font-network para repetir sem interceptação.

As capturas com sufixo pagina-completa-reduzida mostram o conteúdo inteiro no fluxo acessível, sem pinagem. As capturas conteudo-inicial/conteudo-final e transicao mostram os painéis durante a animação normal; no modo animado o conteúdo longo é revelado pela fase de fake scroll.

Os testes não substituem a avaliação humana dos enquadramentos e da composição. Não foram fornecidos vídeos, biografia, depoimentos ou canais comerciais reais; a integração de reprodução com conteúdo final permanece pendente.
