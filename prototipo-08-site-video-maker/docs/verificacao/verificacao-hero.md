# Verificação automatizada do portfólio

Navegador: Chrome/Chromium 155.0.8059.85. Endereço: http://127.0.0.1:8088.

Resultado: **8 verificações passaram; 0 falharam**.

## Cenários

- desktop-1440x900: 10.8 s.

## Intervalos medidos da hero

| Formato | Cliente → título | Título → menu | Menu → frase |
| --- | ---: | ---: | ---: |
| desktop-1440x900 | 2.022 s | 2.016 s | 2.008 s |

Cada intervalo começa no evento CSS animationend anterior. A asserção aceita 1,96 a 2,20 s para acomodar a entrega dos eventos em frames do navegador.

## Falhas

Nenhuma falha automatizada.

## Evidências


O relatório JSON registra eventos de animação, intervalos medidos, caminhos de imagens e erros de console/rede. Falhas externas da fonte Google são registradas separadamente; a fonte local continua disponível.

Os testes não substituem a avaliação humana dos enquadramentos e da composição. Não foram fornecidos vídeos, biografia, depoimentos ou canais comerciais reais; a integração de reprodução com conteúdo final permanece pendente.
