import { useEffect, useState } from "react";
import { Card, Typography, Segmented, Input, Button, Alert, Space, Spin } from "antd";
import { CheckCircleOutlined, FileDoneOutlined, LockOutlined, MobileOutlined } from "@ant-design/icons";
import { Capacitor } from "@capacitor/core";

export default function LoginPage({ authMsg, onLogin, onRegister, authBusy }) {
  const isNative = Capacitor.isNativePlatform();
  const [mode, setMode] = useState("login");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ name: "", email: "", password: "", address: "", photoUrl: "" });
  const authLoading = !!authBusy?.login || !!authBusy?.register;
  const textSafeInputProps = isNative
    ? { autoCapitalize: "none", autoCorrect: "off", spellCheck: false }
    : {};

  useEffect(() => {
    if (mode === "register") {
      setRegisterForm({ name: "", email: "", password: "", address: "", photoUrl: "" });
    }
  }, [mode]);

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-hero">
          <div className="auth-hero-badge">LedgerPro</div>
          <Typography.Title level={2} className="auth-hero-title">
            Run your business ledger with clarity
          </Typography.Title>
          <Typography.Paragraph className="auth-hero-copy">
            Track sales, purchases, GST invoices, dues, and reminders in one clean workspace built for daily bookkeeping.
          </Typography.Paragraph>
          <Space wrap size={8} className="auth-trust-row">
            <span className="auth-trust-chip"><LockOutlined /> Secure Login</span>
            <span className="auth-trust-chip"><FileDoneOutlined /> GST Ready</span>
            <span className="auth-trust-chip"><MobileOutlined /> Multi-device</span>
          </Space>
          <svg className="auth-hero-graphic" viewBox="0 0 560 360" role="img" aria-label="Ledger dashboard illustration">
            <defs>
              <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1f7a5a" />
                <stop offset="100%" stopColor="#2f9e76" />
              </linearGradient>
              <linearGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
                <stop offset="100%" stopColor="#edf6f1" stopOpacity="0.92" />
              </linearGradient>
            </defs>
            <rect x="8" y="8" width="544" height="344" rx="24" fill="url(#bgGradient)" opacity="0.15" />
            <rect x="52" y="52" width="456" height="256" rx="18" fill="url(#cardGradient)" />
            <rect x="76" y="80" width="110" height="10" rx="5" fill="#2f8f6b" opacity="0.75" />
            <rect x="76" y="104" width="170" height="8" rx="4" fill="#6f857a" opacity="0.55" />
            <rect x="76" y="140" width="180" height="56" rx="12" fill="#ffffff" />
            <rect x="266" y="140" width="100" height="56" rx="12" fill="#ffffff" />
            <rect x="376" y="140" width="100" height="56" rx="12" fill="#ffffff" />
            <rect x="76" y="212" width="400" height="72" rx="12" fill="#ffffff" />
            <rect x="92" y="226" width="150" height="8" rx="4" fill="#5f7569" opacity="0.45" />
            <rect x="92" y="244" width="320" height="8" rx="4" fill="#5f7569" opacity="0.3" />
            <rect x="92" y="262" width="250" height="8" rx="4" fill="#5f7569" opacity="0.3" />
            <rect x="406" y="62" width="92" height="48" rx="12" fill="#ffffff" />
            <rect x="420" y="78" width="44" height="8" rx="4" fill="#2f8f6b" opacity="0.75" />
            <circle cx="475" cy="82" r="6" fill="#2f8f6b" opacity="0.75" />
          </svg>
        </div>

        <Card className={`auth-card ${mode === "login" ? "auth-card--login" : "auth-card--register"}`} bordered={false}>
          <Spin spinning={authLoading} tip="Please wait...">
          <Space direction="vertical" size={16} className="auth-form-stack">
            <div className="auth-form-head">
              <Typography.Title level={2} style={{ marginBottom: 4 }}>Welcome</Typography.Title>
              <Typography.Text type="secondary">Sign in to continue to LedgerPro</Typography.Text>
            </div>

            <Segmented
              block
              value={mode}
              onChange={(nextMode) => setMode(nextMode)}
              options={[{ label: "Login", value: "login" }, { label: "Register", value: "register" }]}
            />

            {mode === "login" ? (
              <Space key="login-form" direction="vertical" size={10} style={{ width: "100%" }}>
                <Input
                  size="large"
                  placeholder="Email"
                  autoComplete="username"
                  inputMode="email"
                  {...textSafeInputProps}
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                />
                <Input.Password
                  size="large"
                  placeholder="Password"
                  autoComplete="current-password"
                  {...textSafeInputProps}
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                />
                <Button type="primary" size="large" block loading={!!authBusy?.login} onClick={() => onLogin(loginForm)}>Login</Button>
              </Space>
            ) : (
              <Space key="register-form" direction="vertical" size={10} style={{ width: "100%" }}>
                <input type="text" name="fake-username" autoComplete="username" className="auth-hidden-field" />
                <input type="password" name="fake-password" autoComplete="new-password" className="auth-hidden-field" />
                <Input
                  size="large"
                  placeholder="Name"
                  autoComplete="off"
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                />
                <Input
                  size="large"
                  placeholder="Email"
                  autoComplete="off"
                  inputMode="email"
                  {...textSafeInputProps}
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                />
                <Input.Password
                  size="large"
                  placeholder="Password (min 6 chars)"
                  autoComplete="new-password"
                  {...textSafeInputProps}
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                />
                <Input.TextArea
                  rows={2}
                  placeholder="Address (optional)"
                  autoComplete="off"
                  value={registerForm.address}
                  onChange={(e) => setRegisterForm({ ...registerForm, address: e.target.value })}
                />
                <Input
                  size="large"
                  placeholder="Photo URL (optional)"
                  autoComplete="off"
                  inputMode="url"
                  {...textSafeInputProps}
                  value={registerForm.photoUrl}
                  onChange={(e) => setRegisterForm({ ...registerForm, photoUrl: e.target.value })}
                />
                <Button type="primary" size="large" block loading={!!authBusy?.register} onClick={() => onRegister(registerForm)}>Create Account</Button>
              </Space>
            )}

            {authMsg ? <Alert type="error" message={authMsg} showIcon /> : null}
            <Space direction="vertical" size={4} className="auth-form-points">
              <Typography.Text type="secondary"><CheckCircleOutlined /> Auto-save session</Typography.Text>
              <Typography.Text type="secondary"><CheckCircleOutlined /> Works on mobile, tablet and desktop</Typography.Text>
            </Space>
          </Space>
          </Spin>
        </Card>
      </div>
    </div>
  );
}
