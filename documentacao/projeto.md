# Documentacao do Projeto Minibar

## Visao geral
Aplicacao web (SPA) para controle de vendas de um minibar, com cadastro de clientes e produtos, registro de compras, historico de pagamentos e relatorios. O frontend eh responsavel por toda a interface e regras de tela, enquanto o backend e um Google Apps Script (GAS) exposto como Web App, que grava e consulta dados em uma planilha Google Sheets.

## Stack e dependencias
- Frontend: React 19 + TypeScript + Vite.
- Roteamento: `react-router-dom` com `HashRouter`.
- Backend: Google Apps Script (fora deste repositorio).
- Persistencia local: `localStorage`.

## Arquitetura e fluxo geral
- SPA carregada por `index.tsx` e roteada em `App.tsx`.
- `CartContext` gerencia carrinho e dados do cliente, persistindo no `localStorage`.
- `services/*` encapsulam chamadas ao GAS via `apiClient.call(action, payload)`.
- Cada pagina (`pages/*`) implementa os fluxos de negocio e consumos de servicos.

## Componentes do frontend
- Layout: `AppLayout` e `Header` com logo e titulos.
- UI: `Button`, `Card`, `Input`, `Select`, `Badge`, `Alert`, `ModalConfirm`, `Spinner`.
- Utilitarios: formatacao de moeda, datas, telefone e IDs.

## Rotinas do sistema (frontend)
Rotas principais definidas em `App.tsx`:
- `/` (Home): menu de acesso rapido para todas as funcoes.
- `/sales/new` (Registrar Compra):
  - Identifica cliente por telefone (consulta via API).
  - Adiciona itens ao carrinho com validacao de estoque.
  - Finaliza compra como paga ou pendente.
- `/customers` (Clientes):
  - Lista clientes.
  - Cadastra, edita nome e remove cliente.
  - Valida telefone e evita duplicidade.
- `/products` (Produtos):
  - Lista produtos e estoque.
  - Cadastra e edita produto.
  - Remove produto.
  - Registra entrada de estoque e ajuste manual.
- `/history` (Historico de Compras):
  - Consulta compras por telefone.
  - Marca compras como pagas (individual ou lote).
  - Exclui registros.
  - Exibe totais pagos e pendentes.
- `/reports` (Relatorios):
  - Relatorio de vendas por periodo (totais e detalhamento).
  - Resumo de vendas por produto.
  - Relatorio de estoque (entradas, saidas, saldo).
- `/settings` (Configuracoes):
  - Define URL manual do GAS (local).
  - Indica uso de variavel `VITE_GAS_URL` do deploy.
  - Link direto para a planilha no Google Drive.

## Rotinas e acoes do backend (GAS)
As chamadas sao realizadas por `apiClient.call(action, payload)` via POST:
- Clientes:
  - `getCustomers`, `getCustomerByPhone`, `addCustomer`, `updateCustomer`, `deleteCustomer`.
- Produtos e estoque:
  - `getProducts`, `addProduct`, `updateProduct`, `deleteProduct`.
  - `registerStockEntry` (entrada), `adjustStock` (ajuste).
- Vendas:
  - `registerPurchase`, `getPurchaseHistory`, `markPurchaseAsPaid`, `deletePurchase`.
  - `sendPurchaseHistoryEmail` (envio de recibo/historico por email).
- Relatorios:
  - `getSalesReport`, `getProductSalesSummary`, `getInventoryReport`.

Observacao: o codigo do GAS nao esta neste repositorio; as acoes acima sao o contrato de integracao usado pelo frontend.

## Persistencia local (navegador)
- `minibar_cart`: itens do carrinho + telefone/nome do cliente.
- `minibar_settings`: URL manual do GAS quando configurada na pagina de configuracoes.

## Integracoes
- Google Apps Script Web App:
  - URL configurada via `VITE_GAS_URL` (deploy) ou manualmente no `localStorage`.
  - Requisicoes `fetch` com `Content-Type: text/plain;charset=utf-8`.
- Google Sheets:
  - Fonte de dados primarios (clientes, produtos, vendas, estoque).
  - Link publico no menu de configuracoes para acesso rapido.
- Email:
  - Envio de historico/recibo via acao `sendPurchaseHistoryEmail`.

## 5W2H do projeto
| Item | Descricao |
| --- | --- |
| What (O que) | Sistema web para registrar vendas, gerenciar clientes/produtos, acompanhar pagamentos e gerar relatorios de um minibar. |
| Why (Por que) | Centralizar o controle operacional, reduzir erros manuais e facilitar cobranca e estoque. |
| Where (Onde) | Frontend em navegador; dados no Google Sheets via Google Apps Script. |
| When (Quando) | Uso diario durante operacao do minibar e fechamento/analises periodicas. |
| Who (Quem) | Operador/gestor do minibar; manutencao tecnica por equipe de TI. |
| How (Como) | SPA em React + TypeScript com servicos integrados ao GAS; persistencia local para carrinho e configuracao. |
| How much (Quanto) | Custos diretos dependem do deploy (ex.: Vercel) e da conta Google usada para o GAS/Sheets. |

## Estrutura do projeto (alto nivel)
- `pages/`: telas e fluxos de negocio.
- `components/`: layout e componentes de UI reutilizaveis.
- `services/`: integracao com GAS e mapeamento de dados.
- `context/`: estado global do carrinho.
- `utils/`: formatacoes e helpers.
- `types/`: modelos de dados usados na aplicacao.
