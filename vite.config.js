import { defineConfig, loadEnv } from 'vite';
import laravel from 'laravel-vite-plugin';
import vue from '@vitejs/plugin-vue';
import * as fs from 'fs';
import Components from 'unplugin-vue-components/vite';
import { PrimeVueResolver } from '@primevue/auto-import-resolver';

export default ({ mode }) => {
  const ENV_PREFIX = ['VITE_'];

  process.env = { ...process.env, ...loadEnv(mode, process.cwd(), ENV_PREFIX) };

  const VITE_HMR_HOST = process.env.VITE_HOST || 'localhost';
  const VITE_PORT = parseInt(process.env.VITE_PORT || 1073);
  const BUILD_DIR = process.env.VITE_BUILD_DIR || 'build';

  function getSslConfig () {
    if (process.env.VITE_SSL !== 'true') {
      return false;
    }

    return {
      key: fs.readFileSync('ssl/privkey.pem'),
      cert: fs.readFileSync('ssl/fullchain.pem')
    };
  }
  return defineConfig({
    plugins: [
      laravel({
        input: [
          'resources/js/app.js',
          'resources/sass/app.scss'
        ],
        buildDirectory: BUILD_DIR
      }),
      vue(),
      Components({
        dirs: ['resources/js', 'resources/custom/js'],
        allowOverrides: true,
        extensions: ['vue'],
        deep: true,
        dts: true,
        resolvers: [
          PrimeVueResolver()
        ]
      })
    ],
    server: {
      https: getSslConfig(),
      host: true,
      port: VITE_PORT,
      strictPort: true,
      hmr: {
        host: VITE_HMR_HOST
      }
    },
    optimizeDeps: {
      include: ['axe-core']
    }
  });
};
