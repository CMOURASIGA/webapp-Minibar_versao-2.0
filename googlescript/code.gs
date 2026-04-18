// Google Apps Script - Code.gs
// WebApp para Controle de Vendas Minibar EAC

// ID da planilha (substitua pelo ID real da sua planilha)
const SPREADSHEET_ID = '11V2jDDbLQY3XEoygMKHYLgJGeoJFskwCWLtLx_h6cVU';
const CUSTOMERS_SPREADSHEET_ID = '1M5vsAANmeYk1pAgYjFfa3ycbnyWMGYb90pKZuR9zNo4';
const CUSTOMERS_SHEET_NAME = 'Form Responses 1';

// Configuração das abas
const SHEETS = {
  CADASTRO: 'Cadastro',
  PRODUTOS: 'Produtos', 
  COMPRAS: 'Compras',
  MOVIMENTOS: 'Movimentos' // novo
};

// Utilitários: Cache, Lock e normalização
function getCache_() { return CacheService.getScriptCache(); }
function cacheGetJson_(key) {
  try { const v = getCache_().get(key); return v ? JSON.parse(v) : null; } catch(e) { return null; }
}
function cachePutJson_(key, obj, seconds) {
  try { getCache_().put(key, JSON.stringify(obj), Math.max(1, Math.min(21600, seconds||60))); } catch(e) {}
}
function cacheRemove_(key) { try { getCache_().remove(key); } catch(e) {} }
function parseCustomerRowId_(id) {
  const raw = (id || '').toString().trim();
  const withPrefix = raw.match(/^row:(\d+)$/i);
  const numericOnly = raw.match(/^(\d+)$/);
  const row = withPrefix
    ? parseInt(withPrefix[1], 10)
    : (numericOnly ? parseInt(numericOnly[1], 10) : NaN);
  return Number.isFinite(row) && row >= 2 ? row : null;
}
function normalizePhone_(tel) {
  let digits = (tel || '').toString().replace(/\D/g, '');
  if (!digits) return '';

  if (digits.startsWith('55')) digits = digits.substring(2);
  if (digits.length === 10) {
    // Se vier DDD + 8 dígitos, converte para formato móvel (9 dígitos).
    digits = digits.substring(0, 2) + '9' + digits.substring(2);
  }

  if (digits.length !== 11) return '';
  return '55' + digits;
}
function withLock_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try { return fn(); } finally { try { lock.releaseLock(); } catch(e) {} }
}


function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('Minibar EAC - Controle de Vendas')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// Função para buscar dados dos clientes cadastrados
function getCustomers() {
  try {
    const cached = cacheGetJson_('customers_v2');
    if (cached) return cached;

    const sheet = SpreadsheetApp.openById(CUSTOMERS_SPREADSHEET_ID).getSheetByName(CUSTOMERS_SHEET_NAME);
    if (!sheet) throw new Error('Aba de clientes não encontrada: ' + CUSTOMERS_SHEET_NAME);

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];
    // Base de clientes vinda do Google Forms:
    // Coluna B = nome, Coluna F = telefone
    const data = sheet.getRange(2, 1, lastRow - 1, 6).getValues();

    const customers = [];
    data.forEach((row, idx) => {
      const rowNumber = idx + 2;
      const nome = (row[1] || '').toString().trim();
      const telefone = normalizePhone_(row[5]);
      if (!nome) return;

      customers.push({
        id: `row:${rowNumber}`,
        nome: nome,
        telefone: telefone || ''
      });
    });

    const sorted = sortByName(customers, 'nome');
    cachePutJson_('customers_v2', sorted, 60);
    return sorted;
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    return [];
  }
}

// Função para buscar produtos disponíveis
function getProducts() {
  try {
    const cached = cacheGetJson_('products_v1');
    if (cached) return cached;
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.PRODUTOS);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];
    const data = sheet.getRange(2, 1, lastRow - 1, 4).getValues(); // A..D

    const products = data.map(row => {
      if (row[0] && row[1] && row[2] !== '') {
        return { id: row[0], nome: row[1], valor: parseFloat(row[2]), estoque: parseFloat(row[3] || 0) };
      }
      return null;
    }).filter(Boolean);

    const sorted = sortByName(products, 'nome');
    cachePutJson_('products_v1', sorted, 60);
    return sorted;
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return [];
  }
}

