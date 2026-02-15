import { useEffect, useMemo, useState } from "react";
import api from "../api/client";
import {
  defaultBillTemplateConfig,
  defaultUiPrefs,
  initialBillForm,
  initialBusyState,
  initialEntityForm,
  initialProductForm,
  initialProfileForm,
  initialTxForm,
  mergeBillTemplateConfig,
  STORAGE_KEYS,
} from "../constants/appDefaults";
import { matchesQuery, selectSalesForBill } from "../utils/filtering";
import { money } from "../utils/format";
import { buildAntTheme } from "../utils/themeConfig";

export default function useLedgerState({ navigate }) {
  const [busy, setBusy] = useState(initialBusyState);

  const [me, setMe] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMsg, setAuthMsg] = useState("");

  const [entities, setEntities] = useState([]);
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [bills, setBills] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [summary, setSummary] = useState(null);
  const [audits, setAudits] = useState([]);
  const [globalQuery, setGlobalQuery] = useState("");

  const [entityForm, setEntityForm] = useState(initialEntityForm);
  const [productForm, setProductForm] = useState(initialProductForm);
  const [txForm, setTxForm] = useState(initialTxForm());
  const [billForm, setBillForm] = useState(initialBillForm());
  const [billTemplateConfig, setBillTemplateConfig] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.billTemplate);
      return raw ? mergeBillTemplateConfig(JSON.parse(raw)) : defaultBillTemplateConfig;
    } catch {
      return defaultBillTemplateConfig;
    }
  });
  const [profileForm, setProfileForm] = useState(initialProfileForm());
  const [entityFilter, setEntityFilter] = useState("");
  const [uiPrefs, setUiPrefs] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.uiPrefs);
      return raw ? JSON.parse(raw) : defaultUiPrefs;
    } catch {
      return defaultUiPrefs;
    }
  });

  const loadAll = async () => {
    const [ent, prod, tx, bl, rem, sum, profile, audit] = await Promise.all([
      api.get("/entities"),
      api.get("/products"),
      api.get("/transactions"),
      api.get("/bills"),
      api.get("/reminders"),
      api.get("/summary"),
      api.get("/auth/profile"),
      api.get("/audit?limit=200"),
    ]);
    setEntities(ent.data.items || []);
    setProducts(prod.data.items || []);
    setTransactions(tx.data.items || []);
    setBills(bl.data.items || []);
    setReminders(rem.data.items || []);
    setSummary(sum.data || null);
    setProfileForm({ ...initialProfileForm(), ...(profile.data.item || {}) });
    setAudits(audit.data.items || []);
  };

  const boot = async () => {
    try {
      setAuthLoading(true);
      const res = await api.get("/auth/me");
      if (!res.data.authenticated) {
        setMe(null);
        setAuthLoading(false);
        return;
      }
      setMe(res.data.user);
      await loadAll();
    } catch {
      setMe(null);
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    boot();
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.uiPrefs, JSON.stringify(uiPrefs));
    document.documentElement.setAttribute("data-theme", uiPrefs.darkMode ? "dark" : "light");
    document.documentElement.setAttribute(
      "data-density",
      uiPrefs.compactTables ? "compact" : "comfortable"
    );
  }, [uiPrefs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.billTemplate, JSON.stringify(billTemplateConfig));
  }, [billTemplateConfig]);

  useEffect(() => {
    if (!authLoading && me && window.location.pathname === "/login") {
      navigate("/dashboard", { replace: true });
    }
  }, [authLoading, me, navigate]);

  const salesForBill = useMemo(
    () => selectSalesForBill(transactions, billForm.entityId),
    [transactions, billForm.entityId]
  );

  const antTheme = useMemo(() => buildAntTheme(uiPrefs.darkMode), [uiPrefs.darkMode]);

  const filteredEntities = useMemo(
    () => entities.filter((e) => matchesQuery(e, globalQuery)),
    [entities, globalQuery]
  );
  const filteredProducts = useMemo(
    () => products.filter((p) => matchesQuery(p, globalQuery)),
    [products, globalQuery]
  );
  const filteredTransactions = useMemo(() => {
    const entityId = String(entityFilter || "");
    return transactions.filter((t) => {
      if (entityId && String(t.entityId) !== entityId) return false;
      return matchesQuery(t, globalQuery);
    });
  }, [transactions, entityFilter, globalQuery]);
  const filteredBills = useMemo(
    () => bills.filter((b) => matchesQuery(b, globalQuery)),
    [bills, globalQuery]
  );
  const filteredReminders = useMemo(
    () => reminders.filter((r) => matchesQuery(r, globalQuery)),
    [reminders, globalQuery]
  );

  const moneyFmt = useMemo(
    () => (value) => money(value, profileForm.currency || me?.currency || "INR"),
    [profileForm.currency, me?.currency]
  );

  return {
    values: {
      busy,
      me,
      authLoading,
      authMsg,
      entities,
      products,
      transactions,
      bills,
      reminders,
      summary,
      audits,
      globalQuery,
      entityForm,
      productForm,
      txForm,
      billForm,
      billTemplateConfig,
      profileForm,
      entityFilter,
      uiPrefs,
      salesForBill,
      antTheme,
      filteredEntities,
      filteredProducts,
      filteredTransactions,
      filteredBills,
      filteredReminders,
      moneyFmt,
    },
    setters: {
      setBusy,
      setMe,
      setAuthLoading,
      setAuthMsg,
      setEntities,
      setProducts,
      setTransactions,
      setBills,
      setReminders,
      setSummary,
      setAudits,
      setGlobalQuery,
      setEntityForm,
      setProductForm,
      setTxForm,
      setBillForm,
      setBillTemplateConfig,
      setProfileForm,
      setEntityFilter,
      setUiPrefs,
    },
    loaders: {
      loadAll,
      boot,
    },
  };
}
