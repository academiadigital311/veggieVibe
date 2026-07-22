import React from "react";
import ReactDOM from "react-dom/client";
import { inject } from "@vercel/analytics";
import "./i18n/i18n";
import App from "./App.jsx";

inject();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js');
  });
}