// Adicionar cliente na planilha
function addCustomer(customerData) {
  try {
    cacheRemove_('customers_v2');
    const sheet = SpreadsheetApp.openById(CUSTOMERS_SPREADSHEET_ID).getSheetByName(CUSTOMERS_SHEET_NAME);
    if (!sheet) throw new Error('Aba de clientes não encontrada: ' + CUSTOMERS_SHEET_NAME);
    
    if (!customerData || !customerData.nome || !customerData.telefone) {
      throw new Error('Dados do cliente inválidos');
    }
    
    const normalizedPhone = normalizePhone_(customerData.telefone);
    if (!normalizedPhone) {
      return { success: false, message: 'Telefone inválido. Use o formato 55DDDNUMERO.' };
    }

    const existingCustomers = getCustomers();
    const existingCustomer = existingCustomers.find(c => c.telefone === normalizedPhone);
    
    if (existingCustomer) {
      return { success: false, message: 'Este telefone já está cadastrado.' };
    }
    
    // Mantém compatível com estrutura típica do Forms (A..F), gravando nome em B e telefone em F.
    sheet.appendRow([new Date(), customerData.nome, '', '', '', normalizedPhone]);
    return { success: true, message: 'Cliente cadastrado com sucesso!' };
    
  } catch (error) {
    console.error('Erro ao adicionar cliente:', error);
    return { success: false, message: 'Erro ao cadastrar cliente: ' + error.message };
  }
}

// Função para buscar histórico de compras por telefone
function getPurchaseHistory(telefone) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.COMPRAS);
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];

    const purchases = [];
    const telefoneBusca = telefone.toString().replace(/\D/g, '');

    for (let i = 1; i < data.length; i++) {
      const dadoTelefone = (data[i][6] || '').toString().replace(/\D/g, '');
      if (dadoTelefone === telefoneBusca) {
        purchases.push({
          data: new Date(data[i][0]).toISOString(),
          produto: data[i][1],
          quantidade: parseInt(data[i][2]),
          valorUnitario: parseFloat(data[i][3]),
          subtotal: parseFloat(data[i][4]),
          nome: data[i][5],
          telefone: data[i][6].toString(),
          status: (data[i][7] || 'Pendente').trim()
        });
      }
    }
    return purchases;
  } catch (error) {
    Logger.log('Erro ao buscar histórico: ' + error.message);
    return [];
  }
}


// Fun��o para buscar cliente por telefone
function getCustomerByPhone(telefone) {
  try {
    const customers = getCustomers();
    const t = normalizePhone_(telefone);
    if (!t) return null;
    return customers.find(customer => normalizePhone_(customer.telefone) === t) || null;
  } catch (error) {
    console.error('Erro ao buscar cliente por telefone:', error);
    return null;
  }
}

// Função para registrar uma compra
function registerPurchase(purchaseData) {
  return withLock_(() => {
    try {
      cacheRemove_('products_v1');
      const comprasSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.COMPRAS);

      if (!purchaseData || !Array.isArray(purchaseData.items) || purchaseData.items.length === 0) {
        throw new Error('Dados da compra inv�lidos');
      }

      // Idempot�ncia simples com CacheService (10 min)
      const reqId = (purchaseData.requestId || '').toString();
      if (reqId) {
        const cacheKey = 'req_' + reqId;
        const already = getCache_().get(cacheKey);
        if (already) return { success: true, duplicated: true, message: 'Compra j� processada.' };
        getCache_().put(cacheKey, '1', 600);
      }

      const telefone = normalizePhone_(purchaseData.telefone);
      const customer = getCustomerByPhone(telefone);
      if (!customer) {
        throw new Error('Cliente n�o encontrado no cadastro');
      }

      // 1) Valida��o de estoque e saneamento
      const faltas = [];
      const itensDetalhados = purchaseData.items.map(item => {
        const p = getProductById(item.productId);
        const qtde = Math.max(0, Math.floor(Number(item.quantity) || 0));
        const unit = Number(item.unitPrice) >= 0 ? Number(item.unitPrice) : (p ? p.valor : 0);
        const sub  = Number(item.subtotal) || (qtde * unit);
        if (!p) faltas.push(`Produto ID ${item.productId} n�o encontrado`);
        else if ((Number(p.estoque) || 0) < qtde) faltas.push(`"${p.nome}" sem estoque suficiente (saldo: ${p.estoque}, pedido: ${qtde})`);
        return { p, qtde, unit, sub, productName: item.productName || (p ? p.nome : '') };
      }).filter(it => it.qtde > 0 && it.p);

      if (faltas.length > 0) {
        return { success: false, message: 'Estoque insuficiente:\n- ' + faltas.join('\n- ') };
      }

      // 2) Grava compra (batch)
      const today = new Date();
      const status = purchaseData.pago ? 'Pago' : 'Pendente';
      const rows = itensDetalhados.map(it => [
        today, it.productName, it.qtde, it.unit, it.sub,
        customer.nome, customer.telefone, status
      ]);
      if (rows.length > 0) {
        comprasSheet.getRange(comprasSheet.getLastRow() + 1, 1, rows.length, 8).setValues(rows);
      }

      // 3) Baixa de estoque + log (Sa�da)
      itensDetalhados.forEach(it => {
        changeProductStock(it.p.id, -Number(it.qtde), 'Sa�da', `Venda ${today.toISOString()}`);
      });

      return { success: true, message: 'Compra registrada e estoque atualizado!' };
    } catch (error) {
      console.error('Erro ao registrar compra:', error);
      return { success: false, message: 'Erro ao registrar compra: ' + error.message };
    }
  });
}

