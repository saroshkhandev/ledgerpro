import { Button, Dropdown } from "antd";
import { MoreOutlined } from "@ant-design/icons";

export default function RowActions({ quickActions = [], menuActions = [] }) {
  const visibleQuick = quickActions.filter((a) => a && a.visible !== false);
  const hasMenu = menuActions.length > 0;

  const menu = {
    items: menuActions.map((a, idx) => ({
      key: a.key || String(idx),
      label: a.label,
      danger: !!a.danger,
      disabled: !!a.disabled,
    })),
    onClick: ({ key }) => {
      const item = menuActions.find((a, idx) => (a.key || String(idx)) === key);
      if (item?.onClick) item.onClick();
    },
  };

  return (
    <div className="row-actions">
      {visibleQuick.map((action, idx) => (
        <Button
          key={action.key || String(idx)}
          size="small"
          type={action.type || "default"}
          danger={!!action.danger}
          disabled={!!action.disabled}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      ))}
      {hasMenu ? (
        <Dropdown menu={menu} trigger={["click"]} placement="bottomRight">
          <Button size="small" icon={<MoreOutlined />} />
        </Dropdown>
      ) : null}
    </div>
  );
}
