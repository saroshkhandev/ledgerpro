import { useEffect, useRef, useState } from "react";
import { Layout, Menu, Typography, Button, Avatar, Space, Switch, Divider, Popover, Input } from "antd";
import { MenuOutlined, SettingOutlined, UserOutlined } from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";

const { Sider, Header, Content } = Layout;

const navItems = [
  { key: "/dashboard", label: "Dashboard" },
  { key: "/entities", label: "Entities" },
  { key: "/products", label: "Products" },
  { key: "/transactions", label: "Transactions" },
  { key: "/import-sales", label: "Import Sales" },
  { key: "/bills", label: "Bills" },
  { key: "/reports", label: "Reports" },
  { key: "/reminders", label: "Reminders" },
];

export default function AppLayout({ me, onLogout, logoutLoading, uiPrefs, onUpdateUiPrefs, globalQuery, onGlobalQueryChange, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileCollapsed, setMobileCollapsed] = useState(false);
  const searchRef = useRef(null);

  const selected = navItems.find((x) => location.pathname.startsWith(x.key))?.key || "/dashboard";
  const pageTitle = location.pathname === "/profile"
    ? "Profile Settings"
    : selected.replace("/", "").replace("-", " ").replace(/\b\w/g, (m) => m.toUpperCase());
  const settingsContent = (
    <Space direction="vertical" size={10} style={{ width: 260 }}>
      <div className="settings-row">
        <div>
          <Typography.Text strong>Dark Mode</Typography.Text>
          <div className="settings-help">Comfortable low-light viewing</div>
        </div>
        <Switch
          checked={!!uiPrefs?.darkMode}
          onChange={(checked) =>
            onUpdateUiPrefs((prev) => ({ ...prev, darkMode: checked }))
          }
        />
      </div>

      <div className="settings-row">
        <div>
          <Typography.Text strong>Compact Tables</Typography.Text>
          <div className="settings-help">Reduce row height in list views</div>
        </div>
        <Switch
          checked={!!uiPrefs?.compactTables}
          onChange={(checked) =>
            onUpdateUiPrefs((prev) => ({ ...prev, compactTables: checked }))
          }
        />
      </div>

      <Divider style={{ margin: "8px 0" }} />

      <Button
        icon={<UserOutlined />}
        onClick={() => {
          navigate("/profile");
        }}
      >
        Edit Profile
      </Button>
    </Space>
  );

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const tag = String(event.target?.tagName || "").toLowerCase();
      const isTypingContext =
        tag === "input" ||
        tag === "textarea" ||
        event.target?.isContentEditable;
      if (isTypingContext) return;
      event.preventDefault();
      searchRef.current?.focus?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <Layout className="app-layout modern-shell">
      <Sider
        breakpoint="md"
        collapsedWidth="0"
        width={250}
        collapsed={mobileCollapsed}
        onBreakpoint={(broken) => {
          if (broken) setMobileCollapsed(true);
          else setMobileCollapsed(false);
        }}
        className="app-sider"
      >
        <div className="brand-wrap">
          <div className="brand-logo">LP</div>
          <div>
            <Typography.Title level={5} className="brand-title">LedgerPro</Typography.Title>
            <Typography.Text className="brand-subtitle">Business Ledger Suite</Typography.Text>
          </div>
        </div>

        <Menu
          mode="inline"
          selectedKeys={[selected]}
          items={navItems}
          onClick={({ key }) => {
            navigate(key);
          }}
          style={{ borderInlineEnd: 0, background: "transparent" }}
        />

        <div className="logout-wrap">
          <div className="footer-top">
            <Space align="center">
              <Avatar src={me?.photoUrl || undefined}>{(me?.name || "U")[0]}</Avatar>
              <div>
                <div className="me-name">{me?.name}</div>
                <div className="me-email">{me?.email}</div>
              </div>
            </Space>
            <Popover placement="leftBottom" trigger="click" content={settingsContent}>
              <Button
                className="settings-icon-btn"
                type="text"
                icon={<SettingOutlined />}
                aria-label="Open settings"
              />
            </Popover>
          </div>
          <div className="footer-actions">
            <Button block onClick={onLogout} loading={logoutLoading}>Logout</Button>
          </div>
        </div>
      </Sider>

      <Layout className="app-main">
        <Header className="app-header">
          <div className="header-left">
            <Button
              className="menu-trigger"
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setMobileCollapsed((v) => !v)}
            />
            <Typography.Title level={4} className="page-title">
              {pageTitle}
            </Typography.Title>
          </div>
          <div className="header-right">
            <div className="header-search">
              <Input
                ref={searchRef}
                allowClear
                placeholder="Global search"
                value={globalQuery}
                onChange={(e) => onGlobalQueryChange(e.target.value)}
              />
            </div>
          </div>
        </Header>
        <Content className="app-content">{children}</Content>
      </Layout>
    </Layout>
  );
}