// --- FUNÇÕES DE GERENCIAMENTO DE CLIENTES ---

function updateCustomer(customerData) {
  try {
    cacheRemove_('customers_v2');
    if (!customerData || !customerData.nome) {
      throw new Error('Dados do cliente inválidos para atualização.');
    }

    const sheet = SpreadsheetApp.openById(CUSTOMERS_SPREADSHEET_ID).getSheetByName(CUSTOMERS_SHEET_NAME);
    if (!sheet) throw new Error('Aba de clientes não encontrada: ' + CUSTOMERS_SHEET_NAME);

    const data = sheet.getDataRange().getValues();
    const lastRow = data.length;
    let targetRowIndex = null;

    const rowFromId = parseCustomerRowId_(customerData.id);
    if (rowFromId && rowFromId <= lastRow) {
      targetRowIndex = rowFromId;
    }

    if (!targetRowIndex && customerData.telefoneAnterior) {
      const previousPhone = normalizePhone_(customerData.telefoneAnterior);
      if (previousPhone) {
        for (let i = 1; i < data.length; i++) {
          const phoneInRow = normalizePhone_(data[i][5]); // Coluna F
          if (phoneInRow && phoneInRow === previousPhone) {
            targetRowIndex = i + 1;
            break;
          }
        }
      }
    }

    if (!targetRowIndex && customerData.telefone) {
      const normalizedPhone = normalizePhone_(customerData.telefone);
      if (normalizedPhone) {
        for (let i = 1; i < data.length; i++) {
          const phoneInRow = normalizePhone_(data[i][5]); // Coluna F
          if (phoneInRow && phoneInRow === normalizedPhone) {
            targetRowIndex = i + 1;
            break;
          }
        }
      }
    }

    if (!targetRowIndex) {
      return { success: false, message: 'Cliente não encontrado.' };
    }

    const currentPhoneNormalized = normalizePhone_(sheet.getRange(targetRowIndex, 6).getValue());

    const rawPhone = customerData.telefone == null
      ? (sheet.getRange(targetRowIndex, 6).getValue() || '').toString().trim()
      : customerData.telefone.toString().trim();

    let normalizedPhoneToSave = '';
    if (rawPhone !== '') {
      normalizedPhoneToSave = normalizePhone_(rawPhone);
      if (!normalizedPhoneToSave) {
        return { success: false, message: 'Telefone inválido para atualização.' };
      }

      // Só valida duplicidade se o telefone foi alterado.
      if (normalizedPhoneToSave !== currentPhoneNormalized) {
        for (let i = 1; i < data.length; i++) {
          const rowIndex = i + 1;
          if (rowIndex === targetRowIndex) continue;
          const phoneInRow = normalizePhone_(data[i][5]);
          if (phoneInRow && phoneInRow === normalizedPhoneToSave) {
            return { success: false, message: 'Este telefone já está cadastrado.' };
          }
        }
      }
    }

    sheet.getRange(targetRowIndex, 2).setValue((customerData.nome || '').toString().trim()); // Coluna B
    sheet.getRange(targetRowIndex, 6).setValue(normalizedPhoneToSave); // Coluna F
    return { success: true, message: 'Cliente atualizado com sucesso!' };
  } catch (error) {
    Logger.log('Erro ao atualizar cliente: ' + error.message);
    return { success: false, message: 'Erro no servidor: ' + error.message };
  }
}

function deleteCustomer(customerRef) {
  try {
    cacheRemove_('customers_v2');
    const refId = customerRef && typeof customerRef === 'object' ? customerRef.id : '';
    const refPhone = customerRef && typeof customerRef === 'object' ? customerRef.telefone : customerRef;

    if (!refId && !refPhone) {
      throw new Error('Telefone do cliente não fornecido.');
    }

    const sheet = SpreadsheetApp.openById(CUSTOMERS_SPREADSHEET_ID).getSheetByName(CUSTOMERS_SHEET_NAME);
    if (!sheet) throw new Error('Aba de clientes não encontrada: ' + CUSTOMERS_SHEET_NAME);

    const data = sheet.getDataRange().getValues();
    let targetRowIndex = null;

    const rowFromId = parseCustomerRowId_(refId);
    if (rowFromId && rowFromId <= data.length) {
      targetRowIndex = rowFromId;
    }

    if (!targetRowIndex && refPhone) {
      const normalizedPhone = normalizePhone_(refPhone);
      if (!normalizedPhone) {
        return { success: false, message: 'Telefone inválido para exclusão.' };
      }
      for (let i = data.length - 1; i >= 1; i--) {
        const phoneInRow = normalizePhone_(data[i][5]); // Coluna F
        if (phoneInRow && phoneInRow === normalizedPhone) {
          targetRowIndex = i + 1;
          break;
        }
      }
    }

    if (!targetRowIndex) {
      return { success: false, message: 'Cliente não encontrado para excluir.' };
    }

    const phoneInTargetRow = normalizePhone_(sheet.getRange(targetRowIndex, 6).getValue());
    if (phoneInTargetRow) {
      const purchaseHistory = getPurchaseHistory(phoneInTargetRow);
      if (purchaseHistory.length > 0) {
        return { success: false, message: 'Não é possível excluir. Este cliente possui compras registradas.' };
      }
    }

    sheet.deleteRow(targetRowIndex);
    return { success: true, message: 'Cliente excluído com sucesso!' };
  } catch (error) {
    Logger.log('Erro ao excluir cliente: ' + error.message);
    return { success: false, message: 'Erro no servidor: ' + error.message };
  }
}


