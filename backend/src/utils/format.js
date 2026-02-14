function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function nowIso() {
  return new Date().toISOString();
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function txTotals(tx) {
  const base = toNumber(tx.qty) * toNumber(tx.unitAmount);
  const gst = (base * toNumber(tx.gstRate)) / 100;
  const gross = base + gst;
  const due = Math.max(gross - toNumber(tx.paidAmount), 0);
  return { base, gst, gross, due };
}

module.exports = { todayIso, nowIso, toNumber, txTotals };
