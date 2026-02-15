export function matchesQuery(obj, query) {
  if (!query) return true;
  const q = String(query).toLowerCase();
  return Object.values(obj || {}).some((v) => String(v ?? "").toLowerCase().includes(q));
}

export function selectSalesForBill(transactions, entityId) {
  const normalizedEntityId = String(entityId || "");
  return transactions.filter((t) => {
    const type = String(t.type || "").toLowerCase();
    if (type !== "sale") return false;
    if (!normalizedEntityId) return true;
    return String(t.entityId || "") === normalizedEntityId;
  });
}
