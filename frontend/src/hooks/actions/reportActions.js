import api from "../../api/client";
import { csvDownload, today } from "../../utils/format";

export default function createReportActions({ entities, transactions, bills, setBusy, loadAll, addAudit, apiMsg }) {
  const exportBackup = async () => {
    setBusy((prev) => ({ ...prev, backupExport: true }));
    try {
      const res = await api.get("/backup");
      const file = `ledger-backup-${today()}.json`;
      const blob = new Blob([JSON.stringify(res.data.item, null, 2)], {
        type: "application/json",
      });
      const anchor = document.createElement("a");
      anchor.href = URL.createObjectURL(blob);
      anchor.download = file;
      anchor.click();
      await addAudit("export", "backup", "Backup exported");
      apiMsg.success("Backup exported");
    } catch (err) {
      apiMsg.error(err?.response?.data?.error || "Backup export failed");
    } finally {
      setBusy((prev) => ({ ...prev, backupExport: false }));
    }
  };

  const importBackup = async (jsonText) => {
    setBusy((prev) => ({ ...prev, backupImport: true }));
    try {
      const parsed = JSON.parse(jsonText);
      await api.post("/backup/restore", parsed);
      await addAudit("import", "backup", "Backup restored");
      await loadAll();
      apiMsg.success("Backup restored");
    } catch (err) {
      apiMsg.error(err?.response?.data?.error || err.message || "Backup restore failed");
    } finally {
      setBusy((prev) => ({ ...prev, backupImport: false }));
    }
  };

  const onExportEntities = () =>
    csvDownload("entities.csv", [
      ["Name", "Category", "GSTIN", "Phone", "Address", "Opening Balance", "Balance"],
      ...entities.map((entity) => [
        entity.name,
        entity.category,
        entity.gstin,
        entity.phone,
        entity.address,
        entity.openingBalance,
        entity.balance,
      ]),
    ]);

  const onExportTransactions = () =>
    csvDownload("transactions.csv", [
      [
        "Date",
        "Entity",
        "Product",
        "Type",
        "Item",
        "Batch No",
        "Mfg Date",
        "Exp Date",
        "Qty",
        "Unit",
        "Base",
        "GST",
        "Gross",
        "Paid",
        "Due",
        "Due Date",
      ],
      ...transactions.map((tx) => [
        tx.date,
        tx.entityName,
        tx.productName || "",
        tx.type,
        tx.item,
        tx.batchNo || "",
        tx.mfgDate || "",
        tx.expDate || "",
        tx.qty,
        tx.unitAmount,
        tx.base,
        tx.gst,
        tx.gross,
        tx.paidAmount,
        tx.due,
        tx.dueDate || "",
      ]),
    ]);

  const onExportBills = () =>
    csvDownload("bills.csv", [
      ["Bill No", "Date", "Entity", "Subtotal", "GST", "Total"],
      ...bills.map((bill) => [
        bill.billNo,
        bill.date,
        bill.entityName,
        bill.subtotal,
        bill.gstTotal,
        bill.total,
      ]),
    ]);

  return {
    exportBackup,
    importBackup,
    onExportEntities,
    onExportTransactions,
    onExportBills,
  };
}
