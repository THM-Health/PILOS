// SPDX-FileCopyrightText: 2022 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import laravel from "laravel-vite-plugin";
import vue from "@vitejs/plugin-vue";
import * as fs from "fs";
import Components from "unplugin-vue-components/vite";
import { PrimeVueResolver } from "@primevue/auto-import-resolver";
import { loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";
import VueDevTools from "vite-plugin-vue-devtools";

export default (mode) => {
  const ENV_PREFIX = ["VITE_"];

  process.env = { ...process.env, ...loadEnv(mode, process.cwd(), ENV_PREFIX) };

  const VITE_HMR_HOST = process.env.VITE_HOST || "localhost";
  const VITE_PORT = parseInt(process.env.VITE_PORT || 1073);

  return {
    plugins: [
      VueDevTools({
        appendTo: "resources/js/app.js",
      }),
      tailwindcss(),
      laravel({
        input: ["resources/js/app.js", "resources/css/app.css"],
      }),
      vue({
        template: {
          compilerOptions: {
            isCustomElement: function (tag) {
              const NEW_HTML_TAGS = ["search"];

              if (NEW_HTML_TAGS.includes(tag)) {
                return true;
              }

              return false;
            },
          },
        },
      }),
      Components({
        dirs: ["resources/js", "resources/custom/js"],
        allowOverrides: true,
        extensions: ["vue"],
        deep: true,
        dts: true,
        resolvers: [PrimeVueResolver()],
      }),
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks: (path) => {
            if (path.includes("node_modules")) {
              return "vendor";
            }

            return "app";
          },
        },
      },
    },
    server: {
      https: getSslConfig(process.env),
      host: "0.0.0.0",
      port: VITE_PORT,
      strictPort: true,
      hmr: {
        host: VITE_HMR_HOST,
      },
    },
    optimizeDeps: {
      include: ["axe-core"],
    },
    css: {
      preprocessorOptions: {
        scss: {
          silenceDeprecations: ["import", "global-builtin"],
        },
      },
    },
  };
};

function getSslConfig(env) {
  if (env.VITE_SSL !== "true") {
    return false;
  }

  return {
    key: fs.readFileSync("ssl/privkey.pem"),
    cert: fs.readFileSync("ssl/fullchain.pem"),
  };
}
