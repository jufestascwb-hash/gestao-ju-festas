# Gestão Jú Festas

> **A ferramenta em uso agora é a página da gestão no Claude**, com os dados guardados na conta e envio pelo WhatsApp Business. Este repositório guarda o código-fonte. Para levar dados cadastrados aqui: Ajustes > Baixar cópia de segurança, e na página do Claude use Restaurar cópia.

Ferramenta de gestão da Jú Festas e Presentes, para presentes personalizados. Funciona no navegador do computador ou do celular, sem instalação e sem mensalidade.

## Módulos

| Módulo | O que faz |
| --- | --- |
| Hoje | Resumo do dia: pedidos em aberto, valor a receber, entregas da semana, campanhas de datas comerciais, insumos em falta, pós-venda e datas das clientes |
| Pedidos | Etapas de Novo a Entregue, itens com personalização, sinal e pagamentos, lucro estimado pela ficha técnica e importação da mensagem que chega do catálogo |
| Produção | Fila por técnica (sublimação, DTF UV, recorte na Silhouette, montagem), checklist de cada pedido e peças por dia contra a capacidade |
| Clientes | Cadastro, etiquetas, datas importantes, autorização de foto, histórico de pedidos e de mensagens |
| Produtos e preço | Ficha técnica com insumos, embalagem e tempo; preço sugerido pelo markup divisor e margem de cada produto |
| Insumos | Estoque com mínimo, baixa automática quando o pedido entra em produção, lista de compras e registro de compra |
| Financeiro | Entradas e saídas por mês, saídas por categoria, lembrete do DAS e faturamento do ano contra o limite do MEI |
| Empresas | Orçamentos com validade, prazo e nota fiscal, envio pelo WhatsApp e conversão em pedido |
| Relatórios | Vendas por mês, mais vendidos, margem por produto, ticket médio, recompra e origem das clientes |
| Ajustes | Percentuais do markup, valor da hora, capacidade, MEI, datas comerciais, modelos de mensagem e cópia de segurança |

## Nota fiscal do MEI

Cada pedido tem um bloco **Nota fiscal**. Ele marca sozinho quando a nota é obrigatória (cliente com CNPJ, ou orçamento de empresa com nota) e deixa você ligar a nota em qualquer outro pedido.

1. **Copiar dados da nota** junta cliente, CPF ou CNPJ, endereço, itens com NCM, frete, total, CFOP e regime.
2. **Abrir o emissor** leva ao Emissor de NF-e do Sebrae (emissornfe.sebrae.com.br, gratuito, com a Conta Sebrae e certificado digital A1 ou A3). Em Ajustes dá para trocar pela nota avulsa da Receita/PR ou pelo Emissor Nacional de NFS-e. Ajustes também gera as planilhas de clientes e produtos para importar no emissor do Sebrae.
3. Depois de emitir, anote o número e a data. A nota aparece em **Hoje**, no **Financeiro** e na planilha de pedidos.

Em **Ajustes > Nota fiscal** ficam o tipo de nota mais comum, o CFOP padrão, um link de emissor próprio e a opção de emitir nota em todas as vendas (para usar a partir de 2027, quando a lei prevê nota em toda venda do MEI). NCM e CFOP são sugestões: confirme com o seu contador.

## Identidade da marca

A ferramenta usa o logo, o laço, o coração e as figurinhas oficiais da Jú (pasta `img/fig`). A mascote aparece nas telas vazias, nos avisos e comemora quando um pagamento é confirmado, um pedido fica pronto ou é entregue. Em **Ajustes > Figurinhas da Jú** dá para baixar cada figurinha e enviar no WhatsApp. No pedido entregue, o bloco **Pós-venda com carinho** junta as figurinhas de agradecimento, avaliação no Google e indicação com a mensagem pronta.

## Onde ficam os dados

Os dados ficam guardados **no navegador de quem usa** (armazenamento local). Isso significa:

- Nenhum dado de cliente vai para o GitHub nem fica visível para quem abrir o endereço do site.
- O que você cadastra no computador não aparece no celular, e vice-versa.
- Limpar os dados do navegador apaga tudo.

Por isso, em **Ajustes > Cópia de segurança**, baixe uma cópia toda semana e guarde no Google Drive ou no computador. Para usar em outro aparelho, abra o site nele e use **Restaurar cópia**.

## Como publicar no GitHub Pages

1. No repositório, abra **Settings > Pages**.
2. Em **Source**, escolha **Deploy from a branch**, a branch `main` e a pasta `/ (root)`.
3. Salve. Em alguns minutos o site fica em `https://<conta>.github.io/<repositório>/`.

No celular, abra o endereço e use **Adicionar à tela inicial** para usar como aplicativo.

## Arquivos

- `index.html`: a página
- `app.js`: toda a lógica
- `styles.css`: o visual, com a identidade da marca
- `img/`: logo e mascote oficiais
- `manifest.json`: permite instalar na tela inicial do celular