// --- FUNÇÕES DE GERENCIAMENTO DE PRODUTOS ---

function addProduct(productData) {
  try {
    cacheRemove_('products_v1');
    if (!productData || !productData.nome || !productData.valor) {
      throw new Error('Dados do produto inválidos.');
    }

    const estoqueInicial = Number(productData.quantidade || 0);

    // garante a aba Produtos com 4 colunas
    const sheet = getOrCreateSheet_(SPREADSHEET_ID, SHEETS.PRODUTOS, ['ID','Nome','Valor','Estoque Atual']);
    const lastRow = sheet.getLastRow();

    let newId = 1;
    if (lastRow > 1) {
      const lastId = sheet.getRange(lastRow, 1).getValue();
      newId = parseInt(lastId, 10) + 1;
    }

    sheet.appendRow([newId, productData.nome, parseFloat(productData.valor), estoqueInicial]);

    // se tiver estoque inicial, registra movimento de entrada
    if (estoqueInicial > 0) {
      logStockMovement({
        productId: newId,
        productName: productData.nome,
        tipo: 'Entrada',
        quantidade: estoqueInicial,
        observacao: 'Cadastro inicial'
      });
    }

    return { success: true, message: 'Produto adicionado com sucesso!' };
  } catch (error) {
    Logger.log('Erro ao adicionar produto: ' + error.message);
    return { success: false, message: 'Erro no servidor: ' + error.message };
  }
}



function updateProduct(productData) {
  try {
    cacheRemove_('products_v1');
    if (!productData || !productData.id || !productData.nome || !productData.valor) {
      throw new Error('Dados do produto inválidos para atualização.');
    }

    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.PRODUTOS);
    const data = sheet.getDataRange().getValues();
    let updated = false;

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == productData.id) {
        sheet.getRange(i + 1, 2).setValue(productData.nome);
        sheet.getRange(i + 1, 3).setValue(parseFloat(productData.valor));
        // estoque (coluna D) continua igual; ajustes via funções abaixo
        updated = true;
        break;
      }
    }

    return updated
      ? { success: true, message: 'Produto atualizado com sucesso!' }
      : { success: false, message: 'Produto não encontrado para atualizar.' };
  } catch (error) {
    Logger.log('Erro ao atualizar produto: ' + error.message);
    return { success: false, message: 'Erro no servidor: ' + error.message };
  }
}


function deleteProduct(productId) {
  try {
    cacheRemove_('products_v1');
    if (!productId) {
      throw new Error('ID do produto não fornecido.');
    }

    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.PRODUTOS);
    const data = sheet.getDataRange().getValues();
    let deleted = false;

    for (let i = data.length - 1; i >= 1; i--) {
      if (data[i][0] == productId) {
        sheet.deleteRow(i + 1);
        deleted = true;
        break;
      }
    }

    if (deleted) {
      return { success: true, message: 'Produto deletado com sucesso!' };
    } else {
      return { success: false, message: 'Produto não encontrado para deletar.' };
    }
  } catch (error) {
    Logger.log('Erro ao deletar produto: ' + error.message);
    return { success: false, message: 'Erro no servidor: ' + error.message };
  }
}


// --- FUNÇÕES DE PAGAMENTO, E-MAIL E EXCLUSÃO DE COMPRA ---

function markPurchaseAsPaid(details) {
  try {
    if (!details || !details.telefone || !details.dataISO) {
      throw new Error('Detalhes da compra inválidos para atualização.');
    }

    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.COMPRAS);
    const data = sheet.getDataRange().getValues();
    let updated = false;

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowDate = new Date(row[0]).toISOString();
      const rowPhone = row[6].toString().replace(/\D/g, '');
      const detailsPhone = details.telefone.toString().replace(/\D/g, '');

      if (rowDate === details.dataISO && rowPhone === detailsPhone) {
        sheet.getRange(i + 1, 8).setValue('Pago');
        updated = true;
      }
    }

    if (updated) {
      return { success: true, message: 'Compra marcada como paga!' };
    } else {
      return { success: false, message: 'Nenhuma compra correspondente encontrada.' };
    }

  } catch (error) {
    Logger.log('Erro ao marcar como pago: ' + error.message);
    return { success: false, message: 'Erro no servidor: ' + error.message };
  }
}

