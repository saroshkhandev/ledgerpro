import api from "../../api/client";
import { initialProductForm } from "../../constants/appDefaults";

export default function createProductActions({ apiMsg, productForm, setBusy, setProductForm, loadAll, addAudit }) {
  const editProduct = (product) =>
    setProductForm({
      ...product,
      batchingEnabled: !!product.batchingEnabled,
      initialBatchNo: String(product.initialBatchNo || ""),
      initialMfgDate: String(product.initialMfgDate || ""),
      initialExpDate: String(product.initialExpDate || ""),
    });

  const saveProduct = async () => {
    setBusy((prev) => ({ ...prev, product: true }));
    try {
      const payload = { ...productForm };
      delete payload.id;
      if (!payload.name?.trim()) {
        apiMsg.error("Product name is required");
        return false;
      }
      if (productForm.id) await api.put(`/products/${productForm.id}`, payload);
      else await api.post("/products", payload);
      await addAudit(
        productForm.id ? "update" : "create",
        "product",
        `${payload.name} ${productForm.id ? "updated" : "created"}`
      );
      setProductForm(initialProductForm);
      await loadAll();
      apiMsg.success("Product saved");
      return true;
    } catch (err) {
      apiMsg.error(err?.response?.data?.error || "Failed to save product");
      return false;
    } finally {
      setBusy((prev) => ({ ...prev, product: false }));
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete product?")) return;
    try {
      await api.delete(`/products/${id}`);
      await addAudit("delete", "product", "Product deleted", { id });
      await loadAll();
    } catch (err) {
      apiMsg.error(err?.response?.data?.error || "Failed to delete product");
    }
  };

  const getProductStockLedger = async (id) => {
    const res = await api.get(`/products/${id}/stock-ledger`);
    return res.data.item;
  };

  return { editProduct, saveProduct, deleteProduct, getProductStockLedger };
}
