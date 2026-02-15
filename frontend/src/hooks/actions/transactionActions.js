import api from "../../api/client";
import { initialTxForm } from "../../constants/appDefaults";

export default function createTransactionActions({
  apiMsg,
  txForm,
  moneyFmt,
  setBusy,
  setTxForm,
  loadAll,
  addAudit,
}) {
  const editTx = (tx) =>
    setTxForm({
      ...initialTxForm(),
      ...tx,
      entityId: String(tx.entityId),
      productId: String(tx.productId || ""),
      batchingEnabled: !!(tx.batchingEnabled || tx.batchNo),
      batchNo: String(tx.batchNo || ""),
      mfgDate: String(tx.mfgDate || ""),
      expDate: String(tx.expDate || ""),
    });

  const saveTx = async () => {
    setBusy((prev) => ({ ...prev, transaction: true }));
    try {
      const payload = {
        date: txForm.date,
        entityId: String(txForm.entityId || ""),
        productId: String(txForm.productId || ""),
        type: txForm.type,
        item: txForm.item,
        qty: Number(txForm.qty),
        unitAmount: Number(txForm.unitAmount),
        gstRate: Number(txForm.gstRate),
        dueDate: txForm.dueDate || "",
        paidAmount: Number(txForm.paidAmount || 0),
        reminderEnabled: !!txForm.reminderEnabled,
        note: txForm.note,
        batchingEnabled: !!txForm.batchingEnabled,
        batchNo: txForm.batchingEnabled ? String(txForm.batchNo || "").trim() : "",
        mfgDate: txForm.batchingEnabled ? String(txForm.mfgDate || "").trim() : "",
        expDate: txForm.batchingEnabled ? String(txForm.expDate || "").trim() : "",
      };
      if (!payload.entityId || !payload.item || !payload.date) {
        apiMsg.error("Required fields missing");
        return false;
      }
      if (txForm.id) await api.put(`/transactions/${txForm.id}`, payload);
      else await api.post("/transactions", payload);
      await addAudit(
        txForm.id ? "update" : "create",
        "transaction",
        `${payload.item} ${txForm.id ? "updated" : "created"}`,
        { type: payload.type }
      );
      setTxForm(initialTxForm());
      await loadAll();
      apiMsg.success("Transaction saved");
      return true;
    } catch (err) {
      apiMsg.error(err?.response?.data?.error || "Failed to save transaction");
      return false;
    } finally {
      setBusy((prev) => ({ ...prev, transaction: false }));
    }
  };

  const importSalesCsv = async (csvText) => {
    setBusy((prev) => ({ ...prev, importCsv: true }));
    try {
      const res = await api.post("/transactions/import-csv", { csvText });
      await loadAll();
      return res.data;
    } finally {
      setBusy((prev) => ({ ...prev, importCsv: false }));
    }
  };

  const addPayment = async (tx, payload = null) => {
    let requestPayload = payload;
    if (!requestPayload) {
      const input = window.prompt(`Current due: ${moneyFmt(tx.due)}\nEnter amount:`);
      if (!input) return;
      const addPaid = Number(input);
      if (Number.isNaN(addPaid) || addPaid <= 0) return;
      requestPayload = { addPaid };
    }
    setBusy((prev) => ({ ...prev, payment: true }));
    try {
      await api.patch(`/transactions/${tx.id}/payment`, requestPayload);
      await addAudit("payment", "transaction", `Payment recorded for ${tx.item}`, {
        id: tx.id,
        addPaid: requestPayload.addPaid,
      });
      await loadAll();
      apiMsg.success("Payment recorded");
      return true;
    } catch (err) {
      apiMsg.error(err?.response?.data?.error || "Failed to update payment");
      return false;
    } finally {
      setBusy((prev) => ({ ...prev, payment: false }));
    }
  };

  const getProductBatches = async (productId) => {
    const res = await api.get(
      `/transactions/batches?productId=${encodeURIComponent(String(productId || ""))}`
    );
    return res.data.items || [];
  };

  const deleteTx = async (id) => {
    if (!window.confirm("Delete transaction?")) return;
    await api.delete(`/transactions/${id}`);
    await addAudit("delete", "transaction", "Transaction deleted", { id });
    await loadAll();
  };

  return { editTx, saveTx, importSalesCsv, addPayment, getProductBatches, deleteTx };
}
