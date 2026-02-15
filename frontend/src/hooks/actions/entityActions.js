import api from "../../api/client";
import { initialEntityForm } from "../../constants/appDefaults";

export default function createEntityActions({ apiMsg, entityForm, setBusy, setEntityForm, loadAll, addAudit }) {
  const fillEntity = (entity) =>
    setEntityForm({
      id: entity.id,
      name: entity.name,
      category: entity.category,
      gstin: entity.gstin || "",
      phone: entity.phone || "",
      address: entity.address || "",
      openingBalance: Number(entity.openingBalance || 0),
    });

  const saveEntity = async () => {
    setBusy((prev) => ({ ...prev, entity: true }));
    try {
      const payload = { ...entityForm };
      delete payload.id;
      if (!payload.name.trim()) {
        apiMsg.error("Entity name is required");
        return false;
      }
      if (entityForm.id) await api.put(`/entities/${entityForm.id}`, payload);
      else await api.post("/entities", payload);
      await addAudit(
        entityForm.id ? "update" : "create",
        "entity",
        `${payload.name} ${entityForm.id ? "updated" : "created"}`
      );
      setEntityForm(initialEntityForm);
      await loadAll();
      apiMsg.success("Entity saved");
      return true;
    } catch (err) {
      apiMsg.error(err?.response?.data?.error || "Failed to save entity");
      return false;
    } finally {
      setBusy((prev) => ({ ...prev, entity: false }));
    }
  };

  const deleteEntity = async (id) => {
    if (!window.confirm("Delete entity?")) return;
    try {
      await api.delete(`/entities/${id}`);
      await addAudit("delete", "entity", "Entity deleted", { id });
      await loadAll();
    } catch (err) {
      apiMsg.error(err?.response?.data?.error || "Failed to delete entity");
    }
  };

  const getEntityPassbook = async (id) => {
    const res = await api.get(`/entities/${id}/passbook`);
    return res.data.item;
  };

  return { fillEntity, saveEntity, deleteEntity, getEntityPassbook };
}
