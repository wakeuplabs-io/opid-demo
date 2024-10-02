import "./index.css";
import "@rainbow-me/rainbowkit/styles.css";
import ProvidersWrapper from "@/hoc/providers-wrapper.tsx";
import React from "react";
import ReactDOM from "react-dom/client";
import { router } from "@/shared/config/tanstack-router";
import { RouterProvider } from "@tanstack/react-router";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ProvidersWrapper>
      <RouterProvider router={router} />
    </ProvidersWrapper>
  </React.StrictMode>
);
