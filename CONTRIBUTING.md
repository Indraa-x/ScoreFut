# Contribuir com o ScoreFut

Obrigado por ajudar a melhorar o jogo. Relatos de bugs, sugestões de interface e correções de elencos podem ser enviados pelas [issues](https://github.com/Indraa-x/ScoreFut/issues/new/choose).

## Relatar um problema

Informe o que fez, o que esperava e o que aconteceu. Inclua a competição, o dispositivo, o navegador e, se possível, uma captura de tela. Evite compartilhar senhas ou dados pessoais. Se o problema envolve uma campanha salva, descreva a etapa antes de apagar os dados do navegador.

## Sugerir uma melhoria

Explique o problema que a ideia resolve e onde ela apareceria no jogo. Para mudanças grandes, abra uma sugestão antes de implementar para combinar o escopo com o criador.

## Preparar o projeto

1. Faça um fork e clone sua cópia do repositório.
2. Crie uma branch para a mudança.
3. Execute `npm run dev` e abra `http://127.0.0.1:4173`.

Não é necessário instalar pacotes para executar o projeto.

## Alterar a interface

Mantenha a identidade visual do site e confira a mudança no PC e no celular. Verifique os temas claro e escuro, o uso pelo teclado e a preferência por movimento reduzido quando relevante. Preserve as campanhas e conquistas já salvas no navegador.

## Corrigir elencos e OVRs

Informe o clube ou seleção, a época e o jogador. Inclua uma fonte verificável para escalações, posições ou notas. Siga os [critérios de OVR](data/RATING-SOURCES.md): a edição deve ter sido lançada no ano da época, e os ajustes do criador precisam permanecer identificados. Não apresente estimativas históricas como notas oficiais.

Ao adicionar imagens ou áudio, registre a origem e as condições de uso nos arquivos de fontes correspondentes. Os créditos existentes devem ser preservados.

## Enviar um pull request

Descreva o problema, o comportamento após a mudança e como verificou o resultado. Para interface, inclua imagens de antes e depois quando ajudarem a revisão.

```bash
npm run check
npm test
```

Execute os testes pertinentes à mudança e informe eventuais limitações. Se alterou a home, rode também `npm run prepare:site` e revise os arquivos gerados antes de enviar. Mudanças apenas em documentação podem ser conferidas revisando o texto e os links.

O envio de uma contribuição não publica automaticamente o jogo. A incorporação em `main` é revisada pelo mantenedor e atualiza o site no GitHub Pages.

## Versões durante o beta

A versão é definida em `data/release.js`. Funcionalidades novas, mudanças relevantes nas regras e reformulações amplas da interface incrementam a revisão beta uma vez por atualização publicada. Ajustes pontuais mantêm a revisão. Registre as mudanças importantes em [CHANGELOG.md](CHANGELOG.md) e sincronize o cabeçalho com `node scripts/prerender-home.mjs`. A versão final `1.0` depende da decisão do criador.
