const { txTotals, todayIso } = require("../utils/format");

class SummaryService {
  constructor(models) {
    this.models = models;
  }

  async get(userId) {
    const txs = await this.models.transactions.listByUser(userId);
    const entities = await this.models.entities.listByUser(userId);
    const bills = await this.models.bills.listByUser(userId);

    let sales = 0;
    let purchases = 0;
    let outputGst = 0;
    let inputGst = 0;
    let receivables = 0;
    let payables = 0;

    txs.forEach((tx) => {
      const t = txTotals(tx);
      if (tx.type === "sale") {
        sales += t.base;
        outputGst += t.gst;
        receivables += t.due;
      } else if (tx.type === "purchase") {
        purchases += t.base;
        inputGst += t.gst;
        payables += t.due;
      } else if (tx.type === "sale_return") {
        sales -= t.base;
        outputGst -= t.gst;
        receivables -= t.due;
      } else if (tx.type === "purchase_return") {
        purchases -= t.base;
        inputGst -= t.gst;
        payables -= t.due;
      }
    });

    const today = todayIso();
    const overdueCount = txs.filter((tx) => {
      const t = txTotals(tx);
      return tx.reminderEnabled && tx.dueDate && tx.dueDate < today && t.due > 0;
    }).length;

    return {
      sales,
      purchases,
      netRevenue: sales - purchases,
      outputGst,
      inputGst,
      netGstPayable: outputGst - inputGst,
      receivables,
      payables,
      entities: entities.length,
      bills: bills.length,
      overdueCount,
    };
  }
}

module.exports = SummaryService;
