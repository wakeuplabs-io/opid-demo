/// <reference path="./.sst/platform/config.d.ts" />

import "dotenv/config";

const PROJECT_NAME = "opid-privado";

export default $config({
  app(input) {
    return {
      name: PROJECT_NAME,
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
    };
  },
  async run() {
    const ui = new sst.aws.StaticSite(`${PROJECT_NAME}-ui`, {
      path: "packages/ui",
      build: {
        command: "npm run build",
        output: "dist",
      },
      domain: "opid.wakeuplabs.link",
      dev: {
        command: "npm run dev",
        directory: "packages/ui",
      },
      environment: {
        VITE_RPC_URL: process.env.VITE_RPC_URL,
        VITE_WALLET_CONNECT_ID: process.env.VITE_WALLET_CONNECT_ID,
        VITE_ISSUER_URL: process.env.VITE_ISSUER_URL,
        VITE_ISSUER_DID: process.env.VITE_ISSUER_DID,
        VITE_ISSUER_USER: process.env.VITE_ISSUER_USER,
        VITE_ISSUER_PASSWORD: process.env.VITE_ISSUER_PASSWORD,
      },
      indexPage: "index.html",
      errorPage: "index.html",
      invalidation: {
        paths: "all",
        wait: true,
      },
    });

    return {
      ui: ui.url,
    }
  },
});
