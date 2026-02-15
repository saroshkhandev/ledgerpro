import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "../layout/AppLayout";
import ProtectedRoute from "../components/ProtectedRoute";
import DashboardPage from "../pages/DashboardPage";
import EntitiesPage from "../pages/EntitiesPage";
import ProductsPage from "../pages/ProductsPage";
import TransactionsPage from "../pages/TransactionsPage";
import ImportSalesPage from "../pages/ImportSalesPage";
import BillsPage from "../pages/BillsPage";
import ReportsPage from "../pages/ReportsPage";
import RemindersPage from "../pages/RemindersPage";
import ProfilePage from "../pages/ProfilePage";
import { fmtDate } from "../utils/format";
import { defaultBillTemplateConfig } from "../constants/appDefaults";

export default function AuthenticatedRoutes({ appState, setters, handlers }) {
  return (
    <ProtectedRoute me={appState.me} authLoading={appState.authLoading}>
      <AppLayout
        me={appState.me}
        onLogout={handlers.onLogout}
        logoutLoading={appState.busy.logout}
        uiPrefs={appState.uiPrefs}
        onUpdateUiPrefs={setters.setUiPrefs}
        globalQuery={appState.globalQuery}
        onGlobalQueryChange={setters.setGlobalQuery}
      >
        <Routes>
          <Route
            path="/dashboard"
            element={
              <DashboardPage
                summary={appState.summary}
                transactions={appState.filteredTransactions}
                money={appState.moneyFmt}
                fmtDate={fmtDate}
              />
            }
          />
          <Route
            path="/entities"
            element={
              <EntitiesPage
                entityForm={appState.entityForm}
                setEntityForm={setters.setEntityForm}
                entities={appState.filteredEntities}
                saveEntity={handlers.saveEntity}
                fillEntity={handlers.fillEntity}
                deleteEntity={handlers.deleteEntity}
                getEntityPassbook={handlers.getEntityPassbook}
                saveLoading={appState.busy.entity}
                money={appState.moneyFmt}
                fmtDate={fmtDate}
              />
            }
          />
          <Route
            path="/products"
            element={
              <ProductsPage
                productForm={appState.productForm}
                setProductForm={setters.setProductForm}
                products={appState.filteredProducts}
                saveProduct={handlers.saveProduct}
                editProduct={handlers.editProduct}
                deleteProduct={handlers.deleteProduct}
                getProductStockLedger={handlers.getProductStockLedger}
                saveLoading={appState.busy.product}
                money={appState.moneyFmt}
                fmtDate={fmtDate}
              />
            }
          />
          <Route
            path="/transactions"
            element={
              <TransactionsPage
                txForm={appState.txForm}
                setTxForm={setters.setTxForm}
                entities={appState.entities}
                products={appState.products}
                entityFilter={appState.entityFilter}
                setEntityFilter={setters.setEntityFilter}
                filteredTransactions={appState.filteredTransactions}
                saveTx={handlers.saveTx}
                editTx={handlers.editTx}
                addPayment={handlers.addPayment}
                deleteTx={handlers.deleteTx}
                getProductBatches={handlers.getProductBatches}
                saveLoading={appState.busy.transaction}
                paymentLoading={appState.busy.payment}
                money={appState.moneyFmt}
                fmtDate={fmtDate}
              />
            }
          />
          <Route
            path="/import-sales"
            element={
              <ImportSalesPage
                onImport={handlers.importSalesCsv}
                importLoading={appState.busy.importCsv}
              />
            }
          />
          <Route
            path="/bills"
            element={
              <BillsPage
                billForm={appState.billForm}
                setBillForm={setters.setBillForm}
                entities={appState.entities}
                salesForBill={appState.salesForBill}
                bills={appState.filteredBills}
                saveBill={handlers.saveBill}
                printBill={handlers.printBill}
                deleteBill={handlers.deleteBill}
                billTemplateConfig={appState.billTemplateConfig}
                setBillTemplateConfig={setters.setBillTemplateConfig}
                defaultBillTemplateConfig={defaultBillTemplateConfig}
                saveLoading={appState.busy.bill}
                money={appState.moneyFmt}
                fmtDate={fmtDate}
              />
            }
          />
          <Route
            path="/reports"
            element={
              <ReportsPage
                summary={appState.summary}
                transactions={appState.transactions}
                audits={appState.audits}
                onExportEntities={handlers.onExportEntities}
                onExportTransactions={handlers.onExportTransactions}
                onExportBills={handlers.onExportBills}
                onExportBackup={handlers.exportBackup}
                onImportBackup={handlers.importBackup}
                exportLoading={appState.busy.backupExport}
                importLoading={appState.busy.backupImport}
                money={appState.moneyFmt}
              />
            }
          />
          <Route
            path="/reminders"
            element={
              <RemindersPage
                reminders={appState.filteredReminders}
                addPayment={handlers.addPayment}
                money={appState.moneyFmt}
                fmtDate={fmtDate}
              />
            }
          />
          <Route
            path="/profile"
            element={
              <ProfilePage
                profileForm={appState.profileForm}
                setProfileForm={setters.setProfileForm}
                saveProfile={handlers.saveProfile}
                saveLoading={appState.busy.profile}
              />
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AppLayout>
    </ProtectedRoute>
  );
}
