import { Order } from "../types/order";
import { Client } from "../types/client";
import { Clothes, CLOTHING_TYPE_LABELS, SERVICE_LOCATION_LABELS, SERVICE_TYPE_LABELS,  } from "../types/clothes";
import { Impression } from "../types/impression";

interface InvoicePrintProps {
  order: Order;
  client: Client | null;
  clothes: Clothes[];
  impressions: Impression[];
}

export default function InvoicePrint({ order, client, clothes, impressions }: InvoicePrintProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN'
    }).format(value);
  };

  const handlePrint = () => {
    // Create a new window with only the invoice content
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (printWindow) {
      const invoiceHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Controle Interno - ${order.name}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              background: white;
              color: #333;
            }
            .invoice-container {
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 30px;
            }
            .header-left {
              flex: 1;
              text-align: center;
            }
            .header-right {
              flex: 1;
              text-align: right;
              font-size: 12px;
              line-height: 1.4;
            }
            .company-name {
              font-weight: bold;
              font-size: 14px;
              margin-bottom: 5px;
            }
            .company-details {
              color: #666;
            }
            .logo {
              max-height: 80px;
              max-width: 200px;
              object-fit: contain;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              margin: 10px 0;
            }
            .divider {
              border-bottom: 2px solid #000;
              width: 100%;
              margin: 10px 0;
            }
            .section {
              margin-bottom: 30px;
            }
            .section-title {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 10px;
              border-bottom: 1px solid #ccc;
              padding-bottom: 5px;
            }
            .client-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              border: 1px solid #000;
            }
            th, td {
              border: 1px solid #000;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f5f5f5;
              font-weight: bold;
              text-align: center;
            }
            .text-right {
              text-align: right;
            }
            .text-center {
              text-align: center;
            }
            .totals {
              border-top: 2px solid #000;
              padding-top: 15px;
              text-align: right;
            }
            .total-line {
              margin-bottom: 8px;
            }
            .final-total {
              border-top: 1px solid #000;
              padding-top: 8px;
              margin-top: 10px;
              font-size: 16px;
            }
            .final-total .amount {
              font-size: 18px;
            }
            @media print {
              body { margin: 0; padding: 0; }
              @page { size: A4; margin: 0.5in; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <!-- Header with Logo -->
            <div class="header">
              <div class="header-left">
                <img src="/editartlogo.png" alt="EditArt Logo" class="logo" onerror="this.style.display='none'">
                <h1 class="title">CONTROLE INTERNO</h1>
              </div>
              <div class="header-right">
                <div class="company-name">EditArt Serigrafia & Gráfica</div>
                <div class="company-details">
                  SOCIEDADE UNIPESSOAL LDA<br>
                  Beira, Rua Correia de Brito N°247<br>
                  NUIT: 400710392<br>
                  Cell: 84/860444089
                </div>
              </div>
            </div>
            <div class="divider"></div>

            <!-- Client Information -->
            <div class="section">
              <h2 class="section-title">DADOS DO CLIENTE</h2>
              ${client ? `
                <div class="client-info">
                  <div><strong>Nome:</strong> ${order.client_name}</div>
                  <div><strong>Contato:</strong> ${order.client_contact}</div>
                  <div><strong>NUIT:</strong> ${client.nuit}</div>
                </div>
              ` : `
                <div>
                  <div><strong>Nome:</strong> ${order.client_name}</div>
                  <div><strong>Contato:</strong> ${order.client_contact}</div>
                </div>
              `}
            </div>

            <!-- Produtos -->
${clothes.length > 0 ? `
  <div class="section">
    <h2 class="section-title">PRODUTOS</h2>
    <table>
      <thead>
        <tr>
          <th>Produto</th>
          <th>Quantidade</th>
          <th>Preço Unitário</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${clothes.map((item) => {
          const precoBase = item.unit_price;
          const precoServicos = item.services.reduce((soma, servico) => soma + servico.unit_price, 0);
          const precoUnitario = precoBase + precoServicos;
          const total = precoUnitario * item.total_quantity;

          const nomeProduto = item.clothing_type === "other"
            ? item.custom_type || "Outro"
            : CLOTHING_TYPE_LABELS[item.clothing_type];

          // Linha principal do produto
          let linhasProduto = `
            <tr>
              <td>${nomeProduto}</td>
              <td class="text-center">${item.total_quantity}</td>
              <td class="text-right">${formatCurrency(precoBase)}</td>
              <td class="text-right"><strong>${formatCurrency(total)}</strong></td>
            </tr>
          `;

          // Serviços vinculados à peça
          if (item.services.length > 0) {
            linhasProduto += item.services.map(servico => `
              <tr class="service-row">
                <td style="padding-left: 2rem; font-size: 0.9rem; color: #555;">
                  ↳ ${SERVICE_TYPE_LABELS[servico.service_type]} 
                  (${SERVICE_LOCATION_LABELS[servico.location]})
                  ${servico.description ? ` - ${servico.description}` : ""}
                </td>
                <td class="text-center">—</td>
                <td class="text-right">${formatCurrency(servico.unit_price)}</td>
                <td class="text-right">—</td>
              </tr>
            `).join("");
          }

          return linhasProduto;
        }).join("")}
      </tbody>
    </table>
  </div>
` : ''}


            <!-- Impressions Section -->
            ${impressions.length > 0 ? `
              <div class="section">
                <h2 class="section-title">IMPRESSÕES</h2>
                <table>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Tamanho</th>
                      <th>Preço</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${impressions.map((impression) => `
                      <tr>
                        <td>${impression.name}</td>
                        <td class="text-center">${impression.size}</td>
                        <td class="text-right"><strong>${formatCurrency(impression.price)}</strong></td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            ` : ''}

            <!-- Totals Section -->
            <div class="totals">
              <div class="total-line">
                <strong>Subtotal: </strong>
                <strong>${formatCurrency(order.subtotal)}</strong>
              </div>
              
              <div class="total-line">
                <strong>IVA (${order.iva}%): </strong>
                <strong>${formatCurrency(order.subtotal * order.iva / 100)}</strong>
              </div>
              
              ${order.discount > 0 ? `
                <div class="total-line">
                  <strong>Desconto: </strong>
                  <strong style="color: green;">-${formatCurrency(order.discount)}</strong>
                </div>
              ` : ''}
              
              <div class="final-total">
                <strong>TOTAL: </strong>
                <strong class="amount">${formatCurrency(order.total)}</strong>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
      
      printWindow.document.write(invoiceHTML);
      printWindow.document.close();
      
      // Wait for content to load, then print
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };
    }
  };

  return (
    <button
      onClick={handlePrint}
      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
    >
      🖨️ Imprimir
    </button>
  );
}
