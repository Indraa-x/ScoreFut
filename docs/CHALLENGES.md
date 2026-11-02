# Desafios por código — Beta 0.8

1. Na home, clique em **Criar desafio** e escolha competição e formação.
2. Gere o código de **6 caracteres** (letras e números) e copie o código ou o link para enviar a outra pessoa.
3. Para entrar, use **Tenho um código** ou abra o link. Confira os detalhes e clique em **Começar desafio**.
4. O código permanece no draft, no resumo e no resultado, com um botão para compartilhar novamente.

Abrir o diálogo ou o link não substitui o progresso ativo. Clicar em Começar desafio inicia um novo draft no lugar do ativo, como começar qualquer nova campanha. Campanhas já finalizadas e conquistas permanecem salvas.

## O que é reproduzido

- O código compacto contém a competição, formação, seed inicial e uma assinatura curta de compatibilidade. Não contém nome de usuário, escalação escolhida, histórico ou resultados.
- O primeiro sorteio é idêntico na mesma versão do jogo. Os dois participantes recebem três skips.
- Depois, a elegibilidade depende das escolhas, posições livres, elencos já sorteados e skips. Escolhas diferentes podem gerar caminhos diferentes; o jogo não promete onze elencos iguais independentemente das decisões.
- Com as mesmas decisões e skips, o RNG salvo reproduz a sequência e a seed do torneio também é igual, mesmo em dias e navegadores diferentes. A seed da simulação depende do código; os resultados ainda dependem da escalação e do caminho escolhido.
- As campanhas normais continuam usando os sorteios Web Crypto existentes. Não há alteração nos OVRs, na fórmula de simulação ou no limite de skips.

## Compatibilidade e armazenamento

`js/challenge.js` valida formato, assinatura, limites numéricos, competição e formação antes de usar os campos. Links são apenas analisados para extrair o parâmetro `desafio`; não são navegados nem consultados externamente.

O formato compacto usa seis dígitos em base 36: os quatro primeiros codificam uma seed de 16 bits e uma das 24 combinações de competição/formação. A geração reduz a seed aleatória de 32 bits módulo 65.536. Os dois últimos dígitos são um hash módulo 1.296 do payload, modelo, regras e elencos. São 65.536 sorteios possíveis por combinação. Não há banco de códigos ou dependência de servidor: qualquer navegador pode reconstruir o desafio.

A assinatura curta detecta erros e incompatibilidades, mas tem colisões possíveis (aproximadamente 1/1.296 para uma alteração arbitrária); não garante autenticidade ou proteção contra fraude. Não é possível transportar as assinaturas completas do formato anterior em apenas seis caracteres. Códigos longos `SF1-…`, links antigos e seeds de campanhas já salvas continuam aceitos no formato original, sem converter nem mudar seus sorteios.

A assinatura considera os IDs e a ordem dos elencos, jogadores, posições, OVRs, atributos e camisas, junto das regras, formações e versão do modelo. Se a assinatura não corresponder, é preciso gerar um código novo. Drafts de desafio preservam as notas das escolhas salvas; novas escolhas são bloqueadas se a assinatura deixou de ser compatível. Partidas de um torneio já montado continuam com o snapshot e as configurações salvas.

O marcador `draft.challenge` e o RNG ficam no save ativo. O registro final recebe `challenge` e um ID próprio por código/data, separado das campanhas normais. Não há servidor, conta ou ranking público. O checksum detecta erros de cópia; não é uma assinatura de segurança nem uma proteção contra alteração manual de saves locais.

## Testes

`node --test tests/challenge.test.mjs` verifica seis caracteres em todas as competições e formações, seeds-limite, zeros à esquerda, erros de cópia, compatibilidade de dados, códigos longos antigos, reprodução com retomada, seed do torneio, preservação dos sorteios normais e escape HTML.