function deletePurchase(details) {
  try {
    if (!details || !details.telefone || !details.dataISO) {
      throw new Error('Detalhes da compra inválidos para exclusão.');
    }

    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.COMPRAS);
    const data = sheet.getDataRange().getValues();
    let deleted = false;

    const detailsPhone = details.telefone.toString().replace(/\D/g, '');

    // Itera de baixo para cima para evitar problemas com a reindexação das linhas após a exclusão
    for (let i = data.length - 1; i >= 1; i--) {
      const row = data[i];
      const rowDate = new Date(row[0]).toISOString();
      const rowPhone = row[6].toString().replace(/\D/g, '');

      if (rowDate === details.dataISO && rowPhone === detailsPhone) {
        sheet.deleteRow(i + 1);
        deleted = true;
      }
    }

    if (deleted) {
      return { success: true, message: 'Registro de compra excluído com sucesso!' };
    } else {
      return { success: false, message: 'Nenhuma compra correspondente encontrada para excluir.' };
    }
  } catch (error) {
    Logger.log('Erro ao excluir compra: ' + error.message);
    return { success: false, message: 'Erro no servidor: ' + error.message };
  }
}

function sendPurchaseHistoryEmail(phone, recipientEmail) {
  try {
    const purchases = getPurchaseHistory(phone);
    const customer = getCustomerByPhone(phone);

    if (!customer) throw new Error('Cliente não encontrado.');

    const paidPurchases = purchases.filter(p => p.status === 'Pago');
    if (paidPurchases.length === 0) {
      return { success: false, message: 'Nenhuma compra paga encontrada para enviar.' };
    }

    const totalPaid = paidPurchases.reduce((sum, p) => sum + p.subtotal, 0);

    let itemsHtml = paidPurchases.map(p => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${new Date(p.data).toLocaleDateString('pt-BR')}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${p.produto}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${p.quantidade}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">R$ ${p.subtotal.toFixed(2)}</td>
        </tr>
      `).join('');

    const emailBody = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://i.imgur.com/c5XQ7TW.png" alt="Minibar EAC Logo" style="width: 100px; height: 100px;">
          <h2 style="color: #1e4d72;">Recibo de Compras Pagas</h2>
        </div>
        <p>Olá, <strong>${customer.nome}</strong>,</p>
        <p>Obrigado por sua preferência! Segue abaixo o resumo de suas compras que foram quitadas:</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr>
              <th style="padding: 8px; background-color: #f2f2f2; text-align: left;">Data</th>
              <th style="padding: 8px; background-color: #f2f2f2; text-align: left;">Produto</th>
              <th style="padding: 8px; background-color: #f2f2f2; text-align: center;">Qtd</th>
              <th style="padding: 8px; background-color: #f2f2f2; text-align: right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div style="text-align: right; font-size: 1.2em; font-weight: bold; margin-top: 20px; color: #28a745;">
          Total Pago: R$ ${totalPaid.toFixed(2)}
        </div>
        <hr style="margin-top: 30px;">
        <p style="font-size: 0.8em; color: #777; text-align: center;">
          EAC Porciúncula de Sant'ana<br>
          Este é um e-mail automático, por favor, não responda.
        </p>
      </div>`;

    GmailApp.sendEmail(recipientEmail, `Seu Recibo de Compras - Minibar EAC`, "", {
      htmlBody: emailBody,
      name: "EAC Porciúncula de Sant'ana",
      from: "eacporciunculadesantana@gmail.com"
    });

    return { success: true, message: `Recibo enviado com sucesso para ${recipientEmail}!` };

  } catch (error) {
    Logger.log('Erro ao enviar e-mail: ' + error.message);
    return { success: false, message: 'Erro no servidor ao enviar e-mail: ' + error.message };
  }
}
// Função para gerar relatório de vendas por período
function getSalesReport(startDate, endDate) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.COMPRAS);
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    const data = sheet.getRange(1, 1, lastRow, lastCol).getValues();

    Logger.log('Dados recebidos para início: ' + startDate + ' | fim: ' + endDate);
    Logger.log('Total de linhas lidas na planilha: ' + data.length);

    if (data.length <= 1) return {
      vendas: [],
      totalGeral: 0,
      totalPago: 0,
      totalPendente: 0,
      periodo: { inicio: startDate, fim: endDate }
    };

    const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
    const [endYear, endMonth, endDay] = endDate.split('-').map(Number);

    const start = new Date(startYear, startMonth - 1, startDay, 0, 0, 0);
    const end = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);

    Logger.log('Data inicial convertida: ' + start);
    Logger.log('Data final convertida: ' + end);

    const report = [];
    let totalGeral = 0;
    let totalPago = 0;
    let totalPendente = 0;

    // Constantes de coluna
    const COL = {
      DATA: 0,
      PRODUTO: 1,
      QUANTIDADE: 2,
      VALOR_UNITARIO: 3,
      SUBTOTAL: 4,
      NOME_COMPRADOR: 5,
      TELEFONE: 6,
      STATUS: 7 // Nova coluna
    };

    for (let i = 1; i < data.length; i++) {
      const rawDate = data[i][COL.DATA];
      let rowDate = null;

      if (rawDate instanceof Date) {
        rowDate = new Date(rawDate);
        rowDate.setHours(0, 0, 0, 0);
      } else if (typeof rawDate === 'string') {
        const parts = rawDate.split('/');
        if (parts.length === 3) {
          rowDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          rowDate.setHours(0, 0, 0, 0);
        }
      }

      if (!rowDate) continue;

      if (rowDate >= start && rowDate <= end) {
        const subtotal = parseFloat((data[i][COL.SUBTOTAL] + '').replace(',', '.')) || 0;
        const status = (data[i][COL.STATUS] || 'Pendente').trim();

        report.push({
          data: rowDate.toISOString(),
          produto: data[i][COL.PRODUTO],
          quantidade: parseFloat((data[i][COL.QUANTIDADE] + '').replace(',', '.')) || 0,
          valorUnitario: parseFloat((data[i][COL.VALOR_UNITARIO] + '').replace(',', '.')) || 0,
          subtotal: subtotal,
          nome: data[i][COL.NOME_COMPRADOR] || '',
          telefone: data[i][COL.TELEFONE] || '',
          status: status
        });

        totalGeral += subtotal;
        if (status === 'Pago') {
          totalPago += subtotal;
        } else {
          totalPendente += subtotal;
        }
      }
    }

    Logger.log('Total de vendas encontradas: ' + report.length);
    Logger.log('Total geral: ' + totalGeral);
    Logger.log('Total pago: ' + totalPago);
    Logger.log('Total pendente: ' + totalPendente);

    return {
      vendas: report,
      totalGeral,
      totalPago,
      totalPendente,
      periodo: { inicio: startDate, fim: endDate }
    };

  } catch (e) {
    Logger.log('Erro ao gerar relatório: ' + e.message);
    return {
      erro: e.message,
      vendas: [],
      totalGeral: 0,
      totalPago: 0,
      totalPendente: 0,
      periodo: { inicio: startDate, fim: endDate }
    };
  }
}
// Ordena por nome, ignorando acentos e maiúsculas/minúsculas
function sortByName(list, key = 'nome') {
  return list.sort((a, b) =>
    (a?.[key] || '').toString().localeCompare(
      (b?.[key] || '').toString(),
      'pt-BR',
      { sensitivity: 'base', numeric: true }
    )
  );
}
//relatorio de vendas por produto
function getProductSalesSummary(startDate, endDate) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.COMPRAS);
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    const data = sheet.getRange(1, 1, lastRow, lastCol).getValues();

    if (data.length <= 1) {
      return { produtos: [], totalGeral: 0, periodo: { inicio: startDate, fim: endDate } };
    }

    // Constrói datas do período
    const [sy, sm, sd] = startDate.split('-').map(Number);
    const [ey, em, ed] = endDate.split('-').map(Number);
    const start = new Date(sy, sm - 1, sd, 0, 0, 0);
    const end   = new Date(ey, em - 1, ed, 23, 59, 59, 999);

    // Mapa de colunas (A=0, B=1, ...)
    const COL = {
      DATA: 0,          // A
      PRODUTO: 1,       // B
      QTD: 2,           // C  ✅ referência oficial
      VALOR_UNIT: 3,    // D
      SUBTOTAL: 4,      // E
      STATUS: 7         // H (mantido para possíveis filtros futuros)
    };

    const agregados = new Map();
    let totalGeral = 0;

    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      // Parse da data da linha
      let rowDate = null;
      const raw = row[COL.DATA];
      if (raw instanceof Date) {
        rowDate = new Date(raw);
      } else if (typeof raw === 'string') {
        const parts = raw.split('/');
        if (parts.length === 3) rowDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      }
      if (!rowDate || rowDate < start || rowDate > end) continue;

      const produto = (row[COL.PRODUTO] || '').toString().trim();
      if (!produto) continue;

      const qtd = Number((row[COL.QTD] + '').toString().replace(',', '.')) || 0;
      const subtotal = Number((row[COL.SUBTOTAL] + '').toString().replace(',', '.')) || 0;

      totalGeral += subtotal;

      if (!agregados.has(produto)) {
        agregados.set(produto, { produto, quantidadeTotal: 0, faturamentoTotal: 0, transacoes: 0 });
      }
      const agg = agregados.get(produto);
      agg.quantidadeTotal += qtd;
      agg.faturamentoTotal += subtotal;
      agg.transacoes += 1;
    }

    // Ordena por faturamento desc (pode mudar para quantidade se preferir)
    const produtos = Array.from(agregados.values()).sort((a, b) => b.faturamentoTotal - a.faturamentoTotal);

    return {
      produtos,
      totalGeral,
      periodo: { inicio: startDate, fim: endDate }
    };

  } catch (e) {
    Logger.log('Erro no resumo por produto: ' + e.message);
    return { erro: e.message, produtos: [], totalGeral: 0, periodo: { inicio: startDate, fim: endDate } };
  }
}
//Top N produtos do período
function getTopProducts(limit, startDate, endDate) {
  const res = getProductSalesSummary(startDate, endDate);
  if (res.erro) return res;
  const produtos = (res.produtos || []).slice(0, Number(limit) || 5);
  return { ...res, produtos };
}
//controle de estoque
function getProductById(id) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.PRODUTOS);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      return {
        rowIndex: i + 1,
        id: data[i][0],
        nome: data[i][1],
        valor: parseFloat(data[i][2]),
        estoque: parseFloat(data[i][3] || 0)
      };
    }
  }
  return null;
}

