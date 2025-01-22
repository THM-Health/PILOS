import laravel from "laravel-vite-plugin";
import vue from "@vitejs/plugin-vue";
import * as fs from "fs";
import Components from "unplugin-vue-components/vite";
import { PrimeVueResolver } from "@primevue/auto-import-resolver";
import { loadEnv } from "vite";

export default (mode) => {
  const ENV_PREFIX = ["VITE_"];

  process.env = { ...process.env, ...loadEnv(mode, process.cwd(), ENV_PREFIX) };

  const VITE_HMR_HOST = process.env.VITE_HOST || "localhost";
  const VITE_PORT = parseInt(process.env.VITE_PORT || 1073);

  return {
    plugins: [
      laravel({
        input: ["resources/js/app.js", "resources/sass/app.scss"],
      }),
      vue(),
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
      cors: true,
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
