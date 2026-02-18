import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { Keyboard } from "@capacitor/keyboard";
import "antd/dist/reset.css";
import "./styles.css";
import App from "./App";

if (Capacitor.getPlatform() === "ios") {
  Keyboard.setAccessoryBarVisible({ isVisible: false }).catch(() => {
    // no-op for web or unsupported runtime
  });
}
if (Capacitor.isNativePlatform()) {
  document.documentElement.setAttribute("data-runtime", "native");
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
