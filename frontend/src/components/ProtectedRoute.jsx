import { Navigate } from "react-router-dom";
import { Spin } from "antd";

export default function ProtectedRoute({ me, authLoading, children }) {
  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", gap: 12 }}>
        <Spin size="large" />
        <div style={{ color: "var(--text-soft)", fontWeight: 600 }}>Loading your ledger...</div>
      </div>
    );
  }
  if (!me) return <Navigate to="/login" replace />;
  return children;
}
