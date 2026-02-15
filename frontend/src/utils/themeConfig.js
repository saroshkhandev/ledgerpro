import { theme as antdTheme } from "antd";

export function buildAntTheme(darkMode) {
  return {
    algorithm: darkMode ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: darkMode
      ? {
          colorPrimary: "#34a37d",
          colorInfo: "#34a37d",
          colorSuccess: "#3dbf91",
          colorWarning: "#e4a84e",
          colorError: "#df6b78",
          colorBgBase: "#0f1720",
          colorTextBase: "#e5edf7",
          borderRadius: 8,
        }
      : {
          colorPrimary: "#1f7a5a",
          colorInfo: "#1f7a5a",
          colorSuccess: "#2a9d76",
          colorWarning: "#c98a35",
          colorError: "#c75463",
          colorBgBase: "#f5f7f4",
          colorTextBase: "#1f2a37",
          borderRadius: 8,
        },
    components: {
      Button: { borderRadius: 8, controlHeight: 36, fontWeight: 600 },
      Card: { borderRadiusLG: 10 },
      Menu: { itemBorderRadius: 8 },
      Input: { borderRadius: 8 },
      Select: { borderRadius: 8 },
      Table: { borderRadius: 10 },
    },
  };
}
