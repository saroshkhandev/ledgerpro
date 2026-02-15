import api from "../api/client";
import createAuthProfileActions from "./actions/authProfileActions";
import createEntityActions from "./actions/entityActions";
import createProductActions from "./actions/productActions";
import createTransactionActions from "./actions/transactionActions";
import createBillActions from "./actions/billActions";
import createReportActions from "./actions/reportActions";

export default function useLedgerActions({ navigate, apiMsg, state, setters, loaders }) {
  const {
    me,
    entities,
    transactions,
    bills,
    entityForm,
    productForm,
    txForm,
    billForm,
    billTemplateConfig,
    profileForm,
    moneyFmt,
  } = state;

  const { setBusy, setMe, setAuthMsg, setEntityForm, setProductForm, setTxForm, setBillForm } =
    setters;

  const { loadAll, boot } = loaders;

  const addAudit = async (action, resource, messageText, meta = {}) => {
    try {
      await api.post("/audit", { action, resource, message: messageText, meta });
    } catch {
      // intentionally ignore audit failures
    }
  };

  const authProfileActions = createAuthProfileActions({
    navigate,
    apiMsg,
    profileForm,
    setBusy,
    setAuthMsg,
    setMe,
    boot,
  });

  const entityActions = createEntityActions({
    apiMsg,
    entityForm,
    setBusy,
    setEntityForm,
    loadAll,
    addAudit,
  });

  const productActions = createProductActions({
    apiMsg,
    productForm,
    setBusy,
    setProductForm,
    loadAll,
    addAudit,
  });

  const transactionActions = createTransactionActions({
    apiMsg,
    txForm,
    moneyFmt,
    setBusy,
    setTxForm,
    loadAll,
    addAudit,
  });

  const billActions = createBillActions({
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
  });

  const reportActions = createReportActions({
    entities,
    transactions,
    bills,
    setBusy,
    loadAll,
    addAudit,
    apiMsg,
  });

  return {
    handlers: {
      ...authProfileActions,
      ...entityActions,
      ...productActions,
      ...transactionActions,
      ...billActions,
      ...reportActions,
    },
  };
}
