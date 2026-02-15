export function printBillDocument({
  bill,
  template,
  templateConfig,
  defaultBillTemplateConfig,
  profileForm,
  me,
  moneyFmt,
  fmtDate,
}) {
  const cfg = templateConfig || defaultBillTemplateConfig;
  const businessName = profileForm.businessName || me?.name || "Business Name";
  const businessGstin = profileForm.businessGstin || "-";
  const businessPhone = profileForm.businessPhone || "-";
  const businessEmail = profileForm.businessEmail || me?.email || "-";
  const businessAddress = profileForm.address || "-";
  const bankName = profileForm.bankName || "-";
  const bankBranch = profileForm.bankBranch || "-";
  const bankAccountNo = profileForm.bankAccountNo || "-";
  const bankIfsc = profileForm.bankIfsc || "-";
  const themes = {
    classic: { bodyBg: "#ffffff", text: "#1f2937", accent: "#1f7a5a", thBg: "#f3f6f4" },
    modern: { bodyBg: "#f7faf8", text: "#13203a", accent: "#206f53", thBg: "#eaf3ee" },
    minimal: { bodyBg: "#ffffff", text: "#111827", accent: "#374151", thBg: "#f9fafb" },
    gst_formal: { bodyBg: "#ffffff", text: "#111111", accent: "#111111", thBg: "#ffffff" },
  };
  const theme = themes[template] || themes.classic;
  const cgst = (Number(bill.gstTotal || 0) / 2).toFixed(2);
  const sgst = (Number(bill.gstTotal || 0) / 2).toFixed(2);
  const igst = "0.00";

  if (template === "gst_formal") {
    const rows = bill.lines
      .map((line, idx) => {
        const cells = [];
        if (cfg.columns.srNo) cells.push(`<td>${idx + 1}</td>`);
        if (cfg.columns.item) cells.push(`<td>${line.item}</td>`);
        if (cfg.columns.qty) cells.push(`<td>${line.qty}</td>`);
        if (cfg.columns.unitAmount) cells.push(`<td>${moneyFmt(line.unitAmount)}</td>`);
        if (cfg.columns.gross) cells.push(`<td>${moneyFmt(line.gross)}</td>`);
        return `<tr>${cells.join("")}</tr>`;
      })
      .join("");

    const headCells = [
      cfg.columns.srNo ? "<th>Sr No</th>" : "",
      cfg.columns.item ? "<th>Description of Goods</th>" : "",
      cfg.columns.qty ? "<th>Qty</th>" : "",
      cfg.columns.unitAmount ? "<th>Rate</th>" : "",
      cfg.columns.gross ? "<th>Amount</th>" : "",
    ]
      .filter(Boolean)
      .join("");

    const summaryCells = [
      cfg.totals.subtotal
        ? `<tr><td>Taxable Value</td><td class="right">${moneyFmt(bill.subtotal)}</td></tr>`
        : "",
      cfg.totals.gstTotal
        ? `<tr><td>GST Total</td><td class="right">${moneyFmt(bill.gstTotal)}</td></tr>`
        : "",
      cfg.totals.cgst ? `<tr><td>CGST</td><td class="right">${moneyFmt(cgst)}</td></tr>` : "",
      cfg.totals.sgst ? `<tr><td>SGST</td><td class="right">${moneyFmt(sgst)}</td></tr>` : "",
      cfg.totals.igst ? `<tr><td>IGST</td><td class="right">${moneyFmt(igst)}</td></tr>` : "",
      cfg.totals.total
        ? `<tr><td><b>Total Amount</b></td><td class="right"><b>${moneyFmt(bill.total)}</b></td></tr>`
        : "",
    ]
      .filter(Boolean)
      .join("");

    const html = `<html><head><title>${bill.billNo}</title><style>
      body{font-family:Arial,sans-serif;padding:20px;color:#111}
      .sheet{border:2px solid #111;padding:12px}
      .head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px}
      .h1{font-size:22px;font-weight:700}
      .tax{font-size:46px;font-weight:700}
      .meta{display:grid;grid-template-columns:2fr 1fr;border:1px solid #111;margin-top:12px}
      .meta > div{padding:10px;min-height:85px}
      .meta > div:first-child{border-right:1px solid #111}
      table{width:100%;border-collapse:collapse}
      th,td{border:1px solid #111;padding:6px;vertical-align:top}
      .items{min-height:420px}
      .items td{height:26px}
      .summary td{font-weight:600}
      .bank{margin-top:0}
      .right{text-align:right}
      </style></head><body>
      <div class="sheet">
        <div class="head">
          <div>
            ${cfg.header.businessName ? `<div class="h1">${businessName}</div>` : ""}
            ${cfg.header.businessGstin ? `<div>GSTIN : ${businessGstin}</div>` : ""}
            ${cfg.header.businessAddress ? `<div>Office : ${businessAddress}</div>` : ""}
            ${cfg.header.businessEmail ? `<div>Email ID : ${businessEmail}</div>` : ""}
            ${cfg.header.businessPhone ? `<div>Phone : ${businessPhone}</div>` : ""}
          </div>
          <div class="tax">Tax Invoice</div>
        </div>

        <div class="meta">
          <div>
            ${cfg.header.clientName ? `<div><b>Client Name:</b> ${bill.entityName || "-"}</div>` : ""}
            ${cfg.header.clientAddress ? `<div>Address: ${bill.entityAddress || "-"}</div>` : ""}
            ${cfg.header.clientGstin ? `<div>GSTIN No: ${bill.entityGstin || "-"}</div>` : ""}
          </div>
          <div>
            ${cfg.header.invoiceNo ? `<div><b>Invoice No</b>: ${bill.billNo}</div>` : ""}
            ${cfg.header.invoiceDate ? `<div><b>Invoice Date</b>: ${fmtDate(bill.date)}</div>` : ""}
          </div>
        </div>

        <table><thead><tr>${headCells}</tr></thead><tbody class="items">${rows}</tbody></table>
        <table class="summary">${summaryCells}</table>
        <table class="bank">
          <tr><td colspan="2"><b>Bank Details</b></td><td rowspan="5"><b>Auth. Signatory</b></td></tr>
          <tr><td>Bank Name</td><td>${bankName}</td></tr>
          <tr><td>Branch Name</td><td>${bankBranch}</td></tr>
          <tr><td>Bank Account No</td><td>${bankAccountNo}</td></tr>
          <tr><td>Bank IFSC Code</td><td>${bankIfsc}</td></tr>
        </table>
      </div>
      </body></html>`;

    const popup = window.open("", "_blank");
    popup.document.write(html);
    popup.document.close();
    popup.print();
    return;
  }

  const colDefs = [
    cfg.columns.srNo ? { label: "#", render: (_line, idx) => idx + 1 } : null,
    cfg.columns.item ? { label: "Item", render: (line) => line.item } : null,
    cfg.columns.batchNo ? { label: "Batch", render: (line) => line.batchNo || "-" } : null,
    cfg.columns.qty ? { label: "Qty", render: (line) => line.qty } : null,
    cfg.columns.unitAmount ? { label: "Unit", render: (line) => moneyFmt(line.unitAmount) } : null,
    cfg.columns.base ? { label: "Taxable", render: (line) => moneyFmt(line.base) } : null,
    cfg.columns.gstRate ? { label: "GST%", render: (line) => line.gstRate } : null,
    cfg.columns.gst ? { label: "GST", render: (line) => moneyFmt(line.gst) } : null,
    cfg.columns.gross ? { label: "Total", render: (line) => moneyFmt(line.gross) } : null,
  ].filter(Boolean);

  const headHtml = colDefs.map((c) => `<th>${c.label}</th>`).join("");
  const linesHtml = bill.lines
    .map((line, idx) => `<tr>${colDefs.map((c) => `<td>${c.render(line, idx)}</td>`).join("")}</tr>`)
    .join("");
  const totalsHtml = [
    cfg.totals.subtotal ? `<p><b>Subtotal:</b> ${moneyFmt(bill.subtotal)}</p>` : "",
    cfg.totals.gstTotal ? `<p><b>GST:</b> ${moneyFmt(bill.gstTotal)}</p>` : "",
    cfg.totals.cgst ? `<p><b>CGST:</b> ${moneyFmt(cgst)}</p>` : "",
    cfg.totals.sgst ? `<p><b>SGST:</b> ${moneyFmt(sgst)}</p>` : "",
    cfg.totals.igst ? `<p><b>IGST:</b> ${moneyFmt(igst)}</p>` : "",
    cfg.totals.total ? `<p><b>Total:</b> ${moneyFmt(bill.total)}</p>` : "",
  ].join("");
  const headerMeta = [
    cfg.header.businessName ? `<p><b>Business:</b> ${businessName}</p>` : "",
    cfg.header.businessGstin ? `<p><b>GSTIN:</b> ${businessGstin}</p>` : "",
    cfg.header.businessAddress ? `<p><b>Address:</b> ${businessAddress}</p>` : "",
    cfg.header.businessEmail ? `<p><b>Email:</b> ${businessEmail}</p>` : "",
    cfg.header.businessPhone ? `<p><b>Phone:</b> ${businessPhone}</p>` : "",
    cfg.header.clientName ? `<p><b>Entity:</b> ${bill.entityName || "-"}</p>` : "",
    cfg.header.invoiceNo ? `<p><b>Invoice:</b> ${bill.billNo}</p>` : "",
    cfg.header.invoiceDate ? `<p><b>Date:</b> ${fmtDate(bill.date)}</p>` : "",
  ].join("");
  const html = `<html><head><title>${bill.billNo}</title><style>body{font-family:Arial;padding:24px;background:${theme.bodyBg};color:${theme.text}}h2{color:${theme.accent}}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px}th{background:${theme.thBg}}</style></head><body><h2>Tax Invoice ${bill.billNo}</h2>${headerMeta}<table><thead><tr>${headHtml}</tr></thead><tbody>${linesHtml}</tbody></table>${totalsHtml}</body></html>`;
  const popup = window.open("", "_blank");
  popup.document.write(html);
  popup.document.close();
  popup.print();
}
