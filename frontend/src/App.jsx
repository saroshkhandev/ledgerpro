import { Route, Routes, useNavigate } from "react-router-dom";
import { App as AntApp, ConfigProvider, message } from "antd";
import LoginPage from "./pages/LoginPage";
import useLedgerState from "./hooks/useLedgerState";
import useLedgerActions from "./hooks/useLedgerActions";
import AuthenticatedRoutes from "./routes/AuthenticatedRoutes";

export default function App() {
  const navigate = useNavigate();
  const [apiMsg, contextHolder] = message.useMessage();

  const { values: appState, setters, loaders } = useLedgerState({ navigate });
  const { handlers } = useLedgerActions({
    navigate,
    apiMsg,
    state: appState,
    setters,
    loaders,
  });

  return (
    <ConfigProvider theme={appState.antTheme}>
      <AntApp>
        {contextHolder}
        <Routes>
          <Route
            path="/login"
            element={
              <LoginPage
                authMsg={appState.authMsg}
                onLogin={handlers.onLogin}
                onRegister={handlers.onRegister}
                authBusy={appState.busy}
              />
            }
          />
          <Route
            path="/*"
            element={
              <AuthenticatedRoutes
                appState={appState}
                setters={setters}
                handlers={handlers}
              />
            }
          />
        </Routes>
      </AntApp>
    </ConfigProvider>
  );
}
