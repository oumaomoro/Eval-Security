import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./components/App";
import "./index.css";

/* Ensure Office API is loaded before React renders */
Office.onReady((info) => {
  const isOffice = info.host === Office.HostType.Word;
  const rootElement = document.getElementById("root");
  
  if (rootElement) {
    const root = createRoot(rootElement);
    root.render(<App isOffice={isOffice} />);
  }
});
