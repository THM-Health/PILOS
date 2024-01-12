import { defineConfig, loadEnv } from 'vite';
import laravel from 'laravel-vite-plugin';
import vue from '@vitejs/plugin-vue';
import * as fs from 'fs';
import * as path from 'path';
import Components from 'unplugin-vue-components/vite';
import {
  PrimeVueResolver
} from 'unplugin-vue-components/resolvers';

export default ({ mode }) => {
  const ENV_PREFIX = ['VITE_', 'VITEST_'];

  process.env = { ...process.env, ...loadEnv(mode, process.cwd(), ENV_PREFIX) };

  const VITE_HMR_HOST = process.env.VITE_HOST || 'localhost';
  const VITE_PORT = parseInt(process.env.VITE_PORT || 1073);
  const VITEST_UI_PORT = parseInt(process.env.VITEST_UI_PORT || 1074);
  const THEME = process.env.VITE_THEME || 'default';
  const BUILD_DIR = process.env.VITE_BUILD_DIR || 'build';

  /**
   * Create aliases for the paths we use in our app
   * Slightly different behaviour in testing mode
   */
  function getAlias () {
    const alias = {
      '@': path.resolve(__dirname, './resources/js')
    };
    
    return alias;
  }

  function getSslConfig () {
    if (process.env.VITEST || process.env.VITE_SSL !== 'true') {
      return false;
    }

    return {
      key: fs.readFileSync('ssl/privkey.pem'),
      cert: fs.readFileSync('ssl/fullchain.pem')
    };
  }
  return defineConfig({
    test: {
      coverage: {
        provider: 'istanbul',
        include: ['resources/js/**/*.{js,vue}'],
        all: true
      },
      api: VITEST_UI_PORT,
      globals: true,
      open: false,
      restoreMocks: true,
      environment: 'jsdom',
      include: ['tests/Frontend/**/*.spec.js'],
      environmentOptions: { url: 'http://localhost' },
      setupFiles: './tests/Frontend/setup.js'
    },
    plugins: [
      laravel({
        input: [
          'resources/js/app.js',
          'resources/sass/theme/' + THEME + '/app.scss'
        ],
        buildDirectory: BUILD_DIR
      }),
      vue(),
      Components({
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
    resolve: {
      alias: getAlias()
    },
    optimizeDeps: {
      include: ['axe-core']
    }
  });
};
