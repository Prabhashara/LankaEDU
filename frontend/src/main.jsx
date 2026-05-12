import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";

const savedTheme = window.localStorage.getItem("onlineExam.theme");
const preferredTheme = window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
document.documentElement.dataset.theme = savedTheme === "dark" || savedTheme === "light" ? savedTheme : preferredTheme;
document.documentElement.style.colorScheme = document.documentElement.dataset.theme;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
