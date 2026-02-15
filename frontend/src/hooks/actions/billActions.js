import api from "../../api/client";
import { defaultBillTemplateConfig, initialBillForm } from "../../constants/appDefaults";
import { fmtDate } from "../../utils/format";
import { printBillDocument } from "../../utils/billPrinter";

export default function createBillActions({
  me,
  billForm,
  billTemplateConfig,
  profileForm,
  moneyFmt,
  setBusy,
  setBillForm,
  loadAll,
  addAudit,
  apiMsg,
}) {
  const saveBill = async () => {
    setBusy((prev) => ({ ...prev, bill: true }));
    try {
      if (!billForm.saleIds.length) {
        apiMsg.error("Select one or more sales");
        return false;
      }
      await api.post("/bills", {
        date: billForm.date,
        entityId: String(billForm.entityId || ""),
        prefix: billForm.prefix.toUpperCase(),
        saleIds: billForm.saleIds.map((x) => String(x)),
      });
      await addAudit("create", "invoice", "Invoice generated", {
        entityId: billForm.entityId,
        sales: billForm.saleIds.length,
      });
      setBillForm(initialBillForm());
      await loadAll();
      return true;
    } finally {
      setBusy((prev) => ({ ...prev, bill: false }));
    }
  };

  const deleteBill = async (id) => {
    if (!window.confirm("Delete bill?")) return;
    await api.delete(`/bills/${id}`);
    await addAudit("delete", "invoice", "Invoice deleted", { id });
    await loadAll();
  };

  const printBill = (bill, template = "classic", templateConfig = billTemplateConfig) =>
    printBillDocument({
      bill,
      template,
      templateConfig,
      defaultBillTemplateConfig,
      profileForm,
      me,
      moneyFmt,
      fmtDate,
    });

  return { saveBill, deleteBill, printBill };
}
