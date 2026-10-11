import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import { MotionConfig } from "framer-motion";
document.documentElement.classList.toggle("dark", localStorage.getItem("theme") === "dark");

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <MotionConfig reducedMotion="user"><App /></MotionConfig>
    </BrowserRouter>
  </React.StrictMode>,
);