function setProductStock(rowIndex, novoEstoque) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.PRODUTOS);
  sheet.getRange(rowIndex, 4).setValue(Number(novoEstoque));
}

function logStockMovement({data, productId, productName, tipo, quantidade, observacao}) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.MOVIMENTOS);
  const when = data || new Date();
  sheet.appendRow([when, productId, productName, tipo, Number(quantidade), observacao || '']);
}

function changeProductStock(productId, delta, tipo, observacao) {
  cacheRemove_('products_v1');
  const p = getProductById(productId);
  if (!p) throw new Error('Produto não encontrado para movimentação de estoque.');
  const novo = (p.estoque || 0) + Number(delta);
  if (novo < 0) throw new Error(`Estoque insuficiente de "${p.nome}". Saldo atual: ${p.estoque}.`);
  setProductStock(p.rowIndex, novo);
  logStockMovement({
    data: new Date(),
    productId, productName: p.nome, tipo, quantidade: Math.abs(delta), observacao
  });
  return novo;
}
function registerStockEntry(entry) {
  try {
    cacheRemove_('products_v1');
    // { productId, quantidade, observacao }  (quantidade > 0)
    if (!entry || !entry.productId || !entry.quantidade) throw new Error('Dados inválidos para entrada de estoque.');
    changeProductStock(Number(entry.productId), Number(entry.quantidade), 'Entrada', entry.observacao || 'Entrada manual');
    return { success: true, message: 'Entrada de estoque registrada.' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function adjustStock(entry) {
  try {
    cacheRemove_('products_v1');
    // { productId, novoEstoque, observacao }
    if (!entry || !entry.productId || typeof entry.novoEstoque === 'undefined') throw new Error('Dados inválidos para ajuste de estoque.');
    const p = getProductById(Number(entry.productId));
    if (!p) throw new Error('Produto não encontrado.');
    const delta = Number(entry.novoEstoque) - (p.estoque || 0);
    if (delta !== 0) changeProductStock(p.id, delta, 'Ajuste', entry.observacao || 'Ajuste manual');
    return { success: true, message: 'Ajuste de estoque aplicado.' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}
function getInventorySnapshot() {
  try {
    const prods = getProducts();
    return prods.map(p => ({
      id: p.id, produto: p.nome, valor: p.valor, estoqueAtual: Number(p.estoque || 0)
    }));
  } catch (e) {
    return [];
  }
}
function getInventoryReport(startDate, endDate) {
  try {
    const movSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.MOVIMENTOS);
    const lastRow = movSheet.getLastRow();
    if (lastRow < 2) return { itens: [], periodo: { inicio: startDate, fim: endDate } };

    const data = movSheet.getRange(2, 1, lastRow - 1, 6).getValues(); // A..F

    const [sy, sm, sd] = startDate.split('-').map(Number);
    const [ey, em, ed] = endDate.split('-').map(Number);
    const start = new Date(sy, sm - 1, sd, 0, 0, 0);
    const end   = new Date(ey, em - 1, ed, 23, 59, 59, 999);

    const map = new Map(); // productId -> {produto, entradas, saidas}
    for (let i = 0; i < data.length; i++) {
      let d = data[i][0];
      if (!(d instanceof Date)) continue;
      if (d < start || d > end) continue;
      const pid = data[i][1];
      const nome = data[i][2];
      const tipo = (data[i][3] || '').toString();
      const qtd = Number(data[i][4] || 0);

      if (!map.has(pid)) map.set(pid, { productId: pid, produto: nome, entradas: 0, saidas: 0 });
      const agg = map.get(pid);
      if (tipo === 'Entrada' || tipo === 'Ajuste') {
        agg.entradas += qtd;
      } else if (tipo === 'Saída') {
        agg.saidas += qtd;
      }
    }

    // Juntar com saldo atual
    const prods = getProducts(); // tem estoqueAtual
    const byId = new Map(prods.map(p => [p.id, p]));
    const itens = Array.from(map.values()).map(r => {
      const p = byId.get(r.productId) || {};
      const estoqueAtual = Number(p.estoque || 0);
      const variacaoPeriodo = r.entradas - r.saidas;
      const saldoInicialEstimado = estoqueAtual - variacaoPeriodo;
      return {
        productId: r.productId,
        produto: r.produto,
        entradas: r.entradas,
        saidas: r.saidas,
        saldoInicialEstimado,
        saldoAtual: estoqueAtual
      };
    });

    // Incluir produtos sem movimento no período (opcional)
    prods.forEach(p => {
      if (!map.has(p.id)) {
        itens.push({
          productId: p.id,
          produto: p.nome,
          entradas: 0,
          saidas: 0,
          saldoInicialEstimado: p.estoque, // sem movimento, inicial ~= atual
          saldoAtual: p.estoque
        });
      }
    });

    // Ordenar por menor saldo ou por nome (a seu gosto)
    itens.sort((a, b) => a.produto.localeCompare(b.produto, 'pt-BR', { sensitivity: 'base' }));
    return { itens, periodo: { inicio: startDate, fim: endDate } };
  } catch (e) {
    return { erro: e.message, itens: [], periodo: { inicio: startDate, fim: endDate } };
  }
}
//atualização da planilha com as abas
// Cria a aba se não existir, e garante os cabeçalhos se forem informados
function getOrCreateSheet_(ssId, name, headers) {
  const ss = SpreadsheetApp.openById(ssId);
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (headers && headers.length) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
  } else if (headers && headers.length) {
    // Se a primeira linha estiver vazia, escreve os cabeçalhos
    const hasHeader = sheet.getLastRow() >= 1 && sheet.getRange(1,1,1,1).getValue() !== '';
    if (!hasHeader) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  return sheet;
}

// Garante a existência de todas as abas usadas pelo app
function initSheets() {
  getOrCreateSheet_(SPREADSHEET_ID, SHEETS.CADASTRO, ['Nome','Telefone']);
  getOrCreateSheet_(SPREADSHEET_ID, SHEETS.PRODUTOS, ['ID','Nome','Valor','Estoque Atual']); // D = estoque
  getOrCreateSheet_(SPREADSHEET_ID, SHEETS.COMPRAS, ['Data','Produto','Quantidade','Valor Unitário','Subtotal','Cliente','Telefone','Status']);
  getOrCreateSheet_(SPREADSHEET_ID, SHEETS.MOVIMENTOS, ['Data','Produto ID','Produto','Tipo','Quantidade','Observação']);
}
function logStockMovement({data, productId, productName, tipo, quantidade, observacao}) {
  const sheet = getOrCreateSheet_(SPREADSHEET_ID, SHEETS.MOVIMENTOS, ['Data','Produto ID','Produto','Tipo','Quantidade','Observação']);
  const when = data || new Date();
  sheet.appendRow([when, productId, productName, tipo, Number(quantidade), observacao || '']);
}


/**
 * Função obrigatória para lidar com requisições POST externas (do Vercel/React)
 */
function doPost(e) {
  var result;
  try {
    var request = JSON.parse(e.postData.contents);
    var action = request.action;

    // Roteador de funções baseada na action enviada pelo frontend
    switch (action) {
      case 'getCustomers': result = { success: true, data: getCustomers() }; break;
      case 'getCustomerByPhone': result = { success: true, data: getCustomerByPhone(request.telefone) }; break;
      case 'addCustomer': result = addCustomer({ nome: request.nome, telefone: request.telefone }); break;
      case 'updateCustomer': result = updateCustomer({
        id: request.id,
        nome: request.nome,
        telefone: request.telefone,
        telefoneAnterior: request.telefoneAnterior
      }); break;
      case 'deleteCustomer': result = deleteCustomer({ id: request.id, telefone: request.telefone }); break;
      
      case 'getProducts': result = { success: true, data: getProducts() }; break;
      case 'addProduct': result = addProduct(request); break;
      case 'updateProduct': result = updateProduct(request); break;
      case 'deleteProduct': result = deleteProduct(request.id); break;
      case 'registerStockEntry': result = registerStockEntry({ productId: request.productId, quantidade: request.quantidade }); break;
      case 'adjustStock': result = adjustStock({ productId: request.productId, novoEstoque: request.novoEstoque }); break;

      case 'registerPurchase': result = registerPurchase(request); break;
      case 'getPurchaseHistory': result = { success: true, data: getPurchaseHistory(request.telefone) }; break;
      case 'markPurchaseAsPaid': result = markPurchaseAsPaid({ dataISO: request.dataISO, telefone: request.telefone }); break;
      case 'deletePurchase': result = deletePurchase({ dataISO: request.dataISO, telefone: request.telefone }); break;
      case 'sendPurchaseHistoryEmail': result = sendPurchaseHistoryEmail(request.phone, request.recipientEmail); break;

      case 'getSalesReport': result = getSalesReport(request.startDate, request.endDate); break;
      case 'getProductSalesSummary': result = getProductSalesSummary(request.startDate, request.endDate); break;
      case 'getInventoryReport': result = getInventoryReport(request.startDate, request.endDate); break;

      default:
        result = { success: false, message: 'Ação "' + action + '" não encontrada.' };
    }
  } catch (err) {
    result = { success: false, message: 'Erro interno no Servidor GAS: ' + err.message };
  }

  // Retorna o JSON com os headers de CORS permitidos pelo GAS para WebApps
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}











